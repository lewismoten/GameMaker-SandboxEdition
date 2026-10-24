// What cast.fli is drawn with (after the sequel's cast.ts): the screens' palette plus the
// portraits' extra ramps, a polygon fill, a twisted rope leash, a reel whose frames may each
// bring their own palette (palette cycling), and captions.
import { Pixels } from '../../../kit/pixels';
import { centered, klubArt } from '../art/draw';
import { buildScreenPalette, type Pal } from '../art/pal';

export const W = 320;
export const H = 200;

/** The screen palette plus the ramps only the cast needs (the cycling colors last). */
export const CP: Pal = (() => {
  const pal = buildScreenPalette();
  pal.b.ramp('tomato', 6, [90, 14, 10], [255, 178, 156], [200, 54, 38]);
  pal.b.ramp('amber', 3, [150, 90, 10], [255, 200, 60]);
  pal.b.ramp('denim', 3, [50, 70, 110], [140, 170, 210]);
  pal.b.ramp('volt', 6, [40, 60, 90], [140, 255, 255]);
  return pal;
})();
export const c = (n: string, k: number) => CP.c(n, k);
export const r = (n: string) => CP.r(n);

export type Pt = [number, number];

/** Fills a polygon, coloring each pixel with `fill(x, y)`. */
export function poly(p: Pixels, pts: Pt[], fill: (x: number, y: number) => number): void {
  const ys = pts.map((q) => q[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if (y0 === y1 || y + 0.5 < Math.min(y0, y1) || y + 0.5 >= Math.max(y0, y1)) continue;
      xs.push(x0 + ((y + 0.5 - y0) * (x1 - x0)) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) p.set(x, y, fill(x, y));
  }
}

/**
 * A rope leash along a path, `w0` thick at its start and `w1` at its end (closer to the
 * camera), two-tone twisted; `dots` flecks it white like Gwinn's pink one.
 */
export function rope(p: Pixels, path: Pt[], w0: number, w1: number, ramp: string, dots = false): void {
  const pts: [number, number, number][] = [];
  let len = 0;
  for (let i = 0; i + 1 < path.length; i++) len += Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
  let s = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const [x0, y0] = path[i];
    const [x1, y1] = path[i + 1];
    const d = Math.hypot(x1 - x0, y1 - y0);
    for (let k = 0; k < d; k += 0.5) pts.push([x0 + ((x1 - x0) * k) / d, y0 + ((y1 - y0) * k) / d, s + k]);
    s += d;
  }
  const disc = (x: number, y: number, rad: number, col: (dx: number, dy: number) => number) => {
    for (let dy = -Math.ceil(rad); dy <= rad; dy++)
      for (let dx = -Math.ceil(rad); dx <= rad; dx++) if (dx * dx + dy * dy <= rad * rad + 0.3) p.set(Math.round(x + dx), Math.round(y + dy), col(dx, dy));
  };
  const rad = (at: number) => (w0 + ((w1 - w0) * at) / Math.max(1, len)) / 2;
  for (const [x, y, at] of pts) disc(x, y, rad(at) + 1, () => c('ink', 0));
  for (const [x, y, at] of pts)
    disc(x, y, rad(at), (dx, dy) => {
      const twist = Math.floor((at + dx - dy) / 3) % 2;
      if (dots && (Math.round(x + dx) * 7 + Math.round(y + dy) * 5) % 11 === 0) return c('paint', 3);
      return c(ramp, dy < -rad(at) / 3 ? 3 : twist ? 2 : 1);
    });
}

/** A sheet of frames (all on one palette unless a frame brings its own). */
export class CastReel {
  frames: Uint8Array[] = [];
  pals: Uint8Array[] = [];
  add(p: Pixels, n = 1, pal: Uint8Array = CP.pal): void {
    for (let i = 0; i < n; i++) {
      this.frames.push(Uint8Array.from(p.px));
      this.pals.push(pal);
    }
  }
}

export const say = (p: Pixels, words: string, y: number, col = c('paint', 3), cx = W / 2) => centered(p, y, klubArt(words), col, 1, c('ink', 0), cx);
export const big = (p: Pixels, words: string, y: number, cx = W / 2) => centered(p, y, klubArt(words), c('yellow', 3), 2, c('ink', 0), cx);

/** The palette with a ramp's colors rotated `step` places (palette cycling). */
export function cycled(name: string, step: number, base: Uint8Array = CP.pal): Uint8Array {
  const pal = Uint8Array.from(base);
  const ramp = r(name);
  ramp.forEach((idx, k) => pal.set(base.subarray(ramp[(k + step) % ramp.length] * 3, ramp[(k + step) % ramp.length] * 3 + 3), idx * 3));
  return pal;
}
