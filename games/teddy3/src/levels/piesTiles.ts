// Level 10's background blocks: the Clown Club's practice tent at the Fairgrounds, one
// afternoon. Red and cream canvas, a scalloped valance under the roof, a sawdust floor, the
// pie targets (well splatted), four Club members at pie practice (each one a loop of poses:
// the pie comes out of the block that shows the throw), the little stage, Professor
// Pratfall's bakery stall up on the balcony over it, the birthday cake, and the back flap
// out, which only opens for the cake.
import { Pixels } from '../../../kit/pixels';
import { blob, micro, speckle } from '../art/draw';
import { CTR } from '../ids';
import { GRAV, Tiles } from './level';
import { c, copy, r } from '../blocks/tiles';
import { sign, wideSign } from './common';
import { art } from './parts';
import { KLUB } from '../sprites/klubfolk';
import { leoOn } from '../sprites/leo';
import { cakeOn, thrower, type Pose, type Who } from '../sprites/pies';

export const G = 40;
/** The stage's floor row and the bakery balcony's over it. */
export const STAGE_ROW = 34;
export const BALCONY_ROW = 28;

/** The tent's canvas: red and cream stripes, with a fold line. */
export function canvasCloth(): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 10, 20, r('red'), 0, 1, 7, 0.08);
  speckle(p, 10, 0, 10, 20, r('peach'), 1, 1, 8, 0.08);
  p.rect(9, 0, 1, 20, c('red', 0)).rect(19, 0, 1, 20, c('peach', 0));
  return p;
}

/**
 * A pie thrower's poses, each `[pose, ticks]`, as blocks `<id><k>T` and `<id><k>B` (top and
 * bottom) that take turns in a loop. The level gives the throw poses their births.
 */
function throwerLoop(t: Tiles, id: string, who: Who, frames: [Pose, number][], base: Pixels): void {
  frames.forEach(([pose, ticks], k) => {
    const [top, bot] = leoOn(thrower(who, pose), base, base);
    const next = (k + 1) % frames.length;
    t.air(`${id}${k}T`, top, { next: `${id}${next}T`, ntime: ticks });
    t.air(`${id}${k}B`, bot, { next: `${id}${next}B`, ntime: ticks });
  });
}

/** The throwers' loops (ticks): one slow, one high-and-low, and two in volleys of three. */
export const LOOPS: Record<string, { who: Who; frames: [Pose, number][] }> = {
  teach: {
    who: 'twirly',
    frames: [
      ['ready', 30],
      ['up', 20],
      ['throw', 8],
    ],
  },
  test: {
    who: 'bubbles',
    frames: [
      ['ready', 14],
      ['up', 18],
      ['throw', 4],
      ['ready', 14],
      ['low', 18],
      ['lowThrow', 4],
    ],
  },
  volley: {
    who: 'honker',
    frames: [
      ['ready', 30],
      ['up', 18],
      ['throw', 36],
    ],
  },
  volley2: {
    who: 'juggles',
    frames: [
      ['ready', 30],
      ['up', 18],
      ['throw', 36],
    ],
  },
};

export function piesTiles(): Tiles {
  const t = new Tiles();
  const cloth = canvasCloth();
  t.air('tent', cloth);
  t.wall(
    'roof',
    (() => {
      const p = new Pixels(20, 20, c('red', 0));
      for (let y = 3; y < 20; y += 6) p.rect(0, y, 20, 1, c('red', 1));
      return p;
    })(),
  );
  // the valance under the roof: scallops in red and gold
  t.air(
    'valance',
    (() => {
      const p = copy(cloth);
      p.rect(0, 0, 20, 6, c('red', 2)).rect(0, 6, 20, 1, c('gold', 2));
      for (let x = 0; x < 20; x++) {
        const d = Math.round(4 * Math.sin(((x % 10) / 10) * Math.PI));
        p.rect(x, 7, 1, d, c('red', 2)).set(x, 7 + d, c('gold', 1));
      }
      return p;
    })(),
  );
  // a garland of pennants strung along the tent
  t.air(
    'garland',
    (() => {
      const p = copy(cloth);
      p.line(0, 2, 19, 2, c('ink', 1));
      for (let k = 0; k < 4; k++)
        for (let y = 0; y < 6; y++) p.rect(k * 5 + Math.floor(y / 2), 3 + y, 5 - Math.floor(y / 2) * 2, 1, c(['yellow', 'blue', 'green', 'paint'][k], 2));
      return p;
    })(),
  );
  t.wall(
    'pole',
    (() => {
      const p = new Pixels(20, 20, c('red', 1));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('red', 0));
      p.rect(8, 0, 4, 20, c('wood', 2)).rect(8, 0, 1, 20, c('wood', 3));
      return p;
    })(),
  );
  // the sawdust floor
  t.wall(
    'floor',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('hay'), 1, 2, 31, 0.3);
      p.rect(0, 0, 20, 1, c('hay', 3));
      return p;
    })(),
  );
  t.wall(
    'under',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('dirt'), 1, 1, 32, 0.2);
      return p;
    })(),
  );

  // a pie target, well splatted (scenery: the pies end their flight on it)
  art(
    t,
    'target',
    1,
    2,
    () => cloth,
    (p) => {
      p.rect(9, 20, 2, 20, c('wood', 1));
      p.rect(2, 4, 16, 18, c('wood', 3)).frame(2, 4, 16, 18, c('wood', 0));
      p.ring(10, 13, 6, c('red', 2)).ring(10, 13, 3, c('red', 2)).disc(10, 13, 1, c('red', 2));
      blob(p, 6, 9, 3, 2, r('cloud'), 1, 2);
      blob(p, 14, 17, 3, 2, r('cloud'), 1, 2);
      blob(p, 10, 34, 4, 2, r('cloud'), 1, 2);
    },
  );
  for (const [id, loop] of Object.entries(LOOPS)) throwerLoop(t, id, loop.who, loop.frames, cloth);

  // The little stage: its boards (stand on them, rise up through them) and the skirt under them.
  t.ledge(
    'stage',
    (() => {
      const p = copy(cloth);
      p.rect(0, 0, 20, 5, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 5, 20, 1, c('wood', 0));
      for (let x = 0; x < 20; x += 4) p.rect(x, 6, 2, 5, c('gold', x % 8 ? 2 : 1));
      return p;
    })(),
  );
  t.air(
    'stageLeg',
    (() => {
      const p = copy(cloth);
      p.rect(8, 0, 4, 20, c('wood', 1)).rect(8, 0, 1, 20, c('wood', 2));
      return p;
    })(),
  );
  // the bakery balcony over the stage's far end, on its posts
  t.ledge(
    'balcony',
    (() => {
      const p = copy(cloth);
      p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
      for (let x = 2; x < 20; x += 6) p.rect(x, 5, 3, 3, c('pink', 3));
      return p;
    })(),
  );
  // Professor Pratfall's bakery stall: a striped awning on two posts, the sign, the Professor.
  art(
    t,
    'stall',
    4,
    3,
    () => cloth,
    (p) => {
      for (let x = 0; x < 80; x++) p.rect(x, 4, 1, 8, c(Math.floor(x / 8) % 2 ? 'paint' : 'pink', 3));
      for (let x = 0; x < 80; x += 8) p.disc(x + 4, 12, 3, c(Math.floor(x / 8) % 2 ? 'paint' : 'pink', 3));
      p.rect(0, 3, 80, 1, c('ink', 0));
      p.rect(24, 5, 32, 7, c('paint', 3));
      micro(p, 29, 6, 'BAKERY', c('red', 1));
      p.rect(2, 12, 3, 48, c('wood', 2)).rect(75, 12, 3, 48, c('wood', 2));
      // the counter, with a pie and a loaf on it
      p.rect(2, 48, 76, 4, c('wood', 3)).rect(2, 52, 76, 8, c('wood', 1));
      blob(p, 16, 45, 5, 3, r('hay'), 1, 3);
      p.rect(58, 44, 9, 2, c('cloud', 2)).rect(57, 46, 11, 2, c('wood', 3));
    },
  );
  const [prof0, prof1] = leoOn(KLUB.pratfall.flipX(), cloth, cloth);
  t.air('profTop', prof0);
  t.air('profBot', prof1);
  t.add('cake', cakeOn(cloth), { obj: true, effect: CTR.clues, eamt: 1, score: 100, touch: 'tent', grav: GRAV.down });

  // The back flap out of the tent: it only opens for the cake.
  art(
    t,
    'flap',
    1,
    2,
    () => cloth,
    (p) => {
      p.rect(2, 2, 16, 38, c('red', 1)).frame(2, 2, 16, 38, c('ink', 0));
      p.line(10, 3, 10, 39, c('red', 0));
      p.rect(8, 22, 5, 2, c('gold', 2));
    },
    (_x, y) => (y ? 'wall' : 'air'),
  );
  t.air(
    'flapOpen',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(0, 0, 3, 20, c('red', 1)).rect(17, 0, 3, 20, c('red', 1));
      p.rect(3, 16, 14, 4, c('grass', 2));
      return p;
    })(),
  );
  t.def('flap01').effect = CTR.clues;
  t.def('flap01').eamt = -1;
  t.def('flap01').touch = 'flapOpen';
  t.def('flap01').score = 250;

  // signs
  const signs: [string, string][] = [
    ['signFlop', 'PIES? HOLD\n4: FLAT!'],
    ['signLow', 'HIGH: FLAT\nLOW: HOP'],
    ['signUp', 'THEN 1:\nBALLOON UP'],
  ];
  for (const [name, words] of signs) {
    const [a, b] = wideSign(cloth, words);
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  }
  t.air('signCake', sign(cloth, 'CAKE', 'right'));
  return t;
}
