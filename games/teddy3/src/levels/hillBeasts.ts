// Level 12's monsters: geese (one peck, or a HONK), the ferry across the pond (roadBeasts.ts),
// the drawbridge over the gully (roadBridge.ts; it only stays down a while), and the cows.
// A cow is new: she stands in the road chewing and a honk doesn't budge her (her power is
// above it). She takes her time: after a couple of seconds she turns and ambles out into the
// field behind the fence (a smaller picture, out of the car's way), grazes there a while,
// then turns and ambles back. Her picture list is timed to that walk; only the pictures of
// her in the road are solid.
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { CRITTERS } from '../sprites/critters';
import { cow, cowFar, cowTurn } from '../sprites/roadTrip';
import { drawbridge } from './roadBridge';
import { ferry } from './roadBeasts';

/** The gully's drawbridge stays down this many ticks (about three seconds). */
export const GULLY_LIFE = 56;

/** The pond's ferry crosses this many blocks. */
export const POND_RUN = 6;

/** A cow's walk, in ticks: in the road, turning away, out in the field, turning back. */
export const COW = { road: 36, out: 6, field: 45, back: 6 };

export function hillBeasts() {
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

  ferry(b, POND_RUN);
  drawbridge(b, 'gully', GULLY_LIFE);

  const solid = { solid: 15 };
  b.pic('cow0', cow(0), solid).pic('cow1', cow(1), solid).pic('cowOut', cowTurn(), solid);
  b.pic('cowIn', cowTurn()).pic('cowFar0', cowFar(0)).pic('cowFar1', cowFar(1));
  const walk: [string, number][] = [
    ['cow0', 9],
    ['cow1', 9],
    ['cow0', 9],
    ['cow1', 9],
    ['cowOut', COW.out],
    ['cowFar0', 12],
    ['cowFar1', 12],
    ['cowFar0', 12],
    ['cowFar1', COW.field - 36],
    ['cowIn', COW.back],
  ];
  b.add('cow', { pics: walk, power: POWER.friend });
  // the second cow is half a walk behind the first
  b.add('cow2', { pics: [...walk.slice(5), ...walk.slice(0, 5)], power: POWER.friend });
  return b;
}
