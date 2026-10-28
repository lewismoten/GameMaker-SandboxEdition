// The closing card of a walkthrough the bot made only partway (format.ts `partial`): "The bot
// got this far." and where it stopped, over the last screen played, dimmed. The player shows
// the words over its screen; the MP4 (exportVideo.ts) ends with a few seconds of this card,
// drawn here in the 8x8 font on the 320x200 frame.
import { FONT8X8 } from '../gfx/font8x8';
import type { Walkthrough } from './format';

const W = 320;
const H = 200;
/** Characters on a line of the card (the screen is 40 wide; a margin each side). */
const COLS = 36;

/** The card's lines: the heading, then where it stopped, wrapped to the screen. */
export function endCardLines(walk: Pick<Walkthrough, 'ending'>): string[] {
  const out = ['The bot got this far.'];
  if (!walk.ending) return out;
  out.push('');
  let line = '';
  for (const word of walk.ending.replace(/’/g, "'").split(/\s+/)) {
    if (line && line.length + 1 + word.length > COLS) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

/** Dims the frame (RGBA, 320x200) and writes `lines` on it, centered; the first line in yellow. */
export function drawEndCard(rgba: Uint8ClampedArray, lines: string[]): void {
  for (let i = 0; i < W * H * 4; i += 4) {
    rgba[i] = rgba[i] * 0.3;
    rgba[i + 1] = rgba[i + 1] * 0.3;
    rgba[i + 2] = rgba[i + 2] * 0.3;
  }
  const top = Math.round((H - lines.length * 12) / 2);
  lines.forEach((text, row) => {
    const color = row === 0 ? [255, 255, 85] : [255, 255, 255];
    const left = Math.round((W - text.length * 8) / 2);
    for (let c = 0; c < text.length; c++) {
      const code = text.charCodeAt(c) & 0xff;
      for (let y = 0; y < 8; y++) {
        const bits = FONT8X8[code * 8 + y];
        for (let x = 0; x < 8; x++) {
          if (!(bits & (1 << x))) continue;
          const px = left + c * 8 + x;
          const py = top + row * 12 + y;
          if (px < 0 || px >= W || py < 0 || py >= H) continue;
          const o = (py * W + px) * 4;
          rgba[o] = color[0];
          rgba[o + 1] = color[1];
          rgba[o + 2] = color[2];
          rgba[o + 3] = 255;
        }
      }
    }
  });
}
