// The kitchen's blocks: the linoleum, the counters, the fridge and its cold soda, the toaster, the magnets of Mom's number, the phone, Teddy's bowl.
// Part of REMOTE.BBL (blocks.ts adds them after the living room's, in this order).
import { rng } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { SOLID } from '../../../snowbound/src/blocks/book';
import { DIGITS, DIGITS_NEEDED, MOMS_NUMBER, MON } from '../ids';
import { type Ctx, TOAST_EVERY } from './blocks';

export function kitchenBlocks(ctx: Ctx): void {
  const { book, P, R, c, ink, solid } = ctx;
  // ---------- the kitchen ----------
  // checkered linoleum, red and cream
  const lino = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? c('tile', 1) : c('tile', 3));
    const r = rng(seed);
    for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('tile', 2));
    return p;
  };
  book.add('lino', lino(21));
  // the backsplash (the kitchen's back wall): white tile and a strip of wallpaper
  const tileWall = P().rect(0, 0, 20, 20, c('white', 2));
  for (let k = 0; k < 20; k += 5) tileWall.rect(k, 6, 1, 14, c('white', 0)).rect(0, 6 + k, 20, 1, c('white', 0));
  tileWall.rect(0, 0, 20, 6, c('yellow', 1)).rect(0, 5, 20, 1, c('wood', 1));
  for (let x = 2; x < 20; x += 6) tileWall.set(x, 2, c('red', 2)).set(x + 1, 3, c('green', 1));
  book.add('tileWall', tileWall, solid);
  // the counter: laminate top and cabinet doors, and what sits on it
  const counter = (what?: 'sink' | 'toaster' | 'micro0' | 'micro1' | 'stove' | 'cereal' | 'drawer' | 'drawerOpen') => {
    const p = P().rect(0, 0, 20, 20, c('wood', 2));
    p.rect(0, 0, 20, 9, c('counter', 1)).rect(0, 8, 20, 1, c('counter', 0)).rect(0, 0, 20, 1, c('counter', 2));
    p.rect(1, 10, 8, 9, c('wood', 3)).rect(11, 10, 8, 9, c('wood', 3)).rect(7, 14, 1, 2, c('silver', 2)).rect(12, 14, 1, 2, c('silver', 2));
    if (what === 'sink') p.rect(3, 1, 14, 6, c('silver', 1)).rect(4, 2, 12, 4, c('silver', 0)).rect(9, 0, 2, 3, c('silver', 2));
    if (what === 'toaster') p.rect(4, 0, 12, 7, c('silver', 2)).rect(6, 1, 3, 2, ink).rect(11, 1, 3, 2, ink).rect(16, 3, 2, 1, ink);
    if (what === 'micro0' || what === 'micro1') {
      p.rect(1, 0, 18, 8, c('white', 1)).rect(2, 1, 11, 6, ink).rect(14, 1, 4, 3, c('ink', 1));
      if (what === 'micro0') micro(p, 3, 2, '12:0', c('led', 1));
    }
    if (what === 'stove')
      for (const [x, y] of [
        [5, 3],
        [14, 3],
      ])
        p.ring(x, y, 3, ink).ring(x, y, 1.5, c('crt', 1));
    if (what === 'cereal') p.rect(3, 0, 6, 8, c('yellow', 2)).rect(11, 1, 6, 7, c('blue', 2)).set(5, 3, c('red', 2)).set(13, 4, c('white', 2));
    if (what === 'drawer' || what === 'drawerOpen') {
      p.rect(1, 10, 18, 4, c('wood', 4)).rect(9, 11, 2, 1, c('silver', 2));
      if (what === 'drawerOpen') {
        p.rect(1, 10, 18, 9, c('wood', 1)).rect(2, 11, 16, 7, c('wood', 0));
        p.rect(3, 12, 5, 1, c('yellow', 2)).rect(9, 14, 6, 1, c('blue', 2)).disc(15, 12, 1.5, c('copper', 2)).rect(4, 15, 3, 2, c('red', 1));
      }
    }
    return p;
  };
  book.add('counter', counter(), solid);
  book.add('sink', counter('sink'), solid);
  book.add('toaster', counter('toaster'), { solid: SOLID, birthMon: MON.toast, birthTime: TOAST_EVERY });
  book.add('microwave', counter('micro0'), { solid: SOLID, next: 'microwave2', ntime: 18 });
  book.add('microwave2', counter('micro1'), { solid: SOLID, next: 'microwave', ntime: 18 });
  book.add('stove', counter('stove'), solid);
  book.add('cereal', counter('cereal'), solid);
  book.add('drawer', counter('drawer'), { solid: SOLID, score: 100, touch: 'drawerOpen' });
  book.add('drawerOpen', counter('drawerOpen'), solid);
  // the fridge: almond, two blocks tall, magnets, a crayon drawing; open it (who knows anymore?)
  const fridge = (part: 'top' | 'bottom', open: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('fridge', 2));
    p.rect(0, 0, 1, 20, c('fridge', 1)).rect(19, 0, 1, 20, c('fridge', 1));
    if (part === 'top') {
      p.rect(0, 0, 20, 2, c('fridge', 3)).rect(0, 18, 20, 2, c('fridge', 0)).rect(15, 6, 2, 8, c('silver', 2));
      if (open) p.rect(1, 2, 18, 16, c('screen', 3)).rect(2, 4, 7, 5, c('white', 2)).rect(10, 9, 6, 6, c('blue', 1)).rect(2, 12, 6, 4, c('pink', 2));
      else p.rect(3, 5, 8, 9, c('white', 2)).line(4, 12, 7, 7, c('red', 2)).line(7, 7, 10, 12, c('blue', 2)).disc(7, 6, 1, c('yellow', 2));
    } else {
      p.rect(15, 3, 2, 10, c('silver', 2)).rect(0, 18, 20, 2, c('ink', 1));
      if (open) {
        p.rect(1, 0, 18, 18, c('screen', 3));
        for (const y of [5, 11]) p.rect(1, y, 18, 1, c('silver', 2));
        p.rect(3, 1, 3, 4, c('red', 2))
          .rect(7, 2, 3, 3, c('green', 2))
          .rect(12, 6, 5, 5, c('white', 1))
          .rect(3, 12, 5, 5, c('yellow', 2))
          .rect(11, 13, 2, 4, c('blue', 2));
      } else {
        for (const [x, y, k] of [
          [3, 3, 'red'],
          [8, 9, 'blue'],
          [4, 13, 'green'],
        ] as const)
          p.rect(x, y, 3, 3, c(k, 2));
      }
    }
    return p;
  };
  book.add('fridgeTop', fridge('top', false), { solid: SOLID, score: 50, touch: 'freezerOpen' });
  book.add('freezerOpen', fridge('top', true), solid);
  book.add('fridge', fridge('bottom', false), { solid: SOLID, hp: 25, score: 50, touch: 'fridgeOpen' });
  book.add('fridgeOpen', fridge('bottom', true), solid);
  // the kitchen table and its chairs
  const ktable = lino(22);
  ktable.rect(1, 2, 18, 15, c('wood', 3)).rect(1, 16, 18, 2, c('wood', 1)).rect(1, 2, 18, 1, c('wood', 4));
  blob(ktable, 7, 9, 3, 2.4, R('white'), 1, 2);
  ktable.rect(12, 6, 4, 6, c('blue', 2)).rect(12, 6, 4, 1, c('white', 2));
  book.add('ktable', ktable, solid);
  const kchair = lino(23);
  kchair.rect(4, 4, 12, 12, c('wood', 2)).rect(4, 4, 12, 3, c('wood', 1)).rect(4, 15, 12, 1, c('wood', 0));
  book.add('kchair', kchair, solid);
  // Teddy's bowl, the trash can, a puddle of spilled milk
  const bowl = lino(24);
  blob(bowl, 10, 11, 6, 4, R('red'), 1, 3);
  blob(bowl, 10, 10, 4, 2.4, R('wood'), 1, 2);
  micro(bowl, 5, 13, 'TED', c('white', 2));
  // it's Teddy's: touch it and he grumbles (points off), and it's licked clean
  book.add('bowl', bowl, { solid: SOLID, score: -5, touch: 'bowlClean' });
  const clean = lino(24);
  blob(clean, 10, 11, 6, 4, R('red'), 1, 3);
  blob(clean, 10, 10, 4, 2.4, R('silver'), 1, 2);
  micro(clean, 5, 13, 'TED', c('white', 2));
  book.add('bowlClean', clean, solid);
  const trash = lino(25);
  trash.rect(4, 2, 12, 16, c('silver', 1)).rect(4, 2, 12, 3, c('silver', 2)).rect(8, 0, 4, 2, c('silver', 0));
  trash.rect(6, 7, 1, 9, c('silver', 0)).rect(10, 7, 1, 9, c('silver', 0)).rect(13, 7, 1, 9, c('silver', 0));
  book.add('trash', trash, solid);
  const milk = lino(26);
  blob(milk, 9, 11, 7, 4, R('white'), 1, 2);
  blob(milk, 15, 7, 3, 2, R('white'), 1, 2);
  book.add('milk', milk);
  // a slice of cold pizza on a plate: patience
  const pizza = lino(27);
  pizza.disc(10, 10, 7, c('white', 2));
  for (let y = 5; y < 15; y++) pizza.rect(10 - (y - 5) / 2, y, y - 5 + 1, 1, c('yellow', 2));
  pizza.disc(9, 11, 1.2, c('red', 2)).disc(11, 13, 1.2, c('red', 2)).rect(5, 14, 10, 2, c('orange', 1));
  book.add('pizza', pizza, { hp: 20, score: 25, touch: 'lino' });
  // Mom's number on fridge magnets (counter 21)
  for (const d of [...new Set(MOMS_NUMBER)]) {
    const p = lino(30 + Number(d));
    p.rect(4, 3, 12, 14, c(['red', 'blue', 'green', 'yellow', 'purple', 'orange'][Number(d) % 6], 2));
    p.rect(4, 3, 12, 1, c('white', 2)).rect(4, 16, 12, 1, ink);
    micro(p, 6, 6, d, c('white', 2), 2);
    book.add(`magnet${d}`, p, { effect: DIGITS, eamt: 1, score: 25, touch: 'lino' });
  }
  // the phone: a beige wall phone with a long curly cord. It dials all seven digits ("Called my
  // mom..."), and you're on the line.
  const phone = (off: boolean) => {
    const p = tileWall.crop(0, 0, 20, 20);
    p.rect(5, 6, 10, 12, c('fridge', 1)).rect(5, 6, 10, 1, c('fridge', 3));
    for (let k = 0; k < 9; k++) p.rect(7 + (k % 3) * 2, 11 + Math.floor(k / 3) * 2, 1, 1, c('crt', 1));
    if (!off) p.rect(4, 3, 4, 15, c('fridge', 2)).rect(4, 3, 4, 1, c('fridge', 3));
    else {
      p.rect(7, 18, 3, 2, c('fridge', 0));
      micro(p, 12, 0, 'MA', c('red', 1));
    }
    for (let y = 16; y < 20; y++) p.set(5 + ((y * 3) % 4), y, c('fridge', 0));
    if (!off) micro(p, 12, 1, String(DIGITS_NEEDED), c('red', 1));
    return p;
  };
  book.add('phone', phone(false), { solid: SOLID, effect: DIGITS, eamt: -DIGITS_NEEDED, score: 500, touch: 'phoneDone' });
  book.add('phoneDone', phone(true));
}
