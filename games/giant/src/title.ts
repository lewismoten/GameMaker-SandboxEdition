// BIG BUG's own title picture, in the Foes and Bosses look (the kit's arena): Rima has just thrown a star
// at Rocky, a giant made of four monsters, with a sparkle and the door beyond.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the arena look: the name, a ribbon, then Rima in his throw, a star flying, Rocky in his four parts and the door. */
export function titlePicture(pal: Pal, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'arena');
  const p = backdrop(pal, 'arena');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  p.rect(36, 158, 32, 3, look.floorShadow).rect(176, 158, 80, 3, look.floorShadow);
  put(hero, 30, 160 - 80, 2);
  put(mb.pics.get('star0')!, 90, 160 - 44, 2);
  put(mb.pics.get('star1')!, 134, 160 - 40, 1);
  for (const [k, dx, dy] of [
    ['tl', 0, 0],
    ['tr', 40, 0],
    ['bl', 0, 40],
    ['br', 40, 40],
  ] as const)
    put(mb.pics.get(`gol_${k}0`)!, 176 + dx, 160 - 80 + dy, 2);
  put(mb.pics.get('twinkle0')!, 156, 160 - 44, 1);
  put(door, 268, 160 - 80, 2);
  frameOf(p, pal, 'arena');
  return p;
}
