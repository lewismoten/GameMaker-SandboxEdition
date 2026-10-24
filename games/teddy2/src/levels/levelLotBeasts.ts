// The back lot's monsters: two geese loose from the poultry barn, pacing the path and in
// charge of it (a peck stings; only a BOOF moves a goose, and off it flaps), and Professor
// Pratfall's practice pies, flying low across the path from his hand now and then (flop,
// and they sail over).
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { CRITTERS } from '../sprites/critters';
import { pie } from '../sprites/klubfolk';

export function lotBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('goose')) b.pic(name, px, name === 'gooseRun' ? {} : { hp: -6 });
  b.pic('pie1', pie(0), { hp: -8 }).pic('pie2', pie(1), { hp: -8 });
  for (const [name, w] of [
    ['goose', 3],
    ['gooseB', 2],
  ] as const)
    pacer(
      b,
      name,
      [
        ['goose1', 6],
        ['goose2', 6],
      ],
      POWER.boof - 1,
      w,
      'gooseOff',
      1,
    );
  b.add('gooseOff', { pics: [['gooseRun', 2]], power: 0, path: [[-7, -5, 7, FLIP]], end: -1 });
  // a practice pie, thrown low across the path toward the target board
  b.add('pie', {
    pics: [
      ['pie1', 2],
      ['pie2', 2],
    ],
    power: POWER.pest,
    path: [[-8, 0, 6]],
    end: -1,
  });
  return b;
}
