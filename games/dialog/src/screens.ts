// EVERYBODY TALKS's own pictures: the title (a stage with curtains, The Telling a Story look) and
// the picture each talk opens with, where a friend says one short line in a speech bubble.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene, titlePicture as kitTitle } from '../../kit/starter/screens';
import { ROW, TX, TY, layout } from './talk';
import { talkerPicture, type TalkerName } from './talkers';
import type { Speaker, Turn } from './text';

/** A speech bubble with its left edge at x, top at y; `lines` at 2x, and a tail pointing down-left at (tx, ty). */
function bubble(p: Pixels, pal: Pal, x: number, y: number, lines: string[], tx: number, ty: number, scale = 2): void {
  const w = Math.max(...lines.map((l) => textWidth(l, scale))) + 24;
  const h = lines.length * (8 * scale + 4) + 16;
  // the tail first, so the bubble covers its top: from near the corner on the speaker's side
  const sx = tx > x + w / 2 ? x + w - 22 : x + 22;
  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    const wide = Math.round(16 * (1 - t)) + 2;
    p.rect(Math.round(sx + (tx - sx) * t - wide / 2), Math.round(y + h - 2 + (ty - (y + h - 2)) * t), wide, 3, pal.c('parch', 4));
  }
  bevel(p, x, y, w, h, pal.r('parch'), 3, 2);
  lines.forEach((l, i) => text(p, x + 12, y + 10 + i * (8 * scale + 4), l, pal.c('ink', 0), scale));
}

/** The title: the neon look (Showcase Tricks), Kit on the left and Pip on the right, each in a bubble. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, friend: Pixels, name: string, tagline: string): Pixels {
  const p = kitTitle(pal, book, hero, friend, name, tagline, 'coins', 'neon');
  bubble(p, pal, 88, 84, ['HELLO!'], 82, 104, 1);
  bubble(p, pal, 140, 120, ['HI, KIT!'], 238, 136, 1);
  return p;
}

/** Where each person stands in a card, and how big: two people are drawn at 2x, more at 1x. */
function slot(i: number, n: number): { x: number; y: number; s: number } {
  const s = n <= 2 ? 2 : 1;
  return { x: 316 - 20 * s, y: n <= 2 ? 28 + i * 84 : 24 + i * 44, s };
}

const NAME_INK: Record<Speaker, [string, string]> = { kit: ['teal', 'KIT'], pip: ['purple', 'PIP'], moss: ['blue', 'MOSS'], dot: ['green', 'DOT'] };
/** The bubbles' sides: wide enough that the 28-letter rows (x 40 to 264) sit well inside. */
const BX0 = 32;
const BX1 = 270;

/**
 * One card of a talk: everyone along the right edge, and a speech bubble for each turn with the
 * speaker's name lettered at its top, in a color the speaker's portrait carries too. The words are the .TXT's, written by
 * PLAYGAME over this picture (see talk.ts), so each bubble is exactly as tall as its rows.
 */
export function talkCardPicture(pal: Pal, book: Book, hero: Pixels, people: Speaker[], card: Turn[], seed: number): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 160, seed);
  const spot = people.map((_w, i) => slot(i, people.length));
  people.forEach((who, i) => {
    const pic = who === 'kit' ? hero : talkerPicture(pal, who as TalkerName);
    scaleBlit(p, pic, spot[i].x, spot[i].y, spot[i].s, who === 'kit');
    p.rect(spot[i].x, spot[i].y + 40 * spot[i].s + 1, 20 * spot[i].s, 2, pal.c(NAME_INK[who][0], 0));
  });
  for (const t of layout(card)) {
    const y0 = TY + t.row * ROW - 4;
    const y1 = TY + (t.row + 1 + t.words.length) * ROW + 2;
    const w = BX1 - BX0 + 1;
    // a short tail on the right edge; who is talking is told by the name and its color,
    // which the speaker's portrait carries too (a bar at their feet), so no tail crosses the others
    const [ramp, label] = NAME_INK[t.who];
    const tone = c(ramp, 0);
    const ty = y0 + 5;
    for (let i = 0; i < 6; i++) {
      const top = ty + Math.floor(i / 2);
      const bot = ty + 6 - Math.floor(i / 2);
      p.rect(BX1 + i, top, 1, bot - top + 1, c('parch', 4))
        .set(BX1 + i, top, tone)
        .set(BX1 + i, bot, tone);
    }
    p.rect(BX0, y0, w, y1 - y0 + 1, c('parch', 4)).frame(BX0, y0, w, y1 - y0 + 1, tone);
    p.rect(BX1, ty + 1, 1, 5, c('parch', 4));
    text(p, TX, TY + t.row * ROW - 2, label, tone);
  }
  return p;
}
