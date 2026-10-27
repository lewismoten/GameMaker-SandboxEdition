// Drawing helpers shared by the block, sprite and screen art.
import { Pixels } from '../../../kit/pixels';
export { shadeAt, gradient, blob, speckle } from '../../../kit/shading';

/** Recolors every pixel through a lookup (palette swaps for variants and hurt flashes). */
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

export function sprite(rows: string[], key: Record<string, number>, w = 20, h = 20, dx?: number, dy?: number): Pixels {
  const p = new Pixels(w, h, 255);
  const width = Math.max(...rows.map((r) => r.length));
  p.draw(dx ?? Math.floor((w - width) / 2), dy ?? h - rows.length, rows, key);
  return p;
}
