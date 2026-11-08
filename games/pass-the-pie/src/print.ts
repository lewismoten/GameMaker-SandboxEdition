// The block-print look every picture in PASS THE PIE is drawn in: flat inks, a hard ink outline, paper showing
// through as carved "gouge" marks, and a little grain in the paper. The helpers here are the carving tools.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { RAMP } from './palette';

/** See-through, in a sprite. */
export const T = 255;

/** The press inks as palette indices, darkest first. */
export interface Press {
  paper: number[];
  ink: number[];
  acc: number[];
  acc2: number[];
  leaf: number[];
}

export const press = (pal: Pal): Press => ({
  paper: pal.r(RAMP.paper),
  ink: pal.r(RAMP.ink),
  acc: pal.r(RAMP.acc),
  acc2: pal.r(RAMP.acc2),
  leaf: pal.r(RAMP.leaf),
});

/** The paper: its middle shade with a few fibers of the darker one (the same in every block, so it tiles quietly). */
export function paperBlock(pal: Pal, w = 20, h = 20, seed = 5): Pixels {
  const { paper } = press(pal);
  const p = new Pixels(w, h, paper[2]);
  const r = rng(seed);
  const n = Math.round((w * h) / 130);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * (w - 2));
    const y = Math.floor(r() * h);
    p.rect(x, y, r() < 0.5 ? 2 : 1, 1, paper[1]);
  }
  return p;
}

/** A sprite outlined in ink, then laid on paper (or kept see-through). */
export function stamp(pal: Pal, sprite: Pixels, onPaper = false): Pixels {
  const out = outline(sprite, press(pal).ink[0], { transparent: T });
  if (!onPaper) return out;
  return paperBlock(pal, out.w, out.h).blit(out, 0, 0, T);
}

/** Gouges: short carved strokes of `col` scattered over a rectangle (`slant` 0 flat, 1 rising). */
export function gouges(p: Pixels, x: number, y: number, w: number, h: number, col: number, n: number, seed: number, len = 3, slant = 0): Pixels {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const gx = x + Math.floor(r() * Math.max(1, w - len));
    const gy = y + Math.floor(r() * h);
    for (let k = 0; k < len; k++) p.set(gx + k, gy - (slant ? Math.floor(k / 2) : 0), col);
  }
  return p;
}

/** Diagonal hatching of `col` every `gap` pixels inside a rectangle (a carved shadow). */
export function hatch(p: Pixels, x: number, y: number, w: number, h: number, col: number, gap = 3): Pixels {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j) % gap === 0) p.set(x + i, y + j, col);
  return p;
}

/** A filled ellipse. */
export function oval(p: Pixels, cx: number, cy: number, rx: number, ry: number, col: number): Pixels {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) p.set(x, y, col);
    }
  return p;
}

/** Copies a picture with every `from` color made `to`. */
export const swap = (src: Pixels, map: Record<number, number>): Pixels => {
  const out = new Pixels(src.w, src.h, T);
  out.px.set(src.px);
  return out.map((_x, _y, c) => (c in map ? map[c] : c));
};
