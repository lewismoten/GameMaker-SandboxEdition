// MAKE A TITLE's own pictures: the title (with a framed copy of the menu picture where the coins
// would be), the two menu pictures the first level compares (one too busy for the game's words, one
// plain), the list of the title scene's picture slots, and the diagram of DEMO.REC.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { centered, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { menuPicture, paper, titlePicture as kitTitle } from '../../kit/starter/screens';
import { lookOf } from '../../kit/starter/titleStyles';

const CLEAR = 255;

/** The words PLAYGAME writes on the menu picture: the game's name at (96, 104), then six lines from (80, 120), 8 pixels apart. */
const MENU_WORDS = ['Play', 'Read Instructions', 'Read Storyline', 'See Credits', 'See Highest Scores', 'Quit'];

/** Draws the words the game puts over its menu picture. */
function menuWords(p: Pixels, pal: Pal, name: string): void {
  const col = pal.c('menublue', 1);
  text(p, 96, 104, name, col);
  MENU_WORDS.forEach((w, i) => text(p, 80, 120 + i * 8, w, col));
}

/** A thumbnail of the menu picture in the box at (x, y), w by h: a board with lines where the words go. */
export function miniMenu(p: Pixels, pal: Pal, x: number, y: number, w: number, h: number): void {
  const { c } = pal;
  for (let i = 0; i < h; i++) p.rect(x, y + i, w, 1, c('sky', 5 - Math.min(3, Math.floor((i / h) * 4))));
  p.rect(x + 2, y + h - 6, w - 4, 6, c('grass', 2));
  p.rect(x + 8, y + 5, w - 16, h - 14, c('wood', 1)).rect(x + 9, y + 6, w - 18, h - 16, c('parch', 4));
  for (let i = 0; i < 5; i++) p.rect(x + 16, y + 13 + i * 6, 18 + ((i * 7) % 14), 2, c('menublue', 1));
}

/** The title: the stage look, Lian at the left, a framed copy of the menu picture in the middle, and a small screen at the right. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const { c } = pal;
  const tv = new Pixels(20, 40, CLEAR);
  tv.rect(2, 8, 16, 14, c('stone', 1)).rect(3, 9, 14, 12, c('stone', 4));
  miniMenu(tv, pal, 4, 10, 12, 10);
  tv.rect(8, 22, 4, 6, c('stone', 2)).rect(4, 28, 12, 3, c('stone', 2));
  const p = kitTitle(pal, book, hero, tv, name, tagline, 'coins', 'stage');
  const x = 112;
  const y = 71;
  for (let i = 0; i < 3; i++) p.frame(x - 3 + i, y - 3 + i, 112 + 2 * (3 - i), 52 + 2 * (3 - i), c('gold', i === 0 ? 0 : i === 2 ? 1 : 3));
  miniMenu(p, pal, x, y, 112, 52);
  const look = lookOf(pal, 'stage');
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((p.w - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  return p;
}

/** A caption ribbon at the bottom of a lesson picture. */
function caption(p: Pixels, pal: Pal, line: string): void {
  const w = textWidth(line) + 16;
  const x = Math.round((p.w - w) / 2);
  bevel(p, x, 178, w, 16, pal.r('parch'), 3, 2);
  text(p, x + 8, 183, line, pal.c('ink', 0));
}

/** The menu picture with the game's words drawn over it, as PLAYGAME draws them. `busy` draws stripes and spots under the words, which hides them. */
export function menuWithWords(pal: Pal, book: Book, hero: Pixels, name: string, busy: boolean): Pixels {
  const p = menuPicture(pal, book, hero, name);
  const { c } = pal;
  if (busy) {
    const rand = rng(5);
    const shades = [c('blue', 2), c('teal', 2), c('purple', 3), c('blue', 3), c('green', 2), c('purple', 2)];
    for (let y = 56; y < 168; y += 4) p.rect(66, y, 188, 3, shades[(y >> 2) % shades.length]);
    for (let i = 0; i < 70; i++) p.disc(68 + Math.floor(rand() * 184), 58 + Math.floor(rand() * 108), 3, shades[Math.floor(rand() * shades.length)]);
  }
  menuWords(p, pal, name);
  caption(p, pal, busy ? 'TOO BUSY: THE WORDS GET LOST' : 'PLAIN WHERE THE WORDS GO');
  return p;
}

/** The slots of the title scene: a list on paper, with the ones named in `lit` marked. */
export function slotsList(pal: Pal, book: Book, rows: [string, string][], lit: number[], heading: string): Pixels {
  const { c } = pal;
  const p = paper(pal, book, heading);
  rows.forEach(([slot, file], i) => {
    const y = 34 + i * 11;
    if (lit.includes(i)) p.rect(28, y - 2, 266, 11, c('gold', 4));
    text(p, 30, y, slot, c('ink', 0));
    text(p, 196, y, file, lit.includes(i) ? c('red', 1) : c('wood', 1));
  });
  return p;
}

/** The first records of a demo as a table: wait (ticks), key code, and what that key change means. */
export function recordsTable(pal: Pal, book: Book, rows: [string, string, string][], total: string): Pixels {
  const { c } = pal;
  const p = paper(pal, book, 'INSIDE DEMO.REC');
  text(p, 40, 36, 'WAIT', c('wood', 1));
  text(p, 100, 36, 'KEY', c('wood', 1));
  text(p, 150, 36, 'MEANS', c('wood', 1));
  p.rect(36, 46, 248, 1, c('wood', 3));
  rows.forEach(([w, k, m], i) => {
    const y = 52 + i * 12;
    text(p, 40, y, w, c('ink', 0));
    text(p, 100, y, k, c('ink', 0));
    text(p, 150, y, m, i % 2 ? c('red', 1) : c('green', 0));
  });
  centered(p, 52 + rows.length * 12 + 6, total, c('wood', 1));
  return p;
}
