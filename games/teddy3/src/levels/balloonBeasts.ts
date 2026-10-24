// Level 6's monsters: pigeons strutting in the hall (the rubber chicken's SQUAWK sends them
// off) and Juggles' juggling pins, tossed across the shaft up to the loft now and then: a pin
// pops a balloon dog (and bonks Doc Leo).
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { CRITTERS } from '../sprites/critters';
import { pin } from '../sprites/folks';

export function balloonBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -5 });
  b.pic('pin1', pin(0), { hp: -5 }).pic('pin2', pin(1), { hp: -5 });
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
  // a juggling pin, tossed right across the shaft (it beats a balloon dog)
  b.add('pin', {
    pics: [
      ['pin1', 2],
      ['pin2', 2],
    ],
    power: POWER.ride + 5,
    path: [[7, 0, 5]],
    end: -1,
  });
  return b;
}
