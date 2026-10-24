// Level 3's monsters: the see-saws' ends, going up and down by themselves (kids at the
// other end; they're solid, so Teddy rides one up), Juggles' super see-saw that shoots its
// end way up into the oak, a squirrel on the oak's branch (a bark sends it off), ducks on
// the pond (friendly), and the flying disc.
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { CRITTERS } from '../sprites/critters';
import { seesawEnd } from '../sprites/gadgets';
import { flyingDisc, kid } from '../sprites/folks';
import { Pixels } from '../../../kit/pixels';
import { over } from '../art/draw';

/** How far a see-saw's end travels, in blocks, and its speed. */
export const SEESAW = { rise: 3, speed: 2 };
/** The super see-saw: up this many blocks, fast. */
export const SUPER = { rise: 6 };

export function parkBeasts() {
  const b = newBestiary();
  b.pic('endL', seesawEnd(), { solid: 15 }).pic('endR', seesawEnd(true), { solid: 15 });
  // the other ends: a kid sitting on each, holding the handle
  for (const [name, who] of [
    ['endBoy', 'boy'],
    ['endGirl', 'girl'],
  ] as const) {
    const p = new Pixels(20, 20, 255);
    over(p, kid(who).crop(0, 0, 20, 14), 0, 0);
    over(p, seesawEnd(true).crop(0, 0, 20, 6), 0, 14);
    b.pic(name, p, { solid: 15 });
  }
  for (const [name, px] of Object.entries(CRITTERS)) {
    if (name.startsWith('squirrel')) b.pic(name, px, name === 'squirrelRun' ? {} : { hp: -5 });
    if (name.startsWith('duck')) b.pic(name, px);
  }
  b.pic('disc1', flyingDisc(0), { hp: -8 }).pic('disc2', flyingDisc(1), { hp: -8 });

  // A see-saw's ends, starting low (going up) or high (going down); slow for the last block
  // at the bottom, so there is time to step on. The riding ends are bare planks; the other
  // ends have kids on them.
  const { rise, speed } = SEESAW;
  const up: [number, number, number][] = [
    [0, -1, 1],
    [0, -rise, speed],
    [0, -1, speed],
    [0, 0, 1],
  ];
  const down: [number, number, number][] = [
    [0, rise - 1, speed],
    [0, rise, 1],
    [0, rise - 1, 1],
    [0, 0, speed],
  ];
  b.add('sawUp', { pics: [['endL', 50]], power: POWER.friend, path: up });
  b.add('sawDown', { pics: [['endR', 50]], power: POWER.friend, path: down });
  b.add('kidUp', { pics: [['endBoy', 50]], power: POWER.friend, path: up });
  b.add('kidDown', { pics: [['endGirl', 50]], power: POWER.friend, path: down });
  // Juggles' super see-saw: when he lands on his end, Teddy's end shoots up into the oak; it
  // waits up there a moment (a little bob), then sinks slowly back.
  b.add('sawSuper', {
    pics: [['endL', 50]],
    power: POWER.friend,
    path: [
      [0, 0, 1],
      [0, -SUPER.rise, 4],
      [0, -SUPER.rise + 1, 1],
      [0, -SUPER.rise, 1],
      [0, 0, 3],
    ],
  });

  pacer(
    b,
    'squirrel',
    [
      ['squirrel1', 5],
      ['squirrel2', 5],
    ],
    POWER.pest,
    2,
    'squirrelOff',
    1,
  );
  b.add('squirrelOff', { pics: [['squirrelRun', 2]], power: 0, path: [[5, -4, 7]], end: -1 });
  b.add('duck', {
    pics: [
      ['duck1', 8],
      ['duck2', 8],
    ],
    power: POWER.friend,
    path: [
      [3, 0, 1],
      [0, 0, 1, FLIP],
    ],
  });
  // the disc sails left at head height (play dead under it)
  b.add('disc', {
    pics: [
      ['disc1', 2],
      ['disc2', 2],
    ],
    power: POWER.pest,
    path: [[-9, 0, 6]],
    end: -1,
  });
  return b;
}
