// Drawing helpers shared by the block, sprite and screen art.
import { Pixels } from '../../../kit/pixels';
import { shadeAt } from '../../../kit/shading';
export { shadeAt, gradient, blob, speckle } from '../../../kit/shading';

export const T = 255;

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
