// Level 9's monsters, the things in the ground Gwinn digs through: soft dirt (the shared
// plug: one big dig), hard clay (a big dig cracks it, a second one breaks it; a BOOF does
// nothing to it), tree roots across a tunnel (chew them: 1), moles pacing the tunnels (a
// BOOF sends one diving back into the dirt; bump one and it nips), and the old well's bucket,
// going up and down the well by itself: it waits a moment at the bottom, level with the step
// beside it or a little lower (walk on then), rides up to the top, bobs there (up, never down, so she can always
// step off into the tunnel's tall mouth), and goes back down. It never comes down on a row she can stand on (there is room under its low point).
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { cave, clay, mole, moleDive, roots, wellBucket } from '../sprites/burrow';

/** The bucket's low row is its start; it rides up this many blocks. */
export const WELL = { rise: 7 };

export function digBeasts() {
  const b = newBestiary();
  b.pic('mole1', mole(0), { hp: -6 }).pic('mole2', mole(1), { hp: -6 }).pic('moleDive', moleDive());
  b.pic('roots', roots(cave()), { solid: 15 });
  b.pic('clay', clay(false), { solid: 15 }).pic('clayCracked', clay(true), { solid: 15 });
  b.pic('bucket', wellBucket(), { solid: 15 });

  // Hard clay: only a big dig (122) beats it (121), and it takes two.
  b.add('clay', { pics: [['clay', 50]], power: POWER.boof, becomes: 'clayCracked', upscore: 10 });
  b.add('clayCracked', { pics: [['clayCracked', 50]], power: POWER.boof, becomes: 'puff', upscore: 15 });
  // Roots: a chew (118) gets through them (117).
  b.add('roots', { pics: [['roots', 50]], power: POWER.chomp - 1, becomes: 'puff', upscore: 25 });
  // Moles pace their tunnels; a BOOF sends one diving into the dirt.
  pacer(
    b,
    'mole',
    [
      ['mole1', 4],
      ['mole2', 4],
    ],
    POWER.pest,
    2,
    'moleOff',
    1,
  );
  b.add('moleOff', { pics: [['moleDive', 14]], power: 0, end: 14 });
  // The well bucket.
  const { rise } = WELL;
  b.add('bucket', {
    pics: [['bucket', 50]],
    power: POWER.friend,
    path: [
      [0, 1, 1],
      [0, 0, 1],
      [0, -rise, 8],
      [0, -rise - 1, 2],
      [0, -rise, 2],
      [0, 0, 10],
    ],
  });
  return b;
}
