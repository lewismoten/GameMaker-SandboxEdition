// The town library: tall bookshelves (six kinds, so the wall of books never repeats), a gap on a shelf where an
// overdue book goes back (and the shelf with it back), an overdue book lying where the mountain's step knocked
// it, a floorboard, a tall window (2 x 3) and the sunbeam falling from it, and the checkout desk (3 wide).
import { Pixels, dither, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { inked } from './land';

const SPINES = ['brick', 'gold', 'teal', 'blue', 'moss', 'purple', 'orange'];

/** One shelf of books, 20 wide, between rows `y0` and `y1` (the board under them). */
function booksOn(pal: Pal, p: Pixels, y0: number, y1: number, rand: () => number): void {
  let x = 1;
  while (x < 19) {
    const w = 2 + Math.floor(rand() * 2);
    if (x + w > 19) break;
    const r = pal.r(SPINES[Math.floor(rand() * SPINES.length)]);
    const top = y0 + Math.floor(rand() * 3);
    if (rand() < 0.12) {
      x += w; // a gap between books
      continue;
    }
    p.rect(x, top, w, y1 - top, r[2])
      .rect(x, top, 1, y1 - top, r[3])
      .rect(x, top + 2, w, 1, r[4]);
    if (w > 2) p.rect(x + w - 1, top, 1, y1 - top, r[1]);
    x += w;
  }
}

/** The shelves' wood: two boards (rows 8-9 and 18-19) and the dark back between the books. */
function shelfFrame(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, w[0]);
  p.rect(0, 8, 20, 2, w[3]).rect(0, 8, 20, 1, w[4]).rect(0, 18, 20, 2, w[3]).rect(0, 18, 20, 1, w[4]);
  return p;
}

/** A bookshelf, kind `v` (0 .. 5). */
export function shelf(pal: Pal, v: number): Pixels {
  const p = shelfFrame(pal);
  const rand = rng(100 + v * 7);
  booksOn(pal, p, 0, 8, rand);
  booksOn(pal, p, 10, 18, rand);
  return p;
}

/** A shelf with one book missing in the middle of the lower row (`filled`: put back, a bright new jacket on it). */
export function shelfGap(pal: Pal, filled: boolean): Pixels {
  const p = shelf(pal, 6);
  const w = pal.r('wood');
  p.rect(6, 10, 8, 8, w[0]);
  if (filled) {
    const g = pal.r('gold');
    p.rect(7, 11, 6, 7, pal.c('brick', 2)).rect(7, 11, 1, 7, pal.c('brick', 4)).rect(7, 13, 6, 1, g[4]).rect(7, 15, 6, 1, g[4]);
  } else p.rect(8, 16, 4, 1, pal.c('white', 3)); // a slip of paper where it belongs
  return p;
}

/** An overdue book lying open on the floor, pages up (the room's wall behind it). */
export function lostBook(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const c = pal.r('brick');
  const pg = pal.r('white');
  p.rect(3, 13, 14, 6, c[2]).rect(3, 18, 14, 1, c[0]);
  p.rect(4, 11, 6, 6, pg[3]).rect(10, 11, 6, 6, pg[2]).rect(9, 11, 2, 7, pg[1]);
  for (let y = 12; y < 16; y += 2) p.rect(5, y, 4, 1, pg[1]).rect(11, y, 4, 1, pg[0]);
  return inked(pal, p);
}

/** A floorboard: warm planks, the joins staggered. */
export function floorboard(pal: Pal, seed: number): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, w[2]);
  p.rect(0, 0, 20, 2, w[4]).rect(0, 2, 20, 1, w[3]);
  for (let y = 7; y < 20; y += 6) p.rect(0, y, 20, 1, w[1]);
  const rand = rng(seed);
  for (let y = 2; y < 20; y += 6) p.rect(Math.floor(rand() * 18) + 1, y, 1, 5, w[1]);
  return p;
}

/** A tall window's block `k` (0 .. 5: left, right; top to bottom): an arch, panes of pale daylight, a sill. */
export function libWindow(pal: Pal, k: number): Pixels {
  const big = new Pixels(40, 60, skyOf(pal));
  const w = pal.r('wood');
  const day = pal.r('fog');
  for (let y = 0; y < 60; y++)
    for (let x = 0; x < 40; x++) {
      const inArch = y >= 20 || (x - 20) ** 2 + (y - 20) ** 2 <= 19 ** 2;
      const inPane = y >= 22 || (x - 20) ** 2 + (y - 22) ** 2 <= 16 ** 2;
      if (y > 56 || !inArch) continue;
      big.set(x, y, inPane && x > 3 && x < 36 && y < 55 ? (dither(x, y, y / 60) ? day[2] : day[3]) : w[3]);
    }
  big.rect(19, 6, 2, 50, w[2]).rect(4, 36, 32, 2, w[2]).rect(1, 55, 38, 3, w[4]);
  return inked(pal, big).crop((k % 2) * 20, Math.floor(k / 2) * 20, 20, 20);
}

/** Daylight falling from the window across the wall: a slanting band of lighter, dithered wall (`k` 0 .. 1). */
export function sunbeam(pal: Pal, k: number): Pixels {
  const s = pal.r('sky');
  return new Pixels(20, 20, skyOf(pal)).map((x, y) => {
    const d = (x + y + k * 20) % 40;
    return d < 18 && dither(x, y, 0.5 - Math.abs(d - 9) / 18) ? s[4] : s[3];
  });
}

/** The checkout desk, 3 blocks wide (`part` L, M, R): dark wood, a green-shaded lamp on the left end, a stack of books. */
export function desk(pal: Pal, part: 'L' | 'M' | 'R'): Pixels {
  const big = new Pixels(60, 20, skyOf(pal));
  const w = pal.r('wood');
  big.rect(0, 8, 60, 12, w[1]).rect(0, 8, 60, 2, w[3]).rect(4, 12, 52, 6, w[0]);
  const g = pal.r('moss');
  big.rect(6, 1, 9, 3, g[3]).rect(6, 1, 9, 1, g[4]).rect(10, 4, 1, 4, w[3]).rect(7, 7, 7, 1, w[3]);
  big.rect(7, 4, 7, 1, pal.c('gold', 5));
  for (const [i, r] of ['blue', 'brick', 'teal'].entries()) big.rect(42 - i, 5 - i * 2, 12, 2, pal.c(r, 2));
  const k = { L: 0, M: 1, R: 2 }[part];
  return inked(pal, big).crop(k * 20, 0, 20, 20);
}
