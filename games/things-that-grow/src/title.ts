// SEEDS AND NESTS's own title picture: the hero cheers beside a nest on a brick shelf, a yellow bird and a
// blue one flutter by, and the door is beyond.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { scene, W } from '../../kit/starter/screens';

/** The title: the name, a ribbon, then the hero, the shelf with its nest, two birds and the door. */
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
  // a brick shelf (three blocks) with a nest on it, and a yellow and a blue bird fluttering by
  const brick = book.pics.get('brick')!;
  for (let i = 0; i < 3; i++) put(brick, 110 + i * 40, 104, 2);
  put(
    book.pics.get('nestShelf')!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c)),
    150,
    66,
    2,
  );
  put(mb.pics.get('bird0')!, 196, 62, 2);
  put(mb.pics.get('bluebird1')!, 228, 90, 2);
  scaleBlit(p, door, 268, 160 - 80, 2);
  return p;
}
