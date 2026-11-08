// Fire: a flame as a ring of frames (a torch, a campfire) and the torch's holder. A flame is drawn from its base up in
// four layers (red, orange, gold, white-gold core) by `flame()`; each frame of a ring leans and rises differently.
// Even times make the flame pulse like a lamp; uneven times, with frames that do not grow in order, make it flicker.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

/** One frame of a flame: how tall (pixels), how wide at its widest, and how far its tip leans (positive is right). */
export interface Shape {
  h: number;
  w: number;
  lean: number;
}

/** Draws a flame onto `p`: base at row `baseY`, middle at column `cx`; the four layers are inset from the outer one. */
export function flame(p: Pixels, pal: Pal, shape: Shape, cx = 10, baseY = 19): Pixels {
  const { c } = pal;
  const layers: [number, number, number][] = [
    [1, 1, c('red', 2)],
    [0.76, 0.84, c('orange', 2)],
    [0.52, 0.64, c('gold', 3)],
    [0.28, 0.42, c('gold', 5)],
  ];
  for (const [wide, tall, color] of layers) {
    const h = Math.round(shape.h * tall);
    for (let i = 0; i < h; i++) {
      const t = i / Math.max(1, h - 1); // 0 at the base, 1 at the tip
      const bulge = 0.8 + 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.7));
      const hw = (shape.w / 2) * wide * bulge * Math.pow(1 - t, 0.75);
      const mid = cx + shape.lean * t * t * (wide > 0.9 ? 1 : 0.8);
      const y = baseY - i;
      for (let x = Math.round(mid - hw); x <= Math.round(mid + hw - 0.01); x++) p.set(x, y, color);
    }
  }
  return p;
}

/** The torch's holder, a block below the flame: a wrapped head, a wooden stick, an iron ring and a bracket on the wall. */
export function sconce(pal: Pal, bg: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, bg);
  p.rect(6, 0, 8, 1, c('ink', 1)).rect(5, 1, 10, 3, c('ink', 1)).rect(6, 3, 8, 1, c('ink', 0));
  p.rect(5, 1, 10, 1, c('wood', 1)); // the wrapping's top edge catches the light
  p.rect(8, 4, 4, 16, c('wood', 2)).rect(8, 4, 1, 16, c('wood', 3)).rect(11, 4, 1, 16, c('wood', 1));
  p.rect(7, 6, 6, 2, c('stone', 3)).rect(7, 7, 6, 1, c('stone', 1)); // the iron ring
  p.rect(3, 12, 14, 3, c('stone', 2)).rect(3, 12, 14, 1, c('stone', 4)).rect(3, 14, 14, 1, c('stone', 0));
  p.set(4, 13, c('stone', 0)).set(15, 13, c('stone', 0)); // rivets
  return p;
}

/** A torch flame on a plain background. */
export function torchFrame(pal: Pal, bg: number, shape: Shape): Pixels {
  return flame(new Pixels(20, 20, bg), pal, shape);
}

/** Four frames that grow and shrink in order, in the middle of the block: a pulse. */
export const PULSE: Shape[] = [
  { h: 10, w: 8, lean: 0 },
  { h: 13, w: 9, lean: 0 },
  { h: 16, w: 10, lean: 0 },
  { h: 13, w: 9, lean: 0 },
];
export const PULSE_TICKS = [5, 5, 5, 5];

/** Two flickering loops: frames of different heights and leans, in an order that does not grow and shrink, with uneven times. */
export const FLICKER_A: Shape[] = [
  { h: 15, w: 9, lean: -2 },
  { h: 11, w: 9, lean: 1.5 },
  { h: 17, w: 10, lean: 0.5 },
  { h: 12, w: 8, lean: 3 },
];
export const FLICKER_A_TICKS = [3, 5, 2, 4];
export const FLICKER_B: Shape[] = [
  { h: 13, w: 8, lean: 2.5 },
  { h: 17, w: 10, lean: -1 },
  { h: 10, w: 9, lean: -2.5 },
  { h: 15, w: 9, lean: 1 },
];
export const FLICKER_B_TICKS = [4, 2, 6, 3];
