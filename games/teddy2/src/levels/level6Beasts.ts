// Level 6's monsters: in the corn maze, scents that a sniff turns into paw-print arrows
// (Gwinn went this way), the corn dog stick she left at the heart of the maze (sniff it out),
// field mice in the rows and crows over the corn.
import { Pixels } from '../../../kit/pixels';
import { P } from '../art/pal';
import { CRITTERS } from '../sprites/critters';
import { FARM } from '../sprites/farm';
import { FLIP } from '../characters/mons';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { pacer, popUp, scent } from './common';
import { propSprite } from '../sprites/klown';

/** Gwinn's paw prints making an arrow (which way she went). */
function pawArrow(dir: 'up' | 'down' | 'left' | 'right'): Pixels {
  const ink = P.c('gwinn', 1);
  const p = new Pixels(20, 20, 255);
  const paw = (x: number, y: number) =>
    p
      .rect(x, y + 1, 3, 2, ink)
      .set(x - 1, y, ink)
      .set(x + 1, y - 1, ink)
      .set(x + 3, y, ink);
  const pts: [number, number][] =
    dir === 'right'
      ? [
          [2, 12],
          [7, 9],
          [12, 12],
          [16, 9],
        ]
      : dir === 'left'
        ? [
            [16, 12],
            [11, 9],
            [6, 12],
            [2, 9],
          ]
        : dir === 'up'
          ? [
              [8, 17],
              [11, 12],
              [8, 7],
              [11, 2],
            ]
          : [
              [8, 2],
              [11, 7],
              [8, 12],
              [11, 17],
            ];
  for (const [x, y] of pts) paw(x, y);
  return p;
}

export function mazeBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('rat')) b.pic(name, px, { hp: -8 });
  for (const name of ['crow1', 'crow2'] as const) b.pic(name, FARM[name], { hp: -8 });
  for (const d of ['up', 'down', 'left', 'right'] as const) b.pic(`paws_${d}`, pawArrow(d));
  b.pic('stick', propSprite('stick'), { effect: CTR.clues, eamt: 1, score: 500 });
  b.pic('stickAir', propSprite('stick'));
  for (const d of ['up', 'down', 'left', 'right'] as const) {
    b.add(`paws_${d}`, { pics: [[`paws_${d}`, 50]], power: POWER.friend });
    scent(b, `scent_${d}`, `paws_${d}`);
  }
  b.add('stick', { pics: [['stick', 50]], power: POWER.pickup });
  popUp(b, 'stickPop', 'stickAir', 'stick');
  scent(b, 'scentStick', 'stickPop');
  scent(b, 'scentBone', 'bonePop');
  scent(b, 'scentPoodle', 'poodle');
  pacer(
    b,
    'mouse',
    [
      ['rat1', 2],
      ['rat2', 2],
    ],
    POWER.pest,
    4,
    'puff',
    2,
  );
  b.add('crow', {
    pics: [
      ['crow1', 3],
      ['crow2', 3],
    ],
    power: POWER.pest,
    path: [
      [-4, 1, 3, FLIP],
      [0, 0, 3],
    ],
    becomes: 'puff',
    upscore: 25,
  });
  return b;
}
