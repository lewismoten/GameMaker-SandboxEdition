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
export function scaleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false, transparent = CLEAR): void {
  for (let yy = 0; yy < src.h; yy++)
    for (let xx = 0; xx < src.w; xx++) {
      const v = src.get(flip ? src.w - 1 - xx : xx, yy);
      if (v !== transparent && v >= 0) dst.rect(x + xx * s, y + yy * s, s, s, v);
    }
}

/** Adds a 1 pixel outline in `ink` around every opaque pixel. */
export function outline(src: Pixels, ink: number, options: { transparent?: number; ignoreInk?: boolean } = {}): Pixels {
  const transparent = options.transparent ?? CLEAR;
  const p = new Pixels(src.w, src.h, CLEAR);
  p.px.set(src.px);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      if (src.get(x, y) !== transparent) continue;
      const n = [src.get(x - 1, y), src.get(x + 1, y), src.get(x, y - 1), src.get(x, y + 1)];
      if (n.some((v) => v !== transparent && v !== -1 && (!options.ignoreInk || v !== ink))) p.set(x, y, ink);
    }
  return p;
}

export function asciiSprite(rows: string[], key: Record<string, number>, dx?: number, dy?: number, w = 20, h = 20): Pixels {
  const p = new Pixels(w, h, CLEAR);
  const width = Math.max(...rows.map((r) => r.length));
  p.draw(dx ?? Math.floor((w - width) / 2), dy ?? h - rows.length, rows, key);
  return p;
}
/** Draw ASCII art through the indexed canvas. */
export const asciiArt = (p: Pixels, x: number, y: number, rows: string[], key: Record<string, number>): Pixels => p.draw(x, y, rows, key);
/** Scale with an explicit transparent color and no mirroring. */
export const scaleBlitTransparent = (dst: Pixels, src: Pixels, x: number, y: number, scale: number, transparent = CLEAR): void =>
  scaleBlit(dst, src, x, y, scale, false, transparent);
/** In-place variant for existing sprite canvases. */
export function outlineInPlace(p: Pixels, ink: number, transparent = CLEAR): Pixels {
  p.px.set(outline(p, ink, { transparent }).px);
  return p;
}
