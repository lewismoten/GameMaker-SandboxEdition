// The star Stick Man picks out of the night sky: a bright gold star hung in the air. Touch it and it is
// his (25 points, and it is gone). An ordinary block (a copy of the game can edit it in the Blocks tab).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { archPicture, gatePicture } from '../../kit/starter/locks';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';

/** Stars the town gate costs (the star counter is the kit's key counter, 20). */
export const GATE_STARS = 5;

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
  book.add('pickstar', p, { grav: PULL.down, score: PICK_SCORE, effect: KEYS, eamt: 1, touch: 'sky' });
}

/** The town gate: a stout gate with a gold star where the padlock goes, and the arch over it. It takes five stars from the counter and is gone. */
export function addStarGate(book: Book, pal: Pal): void {
  const g = gatePicture(pal, 'wood', 'gold');
  const ink = pal.c('ink', 0);
  g.rect(4, 2, 12, 15, ink);
  const rows = ['..#..', '.###.', '#####', '.###.', '.#.#.'];
  rows.forEach((row, dy) => [...row].forEach((ch, dx) => ch === '#' && g.rect(5 + dx * 2, 4 + dy * 2, 2, 2, pal.c('gold', 4))));
  book.add('stargateTop', archPicture(pal, 'gold'), { grav: PULL.down });
  book.add('stargate', g, { solid: SOLID, effect: KEYS, eamt: -GATE_STARS, touch: 'sky' });
}
