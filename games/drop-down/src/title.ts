// DROP DOWN's own title picture: the hero, Plop sitting on its crate, then Plop dropped to the ground by the rubble, and the door.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene, W } from '../../kit/starter/screens';

/** The title: the name, a ribbon, then Plop before and after its crate breaks, the hero and the door. */
export function titlePicture(pal: Pal, book: Book, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const p = scene(pal, book, 160);
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, pal.c('gold', 4), pal.c('ink', 0), s, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  // the hero, Plop sitting on its crate, then Plop on the ground by the rubble
  put(hero, 40, 160 - 80, 2);
  put(book.pics.get('crate')!, 112, 160 - 60, 3);
  put(mb.pics.get('plop0')!, 112, 160 - 120, 3);
  put(book.pics.get('rubble')!, 184, 160 - 60, 3);
  put(mb.pics.get('plop1')!, 184, 160 - 60, 3);
  scaleBlit(p, door, 268, 160 - 80, 2);
  return p;
}
