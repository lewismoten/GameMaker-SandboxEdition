// What every block set of VENI, VIDI, RISI! shares: the block book (a block's number is the order
// it was added), the attributes' names, and the little things drawn in every set (the pickups:
// grapes, a cup of wine and water, a silver denarius, a laurel wreath; marble, a column).
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import type { Pal } from '../art/pal';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, down: 4 } as const;
/** Counter 1: lives. */
export const LIFE = 1;

export type BlockSet = 'villa' | 'campus' | 'thermae';

/** What a set's drawing code shares. */
interface Ctx {
  book: BlockBook;
  pal: Pal;
  R: Pal['r'];
  c: Pal['c'];
  P: () => Pixels;
  /** Falling air, the default. */
  air: { grav: number };
}

export function context(pal: Pal): Ctx {
  return { book: new BlockBook(), pal, R: pal.r, c: pal.c, P: () => new Pixels(20, 20), air: { grav: GRAV.down } };
}

/** A copy of a picture (to draw over without touching the original). */
export const copy = (p: Pixels): Pixels => p.crop(0, 0, p.w, p.h);

/** Veined marble across a block (seeded). */
export function marble(x: Ctx, seed: number, lo = 1, hi = 3): Pixels {
  const p = x.P();
  const r = rng(seed);
  const a = r() * 6;
  for (let y = 0; y < 20; y++)
    for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(x.R('marble'), lo, hi, 0.55 + Math.sin((xx + y * 0.6 + a) / 3.4) * 0.12, xx, y));
  for (let k = 0; k < 2; k++) {
    let vx = Math.floor(r() * 20);
    for (let y = 0; y < 20; y++) {
      vx += Math.round(r() * 2 - 1);
      p.set(((vx % 20) + 20) % 20, y, x.c('vein', k));
    }
  }
  return p;
}

/** A fluted column shaft over `bg` (scenery). */
export function column(x: Ctx, bg: Pixels, capital = false, base = false): Pixels {
  const p = copy(bg);
  const { c } = x;
  for (let y = 0; y < 20; y++) for (let xx = 5; xx < 15; xx++) p.set(xx, y, (xx - 5) % 3 === 2 ? c('marble', 1) : c('marble', xx < 9 ? 3 : 2));
  if (capital)
    p.rect(2, 0, 16, 3, c('marble', 3)).rect(3, 3, 14, 2, c('marble', 2)).set(3, 1, c('vein', 0)).set(16, 1, c('vein', 0)).rect(2, 5, 16, 1, c('marble', 1));
  if (base) p.rect(3, 15, 14, 2, c('marble', 2)).rect(2, 17, 16, 3, c('marble', 3)).rect(2, 17, 16, 1, c('marble', 1));
  return p;
}

/** A bunch of grapes over `bg`: dignity back. */
export function grapes(x: Ctx, bg: Pixels): Pixels {
  const p = copy(bg);
  const { c } = x;
  p.line(10, 4, 11, 7, c('wood', 2));
  blob(p, 13, 6, 3, 1.6, x.R('laurel'), 1, 3);
  for (const [gx, gy] of [
    [7, 9],
    [10, 9],
    [13, 9],
    [8, 12],
    [11, 12],
    [14, 12],
    [9, 15],
    [12, 15],
    [10, 18],
  ])
    p.disc(gx, gy, 1.9, c('grape', 1)).set(gx - 1, gy - 1, c('grape', 2));
  return p;
}

/** A cup of wine and water (a two-handled kantharos) over `bg`: dignity back. */
export function cup(x: Ctx, bg: Pixels): Pixels {
  const p = copy(bg);
  const { c } = x;
  p.rect(5, 6, 10, 2, c('bronze', 3))
    .rect(6, 8, 8, 5, c('bronze', 2))
    .rect(7, 13, 6, 1, c('bronze', 1))
    .rect(9, 14, 2, 3, c('bronze', 1))
    .rect(6, 17, 8, 2, c('bronze', 2));
  p.ring(4, 9, 1.6, c('bronze', 1)).ring(16, 9, 1.6, c('bronze', 1)).rect(7, 7, 6, 1, c('pompeii', 1));
  return p;
}

/** A silver denarius over `bg`: points. */
export function denarius(x: Ctx, bg: Pixels): Pixels {
  const p = copy(bg);
  const { c } = x;
  p.disc(10, 11, 4.6, c('gray', 2)).disc(10, 11, 3.6, c('gray', 3)).set(8, 9, c('marble', 3));
  // a laureate head in profile
  p.rect(9, 9, 3, 4, c('gray', 1)).set(12, 11, c('gray', 1)).set(8, 9, c('laurel', 1)).set(9, 8, c('laurel', 1)).set(11, 8, c('laurel', 1));
  return p;
}

/** A laurel wreath over `bg`: an extra life. */
export function wreath(x: Ctx, bg: Pixels): Pixels {
  const p = copy(bg);
  const { c } = x;
  for (let k = 0; k < 14; k++) {
    const a = Math.PI * 0.15 + (k / 13) * Math.PI * 1.7;
    const lx = 10 + Math.cos(a) * 6;
    const ly = 11 + Math.sin(a) * 5;
    p.set(Math.round(lx), Math.round(ly), c('laurel', 1));
    p.set(Math.round(lx + Math.cos(a + 1.2) * 1.5), Math.round(ly + Math.sin(a + 1.2) * 1.5), c('laurel', k % 2 ? 2 : 3));
  }
  p.set(9, 5, c('gold', 2)).set(11, 5, c('gold', 2)).set(10, 6, c('gold', 1));
  return p;
}

/** Sparkles over a picture (seeded): a glint of gold or a spell. */
export function sparkle(x: Ctx, p: Pixels, seed: number, n = 5, ramp = 'gold'): Pixels {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const sx = 2 + Math.floor(r() * 16);
    const sy = 2 + Math.floor(r() * 16);
    p.set(sx, sy, x.c(ramp, 3))
      .set(sx - 1, sy, x.c(ramp, 1))
      .set(sx + 1, sy, x.c(ramp, 1))
      .set(sx, sy - 1, x.c(ramp, 1))
      .set(sx, sy + 1, x.c(ramp, 1));
  }
  return p;
}

/** The solid dark outside every level (and its walls' edges). */
export function outside(x: Ctx): Pixels {
  const p = x.P().rect(0, 0, 20, 20, x.c('ink', 0));
  for (let y = 0; y < 20; y += 10) for (let xx = 0; xx < 20; xx++) p.set(xx, y, x.c('ink', 1));
  for (let y = 0; y < 10; y++) p.set(10, y, x.c('ink', 1));
  for (let y = 10; y < 20; y++) p.set(0, y, x.c('ink', 1));
  return p;
}
