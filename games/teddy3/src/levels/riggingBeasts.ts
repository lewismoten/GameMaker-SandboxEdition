// Level 15's monsters: the sandbags swinging across the catwalks at head height (PRATFALL and
// they go over), the pin Juggles and Twirly toss back and forth (it pops a balloon dog but
// doesn't hurt), a pigeon roosting on a catwalk (SQUAWK), and
// the rigging lift: two planks going round the same shaft half a turn apart. A plank is solid
// only on the way up, slowly for the first block (time to step on) and the last (time to step
// off); it goes back down folded flat against its ropes, so it never comes down on anyone.
import { POWER } from '../ids';
import { newBestiary } from './level';
import { CRITTERS } from '../sprites/critters';
import { pin } from '../sprites/folks';
import { liftFolded, liftPlank, sandbag } from '../sprites/rigging';

/** The lift: its shaft's bottom row, how many blocks it rises, and its speeds. */
export const LIFT = { rise: 13, slow: 2, fast: 5, down: 5 };
/** How far Juggles and Twirly toss their pin, back and forth. */
export const PIN_TOSS = 11;
/** The sandbag swings: [name, blocks out to the left, pixels a tick]. */
export const SWINGS: [string, number, number][] = [
  ['swingLow', 7, 5],
  ['swingHigh', 5, 5],
];

export function riggingBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -6 });
  b.pic('bag1', sandbag(0), { hp: -10 }).pic('bag2', sandbag(1), { hp: -10 });
  b.pic('pin1', pin(0)).pic('pin2', pin(1));
  b.pic('plank', liftPlank(), { solid: 15 }).pic('folded', liftFolded());

  // A sandbag swings out and back for good; one that bumps Doc Leo drops away to the ring.
  for (const [name, out, speed] of SWINGS)
    b.add(name, {
      pics: [
        ['bag1', 4],
        ['bag2', 4],
      ],
      power: POWER.blocker - 3,
      path: [
        [-out, 0, speed],
        [0, 0, speed],
      ],
      becomes: 'bagDrop',
    });
  b.add('bagDrop', { pics: [['bag1', 4]], power: 0, path: [[0, 12, 8]], end: -1 });
  // a juggling pin, tossed back and forth over the catwalk (it beats a balloon dog)
  b.add('pin', {
    pics: [
      ['pin1', 2],
      ['pin2', 2],
    ],
    power: POWER.ride + 5,
    path: [
      [-PIN_TOSS, 0, 5],
      [0, 0, 5],
    ],
  });

  // The lift's two planks: up slowly a block, quickly, slowly the last block; down folded.
  const { rise, slow, fast, down } = LIFT;
  const up: [number, number, number][] = [
    [0, -1, slow],
    [0, -(rise - 1), fast],
    [0, -rise, slow],
  ];
  const ticks = (blocks: number, speed: number) => (blocks * 20) / speed + 1;
  const upTicks = ticks(1, slow) * 2 + ticks(rise - 2, fast);
  const downTicks = ticks(rise, down);
  b.add('liftA', {
    pics: [
      ['plank', upTicks],
      ['folded', downTicks],
    ],
    power: POWER.friend,
    path: [...up, [0, 0, down]],
  });
  // the other plank starts at the top, folded, on its way down
  b.add('liftB', {
    pics: [
      ['folded', downTicks],
      ['plank', upTicks],
    ],
    power: POWER.friend,
    path: [[0, rise, down], ...up.map(([x, y, s]) => [x, y + rise, s] as [number, number, number])],
  });

  // a pigeon roosting on the catwalk, pecking (it stays put until a SQUAWK sends it off)
  b.add('pigeon', {
    pics: [
      ['pigeon1', 6],
      ['pigeon2', 6],
    ],
    power: POWER.pest,
    becomes: 'pigeonFly',
    upscore: 25,
  });
  b.add('pigeonFly', {
    pics: [
      ['pigeonFly1', 2],
      ['pigeonFly2', 2],
    ],
    power: 0,
    path: [[5, -8, 8]],
    end: -1,
  });
  return b;
}
