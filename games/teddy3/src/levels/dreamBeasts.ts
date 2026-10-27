// The dream run's monsters: what comes along the path at Teddy, born in the cells off the
// right edge and rolling left at the near fence's speed (4 px a tick), gone off the left edge.
// The wobble ball and the puddle sit on the ground (hop them); the low branch hangs at a
// standing dog's head (play dead under it), its leaves riding a block above; treats float a block up (hop for them). The three
// in the way are all the same power, so they pass through each other; one that bumps Teddy
// takes a little energy and is gone.
import { POWER } from '../ids';
import { newBestiary } from './level';
import { branchLeaves, lowBranch, puddle, rollingBall } from '../sprites/dream';
import { FENCE, SPAWN, VIEW, speed } from './dreamTiles';

/** The blocks from the spawn cells to just past the left edge. */
const RUN: [number, number, number][] = [[VIEW.x - 2 - SPAWN, 0, speed(FENCE)]];
/** Energy one bump takes (Teddy has 100). */
export const BUMP = 5;

export function dreamBeasts() {
  const b = newBestiary();
  for (let k = 0; k < 4; k++) b.pic(`roll${k}`, rollingBall(k), { hp: -BUMP });
  for (let k = 0; k < 2; k++) b.pic(`puddle${k}`, puddle(k), { hp: -BUMP }).pic(`bough${k}`, lowBranch(k), { hp: -BUMP }).pic(`leaves${k}`, branchLeaves(k));
  const along = (name: string, pics: [string, number][], power: number) => b.add(name, { pics, power, path: RUN, end: -1 });
  along(
    'ball',
    [0, 1, 2, 3].map((k) => [`roll${3 - k}`, 2]),
    POWER.pest,
  );
  along(
    'puddle',
    [
      ['puddle0', 5],
      ['puddle1', 5],
    ],
    POWER.pest,
  );
  along(
    'branch',
    [
      ['bough0', 6],
      ['bough1', 6],
    ],
    POWER.pest,
  );
  // the branch's leaves, born a block above its bough at the same tick (they only look)
  along(
    'leaves',
    [
      ['leaves0', 6],
      ['leaves1', 6],
    ],
    POWER.pest,
  );
  along(
    'treatRun',
    [
      ['treat1', 8],
      ['treat2', 8],
    ],
    POWER.pickup,
  );
  return b;
}
