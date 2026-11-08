// The old fire lookout on the hollow's rim, in the game's woodcut: a timber leg, cross-bracing (an X over two
// blocks by two), a landing of heavy planks, a railing, a hurricane lamp (dark, or lit with a hatched glow), and
// the gusts that sweep the open landings on a clock (streaks, then calm air).
import { Pixels, dither } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { inked } from './land';

const clear = (pal: Pal) => new Pixels(20, 20, skyOf(pal));

/** A squared timber leg, hatched on its shadow side. */
export function leg(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = clear(pal);
  p.rect(6, 0, 8, 20, w[2]).rect(6, 0, 2, 20, w[3]);
  for (let y = 0; y < 20; y++) for (let x = 11; x < 14; x++) if ((x + y) % 3 === 0) p.set(x, y, w[0]);
  p.rect(9, 4, 2, 2, pal.c('rock', 2)).rect(9, 14, 2, 2, pal.c('rock', 2));
  return inked(pal, p);
}

/** Cross-bracing, block `k` (0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right) of an X over 40 x 40. */
export function brace(pal: Pal, k: number): Pixels {
  const w = pal.r('wood');
  const big = new Pixels(40, 40, skyOf(pal));
  for (let i = 0; i < 40; i++)
    for (let t = -2; t <= 1; t++) {
      big.set(i, i + t, t === -2 ? w[3] : w[1]);
      big.set(39 - i, i + t, t === -2 ? w[3] : w[1]);
    }
  big.rect(17, 17, 6, 6, w[2]).set(19, 19, pal.c('rock', 3)).set(20, 20, pal.c('rock', 1));
  return inked(pal, big).crop((k % 2) * 20, Math.floor(k / 2) * 20, 20, 20);
}

/** A landing: three heavy planks across, end grain showing, the underside hatched. */
export function landing(pal: Pal, seed: number): Pixels {
  const w = pal.r('wood');
  const p = clear(pal);
  p.rect(0, 0, 20, 7, w[2]).rect(0, 0, 20, 1, w[4]).rect(0, 6, 20, 1, w[0]);
  p.rect((seed * 7) % 17, 1, 1, 5, w[0]).rect(((seed * 7) % 17) + 1, 1, 1, 5, w[3]);
  for (let x = 0; x < 20; x++) for (let y = 7; y < 10; y++) if ((x + y) % 3 === 0) p.set(x, y, w[1]);
  p.rect(0, 7, 20, 1, pal.c('ink', 0));
  return p;
}

/** A railing: a top rail and two balusters. */
export function railing(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = clear(pal);
  p.rect(0, 4, 20, 3, w[3]).rect(0, 4, 20, 1, w[4]);
  p.rect(4, 7, 2, 13, w[2]).rect(14, 7, 2, 13, w[2]);
  return inked(pal, p);
}

/** A hurricane lamp hanging from a hook: dark, or lit with a hatched ring of glow round it. */
export function lamp(pal: Pal, lit: boolean): Pixels {
  const p = clear(pal);
  const g = pal.r('gold');
  if (lit)
    p.map((x, y, c) => {
      const d = Math.hypot(x - 10, y - 11);
      return d < 9 && dither(x, y, 0.6 - d / 15) ? pal.c('parch', 4) : c;
    });
  p.rect(9, 0, 2, 3, pal.c('ink', 0)).rect(7, 3, 6, 2, pal.c('rock', 2));
  p.rect(6, 5, 8, 10, lit ? g[5] : pal.c('rock', 4)).rect(8, 7, 4, 6, lit ? g[3] : pal.c('rock', 2));
  p.rect(6, 15, 8, 2, pal.c('rock', 2));
  return inked(pal, p);
}

/** Still air where a gust blows on its clock: only a faint streak, so the lane still shows. */
export function calm(pal: Pal): Pixels {
  const p = clear(pal);
  for (let x = 2; x < 18; x += 5) p.set(x, 10, pal.c('sky', 4)).set(x + 1, 10, pal.c('sky', 4));
  return p;
}

/** The cab's roof: rows of cedar shingles, hatched, with an inked eave; `part` L and R are the sloped ends. */
export function shingles(pal: Pal, part: 'L' | 'M' | 'R'): Pixels {
  const w = pal.r('wood');
  const p = clear(pal);
  for (let y = 4; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (part === 'L' && x < 20 - (y - 4) * 1.25) continue;
      if (part === 'R' && x > (y - 4) * 1.25) continue;
      const row = Math.floor((y - 4) / 4);
      const seam = (x + row * 3) % 6 === 0;
      p.set(x, y, y % 4 === 3 ? w[0] : seam ? w[1] : (x + y) % 5 === 0 ? w[2] : w[3]);
    }
  p.rect(0, 18, 20, 2, pal.c('ink', 0));
  return part === 'M' ? p : inked(pal, p);
}
