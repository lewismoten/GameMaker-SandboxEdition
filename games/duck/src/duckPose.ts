// Kit crouching, drawn for KIT DUCKS: 20x20, in the BOTTOM block only (the top block is left empty on purpose, see hero.ts).
// Facing right like the rest of Kit: the beanie and the pom-pom low over his knees, his arms around them, white sneakers on
// the ground. Frame 0 is the half crouch, frame 1 the full one, one pixel lower.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** The crouch picture (`deep` 0 or 1). */
export function crouch(pal: Pal, deep: 0 | 1): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const d = deep;
  const orange = r('orange');
  const skin = r('skin');
  const teal = r('teal');
  const white = r('white');
  const stone = r('stone');
  const ink = c('ink', 0);
  // the hoodie, round-backed, behind everything; the knees and sneakers in front on the ground
  blob(p, 6, 14 + d, 6, 5, orange, 0, 4);
  p.rect(1, 13 + d, 2, 3, orange[1]);
  blob(p, 11, 16, 4, 3, stone, 0, 4);
  for (const x of [4, 10]) p.rect(x, 17, 6, 3, white[3]).rect(x, 19, 6, 1, white[1]).set(x + 4, 18, c('teal', 3));
  // an arm round the knees: a sleeve across, a hand on the shin
  p.line(6, 13 + d, 11, 16, orange[2]).line(6, 14 + d, 11, 17, orange[2]);
  p.disc(12, 16, 1.6, skin[2]);
  // the head forward and low: face, then the beanie over it
  blob(p, 10, 9 + d, 6.4, 5.8, skin, 0, 3);
  const dome = new Pixels(20, 20, T);
  blob(dome, 9, 6 + d, 8, 5.2, teal, 0, 4);
  for (let y = 0; y < 9 + d; y++) for (let x = 0; x < 20; x++) if (dome.get(x, y) !== T) p.set(x, y, dome.get(x, y));
  p.rect(2, 7 + d, 14, 3, teal[3]).rect(2, 7 + d, 14, 1, teal[4]).rect(2, 9 + d, 14, 1, teal[2]);
  p.disc(7, 3 + d, 2.8, white[3]).set(6, 2 + d, white[2]).set(8, 4 + d, white[2]);
  // eye, cheek and a small smile
  p.rect(12, 11 + d, 2, 3, ink).set(13, 11 + d, c('white', 3));
  p.set(15, 14 + d, c('pink', 2)).set(13, 15 + d, ink).set(14, 15 + d, ink);
  return outline(p, ink, { transparent: T });
}
