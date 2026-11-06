// The title uses the same rain and pool pictures as the levels, not a decorative stand-in.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { courseNumber } from '../../../web/src/project/ceremonies';

export function titlePicture(pal: Pal, book: Book, hero: Pixels): Pixels {
  const p = new Pixels(320, 200, pal.c('sky', 3));
  for (let y = 0; y < 160; y += 20) for (let x = 0; x < 320; x += 20) p.blit(book.pics.get(`rain.${(x / 20 + y / 20) % 4}`)!, x, y);
  for (let x = 0; x < 320; x += 20) p.blit(book.pics.get('grass')!, x, 160).blit(book.pics.get('dirt')!, x, 180);
  centered(p, 18, 'RAIN ON THE PATH', pal.c('white', 3), 2, pal.c('ink', 0));
  centered(p, 46, 'A STARTER GAME', pal.c('gold', 4), 1, pal.c('ink', 0));
  centered(p, 64, `COURSE ${courseNumber('rain') ?? ''}`, pal.c('white', 2), 1, pal.c('ink', 0));
  scaleBlit(p, hero, 54, 80, 2);
  for (let part = 0; part < 3; part++) p.blit(book.pics.get(`pool${part}.2`)!, 154 + part * 20, 160);
  centered(p, 190, 'FALLING RAIN / SPLASHES / PALETTES', pal.c('white', 2), 1, pal.c('ink', 0));
  return p;
}
