// Level 7's background blocks, the Tri-County Fair's midway at sunset: the gate arch, the
// High Striker tower (pegs to climb; its bell is a monster), the Klown Klub's booths with
// striped awnings (each run by a friend from the Big Show), the carousel, THE BIG DROP
// (a lattice tower 24 blocks tall; its ticket gate takes three tickets, the way Game-Maker
// refuses a touch the counter can't pay for), the food row, and the show barn.
import { Pixels } from '../../../kit/pixels';
import { blob, klubArt, micro, speckle } from '../art/draw';
import { Tiles } from './level';
import { c, canvas, cloud, copy, cut, dirt, r, sky } from '../blocks/tiles';
import { sign } from './common';
import { KLUB } from '../sprites/klubfolk';
import { halves } from '../sprites/people';
import { rootBeer } from '../sprites/toys';
import { CTR } from '../ids';

export const G = 40;
export const bandRow = (y: number) => (y <= 25 ? 0 : y <= 31 ? 1 : y <= 36 ? 2 : 3);
export const skyAt = (y: number) => `sky${bandRow(y)}`;

export function midwayTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(1, part, 17));
  // the midway: trampled grass and sawdust
  t.wall(
    'sawdust',
    (() => {
      const p = dirt(4);
      speckle(p, 0, 0, 20, 4, r('hay'), 2, 1, 41, 0.4);
      return p;
    })(),
  );
  t.wall('deep', dirt(5, true));
  // strings of lights across the midway (two pictures taking turns: they twinkle)
  for (const ph of [0, 1])
    t.air(
      `lights${ph}`,
      (() => {
        const p = sky(bandRow(33));
        for (let x = 0; x < 20; x++) p.set(x, 4 + Math.round(Math.sin((x / 20) * Math.PI) * 3), c('ink', 1));
        for (let i = 0; i < 4; i++) {
          const x = 2 + i * 5;
          const y = 5 + Math.round(Math.sin((x / 20) * Math.PI) * 3);
          p.rect(x, y, 2, 2, c(['red', 'yellow', 'blue', 'green'][(i + ph) % 4], 3));
        }
        return p;
      })(),
      { next: `lights${1 - ph}`, ntime: 9 },
    );

  // The gate arch: TRI-COUNTY FAIR, two posts and a sign across.
  const arch = canvas(5, 2, (_bx, by) => sky(bandRow(38 + by)));
  arch.rect(2, 4, 6, 36, c('red', 2)).rect(92, 4, 6, 36, c('red', 2));
  arch.rect(0, 2, 100, 14, c('yellow', 2)).frame(0, 2, 100, 14, c('red', 1));
  micro(arch, 14, 7, 'TRI-COUNTY FAIR', c('red', 1));
  const ac = cut(arch);
  for (let bx = 0; bx < 5; bx++) for (let by = 0; by < 2; by++) t.air(`arch${bx}${by}`, ac[by][bx]);

  // The High Striker: a tall pole with a scale, pegs to stand on, the bell at the top.
  // (the pole and the tower below cross several sky bands: one picture over each band, by
  // the map row's band; the canvases are drawn over the sky of the rows they stand on)
  for (let k = 1; k < 4; k++) {
    t.air(
      `striker${k}`,
      (() => {
        const p = sky(k);
        p.rect(7, 0, 6, 20, c('paint', 3)).rect(9, 0, 2, 20, c('red', 2));
        for (let y = 2; y < 20; y += 5) p.rect(7, y, 6, 1, c('ink', 1));
        return p;
      })(),
    );
    t.ledge(
      `peg${k}`,
      (() => {
        const p = copy(t.pic(`striker${k}`));
        p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('ink', 0));
        return p;
      })(),
    );
  }
  t.air(
    'strikerBase',
    (() => {
      const p = sky(3);
      p.rect(7, 0, 6, 12, c('paint', 3)).rect(9, 0, 2, 12, c('red', 2));
      p.rect(2, 12, 16, 8, c('wood', 2)).rect(2, 12, 16, 2, c('wood', 4));
      micro(p, 4, 15, 'RING', c('yellow', 3));
      return p;
    })(),
  );

  // Booths: a striped awning on posts, a counter with prizes.
  const booth = (name: string, col: string, words: string) => {
    const b = canvas(3, 3, (_bx, by) => sky(bandRow(37 + by)));
    for (let x = 0; x < 60; x++) b.rect(x, 4, 1, 10, (x >> 3) % 2 ? c('paint', 3) : c(col, 2));
    for (let x = 0; x < 60; x += 8) blob(b, x + 4, 14, 4, 3, (x >> 3) % 2 ? [c('paint', 2), c('paint', 3)] : [c(col, 1), c(col, 2)], 0, 1);
    b.rect(2, 14, 3, 46, c('wood', 1)).rect(55, 14, 3, 46, c('wood', 1));
    b.rect(0, 44, 60, 16, c(col, 1)).rect(0, 44, 60, 2, c(col, 3));
    micro(b, 30 - Math.floor((words.length * 4 - 1) / 2), 50, klubArt(words), c('paint', 3));
    // prizes on the shelf: plush corgis and pink pit-lab plushies
    for (const [x, k] of [
      [8, 'corgi'],
      [18, 'gwinn'],
      [40, 'corgi'],
      [50, 'pink'],
    ] as [number, string][])
      blob(b, x, 26, 4, 4, r(k), 1, 4);
    b.rect(4, 32, 52, 2, c('wood', 2));
    const bc = cut(b);
    for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) t.air(`${name}${bx}${by}`, bc[by][bx]);
  };
  booth('toss', 'blue', 'RING TOSS');
  booth('wheel', 'green', 'SPIN TO WIN');
  booth('food', 'red', 'CORN DOGS');
  // the Klown Klub's people running them
  const fig = (name: string, px: Pixels) => {
    const [a, b] = halves(px, sky(3), sky(3));
    t.air(`${name}Top`, a);
    t.air(`${name}Bot`, b);
  };
  fig('honker', KLUB.honker);
  fig('bubbles', KLUB.bubbles);
  fig('twirly', KLUB.twirly);
  fig('pratfall', KLUB.pratfall);

  // The carousel: a striped canopy (its roof is a ledge) on a center pole.
  const car = canvas(5, 4, (_bx, by) => sky(bandRow(36 + by)));
  for (let y = 0; y < 22; y++) {
    const half = 8 + y * 2;
    for (let x = 50 - half; x < 50 + half; x++) car.set(x, 4 + y, Math.floor((x + 200) / 10) % 2 ? c('red', 2) : c('yellow', 2));
  }
  car.rect(0, 26, 100, 4, c('gold', 1));
  for (let x = 3; x < 100; x += 8) car.rect(x, 27, 3, 2, c('glow', 3));
  car.rect(48, 30, 4, 50, c('gold', 2));
  for (const x of [8, 92]) car.rect(x, 30, 2, 50, c('gold', 1));
  car.rect(0, 76, 100, 4, c('wood', 2));
  const cc = cut(car);
  for (let bx = 0; bx < 5; bx++) for (let by = 0; by < 4; by++) t.add(`carousel${bx}${by}`, cc[by][bx], by === 1 ? { solid: 1 } : {});

  // THE BIG DROP: a lattice tower, its sign, the deck at the top, the ticket gate.
  for (let k = 0; k < 4; k++) {
    t.air(
      `lattice${k}`,
      (() => {
        const p = sky(k);
        p.rect(0, 0, 2, 20, c('metal', 2)).rect(18, 0, 2, 20, c('metal', 2));
        for (let y = 0; y < 20; y += 10) p.line(2, y, 17, y + 9, c('metal', 1)).line(17, y, 2, y + 9, c('metal', 1));
        return p;
      })(),
    );
    t.wall(
      `latticeWall${k}`,
      (() => {
        const p = sky(k);
        p.rect(0, 0, 2, 20, c('metal', 2)).rect(18, 0, 2, 20, c('metal', 2));
        for (let y = 0; y < 20; y += 5) p.rect(2, y, 16, 2, c('metal', 1));
        return p;
      })(),
    );
    t.air(
      `track${k}`,
      (() => {
        const p = sky(k);
        p.rect(8, 0, 4, 20, c('metal', 3)).rect(9, 0, 2, 20, c('metal', 1));
        return p;
      })(),
    );
  }
  t.ledge(
    'deck',
    (() => {
      const p = sky(0);
      p.rect(0, 0, 20, 4, c('metal', 3)).rect(0, 4, 20, 1, c('ink', 0));
      for (let x = 2; x < 20; x += 5) p.rect(x, 5, 1, 6, c('metal', 1));
      return p;
    })(),
  );
  t.air(
    'rail',
    (() => {
      const p = sky(0);
      p.rect(0, 10, 20, 2, c('metal', 3));
      for (let x = 2; x < 20; x += 5) p.rect(x, 12, 1, 8, c('metal', 2));
      return p;
    })(),
  );
  const dropSign = canvas(3, 1, () => sky(0));
  dropSign.rect(1, 2, 58, 16, c('red', 1)).frame(1, 2, 58, 16, c('yellow', 3));
  micro(dropSign, 8, 7, 'THE BIG DROP', c('yellow', 3));
  const dc = cut(dropSign);
  for (let bx = 0; bx < 3; bx++) t.air(`dropSign${bx}`, dc[0][bx]);
  t.air('gateOpen', (() => {
    const p = sky(3);
    p.rect(0, 0, 3, 20, c('metal', 2)).rect(17, 0, 3, 20, c('metal', 2));
    return p;
  })());
  t.wall(
    'gate',
    (() => {
      const p = copy(t.pic('gateOpen'));
      p.rect(3, 8, 14, 3, c('metal', 3)).rect(3, 14, 14, 3, c('metal', 3));
      micro(p, 4, 1, '3', c('yellow', 3));
      return p;
    })(),
    { effect: CTR.tickets, eamt: -3, touch: 'gateOpen', score: 100 },
  );
  t.air(
    'sign3',
    (() => {
      // '3 TIX' is one letter too wide for a sign plate: the 3 and TIX a little closer
      const p = sign(sky(3), '');
      micro(p, 2, 5, '3', c('ink', 0));
      micro(p, 7, 5, 'TIX', c('ink', 0));
      return p;
    })(),
  );

  // The food row: the root beer stand (Doc Leo's favorite), a picnic bench.
  t.air(
    'rootBeer',
    (() => {
      const p = sky(3);
      p.rect(0, 8, 20, 12, c('wood', 2)).rect(0, 8, 20, 2, c('wood', 4));
      p.blit(rootBeer(0), 0, -6, 255);
      return p;
    })(),
  );
  t.air('signRoot', sign(sky(3), 'ROOT BEER'));

  // The show barn (the dog show is inside) and its open door; THE CHEZ waits outside.
  t.air(
    'barn',
    (() => {
      const p = new Pixels(20, 20, c('red', 1));
      for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 20, c('red', 0));
      return p;
    })(),
  );
  t.air(
    'barnRoof',
    (() => {
      const p = sky(1);
      p.rect(0, 10, 20, 10, c('roof', 2)).rect(0, 10, 20, 2, c('paint', 3));
      return p;
    })(),
  );
  const show = canvas(3, 1, () => t.pic('barn'));
  show.rect(1, 3, 58, 14, c('paint', 3)).frame(1, 3, 58, 14, c('ink', 0));
  micro(show, 8, 8, 'DOG SHOW', c('blue', 1));
  const sc = cut(show);
  for (let bx = 0; bx < 3; bx++) t.air(`showSign${bx}`, sc[0][bx]);
  t.wall('hedgeWall', (() => {
    const p = new Pixels(20, 20, c('leaf', 1));
    for (let i = 0; i < 6; i++) blob(p, (i * 7) % 20, (i * 5) % 20, 4, 4, r('leaf'), 0, 3);
    return p;
  })());
  return t;
}
