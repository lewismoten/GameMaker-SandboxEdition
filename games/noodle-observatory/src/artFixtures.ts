// Shelves, ladders, openings and furniture drawn over each place’s backdrop.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { tile } from './artTile';
import { shaded } from './dressArt';

type P = Pixels;

/** A shelf plank across the top of the tile, its bracket below, over the backdrop. */
export function shelf(pal: Pal, bg: P, look: 'wood' | 'pad' = 'wood'): P {
  // its own shadow on the wall below the plank (none in the open night sky)
  const p = look === 'wood' && bg.get(0, 0) !== pal.c('sky', 1) ? shaded(pal, bg, (_x, y) => (y < 5 ? 0 : 0.85 - (y - 5) / 16)) : tile(bg);
  const k = look === 'pad' ? pal.r('blue') : pal.r('cab');
  p.rect(0, 0, 20, 5, k[2]).rect(0, 0, 20, 1, k[4]).rect(0, 4, 20, 1, k[0]);
  p.rect(4, 5, 2, 4, k[1]).line(5, 8, 9, 5, k[1]);
  return p;
}

/** A shelf that wobbles before it tips (cupboard shelves on a clock): 0 level, 1 wobbling, 2 tipped (fall through). */
export function tiltShelf(pal: Pal, bg: P, stage: 0 | 1 | 2): P {
  const p = tile(bg);
  const k = pal.r('cab');
  const g = pal.r('gold');
  if (stage === 0) {
    p.rect(0, 0, 20, 5, k[3]).rect(0, 0, 20, 1, k[4]).rect(0, 4, 20, 1, k[0]);
    p.rect(1, 1, 2, 2, g[3]).rect(17, 1, 2, 2, g[3]);
  } else if (stage === 1) {
    p.line(0, 1, 19, 3, k[3]).line(0, 2, 19, 4, k[3]).line(0, 3, 19, 5, k[0]).line(0, 0, 19, 2, k[4]);
    // wobble lines: the cue that it is about to tip
    p.rect(2, 8, 3, 1, k[0]).rect(15, 9, 3, 1, k[0]).rect(8, 10, 4, 1, k[0]);
  } else {
    p.line(1, 0, 4, 18, k[3]).line(2, 0, 5, 18, k[3]).line(3, 0, 6, 18, k[0]);
    p.rect(1, 0, 2, 2, g[3]);
  }
  return p;
}

/** A wooden ladder over the backdrop. */
export function ladder(pal: Pal, bg: P): P {
  const p = tile(bg);
  const w = pal.r('wood');
  p.rect(3, 0, 3, 20, w[2]).rect(3, 0, 1, 20, w[4]).rect(14, 0, 3, 20, w[2]).rect(16, 0, 1, 20, w[1]);
  for (const y of [3, 10, 17]) p.rect(6, y, 8, 2, w[3]).rect(6, y + 1, 8, 1, w[1]);
  return p;
}

/** A doorway (the way in, or the way on): dark inside, a wooden frame; `half` 0 top, 1 bottom; `out` adds an arrow. */
export function doorway(pal: Pal, bg: P, half: 0 | 1, out: boolean): P {
  const p = tile(bg);
  const w = pal.r('cab');
  const inside = out ? pal.c('warm', 2) : pal.c('ink', 1);
  p.rect(2, half ? 0 : 3, 16, half ? 20 : 17, w[1]);
  p.rect(4, half ? 0 : 5, 12, half ? 20 : 15, inside);
  if (!half) p.rect(2, 3, 16, 2, w[3]);
  if (out && half === 0) {
    const ink = pal.c('ink', 0);
    p.rect(6, 11, 6, 2, ink).line(12, 8, 15, 12, ink).line(12, 15, 15, 12, ink).line(12, 9, 14, 12, ink).line(12, 14, 14, 12, ink);
  }
  if (out && half === 1) p.rect(4, 0, 12, 20, inside).rect(4, 0, 12, 1, pal.c('warm', 3));
  return p;
}

/** A window pane (2x2 tiles): the sky outside (the look colors it), a wooden frame; `moon` puts the round light in. */
export function windowTile(pal: Pal, bg: P, q: 0 | 1 | 2 | 3, moon = false): P {
  const p = tile(bg);
  const s = pal.r('sky');
  const k = pal.r('cab');
  const left = q % 2 === 0;
  const top = q < 2;
  const x0 = left ? 2 : 0;
  const y0 = top ? 2 : 0;
  const w = left ? 18 : 18;
  const h = top ? 18 : 18;
  p.rect(x0, y0, w, h, k[1]);
  for (let y = y0 + 2; y < y0 + h - (top ? 0 : 2); y++)
    for (let x = x0 + (left ? 2 : 0); x < x0 + w - (left ? 0 : 2); x++) p.set(x, y, s[Math.min(s.length - 1, 1 + Math.floor((y + (top ? 0 : 20)) / 8))]);
  // the cross bar between panes is drawn on the inner edges
  if (left) p.rect(18, y0, 2, h, k[2]);
  if (top) p.rect(x0, 18, w, 2, k[2]);
  if (moon && q === 1) {
    p.disc(9, 9, 4.6, pal.c('warm', 2)).disc(8, 8, 3.2, pal.c('warm', 3));
    p.set(10, 11, pal.c('warm', 1)).set(7, 10, pal.c('warm', 1));
  }
  return p;
}

/** The lintel over a socket: the frame's top over the backdrop (walk under it). */
export function lintel(pal: Pal, bg: P): P {
  const p = tile(bg);
  const k = pal.r('cab');
  p.rect(0, 0, 20, 6, k[1]).rect(0, 0, 20, 1, k[3]).rect(0, 6, 3, 14, k[2]).rect(17, 6, 3, 14, k[2]);
  p.rect(7, 1, 6, 4, pal.c('gold', 3)).rect(7, 1, 6, 1, pal.c('gold', 5));
  return p;
}

/** A pit's soft bottom: a cushion one row lower than the floor (a missed hop lands softly; hop out). */
export function cushion(pal: Pal, bg: P, ramp: 'blue' | 'white' | 'parch' = 'blue'): P {
  const p = tile(bg);
  const b = pal.r(ramp);
  p.rect(0, 8, 20, 12, b[1]).rect(1, 8, 18, 3, b[3]).rect(1, 8, 18, 1, b[4]);
  for (const x of [5, 10, 15]) p.set(x, 13, b[0]);
  return p;
}

/** A lamp hanging from the ceiling (the bright middle of its ring of light). */
export function lamp(pal: Pal, bg: P): P {
  const p = tile(bg);
  const w = pal.r('warm');
  p.rect(9, 0, 2, 6, pal.c('ink', 1));
  p.rect(4, 6, 12, 5, pal.c('green', 1)).rect(5, 6, 10, 1, pal.c('green', 3));
  p.rect(6, 11, 8, 2, w[3]).rect(8, 13, 4, 1, w[2]);
  return p;
}

/** A railing over the night (passable: it only keeps the eye on the roof's edge). */
export function rail(pal: Pal, bg: P): P {
  const p = tile(bg);
  const s = pal.r('steel');
  p.rect(0, 4, 20, 2, s[2]).rect(0, 4, 20, 1, s[3]);
  for (const x of [3, 13]) p.rect(x, 6, 2, 14, s[1]);
  return p;
}

/** A planter box with a winter shrub (solid; stand on it). */
export function planter(pal: Pal, bg: P, top: boolean): P {
  const p = tile(bg);
  const w = pal.r('wood');
  const l = pal.r('leaf');
  if (top) {
    p.disc(10, 13, 8, l[1]).disc(8, 11, 5, l[2]).disc(13, 12, 4, l[2]).set(7, 8, l[3]).set(12, 9, l[3]);
    p.rect(0, 16, 20, 4, w[2]).rect(0, 16, 20, 1, w[4]);
  } else {
    p.rect(0, 0, 20, 20, w[2]).rect(0, 0, 1, 20, w[4]).rect(19, 0, 1, 20, w[0]).rect(0, 9, 20, 1, w[1]);
  }
  return p;
}

/** The supper table: a cloth-covered top (a ledge), a leg, or a place laid on it. */
export function table(pal: Pal, bg: P, part: 'top' | 'leg'): P {
  const p = tile(bg);
  const b = pal.r('blue');
  const w = pal.r('white');
  if (part === 'top') {
    p.rect(0, 0, 20, 4, w[3]).rect(0, 4, 20, 6, w[2]);
    for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 10, b[3]);
    for (let y = 0; y < 10; y += 4) p.rect(0, y, 20, 2, b[2]);
    p.rect(0, 10, 20, 1, b[0]);
  } else p.rect(8, 0, 4, 20, pal.c('wood', 2)).rect(8, 0, 1, 20, pal.c('wood', 4));
  return p;
}
