// One scenery block for the site's achievement badge "Quiet, please" (art by Claude Sonnet 5.5), in the rooftops set: a
// small bibliotheca facade, with columns, steps and a scroll over the door. Plain scenery (no solid, score or touch).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import type { BlockBook } from './common';

/** The library front on `sky` (a copy is drawn on). */
export function libraryBadge(book: BlockBook, pal: Pal, sky: Pixels, air: { grav: number }): void {
  const { c } = pal;
  const K = c('ink', 0);
  const p = sky.crop(0, 0, 20, 20);
  // the pediment: a marble triangle, with a rolled scroll in it
  for (let y = 2; y < 7; y++) {
    const half = (y - 1) * 2;
    p.rect(10 - half, y, half * 2, 1, c('marble', 3));
    p.set(10 - half, y, K).set(9 + half, y, K);
  }
  p.rect(9, 1, 2, 1, K);
  p.rect(5, 6, 10, 1, K);
  p.rect(6, 3, 8, 4, K).rect(7, 4, 6, 2, c('ochre', 4)).rect(6, 3, 1, 4, c('wood', 2)).rect(13, 3, 1, 4, c('wood', 2));
  p.line(8, 4, 11, 4, c('wood', 1)).line(8, 5, 10, 5, c('wood', 1));
  // the beam, four columns, the dark door
  p.rect(0, 7, 20, 3, K).rect(1, 8, 18, 1, c('marble', 3));
  for (const x of [2, 5, 13, 16])
    p.rect(x - 1, 10, 4, 6, K)
      .rect(x, 10, 2, 6, c('marble', 3))
      .rect(x + 1, 10, 1, 6, c('marble', 1));
  p.rect(8, 10, 4, 6, K).rect(9, 11, 2, 5, c('wood', 1)).set(10, 10, c('wood', 1)).set(10, 13, c('gold', 3));
  // the steps
  p.rect(0, 16, 20, 2, K).rect(1, 16, 18, 1, c('stone', 4)).rect(0, 18, 20, 2, K).rect(1, 18, 18, 1, c('stone', 3));
  book.add('libraryFront', p, air);
}
