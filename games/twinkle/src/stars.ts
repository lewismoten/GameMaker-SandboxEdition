// The night sky: the palette's day colors made night, and the stars as loops of blocks. A star is a ring of four
// blocks (dim, a glint, bright, a glint): each turns into the next after a few ticks and the last into the first.
// The game keeps one clock for each block number, not for each cell, so every cell of one block twinkles together.
// A sky that twinkles at random is therefore a sky of many blocks: six star blocks that differ in where the star sits,
// each in its own loop with its own times (23, 32, 21, 37, 29 and 17 ticks round), and laid so that no two stars near
// each other share a loop. The sky repeats, but nothing in it blinks in step.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

/** A block that turns into another after some ticks (the engine's only clock). */
export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/** The sky's day colors made night, and the grass and dirt darker, for this game's palette only. */
export function nightPalette(): Pal {
  const pal = buildStarterPalette();
  const set = (name: string, i: number, rgb: [number, number, number]) => {
    const at = pal.c(name, i) * 3;
    for (let k = 0; k < 3; k++) pal.pal[at + k] = rgb[k] >> 2; // the palette holds 6 bits a color
  };
  [
    [8, 10, 40],
    [12, 16, 60],
    [16, 22, 78],
    [20, 28, 96],
    [44, 56, 130],
    [84, 100, 170],
  ].forEach((rgb, i) => set('sky', i, rgb as [number, number, number]));
  for (const ramp of ['grass', 'dirt'] as const) {
    for (let i = 0; i < (ramp === 'grass' ? 6 : 6); i++) {
      const at = pal.c(ramp, i) * 3;
      for (let k = 0; k < 3; k++) pal.pal[at + k] = Math.round(pal.pal[at + k] * 0.55);
    }
  }
  return pal;
}

/** Where the star sits in its block, for each of the six star blocks. */
export const SPOTS: [number, number][] = [
  [5, 6],
  [13, 4],
  [9, 12],
  [15, 14],
  [4, 15],
  [12, 9],
];

/** Ticks each frame (dim, a glint, bright, a glint) shows. Level 1's wrong sky gives every star these; the right one gives each its own. */
export const SAME: readonly number[] = [16, 2, 3, 2];
export const OWN: readonly (readonly number[])[] = [
  [16, 2, 3, 2],
  [24, 3, 2, 3],
  [11, 3, 4, 3],
  [30, 2, 3, 2],
  [20, 3, 3, 3],
  [9, 3, 2, 3],
];

/** One frame of a star at (x, y) of a block: `size` 0 is a dim dot, 1 a small bright star, 2 a big one with a halo. */
export function starFrame(pal: Pal, [x, y]: [number, number], size: 0 | 1 | 2): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('sky', 3));
  if (size === 0) p.set(x, y, c('white', 2));
  else if (size === 1) p.rect(x, y, 2, 2, c('gold', 4)).set(x, y, c('gold', 5));
  else {
    p.disc(x + 0.5, y + 0.5, 3.6, c('sky', 4));
    p.disc(x + 0.5, y + 0.5, 2.5, c('gold', 4));
    p.disc(x + 0.5, y + 0.5, 1.5, c('white', 3));
  }
  return p;
}

/** The frame sizes of a ring, in order. */
const SIZES = [0, 1, 2, 1] as const;

/** Adds one star's ring `${base}.0` to `${base}.3`, each in the air (the hero falls through it). */
function addRing(book: Book, timed: Timed[], base: string, pal: Pal, spot: [number, number], ticks: readonly number[]): void {
  SIZES.forEach((size, k) => {
    book.add(`${base}.${k}`, starFrame(pal, spot, size), { grav: PULL.down });
    timed.push({ name: `${base}.${k}`, next: `${base}.${(k + 1) % 4}`, ticks: ticks[k] });
  });
}

/** The six star blocks that all keep the same time: `sync0.0` ... `sync5.3`. */
export function addSyncStars(book: Book, timed: Timed[], pal: Pal): void {
  SPOTS.forEach((spot, v) => addRing(book, timed, `sync${v}`, pal, spot, SAME));
}

/** The six star blocks that each keep their own time: `star0.0` ... `star5.3`. */
export function addOwnStars(book: Book, timed: Timed[], pal: Pal): void {
  SPOTS.forEach((spot, v) => addRing(book, timed, `star${v}`, pal, spot, OWN[v]));
}

/** A level's finished blocks: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: { book: Book; timed: Timed[] }) {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
