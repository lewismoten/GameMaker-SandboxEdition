// BIG BUG's pictures, 20 by 20 each, facing left (toward Kit): a plump green beetle with a gold face,
// big eyes, a smile and two antennae with gold tips. It wiggles between two frames. Level 1's bug has
// plain stripes; level 2's has five round lights on its shell, as many lit as hits it has left.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** Where the five lights sit on the shell, in the order they go out last to first: the middle one stays longest. */
const LIGHTS: [number, number][] = [
  [14, 9],
  [11, 6],
  [16, 6],
  [11, 12],
  [16, 12],
];

/** The bug at wiggle `frame` (0 or 1). `lit` is how many of its five lights glow, or undefined for the plain stripes of level 1. */
export function drawBug(pal: Pal, frame: 0 | 1, lit?: number): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  // legs under the shell, three pairs, alternating with the wiggle
  for (const [x, dx] of [
    [6, -1],
    [10, 0],
    [14, 1],
  ] as const) {
    const d = frame ? -dx : dx;
    p.line(x, 16, x + d, 19, c('ink', 0));
  }
  // the shell, with its seam down the middle
  blob(p, 12, 11, 8, 6.4, r('green'), 0, 4);
  if (lit === undefined) {
    p.line(12, 5, 12, 16, c('green', 0));
    // plain stripes: two bands across the shell
    for (const x of [9, 15]) p.line(x, 6, x, 15, c('green', 1));
  } else {
    // a dark lamp for each of the five, a bright one for each hit still to come
    LIGHTS.forEach(([x, y], i) => {
      p.rect(x, y, 2, 2, i < lit ? c('gold', 5) : c('ink', 0));
      if (i < lit) p.set(x, y, c('white', 3));
    });
  }
  // the head, a round gold face on the left, with big eyes and a smile
  blob(p, 5, 11, 4.6, 4.8, r('gold'), 1, 5);
  for (const x of [3, 7])
    p.rect(x - 1, 8, 3, 3, c('white', 3))
      .set(x, 9, c('ink', 0))
      .set(x, 10, c('ink', 0));
  p.set(3, 13, c('ink', 0)).set(4, 14, c('ink', 0)).set(5, 14, c('ink', 0)).set(6, 14, c('ink', 0)).set(7, 13, c('ink', 0));
  // antennae curling up, wagging a pixel with the frame
  const w = frame ? 1 : 0;
  p.line(3, 6, 1 - w, 2, c('ink', 1)).line(7, 6, 7 + w, 2, c('ink', 1));
  p.disc(1 - w, 2, 1.2, c('gold', 4)).disc(7 + w, 2, 1.2, c('gold', 4));
  return outline(p, c('ink', 0), { transparent: T });
}

/** The puff that is left when the last hit lands: a round white cloud with gold sparks, in two sizes (it grows). */
export function drawPoof(pal: Pal, big: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const rad = big ? 7.4 : 5.2;
  blob(p, 10, 11, rad, rad * 0.85, r('white'), 1, 3);
  const arm = big ? 9 : 7;
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    p.rect(10 + dx * arm - 1, 10 + dy * arm - 1, 2, 2, c('gold', 4));
  }
  p.set(10, 2, c('gold', 4)).set(10, 19, c('gold', 3)).set(1, 11, c('gold', 3)).set(18, 11, c('gold', 4));
  return outline(p, c('ink', 0), { transparent: T });
}
