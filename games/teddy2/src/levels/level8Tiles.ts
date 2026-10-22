// Level 8's background blocks: the Fair's show barn at night, the dog show. Bleachers full of
// people, banners, the agility course (an A-frame to climb, a tunnel, a hoop Teddy goes
// round: he retired from hoops), the popcorn stand (it pops popcorn across the ring now
// and then: a block giving birth), the judges' table, the Best Behaved ring, and the stage,
// whose curtain only opens for a blue ribbon.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, micro, speckle } from '../art/draw';
import { Tiles } from './level';
import { c, canvas, copy, cut, dirt, planks, r } from '../blocks/tiles';
import { sign } from './common';
import { CTR } from '../ids';
import { docLeo, halves } from '../sprites/people';

export const G = 40;

/** People on the bleachers, row after row. */
function crowd(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  const R = rng(seed);
  for (let row = 0; row < 2; row++) {
    p.rect(0, row * 10 + 8, 20, 2, c('wood', 3));
    for (let x = 1; x < 20; x += 5) {
      const shirt = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'][Math.floor(R() * 6)];
      p.rect(x, row * 10 + 3, 4, 5, c(shirt, 2));
      blob(p, x + 2, row * 10 + 2, 1.5, 1.5, r('skin'), 1, 3);
    }
  }
  return p;
}

export function showTiles(): Tiles {
  const t = new Tiles();
  const wall = planks(1, 'wood', 1);
  t.air('wall', wall);
  t.air('crowd', crowd(2));
  t.air('crowd2', crowd(3));
  t.air(
    'rafter',
    (() => {
      const p = new Pixels(20, 20, c('ink', 1));
      p.rect(0, 14, 20, 4, c('wood', 1)).line(0, 14, 19, 0, c('wood', 0));
      return p;
    })(),
  );
  // spotlights from the rafters
  for (const side of ['L', 'R'] as const)
    t.air(
      `spot${side}`,
      (() => {
        const p = new Pixels(20, 20, c('ink', 1));
        for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((side === 'L' ? x : 19 - x) <= y && (x + y) % 2 === 0) p.set(x, y, c('glow', 2));
        return p;
      })(),
    );
  t.air(
    'spotDown',
    (() => {
      const p = copy(t.pic('wall'));
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 2 === 0) p.set(x, y, c('glow', 1));
      return p;
    })(),
  );
  const banner = canvas(6, 1, () => wall);
  banner.rect(0, 3, 120, 14, c('blue', 1)).frame(0, 3, 120, 14, c('gold', 2));
  micro(banner, 10, 8, 'TRI-COUNTY FAIR DOG SHOW 1996', c('yellow', 3));
  const bc = cut(banner);
  for (let bx = 0; bx < 6; bx++) t.air(`banner${bx}`, bc[0][bx]);
  // the ring's floor: raked dirt; a low rail round the rings
  t.wall(
    'ring',
    (() => {
      const p = dirt(7);
      for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 1, c('dirt', 4));
      return p;
    })(),
  );
  t.wall('deep', dirt(5, true));
  t.air(
    'rail',
    (() => {
      const p = copy(wall);
      p.rect(0, 10, 20, 2, c('paint', 3)).rect(3, 12, 2, 8, c('paint', 2)).rect(15, 12, 2, 8, c('paint', 2));
      return p;
    })(),
  );
  // the A-frame: climb up one side, down the other (solid)
  for (const side of ['L', 'R', 'T'] as const)
    t.wall(
      `aframe${side}`,
      (() => {
        const p = copy(wall);
        for (let y = 0; y < 20; y++)
          for (let x = 0; x < 20; x++) {
            const inside = side === 'T' ? true : side === 'L' ? x >= 19 - y : x <= y;
            if (inside) p.set(x, y, (y >> 2) % 2 ? c('yellow', 2) : c('blue', 2));
          }
        return p;
      })(),
    );
  // the tunnel (its top is solid; Teddy goes through)
  t.wall(
    'tunnelTop',
    (() => {
      const p = copy(wall);
      p.rect(0, 6, 20, 14, c('red', 2));
      for (let x = 0; x < 20; x += 5) p.rect(x, 6, 1, 14, c('red', 0));
      return p;
    })(),
  );
  t.air(
    'tunnel',
    (() => {
      const p = new Pixels(20, 20, c('red', 0));
      p.rect(0, 0, 20, 3, c('red', 2));
      return p;
    })(),
  );
  // the hoop on its stand (Teddy goes round)
  const hoop = canvas(1, 2, () => wall);
  hoop.ring(10, 18, 8, c('red', 2));
  hoop.ring(10, 18, 7, c('paint', 3));
  hoop.rect(9, 26, 2, 14, c('metal', 2)).rect(4, 38, 12, 2, c('metal', 2));
  const hc = cut(hoop);
  t.air('hoopTop', hc[0][0]);
  t.air('hoopBot', hc[1][0]);
  t.air('signHoop', sign(wall, 'RETIRED'));
  // the popcorn stand
  const pop = canvas(1, 2, () => wall);
  pop.rect(2, 4, 16, 20, c('red', 2)).rect(4, 6, 12, 14, c('glow', 2));
  for (let i = 0; i < 9; i++) blob(pop, 5 + ((i * 3) % 10), 9 + ((i * 5) % 9), 1.5, 1.5, r('paint'), 2, 3);
  pop.rect(2, 24, 16, 16, c('red', 1));
  micro(pop, 3, 28, 'POP', c('yellow', 3));
  const pc = cut(pop);
  t.air('popTop', pc[0][0]);
  t.air('popBot', pc[1][0]);
  // the judges' table, the judge, the Best Behaved sign
  t.ledge(
    'table',
    (() => {
      const p = copy(wall);
      p.rect(0, 2, 20, 18, c('paint', 3)).rect(0, 2, 20, 2, c('fur', 0));
      p.rect(3, 6, 14, 2, c('blue', 2));
      return p;
    })(),
  );
  const judge = canvas(1, 2, () => wall);
  judge.rect(5, 6, 10, 10, c('skin', 3)).rect(4, 2, 12, 5, c('stone', 3));
  judge.set(7, 10, c('ink', 0)).set(12, 10, c('ink', 0)).rect(8, 13, 4, 1, c('ink', 0));
  judge.rect(3, 16, 14, 18, c('ink', 1)).rect(9, 16, 2, 10, c('red', 2));
  judge.rect(4, 34, 4, 6, c('ink', 0)).rect(12, 34, 4, 6, c('ink', 0));
  judge.rect(15, 18, 3, 2, c('paint', 3)).rect(16, 14, 2, 4, c('wood', 2));
  const jc = cut(judge);
  t.air('judgeTop', jc[0][0]);
  t.air('judgeBot', jc[1][0]);
  t.air('signBest', sign(wall, 'BEST BEHAVED'));
  // the stage, Doc Leo waiting on it, its curtain (opens only for a blue ribbon: the way out)
  t.ledge(
    'stage',
    (() => {
      const p = new Pixels(20, 20, c('wood', 2));
      p.rect(0, 0, 20, 3, c('wood', 4)).rect(0, 3, 20, 1, c('ink', 0));
      for (let y = 8; y < 20; y += 6) p.rect(0, y, 20, 1, c('wood', 0));
      return p;
    })(),
  );
  const curtain = (open: boolean) => {
    const p = new Pixels(20, 20, open ? c('ink', 0) : c('red', 1));
    if (!open) for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 20, c('red', 2));
    else p.rect(0, 0, 4, 20, c('red', 2)).rect(16, 0, 4, 20, c('red', 2));
    return p;
  };
  t.air('curtain', curtain(false));
  t.air('curtainOpen', curtain(true));
  t.wall('curtainDoor', curtain(false), { effect: CTR.clues, eamt: -1, touch: 'curtainOpen', score: 1000 });
  const [lt, lb] = halves(docLeo(undefined, true), curtain(false), curtain(false));
  t.air('leoTop', lt);
  t.air('leoBot', lb);
  t.air('signStage', sign(wall, 'STAGE'));
  t.wall('barnWall', planks(9, 'red', 1));
  void speckle;
  return t;
}
