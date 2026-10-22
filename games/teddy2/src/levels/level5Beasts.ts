// Level 5's monsters: hens and a rooster in the chicken yard (Gwinn thinks every one of them
// is Doc Leo's rubber chicken; a BOOF and they flap off), pigs in the wallow, bales of hay
// stacked across the loft (zoomies knock them flat), the goat at the pasture gate (it takes
// a BOOF to move a goat) and the rope on the gate (chew it), and crows round the scarecrow.
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { FARM } from '../sprites/farm';
import { NIGHT } from '../sprites/night';

export function farmBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(FARM)) {
    const solid = name === 'bale' ? { solid: 15 } : name.startsWith('goat') ? { solid: 15 } : {};
    const hp = name.startsWith('crow') ? { hp: -5 } : name.startsWith('rooster') ? { hp: -4 } : {};
    b.pic(name, px, { ...solid, ...hp });
  }
  for (const name of ['ropeKnot', 'ropeChewed'] as const) b.pic(name, NIGHT[name], name === 'ropeKnot' ? { solid: 15 } : {});
  for (const [name, w] of [
    ['hen', 3],
    ['henB', 2],
  ] as const)
    pacer(
      b,
      name,
      [
        ['hen1', 4],
        ['hen2', 4],
      ],
      POWER.pest,
      w,
      'henFlap',
      1,
    );
  b.add('henFlap', { pics: [['henFlap', 2]], power: 0, path: [[3, -4, 6]], end: -1 });
  pacer(
    b,
    'rooster',
    [
      ['rooster1', 8],
      ['rooster2', 8],
    ],
    POWER.pest,
    2,
    'henFlap',
    1,
  );
  b.add('pig', {
    pics: [
      ['pig1', 9],
      ['pig2', 9],
    ],
    power: POWER.friend,
    path: [
      [2, 0, 1],
      [0, 0, 1, FLIP],
    ],
  });
  b.add('bales', { pics: [['bale', 50]], power: POWER.zoom - 1, becomes: 'balesDown', upscore: 50 });
  b.add('balesDown', { pics: [['baleDown', 50]], power: 0, end: 80 });
  b.add('goat', {
    pics: [
      ['goat1', 12],
      ['goat2', 4],
    ],
    power: POWER.boof - 1,
    becomes: 'goatRun',
    upscore: 50,
  });
  b.add('goatRun', {
    pics: [
      ['goat1', 1],
      ['goat2', 1],
    ],
    power: 0,
    path: [[6, -2, 8]],
    end: -1,
  });
  b.add('rope', { pics: [['ropeKnot', 50]], power: POWER.rope, becomes: 'ropeChewed', upscore: 25 });
  b.add('ropeChewed', { pics: [['ropeChewed', 30]], power: 0, end: 30 });
  b.add('crow', {
    pics: [
      ['crow1', 3],
      ['crow2', 3],
    ],
    power: POWER.pest,
    path: [
      [-3, 2, 3, FLIP],
      [0, 0, 3],
    ],
    becomes: 'crowOff',
    upscore: 25,
  });
  b.add('crowOff', { pics: [['crow2', 2]], power: 0, path: [[4, -6, 8]], end: -1 });
  return b;
}
