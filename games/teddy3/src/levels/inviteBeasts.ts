// Level 4's monsters. Each friend's front door is two monsters: the bottom half (solid, with
// the doorbell on it) and the top half. A BOOF (121) beats the bottom half (120): DING-DONG!
// The ding floats up and beats the top half (150), which turns into the friend's "YES!" and
// floats off, and the doorway (background blocks) shows the friend holding out an RSVP card.
// Nothing but a BOOF (or a zoomies dash) rings a bell, and nothing a pest or a trick does can
// spoil the rest of it. Pigeons strut on the sidewalk and the fire escape: a BOOF sends one
// flying (and is used up on it), so the bell behind a pigeon takes a second BOOF. A goose
// minds the lot by the van (only a BOOF moves it).
import { CRITTERS } from '../sprites/critters';
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer } from './common';
import { Pixels } from '../../../kit/pixels';
import { micro } from '../art/draw';
import { bricks, c } from '../blocks/tiles';
import { bubble } from '../sprites/townfolk';

/** A shut door's half, over the shopfront's brick: green boards, a window, a knob, the bell. */
function doorHalf(top: boolean): Pixels {
  const p = bricks(11);
  p.rect(2, top ? 5 : 0, 16, top ? 15 : 20, c('wood', 1));
  p.rect(3, top ? 6 : 0, 14, top ? 14 : 20, c('green', 0));
  if (top) p.rect(5, 9, 10, 9, c('sky', 6)).line(7, 16, 12, 10, c('sky', 7));
  else {
    p.rect(5, 4, 10, 1, c('green', 1)).rect(5, 12, 10, 1, c('green', 1));
    p.rect(13, 6, 2, 2, c('gold', 2));
    // the doorbell: a brass plate on the frame with a white button
    p.rect(16, 2, 4, 9, c('gold', 2)).frame(16, 2, 4, 9, c('ink', 0)).rect(17, 5, 2, 2, c('paint', 3));
  }
  return p;
}

/** DING-DONG, rising (two pictures). */
function ding(k: number): Pixels {
  const p = new Pixels(20, 20, 255);
  micro(p, 2, 3 + k, 'DING', c('yellow', 3));
  micro(p, 2, 10 + k, 'DONG', c('yellow', 3));
  p.set(18, 2 + k * 2, c('yellow', 3)).set(17, 4, c('yellow', 2));
  return p;
}

export function inviteBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS))
    if (name.startsWith('pigeon') || name.startsWith('goose')) b.pic(name, px, name.startsWith('pigeonFly') || name === 'gooseRun' ? {} : { hp: -6 });
  b.pic('doorShutBot', doorHalf(false), { solid: 15 });
  b.pic('doorShutTop', doorHalf(true));
  b.pic('ding1', ding(0)).pic('ding2', ding(1));
  b.pic('yes', bubble(['YES!']));
  b.pic('yes2', bubble(['YES!', 'YAY!']));

  // A friend's door: BOOF the bell.
  b.add('bellDoor', { pics: [['doorShutBot', 50]], power: POWER.boof - 1, becomes: 'ding', upscore: 50 });
  b.add('ding', {
    pics: [
      ['ding1', 3],
      ['ding2', 3],
    ],
    power: POWER.friend - 40,
    path: [[0, -2, 2]],
    end: -1,
  });
  b.add('doorTop', { pics: [['doorShutTop', 50]], power: POWER.friend - 50, becomes: 'yes' });
  b.add('yes', {
    pics: [
      ['yes', 10],
      ['yes2', 10],
    ],
    power: POWER.friend,
    path: [[0, -2, 1]],
    end: -1,
  });

  // Pigeons strut back and forth; a BOOF sends them off over the rooftops.
  const pigeon = (name: string, w: number) =>
    b.add(name, {
      pics: [
        ['pigeon1', 5],
        ['pigeon2', 5],
      ],
      power: POWER.pest,
      path: [
        [w, 0, 1, 0],
        [0, 0, 1, FLIP],
      ],
      becomes: 'pigeonFly',
      upscore: 25,
    });
  pigeon('pigeon', 2);
  pigeon('pigeonShort', 1);
  b.add('pigeonFly', {
    pics: [
      ['pigeonFly1', 2],
      ['pigeonFly2', 2],
    ],
    power: 0,
    path: [[5, -8, 8]],
    end: -1,
  });
  // A goose minding the lot by the van: a BOOF sends it flapping off (and so does one peck:
  // it never pecks twice).
  pacer(
    b,
    'goose',
    [
      ['goose1', 6],
      ['goose2', 6],
    ],
    POWER.pest,
    3,
    'gooseOff',
    1,
  );
  b.add('gooseOff', { pics: [['gooseRun', 2]], power: 0, path: [[-7, -5, 7, FLIP]], end: -1 });
  return b;
}
