// The banter cards: before a level and after it, Doc Leo and the rubber chicken talk it over
// (is it fixed, or do they try something else?). Each card is a speech-bubble picture and a TXT
// of its words: PLAYGAME writes a slide list's TXT over the GIF before it (PLAYGAME.C
// Display_File), 8x8 letters from x 40, y 40, one line every 8 pixels, in one ink (player.json's
// color.rgb.purple). So the picture holds everything else: the bubbles, one per speech and sized
// to its rows, each with its speaker's name lettered on the row above the words (Lady Regina's in
// pink), a level's title in a bar across the top, and the two of them at the right, the chicken on
// a shelf and Doc Leo on the floor below her, where the bubbles' tails point. Cards with the same
// rows, people and props share one picture (screens.ts names them).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { centered, text } from '../../../snowbound/src/art/font';
import { rubberEgg } from '../art/egg';
import { POSES } from '../../../teddy2/src/sprites/teddy';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { SP, INK, drawChicken, drawLeo, dreamFrame } from './art';
import { garage } from './garage';

const c = SP.c;

/** `aside`: the chicken turning to the player. */
export type Who = 'leo' | 'reggie' | 'regina' | 'aside';
/** `stamp`: her name card, reissued (the words are the new name). */
export type Line = [Who, string] | ['stamp', string];
export interface Card {
  /** The heading (a level's name, or none). */
  title?: string;
  lines: Line[];
  /** The chicken is Lady Regina III. */
  lady?: boolean;
  /** Her egg sits beside her on the shelf. */
  egg?: boolean;
  /** Her egg sits on Doc Leo's hat (kept safe). */
  hatEgg?: boolean;
  leoPose?: string;
  /** The chicken is asleep on the shelf, snoring (the dream's end). */
  asleep?: boolean;
  /** Teddy sits at Doc Leo's feet. */
  teddy?: boolean;
  /** Sir Reginald's dream (levels 1-4): the card is framed in cloud. */
  dream?: boolean;
}

const NAMES: Record<Who | 'stamp', string> = {
  leo: 'DOC LEO',
  reggie: 'SIR REGINALD III',
  regina: 'LADY REGINA III',
  aside: 'SIR REGINALD, TO YOU',
  stamp: '*CORRECTION:',
};
/** The words' columns: PLAYGAME reads 31 at a time, and a 31st would push its line break onto a line of its own. */
export const COLS = 28;
/** The text's top-left and line height (PLAYGAME's Display_File). */
const TX = 40;
const TY = 40;
const ROW = 8;
/** The bubbles' sides, clear of the words by more than textfit's 2 pixels. */
const BX0 = 34;
const BX1 = 270;

/** Words wrapped to `width` columns. */
export function wrap(s: string, width = COLS): string[] {
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
 * Whole seconds to read a card: about 3 s and a quarter second a word, and never under 8 s.
 * (The words appear once the picture has faded in, so the fade isn't counted.)
 */
export function cardSeconds(k: Card): number {
  const words = [k.title ?? '', ...k.lines.map((l) => l[1])].join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.ceil(3 + 0.25 * words));
}

/** A speech: who says it, the row its name is on, and its rows of words. */
interface Speech {
  who: Who | 'stamp';
  row: number;
  words: string[];
}
/** Where the words go: each speech's name row and its words, a blank row between speeches. */
function layout(k: Card): Speech[] {
  let row = 0;
  const out: Speech[] = [];
  for (const [who, s] of k.lines) {
    const words = wrap(s);
    out.push({ who, row, words });
    row += 1 + words.length + 1;
  }
  if (row - 1 > 16) throw new Error(`card "${k.title ?? k.lines[0][1]}" needs ${row - 1} lines; PLAYGAME shows 16`);
  return out;
}

/** The card's words, as PLAYGAME writes them: each speech under its name's row. */
export function cardText(k: Card): string {
  const lines: string[] = [];
  for (const s of layout(k)) {
    while (lines.length < s.row) lines.push('');
    lines.push('', ...s.words);
  }
  for (const l of lines) if (l.length > COLS) throw new Error(`card line over ${COLS} columns: "${l}"`);
  return lines.join('\n') + '\n';
}

/** What the picture depends on: cards that agree here share one. */
export function cardKey(k: Card): string {
  const flags = (['lady', 'egg', 'hatEgg', 'asleep', 'teddy', 'dream'] as const).filter((f) => k[f]).join(',');
  return `${k.title ?? ''}|${flags}|${k.leoPose ?? 'grin'}|${layout(k)
    .map((s) => `${s.who}${s.words.length}`)
    .join(' ')}`;
}

/** The chicken's feet, on her shelf at the top right, and Doc Leo's, on the floor below her. */
const HEN: [number, number] = [276, 92];
const LEO: [number, number] = [276, 194];

/** The speech bubbles and the two of them; the words are the TXT's (cardText). */
export function card(k: Card): Pixels {
  const p = garage(166);
  // the shelf, on two brackets, and her on it
  p.rect(272, HEN[1], 48, 4, c('wood', 3))
    .rect(272, HEN[1], 48, 1, c('wood', 4))
    .rect(272, HEN[1] + 4, 48, 1, c('wood', 1));
  for (const x of [278, 310]) p.rect(x, HEN[1] + 5, 2, 8, c('pipe', 1)).rect(x - 2 + (x > 290 ? 2 : 0), HEN[1] + 5, 4, 2, c('pipe', 1));
  drawChicken(p, HEN[0] + (k.egg ? 6 : 2), HEN[1], 2, { lady: k.lady, squawk: !k.asleep, bob: k.asleep ? 1 : 0 }, true);
  if (k.asleep) for (const [i, s] of ['z', 'z', 'Z'].entries()) text(p, 282 + i * 10, 46 - i * 10, s, INK, i === 2 ? 2 : 1);
  if (k.egg) p.blit(rubberEgg(new Pixels(20, 20, 255)), 271, HEN[1] - 19, 255);
  drawLeo(p, k.leoPose ?? 'grin', LEO[0], LEO[1], 2);
  if (k.hatEgg) p.blit(rubberEgg(new Pixels(20, 20, 255)), LEO[0] + 9, LEO[1] - 98, 255);
  if (k.teddy) scaleBlit(p, POSES.front, 246, 176, 1);
  if (k.dream) dreamFrame(p, [282, 66], !k.title);
  // a level's title in a bar across the top (the dream's cloud then frames the other three sides)
  if (k.title) {
    p.rect(0, 0, 320, 22, INK).rect(0, 22, 320, 2, c('accent', 2));
    centered(p, 7, k.title, c('lamp', 4));
  }
  for (const s of layout(k)) {
    const y0 = TY + s.row * ROW - 4;
    const y1 = TY + (s.row + 1 + s.words.length) * ROW + 2;
    const h = y1 - y0 + 1;
    const w = BX1 - BX0 + 1;
    const nameY = TY + s.row * ROW - 2;
    if (s.who === 'stamp') {
      // the reissued name card: a red frame, and the office's round seal at the end of its first row
      p.rect(BX0, y0, w, h, c('cream', 3))
        .frame(BX0, y0, w, h, c('red', 1))
        .rect(BX0 + 1, y0 + 1, w - 2, 1, c('red', 2));
      p.disc(BX1 - 16, nameY + 2, 4.5, c('red', 1))
        .disc(BX1 - 16, nameY + 2, 2.5, c('cream', 3))
        .set(BX1 - 16, nameY + 2, c('red', 1));
      text(p, TX, nameY, NAMES.stamp, c('red', 1));
      continue;
    }
    if (s.who === 'aside') {
      // turned to the player: the box faces out of the card, and its edge is dashed
      p.rect(BX0, y0, w, h, c('yellow', 3));
      for (let x = BX0; x < BX1; x += 4) p.rect(x, y0, 2, 1, INK).rect(x, y1, 2, 1, INK);
      for (let y = y0; y < y1; y += 4) p.rect(BX0, y, 1, 2, INK).rect(BX1, y, 1, 2, INK);
      text(p, TX, nameY, NAMES.aside, c('orange', 0));
      continue;
    }
    p.rect(BX0, y0, w, h, c('paint', 3)).frame(BX0, y0, w, h, INK);
    // the tail, from the bubble's right side toward whoever is talking
    const toLeo = s.who === 'leo';
    const ty = y0 + 3;
    for (let i = 0; i < 7; i++) {
      const x = BX1 + i;
      const top = toLeo ? ty + i : ty - Math.floor(i / 2);
      const bot = toLeo ? ty + 6 + Math.floor(i / 3) : ty + 6 - i;
      if (bot < top) break;
      p.rect(x, top, 1, bot - top + 1, c('paint', 3))
        .set(x, top, INK)
        .set(x, bot, INK);
    }
    p.rect(BX1, ty + 1, 1, 5, c('paint', 3));
    text(p, TX, nameY, NAMES[s.who], s.who === 'leo' ? c('purple', 0) : s.who === 'regina' ? c('pink', 0) : c('orange', 0));
  }
  return p;
}

/** Each card's picture name by its key: cards that agree share one, numbered as first met. */
export function bubbleNames(cards: Card[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const k of cards) {
    const key = cardKey(k);
    if (!out.has(key)) out.set(key, `bub${String(out.size + 1).padStart(2, '0')}.gif`);
  }
  return out;
}
