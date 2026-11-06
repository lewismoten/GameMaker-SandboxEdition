// COLORS THAT WORK's second views: a picture of a level's row of plates, once as you see it and once
// as a player who sees red and green alike can see it (the same pixels in a changed palette).
// Each level card shows them after the card itself (build.ts).
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { scene } from '../../kit/starter/screens';
import { ROW } from './levels';

/** The row of plates as a picture: `safe` and `hot` are block names, drawn twice their size. */
export function viewPicture(pal: Pal, book: Book, safe: string, hot: string, head: string, line: string, seed: number): Pixels {
  const p = scene(pal, book, 160, seed);
  bevel(p, 16, 8, 288, 56, pal.r('parch'), 3, 2);
  p.rect(20, 12, 280, 48, pal.c('parch', 3));
  centered(p, 22, head, pal.c('ink', 0), 1);
  centered(p, 40, line, pal.c('wood', 1));
  const clear = (n: string) => book.pics.get(n)!.map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
  const x0 = Math.round((320 - ROW.length * 40) / 2);
  [...ROW].forEach((ch, i) => scaleBlit(p, clear(ch === 'H' ? hot : safe), x0 + i * 40, 160 - 40, 2));
  return p;
}
