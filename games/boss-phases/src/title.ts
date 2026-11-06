// THREE PHASES' own title picture, in the Foes and Bosses look (the kit's arena): Nova has just thrown a star
// at Big Bug, who is hurried and orange, with a sparkle and the door beyond.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { backdrop, frameOf, lookOf } from '../../kit/starter/titleStyles';

/** The title in the arena look: the name, a ribbon, then Nova in her throw, a star flying, Big Bug and the door. */
export function titlePicture(pal: Pal, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const look = lookOf(pal, 'arena');
  const p = backdrop(pal, 'arena');
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), s === 2 ? 24 : 14, name, look.fill, look.outline, s, look.shadow);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  const put = (pic: Pixels, x: number, y: number, scale: number, flip = false) => scaleBlit(p, pic, x, y, scale, flip);
  p.rect(36, 158, 32, 3, look.floorShadow).rect(188, 158, 40, 3, look.floorShadow);
  put(hero, 30, 160 - 80, 2);
  put(mb.pics.get('star0')!, 98, 160 - 76, 2);
  put(mb.pics.get('star1')!, 144, 160 - 70, 1);
  put(mb.pics.get('hurry0')!, 186, 160 - 44, 2, true);
  put(mb.pics.get('twinkle0')!, 160, 160 - 70, 1);
  put(door, 268, 160 - 80, 2);
  frameOf(p, pal, 'arena');
  return p;
}
