// CUTSCENES' stage pictures: the trapdoor floor of a scene (shut, and flashing before it opens),
// the shaft it opens onto and the soft mat at the bottom of the shaft.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

/** The trapdoor floor block: shut (planks), or flashing (planks with gold and ink stripes, a warning that is shape as well as color). */
export function trap(pal: Pal, flash: boolean): Pixels {
  const { c, r } = pal;
  const w = r('wood');
  const p = new Pixels(20, 20, w[2]);
  p.rect(0, 0, 20, 2, w[4]).rect(0, 2, 20, 1, w[3]);
  for (const y of [8, 14]) p.rect(0, y, 20, 1, w[1]).rect(0, y + 1, 20, 1, w[3]);
  p.rect(0, 19, 20, 1, w[0]);
  if (flash) {
    for (let x = 0; x < 20; x++) for (let y = 4; y < 17; y++) if ((x + y) % 8 < 4) p.set(x, y, c('gold', 3));
    for (let x = 0; x < 20; x++) for (let y = 4; y < 17; y++) if ((x + y) % 8 === 4) p.set(x, y, c('ink', 0));
  } else {
    p.disc(3, 5, 1, w[0]).disc(16, 5, 1, w[0]).disc(3, 16, 1, w[0]).disc(16, 16, 1, w[0]);
  }
  return p;
}

/** The shaft under the floor: a deep blue wall with faint upright planks (lighter than night, so it reads as a slide, not a hole). */
export function shaft(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('blue', 0));
  for (const x of [0, 10]) p.rect(x, 0, 1, 20, c('blue', 1));
  return p;
}

/** The mat at the bottom of the shaft: a fat gold cushion with a blue stripe, set into the blue. */
export function mat(pal: Pal): Pixels {
  const { c } = pal;
  const p = shaft(pal);
  p.rect(0, 8, 20, 12, c('gold', 2)).rect(0, 8, 20, 2, c('gold', 4)).rect(0, 18, 20, 2, c('gold', 1));
  p.rect(0, 12, 20, 2, c('blue', 3));
  p.disc(10, 15, 1, c('gold', 4));
  return p;
}
