// AROUND THE ROOM's title picture: the neon look (Showcase Tricks), and a box of a room with the hero standing on
// each of its four sides, his head always pointing into the room.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The room's four heroes, in the order floor, left wall, ceiling, right wall (each already turned, 20x20). */
export function titlePicture(pal: Pal, heroes: Pixels[], name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'neon');
  const p = backdrop(pal, 'neon');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 12, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 36, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 40, tagline, look.ribbonText);
  // the room: a frame of ground, the inside in sky, and the four heroes on its four sides
  const X0 = 80;
  const Y0 = 60;
  const RW = 160;
  const RH = 130;
  const T = 10;
  bevel(p, X0, Y0, RW, RH, pal.r('grass'), 2, 2);
  p.rect(X0 + T, Y0 + T, RW - 2 * T, RH - 2 * T, pal.c('sky', 3));
  const ix = X0 + T;
  const iy = Y0 + T;
  const iw = RW - 2 * T;
  const ih = RH - 2 * T;
  const spots: [number, number][] = [
    [ix + iw / 2 - 20, iy + ih - 40],
    [ix, iy + ih / 2 - 20],
    [ix + iw / 2 - 20, iy],
    [ix + iw - 40, iy + ih / 2 - 20],
  ];
  heroes.forEach((h, i) => scaleBlit(p, h, spots[i][0], spots[i][1], 2));
  frameOf(p, pal, 'neon');
  return p;
}
