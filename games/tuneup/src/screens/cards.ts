// The banter cards: before a level and after it, Doc Leo and the rubber chicken talk it over
// (is it fixed, or do they try something else?). Doc Leo stands at the left, the chicken on the
// workbench at the right, and their lines run down the middle in speech boxes. Once the egg is
// laid, every card names her Lady Regina III; the card where it happens says so, formally.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { centered, text, textWidth } from '../../../snowbound/src/art/font';
import { SP, INK, drawChicken, drawLeo, garage } from './art';

const c = SP.c;

export type Who = 'leo' | 'reggie' | 'regina';
export type Line = [Who, string] | ['stamp', string];
export interface Card {
  /** The heading across the top (a level's name, or none). */
  title?: string;
  lines: Line[];
  /** The chicken is Lady Regina III. */
  lady?: boolean;
  leoPose?: string;
}

const NAMES: Record<Who, string> = { leo: 'DOC LEO', reggie: 'SIR REGINALD III', regina: 'LADY REGINA III' };
/** The middle column the speech boxes fill. */
const BOX_X = 66;
const BOX_W = 188;
const CHARS = Math.floor((BOX_W - 8) / 8);

/** Words wrapped to the box's width. */
export function wrap(s: string, width = CHARS): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of s.split(' ')) {
    if (line && (line + ' ' + word).length > width) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

export function card(k: Card): Pixels {
  const p = garage(166);
  if (k.title) {
    p.rect(0, 0, 320, 22, INK).rect(0, 22, 320, 2, c('accent', 2));
    centered(p, 7, k.title, c('lamp', 4));
  }
  // Doc Leo at the left; the chicken on the workbench at the right
  drawLeo(p, k.leoPose ?? 'grin', 6, 190, 3);
  p.rect(258, 128, 62, 8, c('pipe', 3)).rect(258, 128, 62, 2, c('pipe', 4)).rect(262, 136, 4, 64, c('pipe', 1)).rect(312, 136, 4, 64, c('pipe', 1));
  drawChicken(p, 254, 129, 3, { lady: k.lady, squawk: true }, true);
  let y = k.title ? 32 : 12;
  for (const [who, words] of k.lines) {
    if (who === 'stamp') {
      // a formal correction, stamped across the card
      const w = textWidth(words) + 12;
      const x = 160 - Math.round(w / 2);
      p.rect(x, y, w, 14, c('red', 1)).frame(x, y, w, 14, c('red', 3));
      text(p, x + 6, y + 3, words, c('paint', 3));
      y += 20;
      continue;
    }
    const rows = wrap(words);
    const h = 13 + rows.length * 9;
    const left = who === 'leo';
    p.rect(BOX_X, y, BOX_W, h, c('paint', 3)).frame(BOX_X, y, BOX_W, h, INK);
    // the box's tail, toward whoever is talking
    const tx = left ? BOX_X : BOX_X + BOX_W - 1;
    for (let i = 0; i < 5; i++) p.rect(left ? tx - i - 1 : tx + 1, y + 6 + i, 1, 5 - i, c('paint', 3));
    text(p, BOX_X + 4, y + 3, NAMES[who], who === 'leo' ? c('purple', 0) : c('orange', 0));
    rows.forEach((r, i) => text(p, BOX_X + 4, y + 12 + i * 9, r, INK));
    y += h + 4;
  }
  if (y > 196) throw new Error(`card "${k.title ?? k.lines[0][1]}" runs off the bottom (${y})`);
  return p;
}
