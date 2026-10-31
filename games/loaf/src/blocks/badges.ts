// Two scenery blocks for the site's achievement badges (art by Claude Sonnet 5.5): green and violet northern lights over a
// dark sky and snowy hills, and a snail with a half-finished progress bar on its shell. Plain scenery (no solid, score or touch).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import type { BlockBook } from '../../../snowbound/src/blocks/book';

/** Adds `aurora` (its own dark sky) and `snail` (drawn over a copy of `sky`). */
export function loafBadges(book: BlockBook, pal: Pal, sky: Pixels, air: { grav: number }): void {
  const { c } = pal;
  const K = c('ink', 0);

  // the lights: a wavy curtain of upright rays, violet at the top and green below, over snowy hills
  const lights = sky.crop(0, 0, 20, 20).rect(0, 0, 20, 20, K);
  for (let y = 0; y < 16; y++) lights.rect(0, y, 20, 1, y < 8 ? c('purple', 0) : K);
  for (const [x, y] of [
    [2, 1],
    [9, 1],
    [16, 2],
    [5, 4],
    [18, 5],
    [1, 8],
  ])
    lights.set(x, y, c('white', 2));
  for (let x = 1; x < 19; x++) {
    const top = 3 + Math.round(Math.sin(x / 2.4) * 2);
    const bot = 13 + Math.round(Math.sin(x / 2 + 1) * 1.5);
    for (let y = top; y <= bot; y++) {
      const f = (y - top) / (bot - top);
      lights.set(x, y, f < 0.3 ? c('purple', x % 2 ? 2 : 1) : f < 0.7 ? c('leaf', x % 2 ? 2 : 3) : c('grass', x % 2 ? 3 : 4));
    }
    lights.set(x, bot + 1, c('leaf', 1));
  }
  for (let x = 0; x < 20; x++) {
    const h = 16 + Math.round(Math.sin(x / 3) * 1.2);
    lights.rect(x, h, 1, 20 - h, c('white', 1)).set(x, h, c('white', 2));
  }
  lights.rect(0, 19, 20, 1, c('ink', 1));
  book.add('aurora', lights, air);

  // a snail carrying a half-finished progress bar on its shell
  const snail = sky.crop(0, 0, 20, 20);
  snail.rect(0, 17, 20, 3, c('grass', 1)).rect(0, 17, 20, 1, c('grass', 3));
  snail.rect(0, 15, 17, 4, K).rect(1, 16, 15, 2, c('sand', 2)).rect(14, 9, 5, 10, K).rect(15, 10, 3, 8, c('sand', 2));
  snail.line(15, 9, 14, 5, K).line(18, 9, 19, 5, K).rect(13, 3, 2, 3, K).rect(18, 3, 2, 3, K);
  snail.set(14, 4, c('white', 2)).set(19, 4, c('white', 2)).rect(16, 12, 1, 1, K).line(15, 15, 17, 15, K);
  snail.disc(7, 9, 7, K).disc(7, 9, 6, c('ochre', 2)).ring(7, 9, 5, c('ochre', 1)).rect(1, 15, 13, 1, K);
  snail.rect(2, 6, 11, 6, K).rect(3, 7, 9, 4, c('white', 2)).rect(3, 7, 4, 4, c('leaf', 3)).rect(3, 7, 4, 1, c('leaf', 2));
  book.add('snail', snail, air);
}
