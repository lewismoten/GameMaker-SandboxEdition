// Records the tour's lines in Lewis Moten's own cloned voice with Pocket TTS, locally: one small
// Ogg Opus clip per line, public/tour/voice/<chapter>/<id>.ogg, with index.json (id → chapter,
// where, words, seconds, hashes) and a generated README.md beside them, skipping lines whose words
// and voice sample haven't changed. The models, engine and voice sample stay outside the repo
// (paths below, or env vars); only the clips are committed, so CI never runs this. From web/:
//   npm run voice                                    every new or changed line of src/tour/lines.ts
//   npm run voice:all                                every line again (--force)
//   npx vite-node scripts/narrate.ts --lines <file>  [{ "id", "chapter", "where", "text" }]
// Options: --out <dir>, --only <id>[,<id>] (a retake; each take differs), --force, --seed <n>
// (the same take again), --sample <file> (.webm, .wav, .m4a, .mp3…; its clearest 10 s is used),
// --engine <dir>, --model <dir>, --kbps <n> and --rate <hz> (the Opus encoding),
// --wav (also keep each take as .wav, for comparing encodings), --dry-run (list what would be recorded).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLIP_OGG, clearestWindow, normalize, readMono, shiftVoice, writeOgg } from './narrate/audio';
import { clipPath, indexJson, lineProblems, planTakes, refreshPlaces, staleIds, textHash, type Line, type VoiceIndex } from './narrate/lineIndex';
import { PocketTts, randomSource } from './narrate/pocketTts';
import { voiceReadme } from './narrate/voiceReadme';

const WORKSPACE = join(homedir(), 'Documents/rivers-of-memory-workspace');
const DEFAULTS = {
  engine: process.env.POCKET_TTS_ENGINE ?? join(WORKSPACE, 'engines/Pocket-TTS'),
  model: process.env.POCKET_TTS_MODEL ?? join(WORKSPACE, 'models/Pocket-TTS-english_2026-04'),
  out: process.env.NARRATE_OUT ?? 'public/tour/voice',
};

/**
 * The voice samples a host's voice names (src/tour/steps.ts HOSTS), all kept outside the repo:
 * Lewis's own recording (chosen by ear; git-ignored), and his other voices recorded in the
 * Local Agent Lab's workspace. NARRATE_SAMPLE_<NAME> (e.g. NARRATE_SAMPLE_SCROOBIE) moves one.
 */
const SAMPLES: Record<string, string> = {
  lewis: fileURLToPath(new URL('../../.for-lewis/voice/lewie-sample-audio.mp3', import.meta.url)),
  scroobie: join(WORKSPACE, 'voices/samples/f2a53d0c-14b9-4919-89fd-582ef03b8c05.webm'),
  'olden-mon': join(WORKSPACE, 'voices/samples/a6c6994c-ad62-48a0-89e9-81d744701b0e.webm'),
  'snooty-wiz': join(WORKSPACE, 'voices/samples/3a31070f-6ac7-4868-8b9c-37018e0dc1f4.webm'),
};
const samplePath = (name: string) => process.env[`NARRATE_SAMPLE_${name.toUpperCase().replace(/-/g, '_')}`] ?? SAMPLES[name];

function args(argv: string[]) {
  const flags = new Set(['force', 'dry-run', 'wav']);
  const o: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`unexpected ${a}`);
    const key = a.slice(2);
    if (flags.has(key)) o[key] = true;
    else if (i + 1 < argv.length) o[key] = argv[++i];
    else throw new Error(`${a} needs a value`);
  }
  return o;
}

async function loadLines(o: Record<string, string | true>): Promise<Line[]> {
  if (typeof o.lines === 'string') return JSON.parse(readFileSync(need(o.lines, 'lines file'), 'utf8'));
  // a path worked out at run time, so this file builds without the tour
  const path = fileURLToPath(new URL('../src/tour/lines', import.meta.url));
  const { tourLines } = (await import(/* @vite-ignore */ path)) as { tourLines: () => Line[] };
  return tourLines().map(({ id, chapter, where, text, voice }) => ({ id, chapter, where, text, voice }));
}

const ENV: Record<string, string> = { sample: 'NARRATE_SAMPLE_<NAME>', engine: 'POCKET_TTS_ENGINE', model: 'POCKET_TTS_MODEL' };

/** The path, or a clear error naming what is missing and how to point at it. */
function need(path: string, what: string): string {
  const flag = what.split(' ')[0];
  const env = ENV[flag] ? ` or set ${ENV[flag]}` : '';
  if (!existsSync(path)) throw new Error(`The ${what} isn't at ${path} (pass --${flag} <path>${env}).`);
  return path;
}

async function main() {
  const o = args(process.argv.slice(2));
  const lines = await loadLines(o);
  const problems = lineProblems(lines);
  if (problems.length) throw new Error(problems.join('\n'));
  const str = (k: string, d: string) => (typeof o[k] === 'string' ? o[k] : d);
  const out = resolve(str('out', DEFAULTS.out));
  // --sample puts every line in one recording (to compare samples); otherwise each host's own
  const override = typeof o.sample === 'string' ? need(o.sample, 'sample') : undefined;
  const voiceOf = (l: Line) => {
    const name = l.voice?.sample ?? 'lewis';
    const path = override ?? samplePath(name);
    if (!path) throw new Error(`${l.id}: there is no voice sample named ${name} (scripts/narrate.ts SAMPLES)`);
    return { path, semitones: l.voice?.semitones ?? 0, tempo: l.voice?.tempo ?? 1 };
  };
  const sampleHashes = new Map<string, string>();
  const voiceHash = (l: Line) => {
    const v = voiceOf(l);
    if (!sampleHashes.has(v.path)) sampleHashes.set(v.path, textHash(new Uint8Array(readFileSync(need(v.path, 'sample')))));
    return textHash(`${sampleHashes.get(v.path)}|${v.semitones}|${v.tempo}`);
  };
  const indexFile = join(out, 'index.json');
  const index: VoiceIndex = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : {};
  const only = typeof o.only === 'string' ? o.only.split(',') : undefined;
  const unknown = only?.filter((id) => !lines.some((l) => l.id === id)) ?? [];
  if (unknown.length) throw new Error(`no line has the id ${unknown.join(', ')}`);
  const todo = planTakes(lines, index, { force: !!o.force, only, voice: voiceHash, exists: (p) => existsSync(join(out, p)) });
  const stale = staleIds(lines, index);
  if (stale.length) console.warn(`in the index but no longer a line (delete their clips by hand): ${stale.join(', ')}`);
  console.log(`${todo.length} of ${lines.length} lines to record into ${out}`);
  if (o['dry-run']) return todo.forEach((id) => console.log(`  ${id}`));

  const save = () => {
    refreshPlaces(lines, index);
    mkdirSync(out, { recursive: true });
    writeFileSync(indexFile, indexJson(index));
    writeFileSync(join(out, 'README.md'), voiceReadme(lines, index));
  };
  if (!todo.length) return save();

  const tts = await PocketTts.load(need(str('engine', DEFAULTS.engine), 'engine folder'), need(str('model', DEFAULTS.model), 'model folder'));
  const rate = tts.sampleRate;
  // each sample is cloned once, when a line first needs it
  const clones = new Map<string, Awaited<ReturnType<typeof tts.cloneVoice>>>();
  const cloneOf = async (path: string) => {
    if (!clones.has(path)) {
      const reference = clearestWindow(readMono(path, rate), rate);
      console.log(`voice: ${path} (${(reference.length / rate).toFixed(1)} s used)`);
      clones.set(path, await tts.cloneVoice(reference));
    }
    return clones.get(path)!;
  };
  const ogg = { kbps: Number(str('kbps', String(CLIP_OGG.kbps))), rate: Number(str('rate', String(CLIP_OGG.rate))) };
  const seed = typeof o.seed === 'string' ? Number(o.seed) : undefined;
  let spoken = 0;
  let spent = 0;
  for (const id of todo) {
    const line = lines.find((l) => l.id === id)!;
    const v = voiceOf(line);
    const take = await tts.generate(line.text, await cloneOf(v.path), randomSource(seed));
    take.audio = normalize(shiftVoice(take.audio, rate, v.semitones, v.tempo), rate);
    const seconds = Math.round((take.audio.length / rate) * 100) / 100;
    const file = join(out, clipPath(line));
    mkdirSync(dirname(file), { recursive: true });
    writeOgg(file, take.audio, rate, ogg);
    if (o.wav) writeWav(file.replace(/\.ogg$/, '.wav'), take.audio, rate);
    index[id] = { chapter: line.chapter, where: line.where ?? '', text: line.text, seconds, hash: textHash(line.text), voice: voiceHash(line) };
    save();
    ((spoken += seconds), (spent += take.genSeconds));
    console.log(`  ${clipPath(line)}: ${seconds.toFixed(2)} s in ${take.genSeconds.toFixed(1)} s`);
  }
  console.log(`${spoken.toFixed(1)} s of speech in ${spent.toFixed(1)} s (${(spoken / spent).toFixed(2)}× real time)`);
}

/** A 16-bit mono WAV, for comparing encodings of one take. */
function writeWav(file: string, pcm: Float32Array, rate: number): void {
  const b = Buffer.alloc(44 + pcm.length * 2);
  (b.write('RIFF', 0),
    b.writeUInt32LE(36 + pcm.length * 2, 4),
    b.write('WAVEfmt ', 8),
    b.writeUInt32LE(16, 16),
    b.writeUInt16LE(1, 20),
    b.writeUInt16LE(1, 22));
  (b.writeUInt32LE(rate, 24),
    b.writeUInt32LE(rate * 2, 28),
    b.writeUInt16LE(2, 32),
    b.writeUInt16LE(16, 34),
    b.write('data', 36),
    b.writeUInt32LE(pcm.length * 2, 40));
  pcm.forEach((v, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  writeFileSync(file, b);
}

// onnxruntime's WASM keeps Node's event loop open, so leave when done
main().then(
  () => process.exit(0),
  (e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
