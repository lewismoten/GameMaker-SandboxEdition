// NOT THAT KEY's door blocks. The Starter blocks bring the gold key (counter 20). This file adds
// the gold gate and its arch, then a COPY of the whole set for counter 22: a green key, a green
// gate and its arch. The copy is the same three blocks with another "Effect counter" number and
// a new color and shape (a square key bow, studs and a square key hole, so a player who sees the colors alike can still
// tell them), which is the whole trick: counters have numbers, not names, and a key only
// opens a door whose number it adds to.
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { archPicture, gatePicture, keyPicture } from '../../kit/starter/locks';
import type { Pal } from '../../kit/starter/palette';

/** The counter the green keys add to (20 is gold; 21 stays unused). */
export const GREEN_KEYS = KEYS + 2;

/** The gold gate and its arch (counter 20), in the set levels 1 and 2 load. */
export function addGoldBlocks(book: Book, pal: Pal): void {
  book.add('gateTop', archPicture(pal, 'gold'), { grav: PULL.down });
  book.add('gate', gatePicture(pal, 'wood', 'gold'), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
}

/** The copy for counter 22, added after every block levels 1 and 2 use, so level 3's own copy of the set keeps their numbers. */
export function addGreenBlocks(book: Book, pal: Pal): void {
  book.add('keyGreen', keyPicture(pal, 'green', true), { grav: PULL.down, score: 25, effect: GREEN_KEYS, eamt: 1, touch: 'sky' });
  book.add('gateTopGreen', archPicture(pal, 'green'), { grav: PULL.down });
  book.add('gateGreen', gatePicture(pal, 'blue', 'green', true), { solid: SOLID, effect: GREEN_KEYS, eamt: -1, touch: 'sky' });
}
