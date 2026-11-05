// The puff a part leaves when its last hit lands: a round white cloud with gold sparks, in two sizes (it grows).
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

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
