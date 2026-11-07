// Lists every word in the pronunciation lexicon (pronounce.json) with what the voices make of it:
// each word is recorded alone, in the voice of every guide (and phone caller) whose lines say it,
// then heard twice, by Whisper (which snaps a made-up word to the nearest real one) and by
// letters.ts (wav2vec2 spelling the sounds with no dictionary). Run from web/:
//   npm run voice:words                       every entry
//   npm run voice:words -- --only Gravitas,Gwinn
//   npm run voice:words -- --compare          each word as written too (the lexicon off), to see why it is there
// Clips are recorded with one seed and cached by narrate.ts in /.narrate/words/ (git-ignored),
// so a second run only hears them again. The report goes to stdout and /.narrate/voice-words.md.
// Listen to a clip there before trusting either transcript: both are only hints.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMono } from './audio';
import { loadLetters } from './letters';
import { clipPath, type Line } from './lineIndex';
import { LEXICON } from './pronounce';
import { DEFAULT_MODEL, transcribe } from './whisper';

const TOOLS = fileURLToPath(new URL('../../../.narrate', import.meta.url));
const WEB = fileURLToPath(new URL('../..', import.meta.url));
const WORKSPACE = join(homedir(), 'Documents/rivers-of-memory-workspace');
const ENGINE = process.env.POCKET_TTS_ENGINE ?? join(WORKSPACE, 'engines/Pocket-TTS');
const WAV2VEC2 = process.env.WAV2VEC2_MODEL ?? join(WORKSPACE, 'models/Wav2Vec2-Base-960h-Q8');

type Voiced = Line & { speaker?: string };

async function allLines(): Promise<Voiced[]> {
  const path = fileURLToPath(new URL('../../src/tour/lines', import.meta.url));
  const { tourLines } = (await import(/* @vite-ignore */ path)) as { tourLines: () => Voiced[] };
  const phone = (await import('./phoneLines')).phoneLines().map((l) => ({ ...l, speaker: 'phone' }));
  return [...tourLines(), ...phone];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A test line per lexicon word and voice that says it: the word alone, in that voice. */
function testLines(lines: Voiced[], words: string[]): (Line & { word: string; speakers: string[] })[] {
  const out = new Map<string, Line & { word: string; speakers: string[] }>();
  for (const word of words) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu');
    for (const l of lines.filter((l) => re.test(l.spoken ?? l.text))) {
      const v = l.voice ?? { sample: 'lewis', semitones: 0, tempo: 1 };
      const id = slug(`${word} ${v.sample} ${v.semitones} ${v.tempo}`);
      const t = out.get(id) ?? { id, chapter: 'words', where: '', text: `${word}.`, voice: v, word, speakers: [] };
      if (!t.speakers.includes(l.speaker ?? '')) t.speakers.push(l.speaker ?? '');
      out.set(id, t);
    }
  }
  return [...out.values()];
}

/** Records the test lines with narrate.ts into `dir` (only new or changed ones), lexicon on or off. */
function record(tests: Line[], dir: string, lexicon: boolean): void {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'lines.json');
  writeFileSync(file, JSON.stringify(tests.map(({ id, chapter, where, text, voice }) => ({ id, chapter, where, text, voice }))));
  execFileSync('npx', ['vite-node', 'scripts/narrate.ts', '--', '--lines', file, '--out', dir, '--seed', '1'], {
    cwd: WEB,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, NARRATE_LEXICON: lexicon ? 'on' : 'off' },
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const compare = argv.includes('--compare');
  const onlyAt = argv.indexOf('--only');
  const only = onlyAt >= 0 ? argv[onlyAt + 1]?.split(',') : undefined;
  const words = Object.keys(LEXICON).filter((w) => !only || only.some((o) => o.toLowerCase() === w.toLowerCase()));
  const tests = testLines(await allLines(), words);
  const said = join(TOOLS, 'words/respelled');
  const written = join(TOOLS, 'words/as-written');
  record(tests, said, true);
  if (compare) record(tests, written, false);

  const files = tests.flatMap((t) => [join(said, clipPath(t)), ...(compare ? [join(written, clipPath(t))] : [])]).filter(existsSync);
  const whisper = transcribe(files, DEFAULT_MODEL);
  const letters = existsSync(WAV2VEC2) ? await loadLetters(ENGINE, WAV2VEC2) : undefined;
  const hear = async (f: string) => {
    if (!existsSync(f)) return '(no clip)';
    const pcm = readMono(f, 16000);
    const l = letters ? (await letters(pcm)).toLowerCase() : '';
    return `“${whisper.get(f) ?? ''}”${letters ? ` / ${l}` : ''} (${(pcm.length / 16000).toFixed(2)} s)`;
  };
  const report = [
    '# Voice words',
    '',
    `Each lexicon word alone, in each voice that says it. Heard by Whisper / ${letters ? 'spelled by wav2vec2' : '(wav2vec2 not found: set WAV2VEC2_MODEL)'}. Clips are in \`.narrate/words/\`.`,
    '',
  ];
  for (const word of words) {
    const p = LEXICON[word];
    report.push(`## ${word}`, '', `- Should sound: ${p.sounds}`, `- Said as: ${p.say}${p.kokoro ? ` (Kokoro: ${p.kokoro})` : ''}`);
    for (const t of tests.filter((t) => t.word === word)) {
      const who = `${t.speakers.join(', ')} (${t.voice!.sample})`;
      report.push(`- ${who}: ${await hear(join(said, clipPath(t)))}`);
      if (compare) report.push(`  - as written: ${await hear(join(written, clipPath(t)))}`);
    }
    if (!tests.some((t) => t.word === word)) report.push('- No line says it now.');
    report.push('');
  }
  const text = report.join('\n');
  writeFileSync(join(TOOLS, 'voice-words.md'), text);
  console.log(text);
  console.log(`(also in ${join(TOOLS, 'voice-words.md')})`);
}

// onnxruntime's WASM keeps Node's event loop open, so leave when done
main().then(
  () => process.exit(0),
  (e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
