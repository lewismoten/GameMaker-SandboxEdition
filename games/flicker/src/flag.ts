// A flag on a pole: a 2-block-wide cloth in four frames that move a wave along it, from the pole to the tip. The first
// block (`flag.a`) holds the pole and the start of the cloth, the second (`flag.b`) the rest and the swallow tail. Both
// are rings with the same times, so they step together and the wave runs across the join. A steady wave wants even
// times (6 ticks each here).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

export const FLAG_TICKS = [6, 6, 6, 6];
const POLE_X = 8;
const CLOTH_X = 11;
const CLOTH_END = 39;
const TOP = 4;
const DEEP = 11;

/** The cloth in frame k (0 to 3) on a 40x20 canvas, pole included. */
function cloth(pal: Pal, bg: number, k: number): Pixels {
  const { c } = pal;
  const p = new Pixels(40, 20, bg);
  p.rect(POLE_X, 0, 4, 20, c('wood', 2))
    .rect(POLE_X, 0, 1, 20, c('wood', 3))
    .rect(POLE_X + 3, 0, 1, 20, c('wood', 1));
  for (let x = CLOTH_X; x <= CLOTH_END; x++) {
    const s = (x - CLOTH_X) / (CLOTH_END - CLOTH_X); // 0 at the pole, 1 at the tip
    const wave = (s: number) => 3 * Math.min(1, s * 2.2) * Math.sin(s * 5.6 - (k * Math.PI) / 2);
    const top = Math.round(TOP + wave(s));
    const slope = wave(s + 0.04) - wave(s - 0.04); // falling cloth turns away from the light
    const notch = s > 0.82 ? Math.round(((s - 0.82) / 0.18) * (DEEP / 2 - 1)) : 0;
    for (let y = 0; y < DEEP; y++) {
      if (notch > 0 && y >= DEEP / 2 - notch && y < DEEP / 2 + notch + (DEEP % 2)) continue; // the swallow tail's notch
      const edge = y === 0 || y === DEEP - 1;
      let col = edge ? c('gold', 3) : c('red', slope > 0.35 ? 1 : slope < -0.35 ? 3 : 2);
      if (edge && slope > 0.35) col = c('gold', 2);
      p.set(x, top + y, col);
    }
  }
  return p;
}

/** Frame k of the flag's first block (the pole and the cloth's start) and of its second. */
export function flagFrames(pal: Pal, bg: number): { a: Pixels[]; b: Pixels[] } {
  const frames = [0, 1, 2, 3].map((k) => cloth(pal, bg, k));
  return { a: frames.map((f) => f.crop(0, 0, 20, 20)), b: frames.map((f) => f.crop(20, 0, 20, 20)) };
}

/** The pole alone: its top (a gold ball), its middle, and a block of it standing on the floor. */
export function poleBlocks(pal: Pal, bg: number): { top: Pixels; mid: Pixels } {
  const { c } = pal;
  const mid = () =>
    new Pixels(20, 20, bg)
      .rect(POLE_X, 0, 4, 20, c('wood', 2))
      .rect(POLE_X, 0, 1, 20, c('wood', 3))
      .rect(POLE_X + 3, 0, 1, 20, c('wood', 1));
  const top = new Pixels(20, 20, bg)
    .rect(POLE_X, 9, 4, 11, c('wood', 2))
    .rect(POLE_X, 9, 1, 11, c('wood', 3))
    .rect(POLE_X + 3, 9, 1, 11, c('wood', 1));
  top.disc(10, 7, 4, c('gold', 2)).disc(9, 6, 2.4, c('gold', 4)).set(8, 5, c('gold', 5));
  return { top, mid: mid() };
}
