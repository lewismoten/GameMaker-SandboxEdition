// Palette variants: the same palette re-lit for another time or place (night, dusk, underwater…)
// by scaling, lifting and clamping each color, as our games make theirs (Snowbound's streets,
// Sandcastle Knight's tunnels). Glowing colors (lamps, windows, stars) can be kept as they are.
import type { Palette } from '../../../formats/palette';

type RGB = [number, number, number];

export interface Variant {
  id: string;
  name: string;
  /** A short file-name stem for the new palette. */
  stem: string;
  mul: RGB;
  /** Added after scaling, in 6-bit VGA units (0..63). */
  add: RGB;
  /** Pulls the brightest colors down (0 = none, 1 = all the way to the mid tones). */
  dim?: number;
}

/** The moods the Owner's Guide suggests, with Snowbound's own dusk and night numbers. */
export const VARIANTS: Variant[] = [
  { id: 'night', name: 'Night', stem: 'night', mul: [0.48, 0.54, 0.8], add: [1.5, 2.5, 6.5] },
  { id: 'dusk', name: 'Dusk', stem: 'dusk', mul: [0.82, 0.74, 0.86], add: [5.5, 2, 3.5] },
  { id: 'morning', name: 'Morning', stem: 'morning', mul: [1, 0.95, 0.97], add: [2.5, 0, 1.5] },
  { id: 'underwater', name: 'Underwater', stem: 'water', mul: [0.45, 0.85, 0.95], add: [0, 4, 8], dim: 0.35 },
  { id: 'cave', name: 'Underground', stem: 'cave', mul: [0.66, 0.58, 0.6], add: [0.25, 0.25, 0.75] },
  { id: 'haunted', name: 'Haunted', stem: 'haunt', mul: [0.6, 0.72, 0.55], add: [2, 4, 1], dim: 0.2 },
];

/**
 * A re-lit copy: every color c becomes clamp(c * mul + add), optionally with the brightest
 * pulled down, except the indices in `keep` (glowing colors), which stay exactly as they are.
 */
export function relight(pal: Palette, v: Pick<Variant, 'mul' | 'add' | 'dim'>, keep: Iterable<number> = []): Palette {
  const out = pal.slice();
  const kept = new Set(keep);
  for (let i = 0; i < 256; i++) {
    if (kept.has(i)) continue;
    for (let c = 0; c < 3; c++) {
      let x = (pal[i * 3 + c] & 63) * v.mul[c] + v.add[c];
      if (v.dim && x > 40) x -= (x - 40) * v.dim;
      out[i * 3 + c] = Math.max(0, Math.min(63, Math.round(x)));
    }
  }
  return out;
}

/** Indices a..b inclusive (a range picked in the palette), for `keep`. */
export const range = (a: number, b: number): number[] => Array.from({ length: Math.abs(b - a) + 1 }, (_, k) => Math.min(a, b) + k);
