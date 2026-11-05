// The cave's block art: each material (air, rock, floor, a stalactite ceiling, a lamp post) is drawn in five brightness
// steps, shade 0 (no lamp near) to shade 4 (right beside a lamp), and the lantern itself. A lamp lights nothing: the level
// lays the brighter block of a material in the cells near a lamp. See games/lights-out/src/levels.ts.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

/** One cobble in a rock block: x, y, width, height. */
type Cobble = [number, number, number, number];
const COBBLES: Cobble[][] = [
  [
    [0, 0, 9, 9],
    [10, 0, 10, 9],
    [0, 10, 5, 10],
    [6, 10, 9, 10],
    [16, 10, 4, 10],
  ],
  [
    [0, 0, 6, 9],
    [7, 0, 9, 9],
    [17, 0, 3, 9],
    [0, 10, 10, 10],
    [11, 10, 9, 10],
  ],
];

/** Open air at shade k: a flat color with a few specks of dust one step lighter. */
export function air(pal: Pal, k: number): Pixels {
  const a = pal.r('cair');
  const p = new Pixels(20, 20, a[k]);
  for (const [x, y] of [
    [3, 4],
    [14, 9],
    [8, 15],
    [17, 2],
  ])
    p.set(x, y, a[k + 1]);
  return p;
}

/** Cobbled rock at shade k (two layouts, so a wall is not wallpaper). */
export function rock(pal: Pal, k: number, v: number): Pixels {
  const r = pal.r('crock');
  const p = new Pixels(20, 20, r[k]);
  const rand = rng(40 + v);
  for (const [x, y, w, h] of COBBLES[v]) {
    p.rect(x, y, w, h, r[k + 1]);
    p.rect(x, y, w, 1, r[k + 2]).rect(x, y, 1, h, r[k + 2]);
    p.rect(x + w - 1, y + 1, 1, h - 1, r[k]).rect(x + 1, y + h - 1, w - 1, 1, r[k]);
    p.set(x + 2 + Math.floor(rand() * Math.max(1, w - 4)), y + 2 + Math.floor(rand() * Math.max(1, h - 4)), r[k]);
  }
  return p;
}

/** A floor's top at shade k: rock under a bright edge line and a darker line below it (the path must always be seen). */
export function floor(pal: Pal, k: number, v: number): Pixels {
  const f = pal.r('cfloor');
  const p = rock(pal, k, v);
  for (let x = 0; x < 20; x++) {
    const nick = (x * 7 + v * 5) % 9 === 0;
    p.set(x, 0, nick ? f[k + 2] : f[k + 3]);
    p.set(x, 1, f[k + 2]);
    p.set(x, 2, f[k + 1]);
    p.set(x, 3, f[k + 1]);
    p.set(x, 4, f[k]);
  }
  return p;
}

/** The ceiling's last row at shade k: rock above, with three stalactites hanging into the air. */
export function drip(pal: Pal, k: number): Pixels {
  const r = pal.r('crock');
  const p = air(pal, k);
  p.blit(rock(pal, k, 1).crop(0, 0, 20, 12), 0, 0);
  for (const [cx, len] of [
    [4, 7],
    [11, 5],
    [16, 8],
  ])
    for (let i = 0; i < len; i++) {
      const half = Math.max(0, Math.floor(((len - i) * 2.2) / len));
      p.rect(cx - half, 12 + i, half * 2 + 1, 1, r[k + 1]);
      p.set(cx - half, 12 + i, r[k + 2]);
      p.set(cx + half, 12 + i, r[k]);
    }
  return p;
}

/** A lamp post at shade k: a plain pole in the air (it is the same brightness as the rock beside it). */
export function post(pal: Pal, k: number): Pixels {
  const r = pal.r('crock');
  const p = air(pal, k);
  p.rect(8, 0, 4, 20, r[k + 1])
    .rect(8, 0, 1, 20, r[k + 2])
    .rect(11, 0, 1, 20, r[k]);
  return p;
}

/** The lantern in the air at its brightest, lit or (as `lit` false) dead and cold: a hook, a cap, a glass box with a flame. */
export function lantern(pal: Pal, lit: boolean): Pixels {
  const { c } = pal;
  const p = air(pal, lit ? 4 : 0);
  const ink = c('ink', 0);
  const metal = lit ? c('stone', 1) : c('stone', 0);
  p.rect(9, 0, 2, 3, metal).rect(7, 0, 6, 1, metal).rect(4, 3, 12, 3, metal).rect(5, 3, 10, 1, c('stone', 2)).rect(4, 5, 12, 1, ink);
  p.rect(5, 6, 10, 9, lit ? c('gold', 2) : c('stone', 0))
    .rect(4, 6, 1, 9, metal)
    .rect(15, 6, 1, 9, metal);
  p.rect(6, 7, 8, 7, lit ? c('gold', 4) : c('ink', 1));
  if (lit) {
    p.disc(10, 11, 3.4, c('gold', 5)).disc(10, 11, 1.8, c('white', 3)).set(10, 7, c('gold', 5)).set(10, 8, c('gold', 5));
  } else p.rect(10, 9, 1, 4, c('ink', 2)).set(10, 8, c('stone', 3));
  p.rect(4, 15, 12, 3, metal).rect(5, 15, 10, 1, c('stone', 2)).rect(4, 17, 12, 1, ink);
  return p;
}

/** The block settings of a cave block: it is open air (the hero falls through it) unless it is rock. */
export const AIR = { grav: PULL.down };
