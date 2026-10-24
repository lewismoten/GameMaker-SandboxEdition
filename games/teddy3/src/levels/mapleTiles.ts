// Level 2's background blocks, Maple Street on a spring morning, seen from the road at THE
// CHEZ's size: little clapboard houses in three colors with their porches, maples, picket
// fences, the sidewalk, the road with its chargers, speed bump, pothole and two hills, and
// at the top of the second hill, the gate of Puddlewick Park.
import { Pixels } from '../../../kit/pixels';
import { blob, speckle } from '../art/draw';
import { Tiles } from './level';
import { c, cloud, copy, dirt, grassTop, hedge, picket, r, sky } from '../blocks/tiles';
import { bandAt, sign, wideSign } from './common';
import { art } from './parts';
import { roadBlocks } from './roadParts';

/** The road's row: THE CHEZ drives on row 39. */
export const G = 40;

/** Sky over row y. */
export const skyAt = (y: number) => `sky${bandAt(y, G)}`;

export function mapleTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(1, part, 9));
  const low = sky(bandAt(39, G));
  const hi = sky(bandAt(38, G));
  t.wall('grass', grassTop(5));
  t.wall('dirt', dirt(6));
  t.wall('deep', dirt(8, true));
  t.air('hedgeTop', hedge(true, 31, sky(bandAt(29, G))));
  t.wall('hedgeWall', hedge(false, 33));
  roadBlocks(t, low, hi);

  // The sidewalk behind the road (the houses stand on it), and a picket fence along it.
  const walk = new Pixels(20, 20);
  speckle(walk, 0, 0, 20, 20, r('stone'), 2, 1, 21, 0.15);
  walk.rect(0, 0, 20, 1, c('stone', 4)).rect(9, 0, 1, 20, c('stone', 1));
  t.air('walk', walk);
  t.air('fence', picket(low, true));

  // The houses: 4x4, a shingled gable, clapboards, a door with a porch light, two windows.
  for (const [name, ramp, door] of [
    ['houseA', 'siding', 'red'],
    ['houseB', 'yellow', 'blue'],
    ['houseC', 'pink', 'green'],
  ] as const)
    art(
      t,
      name,
      4,
      4,
      (_bx, by) => sky(bandAt(35 + by, G)),
      (p) => {
        for (let y = 0; y < 34; y++) {
          const half = Math.min(40, 6 + y * 1.3);
          if (y < 30) for (let x = Math.floor(40 - half); x < 40 + half; x++) p.set(x, y + 2, (y + (x >> 2)) % 5 === 4 ? c('roof', 0) : c('roof', 2));
        }
        for (let y = 34; y < 80; y++) p.rect(1, y, 78, 1, c(ramp, (y + 2) % 5 === 4 ? 0 : (y + 2) % 5 === 0 ? 3 : 2));
        p.rect(2, 32, 76, 3, c('roof', 1));
        // the door, its light, the porch steps
        p.rect(34, 52, 12, 26, c(door, 1)).frame(34, 52, 12, 26, c('ink', 0)).set(43, 66, c('gold', 2));
        p.rect(30, 48, 3, 3, c('glow', 3));
        p.rect(30, 76, 20, 4, c('stone', 3)).rect(30, 76, 20, 1, c('stone', 4));
        for (const x of [12, 54]) {
          p.rect(x, 46, 14, 14, c('paint', 3))
            .rect(x + 2, 48, 10, 10, c('sky', 5))
            .rect(x + 6, 48, 2, 10, c('paint', 3))
            .rect(x + 2, 52, 10, 2, c('paint', 3));
        }
      },
    );

  // A maple, 2x3: a round crown on a trunk.
  art(
    t,
    'maple',
    2,
    3,
    (_bx, by) => sky(bandAt(36 + by, G)),
    (p) => {
      p.rect(17, 30, 6, 30, c('wood', 1)).rect(17, 30, 2, 30, c('wood', 2));
      for (const [x, y, rad] of [
        [12, 22, 11],
        [28, 20, 11],
        [20, 12, 12],
        [20, 26, 10],
      ])
        blob(p, x, y, rad, rad - 2, r('leaf'), 0, 3, 0.8);
    },
  );

  // A speed bump: a striped hump across the road (bump over it).
  const hump = copy(low);
  for (let x = 0; x < 20; x++) {
    const h = Math.round(9 * Math.sin((x / 19) * Math.PI));
    for (let y = 20 - h; y < 20; y++) hump.set(x, y, Math.floor(x / 4) % 2 ? c('yellow', 3) : c('ink', 0));
  }
  t.wall('hump', hump);

  // Puddlewick Park's gate: two stone posts and an iron arch with its name, 4x4.
  art(
    t,
    'gate',
    4,
    4,
    (_bx, by) => sky(bandAt(34 + by, G)),
    (p) => {
      for (const x of [2, 66]) p.rect(x, 20, 12, 60, c('stone', 2)).rect(x, 20, 12, 3, c('stone', 4)).frame(x, 20, 12, 60, c('stone', 0));
      for (let x = 14; x < 66; x++) {
        const y = 16 - Math.round(10 * Math.sin(((x - 14) / 52) * Math.PI));
        p.rect(x, y, 1, 2, c('ink', 0));
        if (x % 6 === 0) p.rect(x, y, 1, 22 - y, c('ink', 1));
      }
      p.rect(22, 12, 36, 10, c('green', 1)).frame(22, 12, 36, 10, c('ink', 0));
      for (let k = 0; k < 6; k++) p.rect(25 + k * 5, 15, 3, 4, c('paint', 3));
    },
  );
  t.air('parkGrass', grassTop(9, sky(3)));

  // Signs (over the sidewalk, the car drives in front of them).
  const [honkL, honkR] = wideSign(walk, 'HONK!\nSPACE');
  t.air('signHonkL', honkL);
  t.air('signHonkR', honkR);
  const [bumpL, bumpR] = wideSign(walk, 'BUMP!\nUP KEY');
  t.air('signBumpL', bumpL);
  t.air('signBumpR', bumpR);
  t.air('signPark', sign(low, 'PARK', 'right'));
  return t;
}
