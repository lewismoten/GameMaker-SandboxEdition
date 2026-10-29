// Hears the tour's voice clips with Whisper, locally, and lists the ones that don't say their
// words: a word dropped, misread or cut short (compare.ts decides what counts). Run after
// npm run voice, from web/:
//   npm run voice:check                    every clip (transcripts are cached by the clip's bytes)
//   npm run voice:check -- --only <id>[,<id>]
// Options: --model <ggml file> for whisper.cpp's whisper-cli (default ggml-large-v3.bin in
// ~/.cache/whisper-cpp, or WHISPER_MODEL), or --model <name> (small, medium.en…) for
// openai-whisper's whisper command; --out <dir> (the clips), --lines <file> (as narrate.ts),
// --fresh (hear every clip again). The report goes to stdout and /.narrate/voice-check.md; the
// cache is /.narrate/voice-check.json, both git-ignored. Nothing is downloaded; CI never runs it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareSpeech, type Hunk } from './compare';
import { clipPath, spokenOf, textHash, type Line } from './lineIndex';

const TOOLS = fileURLToPath(new URL('../../../.narrate', import.meta.url));
const CACHE = join(TOOLS, 'voice-check.json');
const REPORT = join(TOOLS, 'voice-check.md');
const DEFAULT_MODEL = process.env.WHISPER_MODEL ?? join(homedir(), '.cache/whisper-cpp/ggml-large-v3.bin');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

function args(argv: string[]): Record<string, string | true> {
  const o: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (key === 'fresh') o.fresh = true;
    else if (i + 1 < argv.length) o[key] = argv[++i];
    else throw new Error(`${argv[i]} needs a value`);
  }
  return o;
}

async function loadLines(file?: string): Promise<(Line & { speaker?: string })[]> {
  if (file) return JSON.parse(readFileSync(file, 'utf8'));
  const path = fileURLToPath(new URL('../../src/tour/lines', import.meta.url));
  const { tourLines } = (await import(/* @vite-ignore */ path)) as { tourLines: () => (Line & { speaker: string })[] };
  return tourLines();
}

/** Whisper's transcript of each clip (path → text), one model load for them all. */
function transcribe(clips: string[], model: string): Map<string, string> {
  const dir = mkdtempSync(join(tmpdir(), 'voice-check-'));
  const out = new Map<string, string>();
  try {
    // whisper.cpp reads 16 kHz WAV (not Opus); openai-whisper reads anything, through ffmpeg too
    const wavs = clips.map((clip, i) => {
      const wav = join(dir, `${i}.wav`);
      execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', clip, '-ar', '16000', '-ac', '1', wav]);
      return wav;
    });
    const cpp = model.includes('/');
    if (cpp) {
      if (!existsSync(model)) throw new Error(`No Whisper model at ${model} (pass --model <ggml file or name>, or set WHISPER_MODEL).`);
      execFileSync('whisper-cli', ['-m', model, '-l', 'en', '-nt', '-np', '-otxt', ...wavs], { stdio: ['ignore', 'ignore', 'ignore'] });
    } else {
      execFileSync('whisper', [...wavs, '--model', model, '--language', 'en', '--fp16', 'False', '--output_format', 'txt', '--output_dir', dir], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    }
    clips.forEach((clip, i) => {
      const txt = cpp ? `${wavs[i]}.txt` : join(dir, `${basename(wavs[i], '.wav')}.txt`);
      out.set(clip, existsSync(txt) ? readFileSync(txt, 'utf8').replace(/\s+/g, ' ').trim() : '');
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return out;
}

const words = (h: Hunk) => `“${h.said.join(' ') || '…'}” → “${h.heard.join(' ') || '(nothing)'}”`;

async function main() {
  const o = args(process.argv.slice(2));
  const str = (k: string) => (typeof o[k] === 'string' ? o[k] : undefined);
  const model = str('model') ?? DEFAULT_MODEL;
  const voiceDir = resolve(str('out') ?? 'public/tour/voice');
  const only = str('only')?.split(',');
  const lines = (await loadLines(str('lines'))).filter((l) => !only || only.includes(l.id));
  const cache: Record<string, string> = !o.fresh && existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};

  const clips = lines.map((l) => ({ line: l, file: join(voiceDir, clipPath(l)) })).filter((c) => existsSync(c.file));
  const keyOf = (file: string) => `${basename(model)}|${textHash(new Uint8Array(readFileSync(file)))}`;
  const todo = clips.filter((c) => !(keyOf(c.file) in cache));
  console.log(`${clips.length} clips, ${todo.length} to hear with ${basename(model)}…`);
  if (todo.length) {
    const heard = transcribe(
      todo.map((c) => c.file),
      model,
    );
    for (const c of todo) cache[keyOf(c.file)] = heard.get(c.file) ?? '';
    mkdirSync(TOOLS, { recursive: true });
    writeFileSync(CACHE, JSON.stringify(cache, null, 1) + '\n');
  }

  const missed: string[] = [];
  const report = ['# Voice check', '', `${new Date().toISOString().slice(0, 16)}, ${basename(model)}, ${clips.length} clips.`, ''];
  const small: string[] = [];
  for (const { line, file } of clips) {
    const heard = cache[keyOf(file)];
    const spoken = spokenOf(line);
    const r = compareSpeech(line.text, heard, spoken === line.text ? undefined : spoken);
    if (r.misses.length) {
      missed.push(line.id);
      report.push(`## ${line.id}${line.speaker ? ` (${line.speaker})` : ''}`, '', `- Written: ${line.text}`);
      if (spoken !== line.text) report.push(`- Spoken: ${spoken}`);
      report.push(`- Heard: ${heard || '(nothing)'}`, `- Differs: ${r.misses.map(words).join('; ')}`, '');
    } else if (r.small.length) small.push(`- ${line.id}: ${r.small.map(words).join('; ')}`);
  }
  if (small.length) report.push('## Little words only', '', ...small, '');
  report.push(
    missed.length
      ? `${missed.length} of ${clips.length} clips differ. Retake them: \`npm run voice -- --only ${missed.join(',')}\`, then check again.`
      : `All ${clips.length} clips say their words.`,
  );
  const text = report.join('\n') + '\n';
  mkdirSync(TOOLS, { recursive: true });
  writeFileSync(REPORT, text);
  console.log(text);
  console.log(`(also in ${REPORT})`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
