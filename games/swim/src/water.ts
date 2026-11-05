// UNDER THE SURFACE's water: blocks that are only a gravity setting, drawn so you can see which way they pull.
// Nothing here is a new engine rule, and nothing here hurts: the hero is pulled by the block his feet are in.
//   creek, creekTop   water that pulls LEFT and DOWN (a current along the bed), with chevrons pointing left
//   deep, deepTop     water that pulls UP (a float), with rising bubbles; the top row has no pull, so Kit settles there
//   lift, liftTop     water that pulls UP and LEFT (a slanting lift), with slanting chevrons
// The top rows are the surface: lighter, with foam, and no pull at all, so a floater stops bobbing and can walk out.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

/** The pulls. */
export const CREEK_PULL = PULL.left | PULL.down;
export const DEEP_PULL = PULL.up;
export const LIFT_PULL = PULL.up | PULL.left;
export const SURFACE_PULL = PULL.none;

/** A tile of water in ramp `ramp`: a base color with a few darker streaks. */
function tile(pal: Pal, ramp: string, surface: boolean): Pixels {
  const r = pal.r(ramp);
  const w = pal.r('white');
  const p = new Pixels(20, 20, r[2]);
  for (const [x, y] of [
    [2, 6],
    [11, 13],
    [6, 17],
  ])
    p.rect(x, y, 6, 1, r[1]);
  if (surface) {
    p.rect(0, 0, 20, 5, r[3]).rect(0, 4, 20, 1, r[4]);
    for (const x of [1, 8, 14]) p.rect(x, 1, 4, 1, w[3]);
  }
  return p;
}

/** A chevron `<` with its point at (x, y). */
function chevron(p: Pixels, x: number, y: number, c: number): void {
  for (let k = 0; k < 4; k++) p.rect(x + k, y - k, 2, 1, c).rect(x + k, y + k, 2, 1, c);
}

function creek(pal: Pal, surface: boolean): Pixels {
  const p = tile(pal, 'blue', surface);
  const c = pal.r('white')[2];
  const y0 = surface ? 12 : 8;
  chevron(p, 3, y0, c);
  chevron(p, 12, y0 + (surface ? 0 : 4), c);
  return p;
}

function deep(pal: Pal, surface: boolean): Pixels {
  const p = tile(pal, 'teal', surface);
  const w = pal.r('white');
  for (const [x, y] of surface
    ? [[5, 10], [14, 14]]
    : [[4, 3], [13, 8], [7, 14], [15, 17]]) {
    p.rect(x, y, 3, 3, w[3]).rect(x + 1, y + 1, 1, 1, w[1]).rect(x, y, 1, 1, w[2]);
  }
  return p;
}

function lift(pal: Pal, surface: boolean): Pixels {
  const p = tile(pal, 'green', surface);
  const c = pal.r('white')[3];
  // an arrow head pointing up and to the left, with a short shaft
  for (const [x, y] of surface ? [[5, 11]] : [[3, 5], [10, 12]]) {
    p.rect(x, y, 6, 2, c).rect(x, y, 2, 6, c);
    for (let k = 1; k < 6; k++) p.rect(x + k, y + k, 2, 2, c);
  }
  return p;
}

/** Adds the water blocks to `book`. */
export function addWater(book: Book, pal: Pal): void {
  book.add('creek', creek(pal, false), { grav: CREEK_PULL });
  book.add('creekTop', creek(pal, true), { grav: CREEK_PULL });
  book.add('deep', deep(pal, false), { grav: DEEP_PULL });
  book.add('deepTop', deep(pal, true), { grav: SURFACE_PULL });
  book.add('lift', lift(pal, false), { grav: LIFT_PULL });
  book.add('liftTop', lift(pal, true), { grav: SURFACE_PULL });
}
