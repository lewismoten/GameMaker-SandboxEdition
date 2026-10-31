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
  // a long soft body along the bottom, its head up at the left with two eye stalks
  snail.rect(1, 13, 18, 5, K).rect(2, 14, 16, 3, c('sand', 2)).rect(1, 8, 5, 6, K).rect(2, 9, 3, 5, c('sand', 2)).rect(2, 14, 3, 1, c('sand', 2));
  snail.line(2, 8, 1, 3, K).line(4, 8, 5, 3, K).rect(0, 1, 3, 3, K).rect(4, 1, 3, 3, K);
  snail.set(1, 2, c('white', 2)).set(5, 2, c('white', 2)).set(2, 11, K).set(3, 12, K);
  // the round shell with its spiral, then a small progress bar riding on top, half full
  snail.disc(12, 9, 6, K).disc(12, 9, 5, c('ochre', 2));
  for (let t = 0; t < 9.6; t += 0.08) snail.set(Math.round(12 + Math.cos(t) * (0.6 + t * 0.5)), Math.round(9 + Math.sin(t) * (0.6 + t * 0.5)), c('ochre', 0));
  snail.rect(7, 0, 12, 4, K).rect(8, 1, 10, 2, c('white', 2)).rect(8, 1, 5, 2, c('leaf', 3));
  book.add('snail', snail, air);
}
