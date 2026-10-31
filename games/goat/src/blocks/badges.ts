// Two scenery blocks for the site's achievement badges (art by Claude Sonnet 5.5): a shooting star with a stepped trail on
// the night, and the goat looking up from the floor with a tiny musical note (drawn from her own front sprite).
// Plain scenery (no solid, score or touch).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { T } from '../../../snowbound/src/sprites/kidArt';
import type { BlockBook } from '../../../snowbound/src/blocks/book';
import type { Pal } from '../art/pal';
import { goatArt } from '../sprites/sprites';

/** Adds `shootingStar` and `surprisedGoat` (drawn over a copy of `floor`). */
export function goatBadges(book: BlockBook, pal: Pal, floor: Pixels): void {
  const { c } = pal;
  const K = c('ink', 0);

  // a shooting star: a bright five-point head, a trail of steps down to the left, on a deep blue night
  const star = new Pixels(20, 20).rect(0, 0, 20, 20, c('blue', 0));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 2 === 0 && y < 12) star.set(x, y, K);
  for (const [x, y] of [
    [2, 3],
    [9, 1],
    [1, 11],
    [17, 16],
    [6, 17],
  ])
    star.set(x, y, c('star', 1));
  for (let i = 0; i < 6; i++) {
    const x = 12 - i * 2;
    const y = 7 + i * 2;
    const k = Math.min(3, 4 - Math.floor(i / 2));
    star.rect(x - 1, y - 1, 3, 2, c('glow', Math.max(0, k - 1))).rect(x, y, 3, 2, c('glow', Math.max(0, k)));
  }
  star.draw(
    8,
    1,
    ['.....K.....', '....KsK....', '....KsK....', 'KKKKKwKKKKK', 'KssswwwsssK', '.KsswwwssK.', '..KsswwsK..', '..KssKKssK.', '.KssK..KssK', '.KKK....KKK'],
    { K, s: c('star', 2), w: c('star', 1) },
  );
  book.add('shootingStar', star);

  // the goat from the front (her own sprite), startled, with one little note over her
  const goat = floor.crop(0, 0, 20, 20);
  const hero = { fur: 'goat', lo: 1, hi: 5, horns: true, beard: true } as const;
  goat.blit(goatArt(pal).front(hero, 0), 0, 3, T);
  // the note: a stem and a head, white with a dark outline
  goat.rect(1, 5, 5, 4, K).rect(5, 0, 3, 7, K).rect(7, 1, 2, 3, K);
  goat.rect(2, 6, 3, 2, c('star', 2)).rect(6, 1, 1, 6, c('star', 2)).rect(7, 2, 1, 1, c('star', 2));
  book.add('surprisedGoat', goat);
}
