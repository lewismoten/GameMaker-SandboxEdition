// What comes along the dream run's path: Teddy's wobble ball rolling at him (hop it), a
// puddle (hop it), a low branch (play dead under it: its leaves in the block above, its bough
// at a standing dog's head). The treats are the shared ones.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob, sprite } from '../art/draw';
import { c, r } from '../blocks/tiles';
import { wobbleBall } from './toys';

/** The wobble ball rolling along the ground (`turn` in quarter turns). */
export function rollingBall(turn: number): Pixels {
  const b = wobbleBall(turn);
  const p = new Pixels(20, 20, CLEAR);
  p.blit(b, Math.floor((20 - b.w) / 2), 20 - b.h, CLEAR);
  return p;
}

/** A puddle on the path, its shine in one of two places. */
export function puddle(k: number): Pixels {
  const shine = k ? '.owwwwwwwwWWwwwo' : '.owwWWwwwwwwwwwo';
  return sprite(['..oooooooooooo..', shine, 'owwwwwwwwwwwwwwo', '.oooooooooooooo.'], { o: c('water', 0), w: c('water', 2), W: c('water', 3) });
}

/** A low branch over the path, leaves hanging to just above a flat dog. */
export function lowBranch(k: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(0, 1, 20, 3, c('wood', 2)).rect(0, 1, 20, 1, c('wood', 3)).rect(0, 3, 20, 1, c('wood', 0));
  for (const [x, y, rx] of [
    [3, 6, 3],
    [10, 8, 3.5],
    [16, 6, 3],
  ])
    blob(p, x + (k ? 0.5 : 0), y, rx, 3, r('leaf'), 0, 3);
  return p;
}

/** The low branch's leaves, in the block above its bough, joining it at the bottom. */
export function branchLeaves(k: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  for (const [x, y, rx, ry] of [
    [2, 15, 4, 5],
    [8, 12, 5, 5],
    [14, 14, 5, 5],
    [19, 16, 4, 4],
    [10, 18, 6, 3],
  ])
    blob(p, x + (k ? 0.5 : 0), y, rx, ry, r('leaf'), 0, 3);
  p.line(0, 19, 6, 13, c('wood', 1)).line(13, 19, 17, 11, c('wood', 1));
  return p;
}
