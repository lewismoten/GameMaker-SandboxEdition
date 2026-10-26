// Level 5's monsters: pigeons on the sidewalk (a bark sends them up over the roofs), a mouse
// in the bakery after the crumbs (bark it off), and the trays of cookies riding the belts out
// of the oven and the chutes (catch one for a treat; the ones nobody catches go off the end).
import { CRITTERS } from '../sprites/critters';
import { CTR, POWER } from '../ids';
import { FLIP } from '../characters/mons';
import { newBestiary } from './level';
import { pacer } from './common';
import { cookieTray } from '../sprites/bakery';

/** How far the trays ride: out of the oven along the teaching belt, and down a chute and along. */
export const TRAY = { oven: 8, chute: 3, speed: 2 };

export function bakeryBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) {
    if (name.startsWith('rat')) b.pic(name, px, { hp: -5 }).pic(`${name}Run`, px);
    if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -5 });
  }
  for (const ph of [0, 1]) b.pic(`tray${ph}`, cookieTray(ph), { effect: CTR.treats, eamt: 1, score: 10 });

  b.add('pigeon', {
    pics: [
      ['pigeon1', 5],
      ['pigeon2', 5],
    ],
    power: POWER.pest,
    path: [
      [2, 0, 1, 0],
      [0, 0, 1, FLIP],
    ],
    becomes: 'pigeonFly',
    upscore: 25,
  });
  b.add('pigeonFly', {
    pics: [
      ['pigeonFly1', 2],
      ['pigeonFly2', 2],
    ],
    power: 0,
    path: [[5, -8, 8]],
    end: -1,
  });
  pacer(
    b,
    'mouse',
    [
      ['rat1', 2],
      ['rat2', 2],
    ],
    POWER.pest,
    2,
    'mouseRun',
    2,
  );
  // the one on the baker's rack, by the bone
  pacer(
    b,
    'rackMouse',
    [
      ['rat1', 2],
      ['rat2', 2],
    ],
    POWER.pest,
    1,
    'mouseRun',
    1,
  );
  // scared off, it scampers away up the wall and into a crack
  b.add('mouseRun', {
    pics: [
      ['rat1Run', 1],
      ['rat2Run', 1],
    ],
    power: 0,
    path: [[0, -6, 9]],
    end: -1,
  });

  const tray = (name: string, path: [number, number, number][]) =>
    b.add(name, {
      pics: [
        ['tray0', 6],
        ['tray1', 6],
      ],
      power: POWER.pickup,
      path,
      end: -1,
    });
  tray('trayOven', [[TRAY.oven, 0, TRAY.speed]]);
  tray('trayChute', [
    [0, 1, 2],
    [-TRAY.chute, 1, TRAY.speed],
  ]);
  return b;
}
