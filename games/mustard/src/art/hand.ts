// The palm of God's hand: one great open hand of light, cupped to hold the seed, the thumb up
// at the left and the four fingers curling up at the right. Drawn 160x60 for the top of the
// last level (eight blocks by three) and scaled for the cartoons.
import { Pixels } from '../../../kit/pixels';
import { shadeAt } from '../../../snowbound/src/art/draw';
import type { Pal } from './pal';

export const HAND_W = 160;
export const HAND_H = 60;

const FINGERS: [number, number][] = [
  [112, 16],
  [126, 8],
  [140, 6],
  [153, 12],
];

/** Whether (x, y) of the 160x60 drawing is in the hand. */
function inHand(x: number, y: number): boolean {
  const bowl = ((x - 82) / 76) ** 2 + ((y - 24) / 32) ** 2 <= 1 && y >= 30;
  const heel = ((x - 82) / 60) ** 2 + ((y - 44) / 14) ** 2 <= 1;
  const thumb = x >= 8 && x <= 22 && y >= 14 + Math.max(0, x - 18) * 2 && y <= 40;
  const thumbTip = (x - 15) ** 2 + (y - 14) ** 2 <= 49;
  const fingers = FINGERS.some(([fx, top]) => Math.abs(x - fx) <= 5 && y >= top && y <= 40);
  const tips = FINGERS.some(([fx, top]) => (x - fx) ** 2 + (y - top) ** 2 <= 25);
  return bowl || heel || thumb || thumbTip || fingers || tips;
}

/**
 * Draws the hand at (x0, y0), `s` screen pixels per drawing pixel, in the sun ramp, with a soft
 * glow round it (`glow` false leaves what is under it alone). `light` 0..1 dims it.
 */
export function drawHand(p: Pixels, pal: Pal, x0: number, y0: number, s = 1, light = 1, glow = true): void {
  const c = pal.c;
  const R = pal.r('sun');
  const w = Math.round(HAND_W * s);
  const h = Math.round(HAND_H * s);
  const at = (x: number, y: number) => inHand(x / s, y / s);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) {
        if (glow && [-3, 3].some((d) => at(x + d * s, y) || at(x, y + d * s))) p.set(x0 + x, y0 + y, shadeAt(R, 0, 2, 0.6 * light, x, y));
        continue;
      }
      const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      p.set(x0 + x, y0 + y, edge ? c('sun', light > 0.5 ? 1 : 0) : shadeAt(R, 1, 3, (1.05 - y / s / 70 + Math.sin(x / s / 9) * 0.05) * light, x, y));
    }
  // the gaps between the fingers, and the palm's lines
  const ln = (a: number, b: number, cc: number, d: number) => p.line(x0 + a * s, y0 + b * s, x0 + cc * s, y0 + d * s, c('sun', 1));
  for (const [fx, top] of FINGERS) ln(fx + 6, top + 6, fx + 6, 38);
  ln(40, 40, 96, 37);
  ln(52, 46, 104, 42);
  ln(24, 26, 26, 40);
}
