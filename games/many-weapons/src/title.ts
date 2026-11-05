// ONE KEY, MANY WEAPONS' own title picture, in Game Feel's sunset look: the hero has just thrown a
// flame (in his hand-turned-orange pose) at a frosty grump, with a star on its way after it, a
// sparkle and the door beyond.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title: the name, a ribbon, then the hero mid-throw, a flame and a star flying, the frosty grump they fly at, and the door. */
export function titlePicture(pal: Pal, _book: Book, mb: Book, _star: Pixels, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'sunset');
  const p = backdrop(pal, 'sunset');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  p.rect(44, 158, 32, 3, look.floorShadow);
  put(hero, 30, 160 - 80, 2);
  put(mb.pics.get('flame0')!, 96, 160 - 76, 2);
  put(mb.pics.get('star1')!, 144, 160 - 66, 1);
  put(mb.pics.get('frosty0')!, 190, 160 - 40, 2);
  put(mb.pics.get('twinkle0')!, 232, 160 - 70, 1);
  scaleBlit(p, door, 268, 160 - 80, 2);
  frameOf(p, pal, 'sunset');
  return p;
}
