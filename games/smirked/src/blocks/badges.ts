// One scenery block for the site's achievement badge "Bizarre fan" (art by Claude Sonnet 5.5): a violin lying on the last
// hall's carpet, with one jaunty gold musical note over it. Plain scenery (no solid, score or touch).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import type { BlockBook } from '../../../snowbound/src/blocks/book';

/** Adds `violin`, drawn over a copy of `carpet`. */
export function smirkedBadges(book: BlockBook, pal: Pal, carpet: Pixels): void {
  const { c } = pal;
  const K = c('ink', 0);
  const p = carpet.crop(0, 0, 20, 20);
  // the body (two bouts and a waist), tipped a little, the neck up to the right with its scroll
  p.disc(6, 14, 5, K).disc(11, 10, 4, K).disc(6, 14, 4, c('board', 3)).disc(11, 10, 3, c('board', 3));
  p.rect(7, 11, 3, 3, c('board', 3)).rect(8, 11, 1, 1, K).rect(7, 14, 1, 1, K);
  p.disc(6, 14, 2, c('board', 2)).disc(11, 10, 1, c('board', 2));
  p.line(14, 9, 18, 5, K).line(14, 8, 18, 4, c('board', 1)).line(15, 8, 18, 5, c('board', 0)).rect(18, 2, 2, 3, K).set(19, 3, c('board', 3));
  p.line(5, 15, 8, 12, c('gold', 2)).line(6, 16, 9, 13, c('gold', 2));
  p.set(5, 17, K).set(9, 14, K);
  // one note over it: a gold head, a stem and a flag, outlined
  p.rect(1, 3, 5, 4, K).rect(5, 0, 2, 4, K).rect(6, 0, 3, 2, K);
  p.rect(2, 4, 3, 2, c('gold', 2)).rect(5, 1, 1, 4, c('gold', 2)).rect(6, 1, 2, 1, c('gold', 2));
  book.add('violin', p, {});
}
