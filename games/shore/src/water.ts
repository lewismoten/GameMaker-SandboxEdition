// The water, drawn as frames. One animated block is a ring of blocks: each turns into the next after a few ticks, and the
// last turns back into the first. A map cell holds one block number, so every cell of one block turns at the same moment
// (PLAYGAME keeps one timer for each block number, not each cell). The ring's blocks are also the starting points: block 2
// begins on frame 2, so a sea laid from all four starts the same loop four steps apart.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

/** Frames in every ring. */
export const FRAMES = 4;
/** Ticks (18.2 a second) each water frame shows. */
export const WATER_TICKS = 5;
/** How far a wave crest moves down the tile each frame: 4 frames of 5 rows is the tile's 20 rows, so the loop closes. */
const STEP = 5;

/** One water frame: blue with two wave crests (a light stroke over a dark one) that are `frame` steps further down. */
export function waterFrame(pal: Pal, frame: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('blue', 2));
  // a crest is a light dab over a stroke with a shadow under it, 9 across; rows wrap round the tile
  const crest = (x0: number, y0: number) => {
    const row = (dy: number) => (y0 + dy + 40) % 20;
    p.rect(x0 + 2, row(0), 5, 1, c('blue', 4));
    p.rect(x0, row(1), 9, 1, c('blue', 3));
    p.rect(x0 + 1, row(2), 7, 1, c('blue', 1));
  };
  crest(1, 3 + STEP * frame);
  crest(10, 13 + STEP * frame);
  return p;
}
