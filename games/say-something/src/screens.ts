// SAY SOMETHING's own pictures: the title (a stage with curtains, The Telling a Story look) and
// the picture each talk opens with, where a friend says one short line in a speech bubble.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene, titlePicture as kitTitle } from '../../kit/starter/screens';

/** A speech bubble with its left edge at x, top at y; `lines` at 2x, and a tail pointing down-left at (tx, ty). */
function bubble(p: Pixels, pal: Pal, x: number, y: number, lines: string[], tx: number, ty: number, scale = 2): void {
  const w = Math.max(...lines.map((l) => textWidth(l, scale))) + 24;
  const h = lines.length * (8 * scale + 4) + 16;
  // the tail first, so the bubble covers its top
  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    const wide = Math.round(16 * (1 - t)) + 2;
    p.rect(Math.round(x + 22 + (tx - x - 22) * t - wide / 2), Math.round(y + h - 2 + (ty - (y + h - 2)) * t), wide, 3, pal.c('parch', 4));
  }
  bevel(p, x, y, w, h, pal.r('parch'), 3, 2);
  lines.forEach((l, i) => text(p, x + 12, y + 10 + i * (8 * scale + 4), l, pal.c('ink', 0), scale));
}

/** The title: the kit's stage look with the hero on the left saying HELLO to a friend on the right. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, friend: Pixels, name: string, tagline: string): Pixels {
  const p = kitTitle(pal, book, hero, friend, name, tagline, 'coins', 'stage');
  // the kit puts a row of coins between the two; a bubble goes over them
  bubble(p, pal, 90, 70, ['HELLO!'], 82, 98, 2);
  return p;
}

/** The picture a talk opens with: the friend (left) says a line to the hero (right) over the grass. */
export function talkPicture(pal: Pal, book: Book, friend: Pixels, hero: Pixels, lines: string[], seed: number): Pixels {
  const p = scene(pal, book, 160, seed);
  scaleBlit(p, friend, 36, 80, 2);
  scaleBlit(p, hero, 244, 80, 2, true);
  bubble(p, pal, 84, 16, lines, 70, 80, 2);
  return p;
}
