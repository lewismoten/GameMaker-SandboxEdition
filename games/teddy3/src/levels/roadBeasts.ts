// Level 7's monsters: geese on the River Road (a peck stings, once, and off the goose flaps;
// a HONK sends them off without one),
// the two drawbridges (roadBridge.ts; the second one's deck only stays down a while), and the
// ferry. The ferry is three monsters on one path: its stern (solid: the car drives over it to
// board, and it pushes the car across), the hull the car sits in, and the bow. It creeps along
// each dock for a moment (time to drive on or off) and crosses between them.
import { POWER } from '../ids';
import { newBestiary } from './level';
import type { Bestiary } from '../characters/mons';
import { pacer } from './common';
import { CRITTERS } from '../sprites/critters';
import { ferryBow, ferryHull, ferryStern } from '../sprites/roadTrip';
import { drawbridge } from './roadBridge';

/** The second drawbridge's deck stays down this many ticks (about three seconds: time to cross, not to charge). */
export const BRIDGE_LIFE = 56;

/** The ferry's way across, from where the stern starts (by the near dock): creep, cross, creep, back. */
export const FERRY_RUN = 8;

export function roadBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('goose')) b.pic(name, px, name === 'gooseRun' ? {} : { hp: -6 });
  pacer(
    b,
    'goose',
    [
      ['goose1', 6],
      ['goose2', 6],
    ],
    POWER.pest,
    2,
    'gooseOff',
    1,
  );
  b.add('gooseOff', { pics: [['gooseRun', 2]], power: 0, path: [[4, -6, 7]], end: -1 });

  drawbridge(b, 'lift');
  drawbridge(b, 'timed', BRIDGE_LIFE);

  ferry(b, FERRY_RUN);
  return b;
}

/**
 * The ferry (shared with Lookout Hill): stern, hull and bow on one path from the near dock,
 * where the stern starts: creep off (time to drive on), cross `run` blocks, creep at the far
 * dock (time to drive off), and come back.
 */
export function ferry(b: Bestiary, run: number): void {
  b.pic('ferryStern', ferryStern(), { solid: 15 }).pic('ferryHull', ferryHull()).pic('ferryBow', ferryBow());
  const path: [number, number, number][] = [
    [1, 0, 1],
    [run, 0, 5],
    [run - 1, 0, 2],
    [0, 0, 5],
  ];
  for (const part of ['ferryStern', 'ferryHull', 'ferryBow']) b.add(part, { pics: [[part, 50]], power: POWER.friend, path });
}
