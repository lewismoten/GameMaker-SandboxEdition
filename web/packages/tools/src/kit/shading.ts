// Shaded drawing the games' blocks and screens share, in a palette ramp: an ordered-dithered
// shade between two ramp steps, a vertical gradient, a lit lump, a raised box and speckles.
import { Pixels, dither, rng } from './pixels';

/** A shade between ramp[lo] and ramp[hi] for level 0..1, ordered-dithered at (x, y). */
export function shadeAt(ramp: number[], lo: number, hi: number, level: number, x: number, y: number): number {
  const v = lo + Math.max(0, Math.min(1, level)) * (hi - lo);
  const base = Math.floor(v);
  const idx = dither(x, y, v - base) ? base + 1 : base;
  return ramp[Math.max(0, Math.min(ramp.length - 1, idx))];
}

/** An 8-row ordered pattern: row y takes the lighter color when level * 8 is over its threshold. */
const ROWS = [0, 4, 6, 2, 7, 3, 5, 1];

/**
 * A vertical gradient across a rectangle. With `rows`, the blend between two ramp steps is
 * dithered by whole rows (each row one color) instead of the 4x4 pattern: it reads as fine
 * horizontal lines, and a GIF of it is far smaller, because a row of one color packs into a
 * few LZW codes while a dither pattern costs codes all along the row.
 */
export function gradient(p: Pixels, x0: number, y0: number, w: number, h: number, ramp: number[], lo: number, hi: number, rows = false): Pixels {
  for (let y = y0; y < y0 + h; y++) {
    const level = (y - y0) / Math.max(1, h - 1);
    if (rows) {
      const v = lo + Math.max(0, Math.min(1, level)) * (hi - lo);
      const base = Math.floor(v);
      const idx = (v - base) * 8 > ROWS[y & 7] ? base + 1 : base;
      p.rect(x0, y, w, 1, ramp[Math.max(0, Math.min(ramp.length - 1, idx))]);
    } else for (let x = x0; x < x0 + w; x++) p.set(x, y, shadeAt(ramp, lo, hi, level, x, y));
  }
  return p;
}

/** A lit ellipsoid lump, light from the upper left. */
export function blob(p: Pixels, cx: number, cy: number, rx: number, ry: number, ramp: number[], lo = 0, hi = ramp.length - 1, light = 1): Pixels {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      const l = (0.62 * z - 0.42 * nx - 0.52 * ny) * light;
      p.set(x, y, shadeAt(ramp, lo, hi, (l + 0.35) / 1.2, x, y));
    }
  return p;
}

/** A raised box: light top/left edge, dark bottom/right edge. */
export function bevel(
  p: Pixels,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: number[],
  face: number,
  depth = 1,
  edges: readonly [number, number, number, number] = [1, 1, -2, -2],
): Pixels {
  p.rect(x, y, w, h, ramp[face]);
  const color = (offset: number) => ramp[offset >= 0 ? Math.min(ramp.length - 1, face + offset) : Math.max(0, face + offset)];
  const [top, left, bottom, right] = edges.map(color);
  for (let d = 0; d < depth; d++) {
    p.rect(x + d, y + d, w - 2 * d, 1, top).rect(x + d, y + d, 1, h - 2 * d, left);
    p.rect(x + d, y + h - 1 - d, w - 2 * d, 1, bottom).rect(x + w - 1 - d, y + d, 1, h - 2 * d, right);
  }
  return p;
}

/** Fills a rectangle with a speckled texture from ramp[lo..hi]. */
export function speckle(
  p: Pixels,
  x0: number,
  y0: number,
  w: number,
  h: number,
  ramp: number[],
  base: number,
  spread: number,
  seed: number,
  density = 0.25,
): Pixels {
  const r = rng(seed);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      let k = base;
      if (r() < density) k += r() < 0.5 ? -spread : spread;
      p.set(x, y, ramp[Math.max(0, Math.min(ramp.length - 1, k))]);
    }
  return p;
}

/**
 * Steps every pixel that belongs to one of `ramps` by `steps` along its own ramp (negative darkens, positive
 * lightens), where `level(x, y)` (0..1) is ordered-dithered in: a cast shadow, or a painted pool of light, that
 * keeps the colors of whatever it falls on. Pixels in no ramp are left alone.
 */
export function rampShift(p: Pixels, ramps: number[][], steps: number, level: (x: number, y: number) => number): Pixels {
  const to = new Map<number, number>();
  for (const ramp of ramps) ramp.forEach((v, i) => to.set(v, ramp[Math.max(0, Math.min(ramp.length - 1, i + steps))]));
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const t = to.get(p.get(x, y));
      if (t !== undefined && dither(x, y, level(x, y))) p.set(x, y, t);
    }
  return p;
}

export function pool(p: Pixels, cx: number, cy: number, rx: number, ry: number, r: number[], lo: number, hi: number): Pixels {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d > 1) continue;
      p.set(x, y, shadeAt(r, lo, hi, 1 - d, x, y));
    }
  return p;
}
