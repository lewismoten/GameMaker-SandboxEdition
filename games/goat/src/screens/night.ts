// The night over Bethlehem, shared by the pictures and the cartoons: a starry sky, the star
// itself, and the town asleep on its hill.
import { Pixels, rng } from '../../../kit/pixels';
import type { Pal } from '../art/pal';

export const W = 320;
export const H = 200;

/** `n` stars in the top `h` rows, in three brightnesses. */
export function stars(p: Pixels, pal: Pal, seed: number, h: number, n = 120): void {
  const r = rng(seed);
  for (let k = 0; k < n; k++) p.set(Math.floor(r() * W), Math.floor(r() * h), pal.c('star', r() < 0.2 ? 2 : r() < 0.6 ? 1 : 0));
}

/** The star of Bethlehem: a bright cross of light, arms 3s long. */
export function bigStar(p: Pixels, pal: Pal, cx: number, cy: number, s: number): void {
  const c = pal.c;
  for (let k = -s * 3; k <= s * 3; k++) {
    const v = 1 - Math.abs(k) / (s * 3);
    p.set(cx + k, cy, c('star', v > 0.6 ? 2 : v > 0.3 ? 1 : 0)).set(cx, cy + k, c('star', v > 0.6 ? 2 : v > 0.3 ? 1 : 0));
  }
  for (let k = -s; k <= s; k++) p.set(cx + k, cy + k, c('star', 1)).set(cx + k, cy - k, c('star', 1));
  p.disc(cx, cy, s * 0.6, c('star', 2));
}

/** Bethlehem asleep on its hill, its lit windows, and the dark ground below `ground`. */
export function skyline(p: Pixels, pal: Pal, ground: number): void {
  const c = pal.c;
  for (let x = 0; x < W; x++) {
    const h = ground - 18 - Math.round(Math.sin(x / 37) * 8 + Math.sin(x / 11) * 2);
    for (let y = h; y < ground; y++) p.set(x, y, c('night', 1));
  }
  const r = rng(9);
  for (let k = 0; k < 14; k++) {
    const bx = 10 + Math.floor(r() * 290);
    const bw = 12 + Math.floor(r() * 16);
    const bh = 10 + Math.floor(r() * 14);
    p.rect(bx, ground - 20 - bh, bw, bh + 4, c('night', 2));
    if (r() < 0.6) p.rect(bx + 3 + Math.floor(r() * (bw - 6)), ground - 16 - bh + 4, 2, 3, c('glow', 2));
  }
  p.rect(0, ground, W, H - ground, c('night', 0));
}

/** A four-point twinkle of size 0..3 in the star ramp. */
export function twinkle(p: Pixels, pal: Pal, x: number, y: number, size: number): void {
  if (size <= 0) return;
  const c = pal.c;
  p.set(x, y, c('star', 2));
  for (let k = 1; k <= size; k++) {
    const col = c('star', Math.max(0, 2 - k));
    p.set(x + k, y, col).set(x - k, y, col).set(x, y + k, col).set(x, y - k, col);
  }
}
