// BIRDS OF A FEATHER's own title picture: the hero cheers on his way to the door while five birds fly over in a V.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene, W } from '../../kit/starter/screens';

/** The title: the name, a ribbon, then a V of five birds over the hero, and the door. */
export function titlePicture(pal: Pal, book: Book, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const p = scene(pal, book, 160);
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, pal.c('gold', 4), pal.c('ink', 0), s, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  // the hero walks to the door under a V of five birds, wings in step
  put(hero, 216, 160 - 80, 2);
  [
    [22, 76],
    [58, 92],
    [94, 108],
    [130, 92],
    [166, 76],
  ].forEach(([x, y], i) => put(mb.pics.get(i % 2 ? 'bird1' : 'bird0')!, x, y, 2));
  scaleBlit(p, door, 268, 160 - 80, 2);
  return p;
}
