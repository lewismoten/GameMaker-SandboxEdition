// Up the Hive's turret, seen from the side: four of Will's pages blew up here. In by the stair
// from the Hive (bottom left); the ovens at the foot send warm air up a column (walk in and it
// lifts you, a page caught in it on the way) to the ceiling, beside a ledge (a page at its end);
// from the ledge a hop up into the fan's draft, which blows straight across the turret into the
// second column of warm air (another page in it), up to the top floor, the last page, and the
// back stair down to the stage.
import type { BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

export const LOFT_ROWS = [
  '################',
  '#uu....q.....X.#',
  '#uu#############',
  '#pu............#',
  '#uu............#',
  '#uuwwwwwwwwwwwwF',
  '#uuwwwwwwwwwwwwF',
  '#...##.........#',
  '#...UU.......q.#',
  '#...UU=========#',
  '#...UU.........#',
  '#...UU......l..#',
  '#...UU.........#',
  '#...UU.........#',
  '#...UU.........#',
  '#...pU.........#',
  '#...UU.........#',
  '#...UU....l....#',
  '#...UU.........#',
  '#...UU.........#',
  '#D@.UU.........#',
  '####OO##########',
];

export function loftMap(set: BlockSet): Stamped {
  return stamp(
    LOFT_ROWS,
    {
      '#': 'wall',
      '.': 'air',
      '=': 'floor',
      u: 'warm',
      U: 'warm',
      w: 'draftW',
      F: 'fan',
      O: 'oven',
      p: 'pageWarm',
      q: 'page',
      l: 'lamp',
      D: 'stairDown',
      X: 'stairStage',
      '@': 'air',
    },
    set,
    'wall',
    undefined,
    'DX@',
  );
}
