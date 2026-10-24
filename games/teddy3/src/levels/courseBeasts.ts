// Level 16's monsters: the course's stations. Wind-up mice (WOOF), soft dirt at the fence's
// foot (dig), the see-saw (and the kid on its other end), the station door and its button,
// Professor Pratfall's practice pies (play dead), Honker's "SIT?" (sit pretty: a heart wins
// him over) and the turnstile (spin), and the last button, hidden in a wisp of scent (sniff it
// out), whose spark opens the flap into the dark ring for a few seconds.
import { Pixels } from '../../../kit/pixels';
import { over, sprite } from '../art/draw';
import { P } from '../art/pal';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer, scent } from './common';
import { CRITTERS } from '../sprites/critters';
import { askBubble, kid } from '../sprites/folks';
import { pie } from '../sprites/klubfolk';
import { doorOpen, doorShut, seesawEnd } from '../sprites/gadgets';
import { SPARK, wiredButton, wiredDoor } from './parts';

/** The see-saw's rise, in blocks. */
export const RISE = 3;

const K = { o: P.c('ink', 0), m: P.c('metal', 1), M: P.c('metal', 3), r: P.c('red', 2), R: P.c('red', 3), y: P.c('yellow', 3) };
const turnstile = (k: number) =>
  sprite(
    k
      ? [
          '....oo....',
          '...oMMo...',
          'ooooMMoooo',
          'oRRRMMRRRo',
          'ooooMMoooo',
          '...oMMo...',
          '...oMMo...',
          '...oMMo...',
          '...oMMo...',
          '..oMMMMo..',
          '..oooooo..',
        ]
      : [
          '....oo....',
          '...oMMo...',
          '...oMMo..o',
          '...oMMooRo',
          '...oMMoRo.',
          '..ooMMRo..',
          '.oRoMMo...',
          'oRo.MMo...',
          'o..oMMo...',
          '..oMMMMo..',
          '..oooooo..',
        ],
    K,
    undefined,
    7,
  );
/** The flap into the ring, shut (a red curtain to the floor) and pulled aside. */
const flap = (open: boolean) => {
  const p = new Pixels(20, 20, 255);
  if (open) {
    p.rect(0, 0, 4, 20, P.c('red', 1)).rect(0, 0, 1, 20, P.c('ink', 0));
    return p;
  }
  p.rect(0, 0, 20, 20, P.c('red', 1));
  for (let y = 0; y < 20; y += 10) p.rect(0, y, 20, 2, P.c('gold', 1));
  p.rect(0, 0, 2, 20, P.c('ink', 0)).rect(9, 0, 1, 20, P.c('red', 0));
  return p;
};

export function courseBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('rat')) b.pic(name, px, { hp: -6 }).pic(`${name}Run`, px);
  b.pic('pie1', pie(0), { hp: -8 }).pic('pie2', pie(1), { hp: -8 });
  b.pic('endR', seesawEnd(true), { solid: 15 });
  const kidEnd = new Pixels(20, 20, 255);
  over(kidEnd, kid('girl').crop(0, 0, 20, 14), 0, 0);
  over(kidEnd, seesawEnd().crop(0, 0, 20, 6), 0, 14);
  b.pic('endKid', kidEnd, { solid: 15 });
  b.pic('doorShut', doorShut(), { solid: 15 }).pic('doorOpen', doorOpen());
  b.pic('askSit1', askBubble('SIT?', undefined, 0)).pic('askSit2', askBubble('SIT?', undefined, 1));
  b.pic('yay', askBubble('YAY!', undefined, 0));
  // Honker's velvet rope across the course (it drops when he gets his SIT)
  const rope = (down: boolean) => {
    const p = new Pixels(20, 20, 255);
    p.rect(8, 4, 4, 16, P.c('gold', 2)).rect(7, 2, 6, 3, P.c('gold', 3));
    if (down) p.rect(10, 17, 10, 3, P.c('red', 2));
    else for (let x = 0; x < 20; x++) p.rect(x, 8 + Math.round(3 * Math.sin((x / 19) * Math.PI)), 1, 3, P.c('red', 2));
    return p;
  };
  b.pic('ropeShut', rope(false), { solid: 15 }).pic('ropeOpen', rope(true));
  b.pic('turn1', turnstile(0), { solid: 15 }).pic('turn2', turnstile(1), { solid: 15 }).pic('turnSpun', turnstile(1));
  b.pic('flapShut', flap(false), { solid: 15 }).pic('flapOpen', flap(true));

  // wind-up mice: a WOOF and they scamper off the course
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
  b.add('mouseRun', {
    pics: [
      ['rat1Run', 1],
      ['rat2Run', 1],
    ],
    power: 0,
    path: [[6, 0, 9]],
    end: -1,
  });
  // the see-saw: its riding end (starts high) and the kid's end (starts low), slow at the bottom
  b.add('saw', {
    pics: [['endR', 50]],
    power: POWER.friend,
    path: [
      [0, RISE - 1, 2],
      [0, RISE, 1],
      [0, RISE - 1, 1],
      [0, 0, 2],
    ],
  });
  b.add('sawKid', {
    pics: [['endKid', 50]],
    power: POWER.friend,
    path: [
      [0, -1, 1],
      [0, -RISE, 2],
      [0, -1, 2],
      [0, 0, 1],
    ],
  });
  // station 1: the door and its button
  wiredButton(b, 'btnDoor', [[1, 1]]);
  wiredDoor(b, 'door', 'doorShut', 'doorOpen');
  // station 6: a practice pie, thrown low across the course from the Professor's hand
  b.add('pie', {
    pics: [
      ['pie1', 2],
      ['pie2', 2],
    ],
    power: POWER.pest,
    path: [[-7, 0, 6]],
    end: -1,
  });
  // station 7: Honker asks for a SIT (a heart wins him over), and the turnstile (spin it)
  // (his "SIT?" hangs over the spot to sit on; won over, his YAY! drops the rope beside it)
  b.add('askSit', {
    pics: [
      ['askSit1', 8],
      ['askSit2', 8],
    ],
    power: POWER.sitAsk,
    becomes: 'yay',
    upscore: 100,
  });
  b.add('yay', {
    pics: [['yay', 30]],
    power: SPARK,
    path: [
      [0, 0, 1],
      [1, 1, 3],
    ],
    end: -1,
  });
  wiredDoor(b, 'rope', 'ropeShut', 'ropeOpen');
  b.add('turnstile', {
    pics: [
      ['turn1', 9],
      ['turn2', 9],
    ],
    power: POWER.spinAsk,
    becomes: 'turnSpun',
    upscore: 100,
  });
  b.add('turnSpun', { pics: [['turnSpun', 50]], power: POWER.friend, end: 0 });
  // the lift up to the high platform: it waits until Teddy hops on (a touch beats it), then
  // rises four blocks and stays up there
  b.pic(
    'lift',
    (() => {
      const p = new Pixels(20, 20, 255);
      p.rect(0, 0, 20, 5, P.c('gold', 2)).rect(0, 0, 20, 1, P.c('gold', 3)).rect(0, 5, 20, 1, P.c('ink', 0));
      p.rect(2, 6, 2, 14, P.c('metal', 1)).rect(16, 6, 2, 14, P.c('metal', 1));
      return p;
    })(),
    { solid: 15 },
  );
  b.add('liftIdle', { pics: [['lift', 50]], power: POWER.pest, becomes: 'liftUp' });
  b.add('liftUp', {
    pics: [['lift', 50]],
    power: POWER.friend,
    path: [
      [0, 0, 1],
      [0, -4, 2],
    ],
    end: -1,
    becomes: 'liftTop',
  });
  b.add('liftTop', { pics: [['lift', 50]], power: POWER.friend });
  // station 9: the last button, hidden in a wisp of scent: sniffed out, it rises to its
  // place on the post; its spark opens the flap for a few seconds (push it again if need be)
  wiredButton(b, 'btnFlap', [[4, 1]]);
  b.add('btnRise', {
    pics: [['button', 2]],
    power: POWER.friend,
    path: [
      [0, 0, 1],
      [0, -1, 2],
    ],
    end: -1,
    becomes: 'btnFlap',
  });
  scent(b, 'scentButton', 'btnRise');
  wiredDoor(b, 'flap', 'flapShut', 'flapOpen', { holdOpen: 70 });
  return b;
}
