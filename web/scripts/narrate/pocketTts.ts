// Pocket TTS in Node, for scripts/narrate.ts: clones a voice from a reference clip and speaks a
// line with it, as mono Float32 samples at 24 kHz. It runs onnxruntime-web's WASM build from an
// engine folder outside the repo and reads the model files from a model folder outside it too;
// neither is ever copied in. Built-in voices (voices.bin) are never used.
//
// Ported from pocket-tts-js's worker.js (the generate loop, chunking and tensor helpers), with
// file paths in place of fetch and cache, and the whole take returned instead of streamed:
//
//   pocket-tts-js, MIT License, Copyright (c) 2026 vlapky
//   Permission is hereby granted, free of charge, to any person obtaining a copy of this software
//   and associated documentation files (the "Software"), to deal in the Software without
//   restriction, including without limitation the rights to use, copy, modify, merge, publish,
//   distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
//   Software is furnished to do so, subject to the following conditions: The above copyright
//   notice and this permission notice shall be included in all copies or substantial portions of
//   the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//   PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
//   LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
//   OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//   DEALINGS IN THE SOFTWARE.
//
// The model is Kyutai's Pocket TTS (CC BY 4.0), in vlapky's ONNX conversion (pocket-tts-onnx);
// ONNX Runtime is Microsoft's (MIT). See NOTICE.md.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHUNK_GAP_SEC = 0.25;
const MAX_FRAMES = 500;
const TEMPERATURE = 0.7;
const EOS_THRESHOLD = -4.0;
/** Seconds of quiet after the last word, so a clip never ends mid-breath. */
const TAIL_SEC = 0.35;

// the slice of onnxruntime-web's API used here (it is loaded from a path, untyped)
interface Tensor {
  data: Float32Array | BigInt64Array | Uint8Array;
  dims: readonly number[];
}
type Feeds = Record<string, Tensor>;
interface Session {
  run(feeds: Feeds): Promise<Record<string, Tensor>>;
  outputNames: readonly string[];
}
interface Ort {
  Tensor: new (type: string, data: Tensor['data'], dims: readonly number[]) => Tensor;
  InferenceSession: { create(bytes: Uint8Array, options: object): Promise<Session> };
  env: { wasm: { wasmPaths: string; numThreads: number; simd: boolean } };
}
interface StateEntry {
  dtype: 'float32' | 'int64' | 'bool';
  fill: string;
  shape: number[];
  input_name: string;
  output_name: string;
}
interface Bundle {
  sample_rate: number;
  samples_per_frame: number;
  latent_dim: number;
  conditioning_dim: number;
  max_token_per_chunk?: number;
  flow_lm_state_manifest: StateEntry[];
  mimi_state_manifest: StateEntry[];
  insert_bos_before_voice?: boolean;
  bos_before_voice_file?: string;
  tokenizer_file: string;
  remove_semicolons?: boolean;
  pad_with_spaces_for_short_inputs?: boolean;
  model_recommended_frames_after_eos?: number | null;
}
interface Tokenizer {
  encodeIds(text: string): number[];
  decodeIds(ids: number[]): string;
}

/** A cloned voice: the flow model's state after hearing the reference clip. */
export type Voice = Feeds;

export interface Take {
  audio: Float32Array;
  /** Seconds spent generating (the model, not the file reading). */
  genSeconds: number;
}

/** A seeded random source (mulberry32), so a take can be made again; Math.random without a seed. */
export function randomSource(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class PocketTts {
  private constructor(
    private ort: Ort,
    private bundle: Bundle,
    private tokenizer: Tokenizer,
    private bos: { data: Float32Array; shape: number[] } | null,
    private s: { encoder: Session; text: Session; main: Session; flow: Session; decoder: Session },
  ) {}

  get sampleRate(): number {
    return Number(this.bundle.sample_rate);
  }

  /** Loads the runtime (one thread) from `engineDir` and the int8 models from `modelDir`. */
  static async load(engineDir: string, modelDir: string): Promise<PocketTts> {
    const ortModule = await import(/* @vite-ignore */ pathToFileURL(join(engineDir, 'ort.min.mjs')).href);
    const ort = (ortModule.default ?? ortModule) as Ort;
    ort.env.wasm.wasmPaths = pathToFileURL(engineDir).href + '/';
    ort.env.wasm.simd = true;
    ort.env.wasm.numThreads = 1; // its threads need a browser's workers
    const { SentencePieceTokenizer } = await import(/* @vite-ignore */ pathToFileURL(join(engineDir, 'tokenizer.js')).href);
    const { parseNpyFloat32 } = await import(/* @vite-ignore */ pathToFileURL(join(engineDir, 'binary.js')).href);

    const bundle = JSON.parse(readFileSync(join(modelDir, 'bundle.json'), 'utf8')) as Bundle;
    const tokenizer = SentencePieceTokenizer.fromBytes(new Uint8Array(readFileSync(join(modelDir, bundle.tokenizer_file)))) as Tokenizer;
    const session = (name: string) =>
      ort.InferenceSession.create(new Uint8Array(readFileSync(join(modelDir, `${name}_int8.onnx`))), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
    const s = {
      encoder: await session('mimi_encoder'),
      text: await session('text_conditioner'),
      main: await session('flow_lm_main'),
      flow: await session('flow_lm_flow'),
      decoder: await session('mimi_decoder'),
    };
    let bos = null;
    if (bundle.bos_before_voice_file) {
      const bytes = readFileSync(join(modelDir, bundle.bos_before_voice_file));
      bos = parseNpyFloat32(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    }
    return new PocketTts(ort, bundle, tokenizer, bos, s);
  }

  private tensor(dtype: string, data: Tensor['data'], dims: readonly number[]): Tensor {
    return new this.ort.Tensor(dtype, data, dims);
  }

  private initState(manifest: StateEntry[]): Feeds {
    const state: Feeds = {};
    for (const e of manifest) {
      const size = e.shape.reduce((a, b) => a * b, 1);
      let data: Tensor['data'];
      if (e.dtype === 'int64') data = new BigInt64Array(size);
      else if (e.dtype === 'bool') data = new Uint8Array(size);
      else {
        data = new Float32Array(size);
        if (e.fill === 'nan') data.fill(NaN);
        else if (e.fill === 'ones') data.fill(1);
      }
      state[e.input_name] = this.tensor(e.dtype, data, e.shape);
    }
    return state;
  }

  private static update(state: Feeds, result: Record<string, Tensor>, manifest: StateEntry[]): void {
    for (const e of manifest) state[e.input_name] = result[e.output_name];
  }

  /** Clones a voice from mono samples at the model's rate (24 kHz), at most 10 seconds. */
  async cloneVoice(pcm: Float32Array): Promise<Voice> {
    const clip = pcm.length > this.sampleRate * 10 ? pcm.slice(0, this.sampleRate * 10) : pcm;
    const out = await this.s.encoder.run({ audio: this.tensor('float32', clip, [1, 1, clip.length]) });
    const emb = out[this.s.encoder.outputNames[0]];
    let dims = emb.dims.slice();
    while (dims.length > 3 && dims[0] === 1) dims = dims.slice(1);
    if (dims.length < 3) dims = [1, dims[0], dims[1]];
    let data = new Float32Array(emb.data as Float32Array);
    if (this.bundle.insert_bos_before_voice && this.bos) {
      const joined = new Float32Array(this.bos.data.length + data.length);
      joined.set(this.bos.data, 0);
      joined.set(data, this.bos.data.length);
      data = joined;
      dims = [1, dims[1] + this.bos.shape[1], dims[2]];
    }
    const latentDim = Number(this.bundle.latent_dim);
    const state = this.initState(this.bundle.flow_lm_state_manifest);
    const result = await this.s.main.run({
      sequence: this.tensor('float32', new Float32Array(0), [1, 0, latentDim]),
      text_embeddings: this.tensor('float32', data, dims),
      ...state,
    });
    PocketTts.update(state, result, this.bundle.flow_lm_state_manifest);
    return state;
  }

  /** Splits a line into chunks of whole sentences that fit the model's token limit. */
  private chunks(text: string): { chunks: string[]; framesAfterEos: number } {
    const b = this.bundle;
    let prompt = text.trim().replace(/\s+/g, ' ');
    if (!prompt) return { chunks: [], framesAfterEos: 1 };
    if (b.remove_semicolons) prompt = prompt.replace(/;/g, ',');
    const words = prompt.split(' ').length;
    const framesAfterEos = b.model_recommended_frames_after_eos != null ? Number(b.model_recommended_frames_after_eos) : words <= 4 ? 3 : 1;
    if (!/[A-ZÀ-Þ]/.test(prompt[0])) prompt = prompt[0].toUpperCase() + prompt.slice(1);
    if (/[0-9A-Za-zÀ-ÿ]/.test(prompt[prompt.length - 1])) prompt += '.';
    if (b.pad_with_spaces_for_short_inputs && words < 5) prompt = '        ' + prompt;

    const max = Number(b.max_token_per_chunk || 50);
    const sentences = (prompt.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [prompt]).map((s) => s.trim()).filter(Boolean);
    const chunks: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      const ids = this.tokenizer.encodeIds(sentence);
      if (ids.length > max) {
        if (current) (chunks.push(current), (current = ''));
        for (let i = 0; i < ids.length; i += max) {
          const part = this.tokenizer.decodeIds(ids.slice(i, i + max)).trim();
          if (part) chunks.push(part);
        }
      } else if (!current) current = sentence;
      else if (this.tokenizer.encodeIds(`${current} ${sentence}`).length > max) (chunks.push(current), (current = sentence));
      else current = `${current} ${sentence}`;
    }
    if (current) chunks.push(current);
    return { chunks, framesAfterEos };
  }

  /** Speaks `text` in `voice`: the whole take, with a short quiet tail. */
  async generate(text: string, voice: Voice, random: () => number = Math.random): Promise<Take> {
    const { chunks, framesAfterEos } = this.chunks(text);
    if (!chunks.length) throw new Error('No text to speak.');
    const b = this.bundle;
    const latentDim = Number(b.latent_dim);
    const emptySeq = this.tensor('float32', new Float32Array(0), [1, 0, latentDim]);
    const emptyText = this.tensor('float32', new Float32Array(0), [1, 0, Number(b.conditioning_dim)]);
    // one flow step (LSD_STEPS = 1): s = 0, t = 1
    const s0 = this.tensor('float32', new Float32Array([0]), [1, 1]);
    const t1 = this.tensor('float32', new Float32Array([1]), [1, 1]);
    const std = Math.sqrt(TEMPERATURE);
    const pieces: Float32Array[] = [];
    const started = performance.now();

    for (let c = 0; c < chunks.length; c++) {
      // each chunk starts from the clean voice state
      const flowState: Feeds = { ...voice };
      const mimiState = this.initState(b.mimi_state_manifest);
      const ids = this.tokenizer.encodeIds(chunks[c]);
      let textEmb = (await this.s.text.run({ token_ids: this.tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]) }))[
        this.s.text.outputNames[0]
      ];
      if (textEmb.dims.length === 2) textEmb = this.tensor('float32', new Float32Array(textEmb.data as Float32Array), [1, ...textEmb.dims]);
      PocketTts.update(flowState, await this.s.main.run({ sequence: emptySeq, text_embeddings: textEmb, ...flowState }), b.flow_lm_state_manifest);

      const latents: Float32Array[] = [];
      let current = this.tensor('float32', new Float32Array(latentDim).fill(NaN), [1, 1, latentDim]);
      let eosStep: number | null = null;
      for (let step = 0; step < MAX_FRAMES; step++) {
        const ar = await this.s.main.run({ sequence: current, text_embeddings: emptyText, ...flowState });
        if ((ar.eos_logit.data[0] as number) > EOS_THRESHOLD && eosStep == null) eosStep = step;
        const latent = new Float32Array(latentDim);
        for (let i = 0; i < latentDim; i++) {
          let u = 0;
          let v = 0;
          while (u === 0) u = random();
          while (v === 0) v = random();
          latent[i] = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * std;
        }
        const dir = (await this.s.flow.run({ c: ar.conditioning, s: s0, t: t1, x: this.tensor('float32', latent, [1, latentDim]) })).flow_dir
          .data as Float32Array;
        for (let i = 0; i < latentDim; i++) latent[i] += dir[i];
        latents.push(latent);
        current = this.tensor('float32', latent, [1, 1, latentDim]);
        PocketTts.update(flowState, ar, b.flow_lm_state_manifest);
        if (eosStep != null && step >= eosStep + framesAfterEos) break;
      }
      // decode in blocks of 12 frames, carrying the decoder's state, as the streaming worker does
      for (let f = 0; f < latents.length; f += 12) {
        const block = latents.slice(f, f + 12);
        const flat = new Float32Array(block.length * latentDim);
        block.forEach((l, i) => flat.set(l, i * latentDim));
        const out = await this.s.decoder.run({ latent: this.tensor('float32', flat, [1, block.length, latentDim]), ...mimiState });
        PocketTts.update(mimiState, out, b.mimi_state_manifest);
        pieces.push(new Float32Array(out[this.s.decoder.outputNames[0]].data as Float32Array));
      }
      if (c < chunks.length - 1) pieces.push(new Float32Array(Math.floor(CHUNK_GAP_SEC * this.sampleRate)));
    }
    pieces.push(new Float32Array(Math.floor(TAIL_SEC * this.sampleRate)));

    const audio = new Float32Array(pieces.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of pieces) (audio.set(p, at), (at += p.length));
    return { audio, genSeconds: (performance.now() - started) / 1000 };
  }
}
