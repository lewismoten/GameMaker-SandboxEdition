// BOOTS AND JET PACK's own background block, added to the Starter block set before the signs:
//   pod   a boot charge: a blue bubble with two arrows up. Touch it and level 2's jump counter (17, the number
//         of the jump sequence) goes up by 1, with the add-counter sound, and the bubble is gone (it turns
//         into sky, like a coin).
// Nothing here knows what a jump is: a counter that is the same number as a sequence is that sequence's uses left.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { BOOT_SEQ } from './hero';

/** The counter a pod adds to: level 2's jump sequence's own, so the character file's meter 17 is the taps left. */
export const CHARGES = BOOT_SEQ;
/** Taps one pod gives. */
export const POD_TAPS = 1;

/** The bubble: a dark rim, blue body with a shine, and two white arrows up. */
function podPicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const b = pal.r('blue');
  const white = pal.c('white', 3);
  p.disc(9.5, 9.5, 8.5, ink).disc(9.5, 9.5, 7.5, b[1]).disc(9.5, 9.5, 6, b[2]).disc(9.5, 10.5, 4.5, b[3]);
  for (let i = 0; i < 4; i++) {
    p.rect(9 - i, 4 + i, 2, 1, white)
      .rect(10 + i, 4 + i, 2, 1, white)
      .rect(9 - i, 9 + i, 2, 1, white)
      .rect(10 + i, 9 + i, 2, 1, white);
  }
  p.set(5, 6, white).set(6, 5, white);
  return p;
}

/** Adds the pod block. */
export function addBootBlocks(book: Book, pal: Pal): void {
  book.add('pod', podPicture(pal), { grav: PULL.down, effect: CHARGES, eamt: POD_TAPS, touch: 'sky' });
}
