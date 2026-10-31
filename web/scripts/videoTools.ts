// The checks behind `npm run video:transcript` (videoTranscribe.ts): the id and the tools it needs.
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

export const MODEL = join(homedir(), '.cache/whisper-cpp/ggml-large-v3.bin');
const TOOLS = ['yt-dlp', 'ffmpeg', 'whisper-cli'];

/** The id when it is a YouTube id (11 letters, digits, - and _), otherwise null. */
export function parseId(args: string[]): string | null {
  return args.length === 1 && /^[A-Za-z0-9_-]{11}$/.test(args[0]) ? args[0] : null;
}

/** Whether `name` is an executable file in one of the PATH folders. */
function onPath(name: string, path = process.env.PATH ?? ''): boolean {
  return path.split(delimiter).some((d) => d && existsSync(join(d, name)));
}

/** One message per missing tool or model file. */
export function missing(path?: string, model = MODEL): string[] {
  const out = TOOLS.filter((t) => !onPath(t, path)).map((t) => `${t} is not installed (not found on PATH).`);
  if (!existsSync(model)) out.push(`The Whisper model is missing: ${model}`);
  return out;
}
