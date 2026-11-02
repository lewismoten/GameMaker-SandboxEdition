// The banter cards: before a level and after it, Doc Leo and the rubber chicken talk it over
// (is it fixed, or do they try something else?). Doc Leo stands at the left, the chicken on the
// workbench at the right, and their lines run down the middle in speech boxes. Once the egg is
// laid, every card names her Lady Regina III; the card where it happens says so, formally.
// Asleep (the dream's end), the chicken snores; with Teddy, he sits at Doc Leo's feet.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { centered, text, textWidth } from '../../../snowbound/src/art/font';
import { rubberEgg } from '../art/egg';
import { POSES } from '../../../teddy2/src/sprites/teddy';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { SP, INK, drawChicken, drawLeo, dreamFrame } from './art';
import { garage } from './garage';

const c = SP.c;

/** `aside`: the chicken turning to the player. */
export type Who = 'leo' | 'reggie' | 'regina' | 'aside';
export type Line = [Who, string] | ['stamp', string];
export interface Card {
  /** The heading across the top (a level's name, or none). */
  title?: string;
  lines: Line[];
  /** The chicken is Lady Regina III. */
  lady?: boolean;
  /** Her egg sits beside her on the bench. */
  egg?: boolean;
  leoPose?: string;
  /** The chicken is asleep on the bench, snoring (the dream's end). */
  asleep?: boolean;
  /** Teddy sits at Doc Leo's feet. */
  teddy?: boolean;
  /** Sir Reginald's dream (levels 1-4): the card is framed in cloud. */
  dream?: boolean;
}

const NAMES: Record<Who, string> = { leo: 'DOC LEO', reggie: 'SIR REGINALD III', regina: 'LADY REGINA III', aside: 'SIR REGINALD, TO YOU' };
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

/**
 * Whole seconds to read a card: about 3 s and a quarter second a word, and never under the 8 s
 * a card always had. (A level's after card is shown for PLAYGAME's 15 s default, which is more
 * than any of them needs.)
 */
export function cardSeconds(k: Card): number {
  const words = [k.title ?? '', ...k.lines.map((l) => l[1])].join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.ceil(3 + 0.25 * words));
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
  drawChicken(p, 254, 129, 3, { lady: k.lady, squawk: !k.asleep, bob: k.asleep ? 1 : 0 }, true);
  if (k.asleep) for (const [i, s] of ['z', 'z', 'Z'].entries()) text(p, 290 + i * 8, 112 - i * 12, s, INK, i === 2 ? 2 : 1);
  if (k.teddy) scaleBlit(p, POSES.front, 40, 160, 2);
  if (k.egg) p.blit(rubberEgg(new Pixels(20, 20, 255)), 290, 109, 255);
  if (k.dream) dreamFrame(p, [266, 104], !k.title);
  let y = k.title ? 32 : 12;
  for (const [who, words] of k.lines) {
    if (who === 'stamp') {
      // a formal correction, stamped across the card
      const rows = wrap(words, 15);
      const w = Math.max(...rows.map((r) => textWidth(r))) + 12;
      const x = BOX_X + Math.round((BOX_W - w) / 2);
      const h = 6 + rows.length * 10;
      p.rect(x, y, w, h, c('red', 1)).frame(x, y, w, h, c('red', 3));
      rows.forEach((r, i) => text(p, x + 6, y + 4 + i * 10, r, c('paint', 3)));
      y += h + 4;
      continue;
    }
    const rows = wrap(words);
    const h = 13 + rows.length * 9;
    const left = who === 'leo';
    if (who === 'aside') {
      // turned to the player: the box faces out of the card, and its edge is dashed
      p.rect(BOX_X, y, BOX_W, h, c('yellow', 3));
      for (let x = BOX_X; x < BOX_X + BOX_W; x += 4) p.rect(x, y, 2, 1, INK).rect(x, y + h - 1, 2, 1, INK);
      text(p, BOX_X + 4, y + 3, NAMES[who], c('orange', 0));
      rows.forEach((r, i) => text(p, BOX_X + 4, y + 12 + i * 9, r, INK));
      y += h + 4;
      continue;
    }
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
