// Palette ramps: runs of shades of one material, dark to light, as the Ultimate Owner's Guide
// plans a palette. Finds the ramp a color sits in (for the block painter's lighten and darken
// brush), blends a range between two colors, and lays out a shade ramp from one color.
import type { Palette } from '../../../formats/palette';

type RGB = [number, number, number];
const rgb = (pal: Palette, i: number): RGB => [pal[i * 3] & 63, pal[i * 3 + 1] & 63, pal[i * 3 + 2] & 63];

/** Brightness 0..63 (the usual luma weights). */
export function luma(pal: Palette, i: number): number {
  const [r, g, b] = rgb(pal, i);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function dist(a: RGB, b: RGB): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Two palette neighbors are steps of one ramp when they are close in color and differ in brightness. */
const STEP = 28;
function linked(pal: Palette, a: number, b: number): number {
  if (a < 0 || b < 0 || a > 255 || b > 255) return 0;
  if (dist(rgb(pal, a), rgb(pal, b)) > STEP) return 0;
  return Math.sign(luma(pal, b) - luma(pal, a));
}

/**
 * The ramp color `c` sits in: the run of neighboring palette entries that step steadily
 * brighter (or darker) through it, listed dark to light. Just [c] when it stands alone.
 */
export function rampOf(pal: Palette, c: number): number[] {
  const up = linked(pal, c, c + 1);
  const down = linked(pal, c - 1, c);
  // the direction brightness runs with the index; neighbors that disagree end the ramp
  const dir = up || down;
  if (!dir) return [c];
  let lo = c;
  let hi = c;
  while (linked(pal, lo - 1, lo) === dir) lo--;
  while (linked(pal, hi, hi + 1) === dir) hi++;
  const run = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
  return dir > 0 ? run : run.reverse();
}

/**
 * One shade lighter (dir 1) or darker (dir -1) than `c`: the next step of its ramp; at a
 * ramp's end it stays. A color with no ramp takes the nearest palette color that is brighter
 * or darker.
 */
export function shade(pal: Palette, c: number, dir: 1 | -1): number {
  const ramp = rampOf(pal, c);
  if (ramp.length > 1) return ramp[Math.max(0, Math.min(ramp.length - 1, ramp.indexOf(c) + dir))];
  const [r, g, b] = rgb(pal, c);
  const k = dir > 0 ? 1.25 : 0.75;
  const lift = dir > 0 ? 4 : -4;
  const target: RGB = [r * k + lift, g * k + lift, b * k + lift].map((v) => Math.max(0, Math.min(63, v))) as RGB;
  const l = luma(pal, c);
  let best = c;
  let bestD = Infinity;
  for (let i = 0; i < 256; i++) {
    if (i === c || Math.sign(luma(pal, i) - l) !== dir) continue;
    const d = dist(rgb(pal, i), target);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Blends the colors strictly between a and b from a's color to b's (the editor's Spread). */
export function spread(pal: Palette, a: number, b: number): void {
  const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
  for (let i = lo + 1; i < hi; i++)
    for (let c = 0; c < 3; c++) pal[i * 3 + c] = Math.round(pal[lo * 3 + c] + ((pal[hi * 3 + c] - pal[lo * 3 + c]) * (i - lo)) / (hi - lo));
}

/**
 * Fills a..b (inclusive) with a ramp of `base`'s color: deep shadow at the dark end, the color
 * itself two thirds of the way, a pale highlight at the light end.
 */
export function shadeRamp(pal: Palette, base: RGB, a: number, b: number): void {
  const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
  const n = hi - lo;
  const dark: RGB = base.map((v) => v * 0.2) as RGB;
  const light: RGB = base.map((v) => v + (63 - v) * 0.7) as RGB;
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 1;
    const [from, to, u] = t <= 2 / 3 ? [dark, base, t * 1.5] : [base, light, (t - 2 / 3) * 3];
    for (let c = 0; c < 3; c++) pal[(lo + i) * 3 + c] = Math.max(0, Math.min(63, Math.round(from[c] + (to[c] - from[c]) * u)));
  }
}
