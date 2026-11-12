// The star Stick Man picks out of the night sky: a bright gold star hung in the air. Touch it and it is
// his (25 points, and it is gone). An ordinary block (a copy of the game can edit it in the Blocks tab).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';

/** Points for a star out of the sky. */
export const PICK_SCORE = 25;

export function addPickStar(book: Book, pal: Pal): void {
  const p = new Pixels(20, 20, skyOf(pal));
  p.blit(drawStar(pal, 0), 0, 0, 255);
  // a glint of white on the sky around it
  for (const [x, y] of [
    [2, 3],
    [17, 5],
    [3, 16],
    [16, 17],
  ] as const)
    p.set(x, y, pal.c('white', 3));
  book.add('pickstar', p, { grav: PULL.down, score: PICK_SCORE, touch: 'sky' });
}
