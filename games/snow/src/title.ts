// A snow-covered title scene made from the game's own powder, drift and hero pixels.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered, outlined, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import type { Book } from '../../kit/starter/book';

export function snowTitle(pal: Pal, book: Book, hero: Pixels, door: Pixels): Pixels {
  const p = new Pixels(320, 200, pal.c('sky', 3));
  for (let y = 80; y < 145; y += 24) for (let x = 8; x < 316; x += 29) p.blit(book.pics.get(`flake${x % 2}.${Math.floor(x / 29) % 8}`)!, x, y);
  for (let x = 0; x < 320; x += 20) {
    p.blit(book.pics.get('grass')!, x, 170);
    p.blit(book.pics.get('dirt')!, x, 190);
    p.blit(book.pics.get(x > 75 && x < 225 ? 'footprints' : 'powder')!, x, 150);
  }
  for (let col = 0; col < 3; col++) p.blit(book.pics.get(`drift${col}.2`)!, 142 + col * 20, 150);
  scaleBlit(p, hero, 44, 90, 2);
  scaleBlit(p, door, 244, 90, 2);
  outlined(p, (320 - textWidth('SNOW TRAILS', 3)) / 2, 17, 'SNOW TRAILS', pal.c('white', 3), pal.c('ink', 0), 3, pal.c('sky', 0));
  centered(p, 54, 'A STARTER GAME', pal.c('gold', 4));
  centered(p, 73, 'FALLING SNOW, DRIFTS, FOOTPRINTS', pal.c('white', 3));
  return p;
}
