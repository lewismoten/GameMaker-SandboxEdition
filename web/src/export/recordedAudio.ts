// The part of a game that isn't MIT licensed: a Bard of Bizarre game's voice clips, cut from
// song recordings made on the free plan of Riffusion (now Google Flow Music), whose terms allow
// free-plan output for "personal, non-commercial uses only" (NOTICE.md). The game's
// LICENSE.TXT names them under "VOICE CLIPS: NOT MIT" (games/kit/license.ts); the downloads'
// notices (notices.ts, exportDos.ts, exportWebApp.ts) repeat it so it travels with every copy.
import type { GameFiles } from '../project/files';

/** The heading LICENSE.TXT gives the clips (games/kit/license.ts). */
export const RECORDED_HEADING = 'VOICE CLIPS: NOT MIT';

/** The voice clips (upper-case DOS names) a game's LICENSE.TXT says are not MIT, or none. */
export function recordedClips(files: GameFiles): string[] {
  const bytes = files.get('license.txt');
  if (!bytes) return [];
  const text = new TextDecoder('latin1').decode(bytes);
  const at = text.indexOf(RECORDED_HEADING);
  if (at < 0) return [];
  // the clip list runs from the heading to the sentence that follows it ("That service's terms...")
  const end = text.indexOf("That service's", at);
  const list = text.slice(at + RECORDED_HEADING.length, end < 0 ? undefined : end);
  return [...new Set(list.match(/\b[A-Z0-9_]{1,8}\.VOC\b/g) ?? [])];
}

/** Word-wraps text to `width` columns, each line starting with `indent`. */
function wrap(text: string, width: number, indent: string): string {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && indent.length + line.length + 1 + word.length > width) {
      out.push(indent + line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(indent + line);
  return out.join('\n');
}

/** The downloads' paragraph about the clips (`indent` for the DOS README's style), or undefined when there are none. */
export function recordedAudioNotice(clips: readonly string[], width = 78, indent = ''): string | undefined {
  if (!clips.length) return undefined;
  return [
    `The game's voice clips (${clips.join(', ')}) are cut from song recordings made on the free plan of Riffusion (now Google Flow Music), whose terms allow free-plan songs only "personal, non-commercial uses". They are not covered by the MIT License: don't sell them or use them commercially.`,
    "The rest of the game (its code, levels, art, text, and FM music arranged by Claude) is MIT licensed; the game's LICENSE.TXT has the details.",
  ]
    .map((p) => wrap(p, width, indent))
    .join('\n\n');
}
