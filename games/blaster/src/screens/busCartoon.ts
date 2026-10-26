// The cartoons on either side of a data bus ride. warp.fli plays when a boss falls: STAGE
// CLEAR!, then the speed lines settle into the bus coming at you in perspective and the
// BLASTER drops onto it from behind, RIDING THE DATA BUS... into the ride itself (its card, then
// the ride). <ride>.fli plays when the ride ends: the next stage's chip swells to fill the
// screen and the BLASTER flies into it, NEXT STOP and the stage's name, then a fade to black
// before the stage's first card.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels } from '../../../kit/pixels';
import { encodeFliFadeOut } from '../../../kit/fadeOut';
import { CLEAR, centered, shadeAt } from '../art/draw';
import { shipBlocks } from '../characters/ship';
import { chipArt, chipAt } from '../bus/busChip';
import type { Ride } from '../bus/rides';
import { H, SHIP, SHIP_FLAME, SP, W, blob, c, scaleBlit, speedLines } from './cartoon';

const REAR = shipBlocks(SP).pic('rear0');
const REAR_FLAME = shipBlocks(SP).pic('rear1');

const caption = (p: Pixels, s: string) => {
  p.rect(0, 0, W, 14, c('ink', 0));
  centered(p, 3, s, c('gold', 4));
};

/** The bus in perspective from (vx, hy) down to the bottom of the screen, `grow` 0..1 of the way there. */
function bus(p: Pixels, vx: number, hy: number, grow: number, t: number): void {
  const bottom = hy + (H - hy) * grow;
  for (let y = hy; y < bottom; y++) {
    const half = (y - hy) * 1.2;
    const near = (y - hy) / (H - hy);
    for (let x = Math.max(0, Math.floor(vx - half - 6)); x <= Math.min(W - 1, vx + half + 6); x++) {
      const d = Math.abs(x + 0.5 - vx) - half;
      if (d < 0) p.set(x, y, shadeAt(SP.r('trim'), 0, 3, near, x, y));
      else if (d < 2 + near * 5) p.set(x, y, d < 1 + near * 2 ? c('trim', 6) : c('deep', 0));
    }
    // pulses down the lines between the lanes, racing toward the viewer
    if (Math.floor((y - hy) / (4 + near * 14) - t * 0.7) % 3 === 0)
      for (const side of [-1, 1]) {
        const x = vx + (side * half) / 3;
        p.rect(Math.round(x - near * 1.5), y, Math.max(1, Math.round(near * 3)), 1, c('glow', 4));
      }
  }
}

/** A boss down: the stage is clear, and the BLASTER boards the data bus. */
export function warpFli(): Uint8Array {
  const frames: Uint8Array[] = [];
  const frame = (p: Pixels) => frames.push(Uint8Array.from(p.px));
  for (let f = 0; f < 16; f++) {
    const p = new Pixels(W, H, c('ink', 0));
    speedLines(p, 160, 100, f, f % 6 < 3 ? 'cyan' : 'gold', 80);
    blob(p, 160, 100, 14 + (f % 3), 14 + (f % 3), SP.r('glow'), 0, 2, 0.4);
    scaleBlit(p, f % 2 ? SHIP_FLAME : SHIP, 140, 90 - Math.round(Math.sin(f / 3) * 4), 2);
    caption(p, 'STAGE CLEAR!');
    frame(p);
  }
  // the speed lines thin out as the bus rolls in under the ship, and the ship turns to ride it
  for (let f = 0; f < 22; f++) {
    const p = new Pixels(W, H, c('ink', 0));
    p.rect(0, 70, W, 1, c('glow', 2));
    speedLines(p, 160, 70, 16 + f, 'cyan', Math.max(0, 60 - f * 4));
    bus(p, 160, 70, Math.min(1, f / 10), f);
    if (f < 8) scaleBlit(p, f % 2 ? SHIP_FLAME : SHIP, 140, 90 - f * 2, 2);
    else scaleBlit(p, f % 2 ? REAR_FLAME : REAR, 140, 128 - Math.round(Math.max(0, 14 - f) * 3), 2);
    caption(p, 'RIDING THE DATA BUS...');
    frame(p);
  }
  return encodeFli(frames, SP.pal, { speed: 4 });
}

/** A ride's end: the next stage's chip fills the screen and the BLASTER flies in. */
export function arriveFli(ride: Ride, stageTitle: string): Uint8Array {
  const frames: Uint8Array[] = [];
  const chip = chipArt(SP, ride.n);
  for (let f = 0; f < 26; f++) {
    const p = new Pixels(W, H, c('ink', 0));
    // the chip swells until it fills the screen's width, the board rising under it
    const s = Math.min(5, 1.2 * 1.16 ** f);
    const hy = Math.min(165, 110 + f * 4);
    p.rect(0, hy, W, H - hy, c('base', 0));
    bus(p, 160, hy, 1, f);
    const big = new Pixels(W, H, CLEAR);
    chipAt(big, chip, s, 160, hy);
    p.blit(big, 0, 0, CLEAR);
    // the ship shrinks into the pins under the chip's name as it flies in
    const k = Math.max(0, 3 - Math.floor(f / 5));
    if (k > 0) scaleBlit(p, f % 2 ? REAR_FLAME : REAR, 160 - 10 * k, 170 - f * 2 - 10 * k, k);
    caption(p, f < 12 ? 'NEXT STOP...' : stageTitle.toUpperCase() + '!');
    frames.push(Uint8Array.from(p.px));
  }
  return encodeFliFadeOut(frames, SP.pal, { speed: 4 });
}
