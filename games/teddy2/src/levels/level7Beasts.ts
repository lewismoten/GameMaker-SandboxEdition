// Level 7's monsters. Tickets come from tricks: ring the High Striker's bell (climb its pegs,
// high five), sit pretty for Bubbles at the ring toss, spin for Twirly at the wheel; a scent
// under the bleachers hides one more. THE BIG DROP's car rides up its tower slowly and drops
// fast. The carousel's horses go up and down (stand on one for a lift to the canopy). Bees
// at the root beer stand.
import { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { newBestiary } from './level';
import { pacer, popUp, scent } from './common';
import { FX } from '../sprites/fx';
import { askBubble } from '../sprites/folks';
import { bell } from '../sprites/townfolk';

const c = (n: string, k: number) => P.c(n, k);

/** A carousel horse on its pole, its back the thing to stand on (solid). */
function horse(col: string): Pixels {
  const K = { o: c('ink', 0), w: c('paint', 3), W: c('paint', 2), g: c('gold', 2), r: c(col, 2), y: c('yellow', 3) };
  return sprite(
    ['.........g..........', '.........g..........', 'oooooooooooooooo....', 'owwwwwwwwwwwwwwwoo..', 'owwwrrrrrwwwwwwwwwo.', '.owwwwwwwwwwwwwwwwwo', '..owwwwwwwwwwwo.owo.', '..owo.ow.owo.wo.oo..', '..oo..oo..oo..oo....', '.........g..........'],
    K,
    0,
    0,
  );
}

/** THE BIG DROP's car: a ring of seats around the tower. */
function dropCar(): Pixels {
  const K = { o: c('ink', 0), r: c('red', 2), R: c('red', 3), y: c('yellow', 3), m: c('metal', 2) };
  return sprite(['oooooooooooooooooooo', 'oRRRRRRRRRRRRRRRRRRo', 'orrrrrrrrrrrrrrrrrro', 'oyoyoyoyoyoyoyoyoyoo', 'oooooooooooooooooooo', '.m.m.m.m.m.m.m.m.m..'], K, 0, 0);
}

const bee = (k: number) => sprite(k ? ['.ww.ww.', '..www..', '.yoyoy.', 'yoyoyo.', '.yoyo..'] : ['.......', 'wwwwww.', '.yoyoy.', 'yoyoyo.', '.yoyo..'], { w: c('paint', 3), y: c('yellow', 3), o: c('ink', 0) }, 7, 8);

export function midwayBeasts() {
  const b = newBestiary();
  for (let k = 0; k < 3; k++) b.pic(`bell${k}`, bell(k));
  b.pic('askSit1', askBubble('SIT?', undefined, 0)).pic('askSit2', askBubble('SIT?', undefined, 1));
  b.pic('askSpin1', askBubble('SPIN?', undefined, 0)).pic('askSpin2', askBubble('SPIN?', undefined, 1));
  b.pic('horseR', horse('blue'), { solid: 15 }).pic('horseB', horse('purple'), { solid: 15 });
  b.pic('dropCar', dropCar(), { solid: 15 });
  b.pic('bee1', bee(0), { hp: -4 }).pic('bee2', bee(1), { hp: -4 });

  b.add('strikerBell', { pics: [['bell0', 50]], power: POWER.paw - 1, becomes: 'strikerRing', upscore: 100 });
  b.add('strikerRing', {
    pics: [
      ['bell1', 2],
      ['bell2', 2],
      ['bell1', 2],
      ['bell2', 2],
    ],
    power: 0,
    end: 8,
    becomes: 'ticketFall',
  });
  b.add('askSit', {
    pics: [
      ['askSit1', 8],
      ['askSit2', 8],
    ],
    power: POWER.sitAsk,
    becomes: 'ticketFall',
    upscore: 100,
  });
  b.add('askSpin', {
    pics: [
      ['askSpin1', 8],
      ['askSpin2', 8],
    ],
    power: POWER.spinAsk,
    becomes: 'ticket',
    upscore: 100,
  });
  for (const [name, pic, dy] of [
    ['horse1', 'horseR', -2],
    ['horse2', 'horseB', 2],
  ] as const)
    b.add(name, {
      pics: [[pic, 50]],
      power: POWER.friend,
      path: [
        [0, dy, 1],
        [0, 0, 1],
      ],
    });
  b.add('dropCar', {
    pics: [['dropCar', 50]],
    power: POWER.friend,
    // up slowly, a pause at the top, then the big drop; a pause at the bottom
    path: [
      [0, -21, 2],
      [0, -20, 1],
      [0, -21, 1],
      [0, 0, 7],
      [0, -1, 1],
      [0, 0, 1],
    ],
  });
  pacer(
    b,
    'bee',
    [
      ['bee1', 1],
      ['bee2', 1],
    ],
    POWER.pest,
    2,
    'puff',
    2,
  );
  b.pic('ticketAir', FX.ticket1);
  popUp(b, 'ticketPop', 'ticketAir', 'ticket');
  scent(b, 'scentTicket', 'ticketPop');
  void FLIP;
  return b;
}
