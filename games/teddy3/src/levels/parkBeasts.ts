// Level 3's monsters: the see-saws' ends, going up and down by themselves (kids at the
// other end; they're solid, so Teddy rides one up), Juggles' super see-saw that shoots its
// end way up into the oak, a squirrel on the oak's branch (a bark sends it off), ducks on
// the pond (friendly), and the flying disc.
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { SAW_DOWN, SAW_UP, seesawPlank } from './seesaw';
import { CRITTERS } from '../sprites/critters';
import { seesawEnd } from '../sprites/gadgets';
import { flyingDisc, kid } from '../sprites/folks';
import { Pixels } from '../../../kit/pixels';
import { over } from '../art/draw';

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

  // A see-saw's ends, starting low (going up) or high (going down), each slow as it leaves the
  // bottom (time to step on) and the top (time to step off); the planks tilt in step. The
  // riding ends are bare planks; the other ends have kids on them.
  b.add('sawUp', { pics: [['endL', 50]], power: POWER.friend, path: SAW_UP });
  b.add('sawDown', { pics: [['endR', 50]], power: POWER.friend, path: SAW_DOWN });
  b.add('kidUp', { pics: [['endBoy', 50]], power: POWER.friend, path: SAW_UP });
  b.add('kidDown', { pics: [['endGirl', 50]], power: POWER.friend, path: SAW_DOWN });
  // see-saw A's plank spans its two fulcrum blocks; the pond's see-saws have one each
  seesawPlank(b, 'plankA', 2, true);
  seesawPlank(b, 'plank', 1, true);
  // Juggles' super see-saw: when he lands on his end, Teddy's end shoots up into the oak; it
  // lingers up there a second (sinking slowly: time to step off), then drops back. One go is
  // 64 ticks (3.5 s), so it is back at its step within 3 s.
  b.add('sawSuper', {
    pics: [['endL', 50]],
    power: POWER.friend,
    path: [
      [0, -1, 2],
      [0, -SUPER.rise, 5],
      [0, -SUPER.rise + 1, 1],
      [0, 0, 10],
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
