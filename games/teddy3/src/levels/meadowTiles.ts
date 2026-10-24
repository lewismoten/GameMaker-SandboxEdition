// Level 13's background blocks, Firefly Meadow at night at the foot of Lookout Hill: the
// starry sky and the moon, the dark woods far off, the lawn, tall hedges with leafy arches
// through them, the brook (water that floats Teddy up and drifts him back to the near bank)
// and its stepping stones, the old oak with branches to climb, the hill itself with an old
// tunnel through it (where the paper lantern is), the Big Top glowing far up the hill, and
// the road where THE CHEZ waits.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { branch, c, dirt, grassTop, hedge, leaves, r, sky, trunk, tuft } from '../blocks/tiles';
import { bandAt, road, water, wideSign } from './common';
import { art } from './parts';

export const G = 40;
/** The top row of the hedges and of Lookout Hill. */
export const HEDGE = 34;

export function meadowTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  // stars (the glow ramp stays bright at night)
  for (let k = 0; k < 2; k++) {
    const p = sky(k);
    const R = rng(70 + k);
    for (let i = 0; i < 3; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('glow', 3));
    t.air(`star${k}`, p);
  }
  art(
    t,
    'moon',
    2,
    2,
    () => sky(0),
    (p) => {
      p.disc(20, 20, 13, c('glow', 3));
      p.disc(26, 16, 11, c('sky', 0));
      blob(p, 14, 22, 3, 2, [c('glow', 2)], 0, 0);
    },
  );
  t.wall('grass', grassTop(81));
  t.wall('dirt', dirt(82));
  t.wall('deep', dirt(83, true));
  // the dark woods far off, and the lawn in front of them
  const far = (top: boolean, seed: number) => {
    const p = top ? sky(3) : new Pixels(20, 20, c('leaf', 0));
    const R = rng(seed);
    for (let i = 0; i < 6; i++) blob(p, R() * 20, (top ? 14 : 5) + R() * 8, 5 + R() * 3, 5, [c('leaf', 0), c('leaf', 1)], 0, 1, 0.6);
    return p;
  };
  t.air('farTop', far(true, 84));
  t.air('far', far(false, 85));
  const lawn = tuft(new Pixels(20, 20, c('grass', 1)), 86);
  t.air('lawn', lawn);
  t.air('lawnFlower', tuft(new Pixels(20, 20, c('grass', 1)), 87, 'yellow'));
  t.wall('edge', hedge(false, 88));
  t.wall('edgeTop', hedge(true, 89, sky(bandAt(29, G))));

  // The hedges: too tall to hop, with a leafy arch at the bottom (dark inside).
  t.wall('hedge', hedge(false, 90));
  t.wall('hedgeTop', hedge(true, 91, sky(bandAt(HEDGE, G))));
  t.air(
    'arch',
    (() => {
      const p = new Pixels(20, 20, c('leaf', 0));
      for (let x = 0; x < 20; x++) p.set(x, 2 + Math.round(Math.sin(x / 3) * 2), c('leaf', 1));
      speckle(p, 0, 16, 20, 4, r('grass'), 0, 1, 92, 0.4);
      return p;
    })(),
  );

  // The brook and its stepping stones (fall in and it floats Teddy back to the near bank).
  t.air('brookTop', water(true, 1, lawn), { grav: GRAV.up | GRAV.left });
  t.air('brook', water(false, 2), { grav: GRAV.up | GRAV.left });
  t.wall(
    'brookBed',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('mud'), 0, 2, 93, 0.3);
      return p;
    })(),
  );
  t.wall(
    'stone',
    (() => {
      const p = water(false, 3);
      blob(p, 10, 8, 10, 8, r('stone'), 1, 3);
      p.rect(2, 0, 16, 2, c('stone', 3));
      return p;
    })(),
  );

  // The old oak: leaves, trunk, branches to climb (hop up through them).
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(94 + k, sky(k)));
  for (let k = 0; k < 4; k++) t.air(`trunk${k}`, trunk(sky(k)));
  t.air('trunkFar', trunk(t.pic('far')));
  t.air('trunkFarTop', trunk(t.pic('farTop')));
  t.air('trunkLawn', trunk(lawn));
  for (let k = 0; k < 4; k++) t.ledge(`branch${k}`, branch(sky(k)));
  for (let k = 0; k < 4; k++) t.ledge(`branchLeaf${k}`, branch(leaves(98 + k, sky(k))));
  t.ledge('branchFar', branch(t.pic('far')));
  t.ledge('branchTrunk', branch(trunk(sky(bandAt(36, G)))));

  // Lookout Hill: grassy top, earth, and the old tunnel through it.
  t.wall('hillTop', grassTop(102, sky(bandAt(HEDGE, G))));
  t.wall('hill', dirt(103));
  t.air(
    'tunnel',
    (() => {
      const p = new Pixels(20, 20, c('dirt', 0));
      speckle(p, 0, 0, 20, 4, r('dirt'), 0, 1, 104, 0.5);
      for (const x of [4, 13]) p.rect(x, 0, 1, 3 + (x % 3), c('wood', 1));
      return p;
    })(),
  );
  t.clue('lantern', 'lantern', 'tunnel');
  // the Big Top far up the hill, its lights glowing
  art(
    t,
    'bigTop',
    2,
    1,
    () => sky(bandAt(HEDGE - 1, G)),
    (p) => {
      for (let y = 4; y < 18; y++) {
        const half = 2 + (y - 4) * 1.2;
        for (let x = Math.round(20 - half); x < Math.round(20 + half); x++) p.set(x, y, Math.floor(x / 3) % 2 ? c('red', 1) : c('paint', 1));
      }
      p.rect(19, 0, 2, 5, c('ink', 0)).set(21, 0, c('yellow', 3));
      for (let x = 5; x < 36; x += 3) p.set(x, 17, c('glow', 3));
      p.rect(17, 12, 6, 6, c('glow', 2));
    },
  );
  // the road at the far side of the hill
  t.wall('road', road(false, 105));

  // Signs.
  for (const [name, words] of [
    ['Sniff', 'TOO DARK!\nS: SNIFF'],
    ['Follow', 'FOLLOW\nTHE LIGHT'],
    ['Up', 'UP THE\nOLD OAK'],
  ]) {
    const [l, rr] = wideSign(lawn, words);
    t.air(`sign${name}L`, l);
    t.air(`sign${name}R`, rr);
  }
  return t;
}
