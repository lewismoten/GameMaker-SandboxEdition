// Whisper, run locally on clips: whisper.cpp's whisper-cli with a ggml model file (a path), or
// openai-whisper's whisper command with a model name. Used by voice:check (verify.ts) and
// voice:words (words.ts). Nothing is downloaded.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join } from 'node:path';

export const DEFAULT_MODEL = process.env.WHISPER_MODEL ?? join(homedir(), '.cache/whisper-cpp/ggml-large-v3.bin');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

/** Whisper's transcript of each clip (path → text), one model load for them all. */
export function transcribe(clips: string[], model: string): Map<string, string> {
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
