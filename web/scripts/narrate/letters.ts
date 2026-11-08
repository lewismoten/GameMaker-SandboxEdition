// What a clip sounds like, spelled letter by letter, with no dictionary: wav2vec2-base-960h
// (facebook, Apache-2.0) run greedily, so a made-up word comes out as the sounds it was said with
// ("GRAVITASS", "GRAVEETUS") where Whisper's language model would snap it to the nearest real word.
// voice:words (words.ts) prints both. The model stays outside the repo (WAV2VEC2_MODEL, or the
// Local Agent Lab's models folder); it runs on the Pocket TTS engine's onnxruntime-web.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

interface Tensor {
  data: Float32Array;
  dims: number[];
}
interface Ort {
  env: { wasm: { wasmPaths: string; simd: boolean; numThreads: number } };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => Tensor;
  InferenceSession: { create(model: Uint8Array): Promise<{ run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>> }> };
}

/** Collapses CTC frames (the best token per frame) to text: repeats merged, blanks dropped. */
export function ctcDecode(best: number[], vocab: Record<string, number>): string {
  const byId = new Map(Object.entries(vocab).map(([k, v]) => [v, k]));
  let out = '';
  let prev = -1;
  for (const id of best) {
    if (id !== prev) {
      const t = byId.get(id) ?? '';
      if (t === '|') out += ' ';
      else if (!t.startsWith('<')) out += t;
    }
    prev = id;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Loads wav2vec2 and returns a function from 16 kHz mono samples to the letters heard. */
export async function loadLetters(engineDir: string, modelDir: string): Promise<(pcm: Float32Array) => Promise<string>> {
  const mod = await import(/* @vite-ignore */ pathToFileURL(join(engineDir, 'ort.min.mjs')).href);
  const ort = (mod.default ?? mod) as Ort;
  ort.env.wasm.wasmPaths = pathToFileURL(engineDir).href + '/';
  ort.env.wasm.simd = true;
  ort.env.wasm.numThreads = 1;
  const session = await ort.InferenceSession.create(new Uint8Array(readFileSync(join(modelDir, 'onnx/model_quantized.onnx'))));
  const vocab = JSON.parse(readFileSync(join(modelDir, 'vocab.json'), 'utf8')) as Record<string, number>;
  return async (pcm) => {
    // the feature extractor's normalization: zero mean, unit variance
    const mean = pcm.reduce((a, b) => a + b, 0) / pcm.length;
    const sd = Math.sqrt(pcm.reduce((a, b) => a + (b - mean) ** 2, 0) / pcm.length + 1e-7);
    const input = pcm.map((v) => (v - mean) / sd);
    const { logits } = await session.run({ input_values: new ort.Tensor('float32', input, [1, input.length]) });
    const [, frames, size] = logits.dims;
    const best: number[] = [];
    for (let f = 0; f < frames; f++) {
      let top = 0;
      for (let k = 1; k < size; k++) if (logits.data[f * size + k] > logits.data[f * size + top]) top = k;
      best.push(top);
    }
    return ctcDecode(best, vocab);
  };
}
