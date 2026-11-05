// CORNER VIEW's own title picture, in the Showcase Tricks look (the kit's neon): the name over a small room seen
// from a corner: a patch of diamond floor, a row of cubes and a stair of towers, with Kit from above on the floor.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';
import { cubeShades, floor, tower } from './iso';

/** The title: the name on two lines, a ribbon, then the little room and Kit. */
export function titlePicture(pal: Pal, above: Pixels, tagline: string): Pixels {
  const look = lookOf(pal, 'neon');
  const p = backdrop(pal, 'neon');
  ['CORNER', 'VIEW'].forEach((l, i) => outlined(p, Math.round((W - textWidth(l, 2)) / 2), 8 + i * 19, l, look.fill, look.outline, 2, look.shadow));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  // the room: a 200x100 patch of floor, cubes along the back and a stair of towers one, two and three blocks tall
  const room = new Pixels(200, 100, 0);
  floor(room, pal);
  const purple = cubeShades(pal, 'purple');
  const teal = cubeShades(pal, 'teal');
  for (let x = 0; x < 10; x++) tower(room, x * 20 + 10, 20, 10, purple);
  [1, 2, 3, 2, 1].forEach((k, i) => tower(room, 60 + i * 20 + 10, 90, 20 * k - 10, teal));
  bevel(p, 56, 76, 208, 108, pal.r('ink'), 2, 2);
  p.blit(room, 60, 80);
  scaleBlit(p, above, 80, 120, 2);
  frameOf(p, pal, 'neon');
  return p;
}
