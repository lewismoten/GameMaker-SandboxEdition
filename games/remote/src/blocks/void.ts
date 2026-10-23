// The void between the cushions' blocks: the solid nothing, the Bermuda swirl, the lost things, the fake remotes and the pay TV.
// Part of REMOTE.BBL (blocks.ts adds them after the living room's, in this order).
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { SOLID } from '../../../snowbound/src/blocks/book';
import { MONEY, PENNIES_NEEDED } from '../ids';
import { type Ctx, type LivingRoom } from './blocks';

export function voidBlocks(ctx: Ctx, lr: LivingRoom): void {
  const { book, P, R, c, ink, solid } = ctx;
  const { penny } = lr;
  // ---------- the void between the cushions ----------
  const deep = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sky'), 0, 2, 0.3 + Math.sin((x + seed * 3) / 5 + y / 7) * 0.25, x, y));
    const r = rng(seed);
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('star', i % 2));
    return p;
  };
  book.add('void', deep(40), solid);
  book.add('void2', deep(41), solid);
  // a lost thing floating far off in the void (scenery, solid): a sock, a key, a crayon
  const far = (k: number) => {
    const p = deep(42 + k);
    if (k === 0) p.rect(7, 5, 4, 7, c('red', 1)).rect(7, 11, 7, 3, c('red', 1)).rect(7, 5, 4, 1, c('white', 1));
    if (k === 1) p.disc(7, 8, 3, c('gold', 0)).rect(9, 8, 8, 2, c('gold', 0)).rect(14, 10, 1, 2, c('gold', 0));
    if (k === 2) p.rect(4, 10, 12, 3, c('blue', 1)).rect(15, 10, 3, 3, c('blue', 0));
    return p;
  };
  for (const k of [0, 1, 2]) book.add(`far${k}`, far(k), solid);
  // the couch fabric you walk on in there: rose and teal, worn
  const fabric = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (x % 9 === 4 && y % 8 === 3) || (x % 9 === 0 && y % 8 === 7) ? c('flora', 2) : c('couch', (x + y + seed) % 7 === 0 ? 1 : 2));
    const r = rng(seed);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('couch', 3));
    return p;
  };
  book.add('fabric', fabric(44));
  book.add('fabric2', fabric(45));
  // a Bermuda swirl on the path: it stings as you step through it, and closes
  const swirl = (f: number) => {
    const p = deep(46);
    for (let t = 0; t < 60; t++) {
      const a = t * 0.35 + f * 1.4;
      const rr = t / 7;
      p.set(10 + Math.cos(a) * rr, 10 + Math.sin(a) * rr, c('purple', 3 - Math.floor(t / 20)));
    }
    return p;
  };
  book.add('swirl0', swirl(0), { hp: -8, touch: 'fabric2', next: 'swirl1', ntime: 3 });
  book.add('swirl1', swirl(1), { hp: -8, touch: 'fabric2', next: 'swirl0', ntime: 3 });
  // lost things: points (and a few red herrings)
  const lost = (what: string, draw: (p: Pixels) => void, score: number) => {
    const p = fabric(50 + book.index.size);
    draw(p);
    book.add(what, p, { score, touch: 'fabric' });
  };
  lost('pen', (p) => p.line(4, 15, 15, 4, c('blue', 1)).line(5, 15, 16, 4, c('blue', 2)).set(15, 4, c('white', 2)).set(4, 16, ink), 50);
  lost('spoon', (p) => (blob(p, 6, 6, 3, 2.4, R('silver'), 1, 2), p.line(8, 8, 16, 16, c('silver', 2))), 100);
  lost('xmasSock', (p) => {
    p.rect(6, 2, 7, 9, c('red', 2)).rect(6, 10, 10, 6, c('red', 2)).rect(6, 2, 7, 3, c('white', 2));
    p.set(9, 7, c('green', 2)).set(11, 12, c('green', 2)).set(8, 13, c('gold', 2));
  }, 250);
  lost('pog', (p) => {
    p.disc(10, 10, 6, c('yellow', 2)).ring(10, 10, 6, c('red', 1));
    for (let a = 0; a < 6.28; a += 0.8) p.line(10, 10, 10 + Math.cos(a) * 5, 10 + Math.sin(a) * 5, c('red', 2));
    p.disc(10, 10, 2, c('blue', 2));
  }, 25);
  lost('guide', (p) => {
    p.rect(4, 3, 12, 15, c('white', 2)).rect(4, 3, 12, 4, c('red', 2));
    micro(p, 6, 4, 'TV', c('white', 2));
    p.rect(6, 9, 8, 1, ink).rect(6, 11, 6, 1, ink).rect(6, 13, 8, 1, ink);
  }, 150);
  lost('crumb', (p) => {
    p.line(4, 10, 16, 10, c('gold', 1)).line(10, 4, 10, 16, c('gold', 1));
    blob(p, 10, 10, 3, 2.6, R('wood'), 3, 4, 1.2);
  }, 77);
  // fake remotes: a calculator, the garage door opener, a handheld game. NOPE.
  const fake = (name: string, draw: (p: Pixels) => void) => {
    const p = fabric(60 + book.index.size);
    draw(p);
    book.add(name, p, { score: 10, touch: 'nope' });
  };
  fake('calc', (p) => {
    p.rect(5, 2, 10, 16, c('crt', 0)).rect(6, 3, 8, 4, c('led', 0));
    for (let k = 0; k < 9; k++) p.rect(6 + (k % 3) * 3, 8 + Math.floor(k / 3) * 3, 2, 2, c('crt', 2));
  });
  fake('opener', (p) => {
    p.rect(5, 5, 10, 10, c('crt', 1)).rect(5, 5, 10, 2, c('crt', 2)).disc(10, 11, 2.4, c('red', 2));
  });
  fake('handheld', (p) => {
    p.rect(5, 1, 11, 18, c('crt', 3)).rect(7, 3, 7, 6, c('crt', 0)).rect(8, 4, 5, 4, c('green', 0));
    p.rect(7, 12, 3, 1, ink).rect(8, 11, 1, 3, ink).disc(13, 13, 1, c('purple', 2)).disc(14, 11, 1, c('purple', 2));
  });
  const nope = fabric(70);
  micro(nope, 3, 7, 'NOPE', c('red', 3));
  book.add('nope', nope);
  // a candy bar (patience) and pennies lying on the fabric
  const candy = fabric(71);
  candy.rect(4, 7, 12, 6, c('wood', 0)).rect(4, 7, 4, 6, c('red', 2)).rect(12, 7, 4, 6, c('red', 2));
  book.add('candy', candy, { hp: 20, score: 10, touch: 'fabric' });
  book.add('pennyF', penny(() => fabric(72)), { effect: MONEY, eamt: 1, score: 5, touch: 'fabric' });
  // the pay TV: an old coin-op set floating in the void (insert ten pennies), and it warms up
  const payTv = (on: boolean) => {
    const p = fabric(73);
    p.rect(1, 1, 18, 17, c('crt', 1)).rect(1, 1, 18, 1, c('crt', 3));
    p.rect(3, 3, 11, 9, on ? c('screen', 2) : c('crt', 0));
    if (on) for (let y = 4; y < 11; y += 2) p.rect(4, y, 9, 1, c('screen', 3));
    p.rect(15, 4, 2, 4, ink).rect(15, 4, 2, 1, c('silver', 2));
    micro(p, 3, 13, on ? 'ON' : `${PENNIES_NEEDED}C`, on ? c('led', 1) : c('copper', 3));
    return p;
  };
  book.add('payTv', payTv(false), { solid: SOLID, effect: MONEY, eamt: -PENNIES_NEEDED, score: 1000, touch: 'payTvOn' });
  book.add('payTvOn', payTv(true));
  // a sign in the void
  const sign = deep(74);
  sign.rect(1, 4, 18, 11, c('wood', 3)).rect(1, 4, 18, 1, c('wood', 4)).rect(9, 15, 2, 5, c('wood', 1));
  micro(sign, 2, 5, 'LOST', ink);
  micro(sign, 2, 10, '&FND', ink);
  book.add('sign', sign, solid);

}
