// The Starters' little sparkle, what a monster leaves behind for a moment: a four-point star
// with tapered arms (a bright center, thin pointed tips), never a plus of straight bars, which
// reads as a cross. The second frame is the star turned 45 degrees and smaller, with two tiny
// glints beside it, so the two frames twinkle.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from './palette';

const T = 255;

/** A 20x20 sparkle: upright and full size, or `turned` (45 degrees, smaller, with glints). */
export function sparkle(pal: Pal, turned: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const gold = pal.r('gold');
  const white = pal.c('white', 3);
  if (turned) {
    // small: a diamond of light with four thin points out along the diagonals, and two glints
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (Math.abs(x) + Math.abs(y) <= 2) p.set(10 + x, 10 + y, gold[4]);
    p.set(10, 10, white);
    for (let i = 2; i <= 4; i++) for (const [dx, dy] of DIAGONALS) p.set(10 + dx * i, 10 + dy * i, i < 3 ? gold[4] : gold[3]);
    return p.set(16, 8, gold[4]).set(4, 13, gold[3]);
  }
  // an astroid: thick in the middle, pointed at the four tips
  const k = 0.68;
  const reach = Math.pow(7.8, k);
  for (let y = -8; y <= 8; y++)
    for (let x = -8; x <= 8; x++) {
      const s = Math.pow(Math.abs(x), k) + Math.pow(Math.abs(y), k);
      if (s <= reach) p.set(10 + x, 10 + y, s < 1.3 ? white : s < reach * 0.7 ? gold[4] : gold[3]);
    }
  return p;
}

const DIAGONALS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];
