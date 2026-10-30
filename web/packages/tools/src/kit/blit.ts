// Copying and recoloring the games' sprites, with 255 as the clear color: over another picture,
// through a color lookup, scaled up, or with a one-pixel outline.
import { Pixels } from './pixels';

export const CLEAR = 255;

/** Copies src over dst, skipping clear pixels. */
export function over(dst: Pixels, src: Pixels, x = 0, y = 0): Pixels {
  return dst.blit(src, x, y, CLEAR);
}

/** Recolors every pixel through a lookup (palette swaps for variants and hurt flashes). */
export function recolor(src: Pixels, fn: (c: number) => number): Pixels {
  const p = new Pixels(src.w, src.h);
  p.px.set(src.px.map(fn));
  return p;
}

/** Nearest-neighbor scaled copy (for big sprites on screens). */
export function scaleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false): void {
  for (let yy = 0; yy < src.h; yy++)
    for (let xx = 0; xx < src.w; xx++) {
      const v = src.get(flip ? src.w - 1 - xx : xx, yy);
      if (v !== CLEAR && v >= 0) dst.rect(x + xx * s, y + yy * s, s, s, v);
    }
}

/** Adds a 1 pixel outline in `ink` around every opaque pixel. */
export function outline(src: Pixels, ink: number): Pixels {
  const p = new Pixels(src.w, src.h, CLEAR);
  p.px.set(src.px);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      if (src.get(x, y) !== CLEAR) continue;
      const n = [src.get(x - 1, y), src.get(x + 1, y), src.get(x, y - 1), src.get(x, y + 1)];
      if (n.some((v) => v !== CLEAR && v !== -1)) p.set(x, y, ink);
    }
  return p;
}
