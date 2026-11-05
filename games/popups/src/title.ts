// SCORE POPUPS' own title picture, in the Showcase Tricks look (a night skyline, via
// kit/starter/titleStyles): Yana and the door as in every Starter, with the numbers a coin, a gem and a box leave
// under the row of coins.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { titlePicture as kitTitle } from '../../kit/starter/screens';

/** The title: the kit's stage picture, then the three numbers over the stage. */
export function titlePicture(pal: Pal, book: Book, mb: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const p = kitTitle(pal, book, hero, door, name, tagline, 'coins', 'neon');
  const put = (pic: Pixels, x: number, y: number, scale: number) => scaleBlit(p, pic, x, y, scale);
  // one number for each kind of prize, under the row of coins
  put(mb.pics.get('num100')!, 92, 88, 2);
  put(mb.pics.get('num200')!, 138, 88, 2);
  put(mb.pics.get('num500')!, 184, 88, 2);
  return p;
}
