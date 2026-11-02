// One scenery block for the site's achievement badge "Bizarre fan" (art by Claude Sonnet 5.5): a violin lying on the last
// hall's carpet, with one jaunty gold musical note over it. Plain scenery (no solid, score or touch).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import type { BlockBook } from '../../../snowbound/src/blocks/book';

/** Adds `violin`, drawn on a plain dark backdrop (the carpet is only used for its size). */
export function smirkedBadges(book: BlockBook, pal: Pal, carpet: Pixels): void {
  const { c } = pal;
  const K = c('ink', 0);
  const p = carpet.crop(0, 0, 20, 20).rect(0, 0, 20, 20, c('purple', 1));
  const wood = c('board', 3);
  // an upright violin: scroll and pegs, a dark fingerboard on the neck, a waisted body with two f-holes and a bridge
  p.rect(7, 0, 4, 4, K).rect(8, 1, 2, 2, wood).rect(5, 1, 2, 1, K).rect(11, 1, 2, 1, K);
  p.rect(7, 4, 4, 8, K).rect(8, 4, 2, 8, K).rect(7, 4, 1, 8, wood).rect(10, 4, 1, 8, wood);
  p.disc(9, 11, 5, K).disc(9, 16, 5, K).rect(7, 12, 5, 3, K);
  p.disc(9, 11, 4, wood).disc(9, 16, 4, wood).rect(5, 12, 9, 3, wood);
  p.rect(8, 4, 2, 9, K).line(7, 9, 7, 10, c('board', 4)).line(6, 16, 6, 18, c('board', 4));
  p.rect(7, 15, 5, 1, c('white', 2)).line(7, 12, 7, 14, K).line(11, 12, 11, 14, K).line(7, 17, 7, 18, K).line(11, 17, 11, 18, K);
  // the bow across it
  p.line(1, 19, 18, 5, K).line(1, 18, 18, 4, c('khaki', 3)).rect(0, 18, 3, 2, c('red', 2));
  // one note over it: a gold head, a stem and a flag, outlined
  p.rect(1, 3, 5, 4, K).rect(5, 0, 2, 4, K).rect(6, 0, 3, 2, K);
  p.rect(2, 4, 3, 2, c('gold', 2)).rect(5, 1, 1, 4, c('gold', 2)).rect(6, 1, 2, 1, c('gold', 2));
  book.add('violin', p, {});
}
