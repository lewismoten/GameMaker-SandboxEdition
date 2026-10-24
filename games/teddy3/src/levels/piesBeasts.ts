// Level 10's monsters: the Klown Klub's practice pies (custard, thrown at head height: PRATFALL
// and they sail over; or skidding along the floor: hop them), each thrower's with its own
// reach and speed, and the pigeons after the crumbs (the rubber chicken's SQUAWK sends them
// off). A pie only stings a little, and it is gone once it lands.
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { CRITTERS } from '../sprites/critters';
import { pie } from '../sprites/klubfolk';
import { skidPie } from '../sprites/pies';

/** Each thrower's pie: [name, blocks it flies left, pixels a tick, at the feet?]. */
export const PIES: [string, number, number, boolean][] = [
  ['pieTeach', 13, 4, false],
  ['pieHigh', 8, 5, false],
  ['pieLow', 8, 5, true],
  ['pieVolley', 22, 6, false],
  ['pieVolley2', 13, 6, false],
];

export function piesBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -6 });
  b.pic('pie1', pie(0), { hp: -10 }).pic('pie2', pie(1), { hp: -10 });
  b.pic('skid1', skidPie(0), { hp: -10 }).pic('skid2', skidPie(1), { hp: -10 });
  for (const [name, reach, speed, low] of PIES)
    b.add(name, {
      pics: [
        [low ? 'skid1' : 'pie1', 2],
        [low ? 'skid2' : 'pie2', 2],
      ],
      power: POWER.pest,
      path: [[-reach, 0, speed]],
      end: -1,
    });
  pacer(
    b,
    'pigeon',
    [
      ['pigeon1', 5],
      ['pigeon2', 5],
    ],
    POWER.pest,
    2,
    'pigeonFly',
    1,
  );
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
