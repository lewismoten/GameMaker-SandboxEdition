// Level 1's monsters: the house's pests (dust bunnies that roll at Teddy, a mouse in the
// kitchen, Doc Leo's wind-up chattering teeth, a spider in the basement), all beaten by a
// bark; toast the toaster pops (catch it for energy); and the scents only a sniff finds:
// treats in the couch, a bone under Gwinn's bed, the wobble ball under Doc Leo's bed, and
// Gwinn's pink collar in the laundry basket, where she slipped out of it.
import { sprite } from '../art/draw';
import { P } from '../art/pal';
import { CRITTERS } from '../sprites/critters';
import { TOYS } from '../sprites/toys';
import { CK, propSprite } from '../sprites/klown';
import { FLIP } from '../characters/mons';
import { CTR, POWER } from '../ids';
import { newBestiary } from './level';
import { pacer, popUp, scent } from './common';

const K: Record<string, number> = {
  ...CK,
  d: P.c('stone', 2),
  D: P.c('stone', 3),
  l: P.c('stone', 4),
  i: P.c('ink', 0),
  T: P.c('wood', 3),
  t: P.c('wood', 4),
  c: P.c('yellow', 2),
};
const S = (rows: string[], dx?: number, dy?: number) => sprite(rows, K, dx, dy);

/** Dust bunnies: grey fluff with two dot eyes, rolling. */
const bunny = (k: number) =>
  S(
    k
      ? ['....d.ddd....', '..ddDdDDdd...', '.dDDlDDDDDd..', 'dDDoDDDoDDDd.', 'dDDDDDDDDDDd.', '.dDDDlDDDDd..', '..ddDDDdd....']
      : ['...ddd.d.....', '..ddDDdDdd...', '.dDDDDlDDDd..', 'dDDoDDDoDDDd.', 'dDlDDDDDDDDd.', '.dDDDDDDlDd..', '...ddDdd.....'],
    undefined,
    13,
  );
/** Doc Leo's wind-up chattering teeth on their little feet. */
const teeth = (k: number) =>
  S(
    [
      '...........m.',
      '..oooooooo.mm',
      '.orrrrrrrro.m',
      'owwwwwwwwwwo.',
      k ? 'owowowowowo..' : 'oooooooooooo.',
      k ? '.o.o.o.o.o...' : 'owwwwwwwwwwo.',
      '.orrrrrrrro..',
      '..oooooooo...',
      '...yy..yy....',
      k ? '..yy....yy...' : '...yy..yy....',
    ],
    undefined,
    10,
  );
const spider = (k: number) =>
  S(
    [
      '.........i..........',
      '.........i..........',
      '.........i..........',
      '.........i..........',
      '.........i..........',
      k ? '...i...iiii...i.....' : '....i..iiii..i......',
      '....i.iiiiii.i......',
      '.....iiwiiwiii......',
      '....iiiiiiiiii......',
      k ? '...i.iiiiiiii.i.....' : '..i..iiiiiiii..i....',
      '..i...i....i...i....',
    ],
    0,
    0,
  );
const toast = (k: number) =>
  S(
    ['..tttttttt..', '.tTTTTTTTTt.', 'tTTccTTTTTTt', 'tTTTTTTccTTt', 'tTTTTTTTTTTt', k ? 'tTTTcTTTTTTt' : 'tTTTTTTTTTTt', 'tTTTTTTTTTTt', '.tttttttttt.'],
    undefined,
    6,
  );

export function houseBeasts() {
  const b = newBestiary();
  b.pic('bunny1', bunny(0), { hp: -3 }).pic('bunny2', bunny(1), { hp: -3 });
  b.pic('teeth1', teeth(0), { hp: -5 }).pic('teeth2', teeth(1), { hp: -5 });
  b.pic('spider1', spider(0), { hp: -5 }).pic('spider2', spider(1), { hp: -5 });
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('rat')) b.pic(name, px, { hp: -5 });
  b.pic('toast1', toast(0), { hp: 10, score: 25 }).pic('toast2', toast(1), { hp: 10, score: 25 });
  b.pic('collar', propSprite('collar'), { effect: CTR.clues, eamt: 1, score: 500 });
  b.pic('collarAir', propSprite('collar'));
  for (const [name, px] of Object.entries(TOYS))
    if (name.startsWith('wobble') || name.startsWith('ballAir')) b.pic(name, px, name.startsWith('wobble') ? { effect: CTR.lives, eamt: 1, score: 500 } : {});

  // Pests: a bark sends each one off (the dust bunnies blow away, the rest run).
  pacer(
    b,
    'bunny',
    [
      ['bunny1', 4],
      ['bunny2', 4],
    ],
    POWER.pest,
    3,
    'puff',
    1,
  );
  pacer(
    b,
    'mouse',
    [
      ['rat1', 2],
      ['rat2', 2],
    ],
    POWER.pest,
    5,
    'mouseRun',
    3,
  );
  b.add('mouseRun', {
    pics: [
      ['rat1', 1],
      ['rat2', 1],
    ],
    power: 0,
    path: [[-6, 0, 9, FLIP]],
    end: -1,
  });
  pacer(
    b,
    'teeth',
    [
      ['teeth1', 2],
      ['teeth2', 2],
    ],
    POWER.pest,
    4,
    'puff',
    2,
  );
  // The spider goes up and down its thread.
  b.add('spider', {
    pics: [
      ['spider1', 4],
      ['spider2', 4],
    ],
    power: POWER.pest,
    path: [
      [0, 2, 1],
      [0, 0, 1],
    ],
    becomes: 'puff',
    upscore: 25,
  });
  // Toast pops up out of the toaster and drops back in: catch it on the way.
  b.add('toast', {
    pics: [
      ['toast1', 3],
      ['toast2', 3],
    ],
    power: POWER.pickup,
    path: [
      [0, -3, 6],
      [0, 0, 3],
    ],
    end: -1,
  });

  // What the sniff finds.
  b.add('collar', { pics: [['collar', 50]], power: POWER.pickup });
  popUp(b, 'collarPop', 'collarAir', 'collar');
  b.add('wobble', {
    pics: [
      ['wobble1', 4],
      ['wobble2', 3],
      ['wobble3', 4],
      ['wobble4', 3],
    ],
    power: POWER.pickup,
  });
  popUp(b, 'wobblePop', 'ballAir1', 'wobble');
  scent(b, 'scentCollar', 'collarPop');
  scent(b, 'scentTreat', 'treatFall');
  scent(b, 'scentBone', 'bonePop');
  scent(b, 'scentBall', 'wobblePop');
  return b;
}
