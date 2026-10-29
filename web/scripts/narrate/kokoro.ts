// Kokoro (hexgrad's Kokoro-82M, Apache-2.0) for scripts/narrate.ts: the tour's hosts who need a
// voice unlike Lewis's own (Gwinn's) speak in one of its stock voices. kokoro-js and its
// packages live in the git-ignored /.narrate folder (npm run voice:setup), never in the app's
// own packages, and the model is read from the Local Agent Lab's workspace; nothing downloads.
// It runs in a child process: onnxruntime-node aborts a process that exits with it loaded, so
// the child is killed when the script is done instead.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

/**
 * The child: loads Kokoro from the tools folder (so kokoro-js and transformers.js share one
 * setup there), then for each line of JSON { text, voice } on stdin answers with one line of
 * JSON { rate, seconds, pcm (base64 Float32) } on stdout.
 */
const CHILD = `import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';
import { createInterface } from 'node:readline';
env.localModelPath = process.argv[2];
env.allowRemoteModels = false;
const tts = await KokoroTTS.from_pretrained('kokoro', { dtype: 'q8', device: 'cpu' });
process.stdout.write('ready\\n');
for await (const line of createInterface({ input: process.stdin })) {
  const { text, voice } = JSON.parse(line);
  const t = performance.now();
  const r = await tts.generate(text, { voice });
  const pcm = Buffer.from(r.audio.buffer, r.audio.byteOffset, r.audio.byteLength).toString('base64');
  process.stdout.write(JSON.stringify({ rate: r.sampling_rate, seconds: (performance.now() - t) / 1000, pcm }) + '\\n');
}
`;

export interface KokoroTake {
  audio: Float32Array;
  rate: number;
  genSeconds: number;
}

export interface Kokoro {
  generate(text: string, voice: string): Promise<KokoroTake>;
  /** Ends the child process. */
  close(): void;
}

/**
 * Starts Kokoro: `tools` holds kokoro-js's node_modules, `model` the Kokoro-82M ONNX folder
 * (model_quantized.onnx, config.json, tokenizer.json, tokenizer_config.json). The stock voices
 * come with kokoro-js.
 */
export async function loadKokoro(tools: string, model: string): Promise<Kokoro> {
  if (!existsSync(join(tools, 'node_modules/kokoro-js')))
    throw new Error(`Kokoro isn't set up in ${tools} (run npm run voice:setup from web/, or set NARRATE_TOOLS).`);
  // transformers.js wants <models>/<name>/{config.json,…,onnx/model_quantized.onnx}: lay that out with links
  const models = join(tools, 'models');
  const dir = join(models, 'kokoro');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'onnx'), { recursive: true });
  for (const f of ['config.json', 'tokenizer.json', 'tokenizer_config.json']) symlinkSync(join(model, f), join(dir, f));
  symlinkSync(join(model, 'model_quantized.onnx'), join(dir, 'onnx/model_quantized.onnx'));
  const entry = join(tools, 'kokoro-child.mjs');
  writeFileSync(entry, CHILD);

  const child = spawn(process.execPath, [entry, `${models}/`], { cwd: tools, stdio: ['pipe', 'pipe', 'inherit'] });
  const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
  const next = async (): Promise<string> => {
    const r = await lines.next();
    if (r.done) throw new Error('Kokoro stopped (see its message above).');
    return r.value;
  };
  if ((await next()) !== 'ready') throw new Error('Kokoro didn’t start.');
  return {
    async generate(text, voice) {
      child.stdin.write(`${JSON.stringify({ text, voice })}\n`);
      const r = JSON.parse(await next()) as { rate: number; seconds: number; pcm: string };
      const bytes = Buffer.from(r.pcm, 'base64');
      const audio = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      return { audio, rate: r.rate, genSeconds: r.seconds };
    },
    close() {
      child.kill('SIGKILL');
    },
  };
}
