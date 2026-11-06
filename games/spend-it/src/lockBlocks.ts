// SPEND IT's gold door: the gate and its arch (counter 20, the same as the Starter key). The stalls and
// the coin that pays for them are in games/kit/starter/shop.ts.
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { archPicture, gatePicture } from '../../kit/starter/locks';
import type { Pal } from '../../kit/starter/palette';

export function addGoldBlocks(book: Book, pal: Pal): void {
  book.add('gateTop', archPicture(pal, 'gold'), { grav: PULL.down });
  book.add('gate', gatePicture(pal, 'wood', 'gold'), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
}
