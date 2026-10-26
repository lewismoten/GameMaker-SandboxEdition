// Level 13's monsters: sleepy fireflies dozing in the grass (a sniff wakes one), the woken
// fireflies (each glows along its own way and off into the sky, and the dark melts wherever
// it goes), patches of the deep dark that Teddy won't walk into (nothing of his beats them;
// only a firefly's light does), and a raccoon up in the old oak, pacing its branch.
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { NIGHT } from '../sprites/night';
import { deepDark, fireflyLight, sleepy } from '../sprites/meadow';

/** The deep dark is above every trick of Teddy's; a firefly's light is above the dark. */
export const DARK = 140;
export const LIGHT = 145;

/** Each firefly's way, as corners from where it dozed (the last one is off into the sky). */
export const FLIGHTS: Record<string, [number, number, number][]> = {
  A: [
    [5, 0, 4],
    [12, -9, 5],
  ],
  B: [
    [5, 0, 4],
    [9, -4, 4],
    [14, -10, 5],
  ],
  C: [
    [4, 0, 4],
    [10, -9, 5],
  ],
  D: [
    [0, 6, 6],
    [17, 6, 8],
    [24, -3, 6],
  ],
};

export function meadowBeasts() {
  const b = newBestiary();
  b.pic('sleepy1', sleepy(0)).pic('sleepy2', sleepy(1));
  b.pic('light1', fireflyLight(0)).pic('light2', fireflyLight(1));
  b.pic('dark1', deepDark(0), { solid: 15 }).pic('dark2', deepDark(2), { solid: 15 });
  for (const [name, px] of Object.entries(NIGHT)) if (name.startsWith('raccoon')) b.pic(name, px, name === 'raccoonRun' ? {} : { hp: -5 });

  for (const [k, path] of Object.entries(FLIGHTS)) {
    b.add(`fly${k}`, {
      pics: [
        ['light1', 3],
        ['light2', 3],
      ],
      power: LIGHT,
      path,
      end: -1,
    });
    b.add(`sleep${k}`, {
      pics: [
        ['sleepy1', 9],
        ['sleepy2', 9],
      ],
      power: POWER.scent,
      becomes: `fly${k}`,
      upscore: 25,
    });
  }
  b.add('dark', {
    pics: [
      ['dark1', 10],
      ['dark2', 10],
    ],
    power: DARK,
    becomes: 'puff',
    upscore: 25,
  });
  pacer(
    b,
    'raccoon',
    [
      ['raccoon1', 4],
      ['raccoon2', 4],
    ],
    POWER.pest,
    2,
    'raccoonRun',
    2,
  );
  b.add('raccoonRun', { pics: [['raccoonRun', 2]], power: 0, path: [[6, -3, 9, FLIP]], end: -1 });
  return b;
}
