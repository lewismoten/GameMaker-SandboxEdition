// MEET THE MONSTERS' own title picture: the hero meets the monsters in a row on the grass, with
// a star high above and the door beyond, and no coins (the kit's title arcs coins from the hero).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene, W } from '../../kit/starter/screens';

/** The title: the name, a ribbon, then the hero, a gumdrop, a mint gumdrop and a snail on the walk to the door. */
export function titlePicture(pal: Pal, book: Book, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const p = scene(pal, book, 160);
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, pal.c('gold', 4), pal.c('ink', 0), s, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  const put = (pic: Pixels, x: number, scale: number) => scaleBlit(p, pic, x, 160 - 20 * scale, scale);
  scaleBlit(p, hero, 30, 160 - 80, 2);
  put(mb.pics.get('gumdrop0')!, 96, 2);
  put(mb.pics.get('pop0')!, 146, 2);
  put(mb.pics.get('shelly0')!, 190, 2);
  scaleBlit(p, door, 260, 160 - 80, 2);
  return p;
}
