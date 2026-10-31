// The checks behind `npm run video:transcript` (videoTranscribe.ts): the id and the tools it needs.
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

export const MODEL = join(homedir(), '.cache/whisper-cpp/ggml-large-v3.bin');
// How to get each one (macOS with Homebrew; other systems have the same packages under these names).
const INSTALL: Record<string, string> = {
  'yt-dlp': 'brew install yt-dlp  (or pipx install yt-dlp; https://github.com/yt-dlp/yt-dlp)',
  ffmpeg: "brew install ffmpeg  (or your system's ffmpeg package; https://ffmpeg.org)",
  'whisper-cli': 'brew install whisper-cpp  (https://github.com/ggml-org/whisper.cpp)',
};
const TOOLS = Object.keys(INSTALL);
const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin';

/** The id when it is a YouTube id (11 letters, digits, - and _), otherwise null. */
export function parseId(args: string[]): string | null {
  return args.length === 1 && /^[A-Za-z0-9_-]{11}$/.test(args[0]) ? args[0] : null;
}

/** Whether `name` is an executable file in one of the PATH folders. */
function onPath(name: string, path = process.env.PATH ?? ''): boolean {
  return path.split(delimiter).some((d) => d && existsSync(join(d, name)));
}

/** One message per missing tool or model file, each with how to install it. */
export function missing(path?: string, model = MODEL): string[] {
  const out = TOOLS.filter((t) => !onPath(t, path)).map((t) => `${t} is not installed (not found on PATH). Install: ${INSTALL[t]}`);
  if (!existsSync(model)) out.push(`The Whisper model is missing: ${model}. Download (about 3 GB): curl -L --create-dirs -o "${model}" ${MODEL_URL}`);
  return out;
}
