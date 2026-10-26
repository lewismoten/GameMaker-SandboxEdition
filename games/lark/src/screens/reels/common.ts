// What the story cartoons (the FLIs at the story's turns) share: their speed, the palette by a
// scene's light (the same indexes in every light, so one drawing serves dusk, night or gold),
// a blend between two palettes, the starry sky, the caption bar, and the close: every cartoon
// ends on a fade to black, since PLAYGAME cuts an FLI's last frame straight to black before the
// page picture that follows it fades in.
import { fadeOutLength } from '../../../../kit/fadeOut';
import { Pixels, rng } from '../../../../kit/pixels';
import type { Reel } from '../../../../kit/reel';
import { centered } from '../../art/draw';
import { buildPalette, c, type Light } from '../../art/pal';

export const W = 320;
export const H = 200;
/** 1/70 s a frame: about 12 frames a second. */
export const SPEED = 6;

/** The game's palette in a light (6-bit VGA). */
export const lit = (light: Light): Uint8Array => buildPalette(light).pal;

/** A palette `t` (0..1) of the way from `a` to `b`. */
export const blend = (a: Uint8Array, b: Uint8Array, t: number): Uint8Array => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Stars over the top `h` rows, the same every build. */
export function stars(p: Pixels, seed: number, h: number, n = 70): void {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(R() * W);
    const y = Math.floor(R() * h);
    p.set(x, y, R() < 0.25 ? c('yellow', 3) : c('paper', R() < 0.5 ? 4 : 2));
  }
}

/** A line of words on a dark bar along the bottom. */
export function caption(p: Pixels, words: string, y = 186): void {
  p.rect(0, y - 4, W, H - y + 4, c('ink', 0));
  centered(p, y, words, c('paper', 4));
}

/** The cartoon's end: the fade to black, and the file. */
export function close(r: Reel): Uint8Array {
  r.fadeOut(fadeOutLength(SPEED));
  return r.fli(SPEED);
}
