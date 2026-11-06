// COUNTDOWN's other pictures: the double door of level 1 (shut or open), the trapdoor floor of
// level 2 (shut, flashing, and the shaft it opens onto) and the soft mat at the bottom of the shaft.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The double door as one 40x40 picture (cut into four blocks). Shut: steel plates and a red lamp. Open: a dark doorway with a green lamp. */
export function door(pal: Pal, open: boolean): Pixels {
  const { c, r } = pal;
  const s = r('stone');
  const p = new Pixels(40, 40, skyOf(pal));
  p.rect(0, 0, 40, 40, s[2]).frame(0, 0, 40, 40, s[4]).rect(0, 0, 1, 40, s[4]).rect(39, 0, 1, 40, s[1]);
  if (open) {
    p.rect(3, 4, 34, 36, c('ink', 0)).rect(3, 4, 34, 1, s[1]).rect(3, 4, 1, 36, s[1]);
    // a warm light inside and the floor line
    p.rect(8, 12, 24, 28, c('ink', 1)).rect(12, 16, 16, 24, c('gold', 1)).rect(16, 20, 8, 20, c('gold', 3));
  } else {
    for (const x of [3, 21]) {
      p.rect(x, 4, 16, 36, s[3]).frame(x, 4, 16, 36, s[1]);
      for (let y = 12; y < 38; y += 8) p.rect(x + 2, y, 12, 1, s[1]).rect(x + 2, y + 1, 12, 1, s[4]);
    }
    p.rect(18, 4, 4, 36, s[1]);
  }
  // the lamp over the door: green when open, red when shut
  p.disc(20, 2, 3, open ? c('green', 3) : c('red', 2)).ring(20, 2, 3, c('ink', 0));
  return p;
}

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
    // square nail heads: a radius-1 disc is a plus sign, and a floor of them read as rows of crosses
    for (const [x, y] of [[2, 4], [15, 4], [2, 15], [15, 15]] as const) p.rect(x, y, 2, 2, w[0]);
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
