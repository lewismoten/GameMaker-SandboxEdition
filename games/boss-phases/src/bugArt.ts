// THREE PHASES' pictures, 20 by 20 each, facing right (the engine mirrors a monster that walks left).
// Big Bug has three looks, one for each phase of the fight: calm (a plump green beetle with a gold
// face and a smile), hurried (the same beetle in orange, with speed lines behind it and a round "oh"
// mouth) and tiny (a small purple one with a bow, who scoots). Each wiggles between two frames.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

export type Look = 'calm' | 'hurry' | 'tiny';

/** The bug at wiggle `frame` (0 or 1) in `look`, facing right. */
export function drawBug(pal: Pal, frame: 0 | 1, look: Look): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const small = look === 'tiny';
  // legs under the shell, three pairs, alternating with the wiggle (a hurried bug's legs stretch farther)
  const reach = look === 'hurry' ? 2 : 1;
  for (const [x, dx] of [
    [6, -reach],
    [10, 0],
    [14, reach],
  ] as const) {
    const d = frame ? -dx : dx;
    p.line(x, small ? 17 : 16, x + d, 19, c('ink', 0));
  }
  const shell = look === 'hurry' ? r('orange') : look === 'tiny' ? r('purple') : r('green');
  const seam = look === 'hurry' ? c('orange', 0) : look === 'tiny' ? c('purple', 0) : c('green', 0);
  if (small) blob(p, 11, 13, 5.6, 4.6, shell, 0, 4);
  else blob(p, 12, 11, 8, 6.4, shell, 0, 4);
  if (look === 'calm') {
    p.line(12, 5, 12, 16, seam);
    for (const x of [9, 15]) p.line(x, 6, x, 15, c('green', 1));
  } else if (look === 'hurry') {
    p.line(12, 5, 12, 16, seam);
    // speed lines trailing behind (on the left)
    p.line(0, 7, 4, 7, c('white', 3)).line(0, 11, 3, 11, c('white', 3)).line(1, 15, 4, 15, c('white', 3));
    for (const x of [9, 15]) p.line(x, 6, x, 15, c('orange', 1));
  } else {
    // two little spots on the shell
    p.rect(9, 11, 2, 2, c('purple', 4)).rect(13, 12, 2, 2, c('purple', 4));
  }
  // the head, a round gold face on the left, with big eyes and a mouth
  if (small) {
    blob(p, 6, 13, 3.6, 3.8, r('gold'), 1, 5);
    for (const x of [5, 8])
      p.rect(x - 1, 11, 2, 3, c('white', 3))
        .set(x, 12, c('ink', 0))
        .set(x, 13, c('ink', 0));
    p.set(5, 16, c('ink', 0)).set(6, 16, c('ink', 0)).set(7, 16, c('ink', 0));
    // a pink bow on top
    p.rect(9, 7, 2, 2, c('pink', 2)).rect(12, 7, 2, 2, c('pink', 2)).rect(11, 8, 1, 1, c('pink', 0));
  } else {
    blob(p, 5, 11, 4.6, 4.8, r('gold'), 1, 5);
    for (const x of [3, 7])
      p.rect(x - 1, 8, 3, 3, c('white', 3))
        .set(x, 9, c('ink', 0))
        .set(x, 10, c('ink', 0));
    if (look === 'hurry') p.rect(4, 13, 3, 2, c('ink', 0)).set(5, 13, c('red', 3));
    else p.set(3, 13, c('ink', 0)).set(4, 14, c('ink', 0)).set(5, 14, c('ink', 0)).set(6, 14, c('ink', 0)).set(7, 13, c('ink', 0));
    // antennae curling up, wagging a pixel with the frame
    const w = frame ? 1 : 0;
    p.line(3, 6, 1 - w, 2, c('ink', 1)).line(7, 6, 7 + w, 2, c('ink', 1));
    p.disc(1 - w, 2, 1.2, c('gold', 4)).disc(7 + w, 2, 1.2, c('gold', 4));
  }
  // drawn facing left, so turn it to face right
  return outline(p, c('ink', 0), { transparent: T }).flipX();
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
