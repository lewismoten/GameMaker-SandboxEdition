// Drawing helpers shared by the block, sprite and screen art.
import { Pixels, dither, rng } from '../../../kit/pixels';

export const T = 255;

/** A shade between ramp[lo] and ramp[hi] for level 0..1, ordered-dithered at (x, y). */
export function shadeAt(ramp: number[], lo: number, hi: number, level: number, x: number, y: number): number {
  const v = lo + Math.max(0, Math.min(1, level)) * (hi - lo);
  const base = Math.floor(v);
  const idx = dither(x, y, v - base) ? base + 1 : base;
  return ramp[Math.max(0, Math.min(ramp.length - 1, idx))];
}

/** A lit ellipsoid lump, light from the upper left. */
export function blob(p: Pixels, cx: number, cy: number, rx: number, ry: number, ramp: number[], lo: number, hi: number, light = 1): Pixels {
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

/** Fills a rectangle with a speckled texture from ramp[base +- spread]. */
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

/** A vertical gradient across a rectangle. */
export function gradient(p: Pixels, x0: number, y0: number, w: number, h: number, ramp: number[], lo: number, hi: number): Pixels {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) p.set(x, y, shadeAt(ramp, lo, hi, (y - y0) / Math.max(1, h - 1), x, y));
  return p;
}

/** A horizontal gradient (chrome bars). */
export function hgradient(p: Pixels, x0: number, y0: number, w: number, h: number, ramp: number[], lo: number, hi: number): Pixels {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) p.set(x, y, shadeAt(ramp, lo, hi, (x - x0) / Math.max(1, w - 1), x, y));
  return p;
}

/** Recolors every pixel through a lookup. */
export function recolor(src: Pixels, fn: (c: number) => number): Pixels {
  const p = new Pixels(src.w, src.h);
  p.px.set(src.px.map(fn));
  return p;
}

/** Rotates a square picture a quarter turn clockwise. */
export function rotate(src: Pixels): Pixels {
  const p = new Pixels(src.w, src.h);
  return p.map((x, y) => src.get(y, src.w - 1 - x));
}

/** ASCII-art sprite on a transparent 20x20 (or w x h) canvas, bottom aligned and centered. */
export function sprite(rows: string[], key: Record<string, number>, w = 20, h = 20, dx?: number, dy?: number): Pixels {
  const p = new Pixels(w, h, T);
  const width = Math.max(...rows.map((r) => r.length));
  p.draw(dx ?? Math.floor((w - width) / 2), dy ?? h - rows.length, rows, key);
  return p;
}

/** Outlines the non-transparent shape of a sprite with `ink` (in place). */
export function outline(p: Pixels, ink: number): Pixels {
  const src = Uint8Array.from(p.px);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= p.w || y >= p.h ? T : src[y * p.w + x]);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (at(x, y) !== T) continue;
      if (at(x - 1, y) !== T || at(x + 1, y) !== T || at(x, y - 1) !== T || at(x, y + 1) !== T) p.set(x, y, ink);
    }
  return p;
}

/** A filled ellipse in one color. */
export function oval(p: Pixels, cx: number, cy: number, rx: number, ry: number, c: number): Pixels {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1) p.set(x, y, c);
    }
  return p;
}
