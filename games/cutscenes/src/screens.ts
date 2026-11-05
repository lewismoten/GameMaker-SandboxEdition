// CUTSCENES' own pictures: the title (the Telling a Story stage with the hero, a framed
// picture where the coins would be and an easel), and the postcard shown after level 1.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { centered, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene, titlePicture as kitTitle } from '../../kit/starter/screens';
import { lookOf } from '../../kit/starter/titleStyles';

const CLEAR = 255;

/** A little painted landscape (sky, two hills, a sun) filling the box at (x, y), w by h. */
export function miniLandscape(p: Pixels, pal: Pal, x: number, y: number, w: number, h: number): void {
  const { c } = pal;
  for (let i = 0; i < h; i++) p.rect(x, y + i, w, 1, c('sky', 5 - Math.min(3, Math.floor((i / h) * 4))));
  p.disc(x + Math.round(w * 0.78), y + Math.round(h * 0.28), Math.max(3, Math.round(h * 0.14)), c('gold', 4));
  for (let i = 0; i < w; i++) {
    const far = Math.round(h * 0.62 - Math.sin(i / (w / 5) + 1) * h * 0.1);
    const near = Math.round(h * 0.8 - Math.sin(i / (w / 4) + 4) * h * 0.07);
    p.rect(x + i, y + far, 1, h - far, c('green', 1));
    p.rect(x + i, y + near, 1, h - near, c('grass', 2));
  }
}

/** A gold picture frame around the box at (x, y), w by h, `t` thick. */
function frame(p: Pixels, pal: Pal, x: number, y: number, w: number, h: number, t = 4): void {
  const { c } = pal;
  for (let i = 0; i < t; i++) p.frame(x - t + i, y - t + i, w + 2 * (t - i), h + 2 * (t - i), c('gold', i === 0 ? 0 : i === t - 1 ? 1 : 3));
}

/** An easel, 20x40 like a hero, holding a small painting: for the title's right-hand side. */
function easel(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 40, CLEAR);
  p.line(3, 39, 8, 12, c('wood', 0)).line(16, 39, 11, 12, c('wood', 0)).line(9, 39, 9, 14, c('wood', 1)).line(10, 39, 10, 14, c('wood', 1));
  p.rect(2, 4, 16, 14, c('wood', 3));
  miniLandscape(p, pal, 3, 5, 14, 12);
  p.frame(2, 4, 16, 14, c('wood', 0));
  p.rect(2, 26, 16, 2, c('wood', 0));
  return p;
}

/** The title: the stage look, Mara on the left, a framed picture over the middle, and an easel on the right. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const p = kitTitle(pal, book, hero, easel(pal), name, tagline, 'coins', 'stage');
  // the kit puts a row of coins in the middle; a framed picture covers them
  const x = 112;
  const y = 71;
  frame(p, pal, x, y, 112, 52, 3);
  miniLandscape(p, pal, x, y, 112, 52);
  // the ribbon again, in case the frame came near it
  const look = lookOf(pal, 'stage');
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((p.w - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  return p;
}

/** The postcard shown after level 1: a painted landscape in a gold frame, a line under it, and Mara cheering below. */
export function postcardPicture(pal: Pal, book: Book, cheer: Pixels, head: string, line: string): Pixels {
  const p = scene(pal, book, 160, 61);
  bevel(p, 56, 4, 208, 74, pal.r('parch'), 3, 2);
  frame(p, pal, 100, 14, 120, 34, 3);
  miniLandscape(p, pal, 100, 14, 120, 34);
  centered(p, 56, head, pal.c('ink', 0), 1);
  centered(p, 66, line, pal.c('wood', 1));
  scaleBlit(p, cheer, 140, 160 - 80, 2);
  return p;
}
