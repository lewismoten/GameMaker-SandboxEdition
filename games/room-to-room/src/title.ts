// ROOM TO ROOM's own title picture: the hero by a door, and a second door beyond it up the path, with
// nothing floating or trailing (the kit's title arcs coins or a key from the hero).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';
import { scene, W } from '../../kit/starter/screens';

/** The title: the name, a ribbon, then the hero beside a door, with a second (smaller, farther) door up the hill. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, farDoor: Pixels, name: string, tagline: string): Pixels {
  const p = scene(pal, book, 160);
  outlined(p, Math.round((W - textWidth(name, 3)) / 2), 14, name, pal.c('gold', 4), pal.c('ink', 0), 3, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  scaleBlit(p, farDoor, 252, 160 - 56, 1);
  scaleBlit(p, door, 150, 160 - 80, 2);
  scaleBlit(p, hero, 70, 160 - 80, 2);
  return p;
}
