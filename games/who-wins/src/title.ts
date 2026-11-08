// WHO WINS?'s own title picture: the hero has just thrown a star (it is mid-air) at a small mint
// gumdrop, with the big red one beside it, and the door beyond.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene, W } from '../../kit/starter/screens';

/** The title: the name, a ribbon, then the hero in her throw, a star flying, a small gumdrop, the big one and the door. */
export function titlePicture(pal: Pal, book: Book, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const p = scene(pal, book, 160);
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, pal.c('gold', 4), pal.c('ink', 0), s, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  put(hero, 20, 160 - 80, 2);
  put(mb.pics.get('star0')!, 74, 160 - 76, 2);
  put(mb.pics.get('pip0')!, 130, 160 - 40, 2);
  put(mb.pics.get('twinkle0')!, 150, 160 - 70, 1);
  put(mb.pics.get('big0')!, 184, 160 - 60, 3);
  scaleBlit(p, door, 268, 160 - 80, 2);
  return p;
}
