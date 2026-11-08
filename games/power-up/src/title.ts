// POWER UP's own title picture: the hero on the grass with a pair of sneakers and a star ahead of
// him, and the exit door up on a ledge of planks. Nothing floats from or trails behind him.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';
import { scene, W } from '../../kit/starter/screens';

/** The title: the name, a ribbon, then the hero, two sneakers, a star and the door on its ledge. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const p = scene(pal, book, 160);
  // the blocks' sky made clear, so the scene's own shows through
  const clear = (b: Pixels) => b.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, pal.c('gold', 4), pal.c('ink', 0), s, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  scaleBlit(p, hero, 30, 160 - 80, 2);
  scaleBlit(p, clear(book.pics.get('sneakerL')!), 100, 160 - 40, 2);
  scaleBlit(p, clear(book.pics.get('sneakerR')!), 140, 160 - 40, 2);
  scaleBlit(p, clear(book.pics.get('star')!), 190, 84, 2);
  // the ledge: two planks, and the door standing on them
  for (const x of [236, 276]) scaleBlit(p, clear(book.pics.get('plank')!), x, 100, 2);
  scaleBlit(p, door, 276, 20, 2);
  return p;
}
