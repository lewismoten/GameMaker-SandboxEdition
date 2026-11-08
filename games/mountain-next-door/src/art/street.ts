// The sleeping town's street in EXCUSE ME, as 20x20 blocks: three things that stand in the mountain's way, each three
// blocks tall (bottom, middle, top). A stack of recycling bins and a washing line with sheets give way when Tess
// bumps them; a yard gate swings shut and open on a clock.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../../kit/starter/palette';
import { clear, inked } from './land';

/** Recycling night: a blue bin at the bottom, a green one on it, a tipped box of cardboard on top. */
export function binStack(pal: Pal, part: 0 | 1 | 2): Pixels {
  const p = clear(pal);
  const b = pal.r('blue');
  const g = pal.r('green');
  const c = pal.r('parch');
  if (part === 0) {
    p.rect(2, 3, 16, 17, b[2]).rect(1, 1, 18, 3, b[1]).rect(2, 3, 16, 1, b[3]);
    for (const y of [9, 12, 15]) p.rect(6, y, 8, 1, pal.c('white', 3));
    p.rect(4, 5, 2, 12, b[3]);
  } else if (part === 1) {
    p.rect(3, 2, 14, 18, g[2]).rect(2, 0, 16, 3, g[1]).rect(3, 2, 14, 1, g[3]);
    p.rect(7, 9, 6, 1, pal.c('white', 3)).rect(9, 7, 2, 5, pal.c('white', 3));
  } else {
    p.rect(2, 8, 16, 12, c[2]).rect(2, 8, 16, 2, c[3]).rect(9, 8, 2, 12, c[1]);
    p.rect(4, 3, 10, 5, c[3]).rect(9, 3, 2, 5, c[1]);
    p.set(15, 6, c[1]).set(16, 5, c[1]);
  }
  return inked(pal, p);
}

/** A washing line with a bedsheet: the line and pegs on top, the sheet's folds, its hem with a gap under it. */
export function sheet(pal: Pal, part: 0 | 1 | 2): Pixels {
  const p = clear(pal);
  const w = pal.r('white');
  const gold = pal.r('gold');
  if (part === 0) {
    p.rect(0, 3, 20, 1, pal.c('ink', 1));
    p.rect(1, 4, 18, 16, w[3]).rect(1, 4, 18, 1, w[2]);
    for (const x of [3, 9, 15]) p.rect(x, 1, 2, 5, gold[3]);
  } else if (part === 1) {
    p.rect(1, 0, 18, 20, w[3]);
    for (const x of [6, 12]) p.rect(x, 0, 1, 20, w[1]);
  } else {
    p.rect(1, 0, 18, 14, w[3]);
    for (const x of [6, 12]) p.rect(x, 0, 1, 14, w[1]);
    for (let x = 1; x < 19; x += 3) p.rect(x, 14, 2, 1, w[3]);
    p.rect(1, 13, 18, 1, w[2]);
  }
  return inked(pal, p);
}

/** A yard gate, shut (pales across all three blocks, a rail on each) or swung open (only the posts and a thin leaf). */
export function yardGate(pal: Pal, part: 0 | 1 | 2, open: boolean): Pixels {
  const p = clear(pal);
  const wd = pal.r('wood');
  if (open) {
    p.rect(0, 0, 3, 20, wd[1]).rect(17, 0, 3, 20, wd[1]);
    p.rect(3, 0, 2, 20, wd[2]);
    return inked(pal, p);
  }
  for (let x = 0; x < 20; x += 5) {
    p.rect(x, part === 0 ? 4 : 0, 4, part === 0 ? 16 : 20, wd[2]).rect(x, part === 0 ? 4 : 0, 1, part === 0 ? 16 : 20, wd[3]);
    if (part === 0) p.rect(x + 1, 2, 2, 2, wd[2]).set(x + 1, 1, wd[2]);
  }
  p.rect(0, 5 + part * 2, 20, 2, wd[1]).rect(0, 13, 20, 2, wd[1]);
  return inked(pal, p);
}
