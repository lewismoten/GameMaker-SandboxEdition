// Level 2's monsters: geese crossing Maple Street in no hurry (a peck stings; a HONK sends
// them flapping off the road).
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { CRITTERS } from '../sprites/critters';

export function mapleBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('goose')) b.pic(name, px, name === 'gooseRun' ? {} : { hp: -6 });
  pacer(
    b,
    'goose',
    [
      ['goose1', 6],
      ['goose2', 6],
    ],
    POWER.honk - 1,
    2,
    'gooseOff',
    1,
  );
  b.add('gooseOff', { pics: [['gooseRun', 2]], power: 0, path: [[4, -6, 7]], end: -1 });
  return b;
}
