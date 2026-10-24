// SNOW.MBL: two frames each of everything that moves on its own: snowballs (theirs and
// yours) and the poof they leave, Biscuit the dog, Pete the bully (walking, and strolling off),
// the plow and cars (two blocks each, rear and front), shopping carts, other sledders and
// the cardinal.
import { Pixels } from '../../../kit/pixels';
import { blob, sprite } from '../art/draw';
import type { Pal } from '../art/pal';
import { BODY_FRONT, BODY_SIDE, HEAD_DOWN, HEAD_SIDE, LEGS_A, LEGS_B, LEGS_SIDE_A, LEGS_SIDE_B, T, keyFor, kidPic, makeBook } from './kidArt';

// ---------------------------------------------------------------- monster blocks
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const snow = pal.r('snow');
  const hurtBy = (hp: number) => ({ chHitPt: hp });
  /**
   * A one-pixel rim of pale snow around a sprite's edge: on a daytime street it melts into
   * the snow, but on LaVale's dark lot at night it keeps Biscuit, Pete and the carts in view.
   */
  const rim = (src: Pixels) => {
    const p = new Pixels(src.w, src.h, T);
    p.px.set(src.px);
    const solid = (x: number, y: number) => {
      const v = src.get(x, y);
      return v !== T && v !== -1;
    };
    return p.map((x, y, v) => (v === T && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) ? c('snow', 4) : v));
  };

  // Snowballs: theirs hurt (packed hard, gray with grit from the plow banks), yours don't
  // touch you (bright white, with a red thread from your mitten), so the two read apart.
  const ball = (spin: number, mine: boolean) => {
    const p = new Pixels(20, 20, T);
    blob(p, 10, 14, 3, 1, pal.r('ink'), 0, 1);
    p.disc(10, 10, 4.4, c('ink', mine ? 1 : 0));
    blob(p, 10, 10, 3.6, 3.6, snow, mine ? 3 : 1, mine ? 6 : 4);
    p.set(9 + spin, 8, c('snow', 6));
    if (mine) p.set(11 - spin, 11, c('coat', 3)).set(12 - spin, 11 + spin, c('coat', 2));
    else p.set(11 - spin, 11, c('asphalt', 1)).set(8 + spin, 12, c('asphalt', 2));
    return p;
  };
  book.add('ball0', ball(0, false), hurtBy(-5));
  book.add('ball1', ball(1, false), hurtBy(-5));
  book.add('myBall0', ball(0, true));
  book.add('myBall1', ball(1, true));
  const poof = (r: number) => {
    const p = new Pixels(20, 20, T);
    for (let a = 0; a < 8; a++) {
      const x = 10 + Math.cos(a * 0.8) * r;
      const y = 10 + Math.sin(a * 0.8) * r;
      blob(p, x, y, 1.8, 1.8, snow, 4, 6);
    }
    return p;
  };
  book.add('poof0', poof(3));
  book.add('poof1', poof(6));

  // Biscuit, the dog that wants to play.
  const dogKey = keyFor(pal);
  const DOG = [
    '............kk',
    '...........kDdk',
    '..........kdddddkk',
    '..k.......kddkdddddn',
    '.kdk......kddddddtk',
    '..kdk....krrrrdddk',
    '...kdkkkkkddddddk',
    '...kddddddddddddk',
    '...kdlddddddddddk',
    '...kdllllllldddk',
  ];
  dogKey.r = c('coat', 3);
  const dog = (legs: string[]) => rim(sprite([...DOG, ...legs], dogKey, 20, 20, 0, 20 - DOG.length - legs.length));
  book.add('dog0', dog(['...kddkkkkkkkddk', '...kdk......kdk', '...kk.......kk']), hurtBy(-8));
  book.add('dog1', dog(['...kddkkkkkkkddk', '..kdk........kdk', '.kk..........kk']), hurtBy(-8));
  book.add('dogRun0', dog(['...kddkkkkkkkddk', '...kdk......kdk', '...kk.......kk']));
  book.add('dogRun1', dog(['...kddkkkkkkkddk', '..kdk........kdk', '.kk..........kk']));

  // Big Pete, the bully: green coat, blue beanie, no shovel.
  const bk = keyFor(pal, 'bully');
  const pete = (legs: string[]) => rim(kidPic([...HEAD_DOWN, ...BODY_FRONT, ...legs], bk));
  book.add('bully0', pete(LEGS_A), hurtBy(-10));
  book.add('bully1', pete(LEGS_B), hurtBy(-10));
  const run = (legs: string[]) => rim(kidPic([...HEAD_SIDE, ...BODY_SIDE, ...legs], bk));
  book.add('bullyRun0', run(LEGS_SIDE_A));
  book.add('bullyRun1', run(LEGS_SIDE_B));

  // Snowplows and cars: two blocks each, drawn facing right (rear | front).
  const vehicle = (body: string, front: boolean, frame: number, plow: boolean) => {
    const p = new Pixels(20, 20, T);
    const k = c('ink', 0);
    const b = (s: number) => c(body, s);
    if (!front) {
      if (plow) {
        p.rect(0, 4, 20, 10, k).rect(1, 5, 18, 8, b(2)).rect(1, 5, 18, 2, b(3)).rect(1, 11, 18, 2, b(1));
        for (let x = 3; x < 18; x += 5) p.rect(x, 7, 1, 4, b(1));
        blob(p, 10, 4, 9, 2, snow, 3, 6);
        p.rect(0, 13, 20, 2, k);
      } else {
        p.rect(0, 8, 20, 6, k).rect(1, 9, 19, 4, b(2)).rect(1, 9, 19, 1, b(3));
        p.rect(8, 4, 12, 5, k).rect(9, 5, 11, 4, c('ice', 2)).rect(13, 5, 1, 4, k);
        p.rect(0, 10, 2, 2, c('coat', 3));
        blob(p, 14, 4, 6, 1.4, snow, 4, 6);
      }
      for (const x of [5, 15]) {
        blob(p, x, 16, 3.4, 3.4, pal.r('ink'), 0, 1);
        p.rect(x - 1, 15, 2, 2, c('grey', 3 + ((frame + x) % 2)));
      }
    } else {
      if (plow) {
        p.rect(0, 2, 11, 12, k).rect(1, 3, 9, 10, b(2)).rect(1, 3, 9, 2, b(3));
        p.rect(4, 4, 6, 5, c('ice', 3)).rect(4, 4, 6, 1, c('ice', 4));
        p.rect(10, 7, 4, 7, k).rect(10, 8, 3, 5, b(2));
        p.rect(2, 0, 4, 2, frame ? c('orange', 3) : c('orange', 0));
        if (frame) p.set(1, 0, c('orange', 2)).set(6, 0, c('orange', 2));
        // the blade, angled, with snow curling off it
        for (let y = 5; y < 20; y++) p.rect(14 + Math.floor((y - 5) / 5), y, 3, 1, y % 3 === 0 ? c('gold', 1) : c('gold', 3));
        p.rect(14, 5, 1, 15, k);
        for (const [x, y] of frame
          ? [
              [18, 7],
              [19, 11],
              [18, 15],
              [17, 3],
            ]
          : [
              [19, 6],
              [18, 10],
              [19, 14],
              [18, 2],
            ])
          blob(p, x, y, 1.5, 1.5, snow, 4, 6);
        blob(p, 6, 2, 5, 1.2, snow, 4, 6);
      } else {
        p.rect(0, 8, 17, 6, k).rect(0, 9, 16, 4, b(2)).rect(0, 9, 16, 1, b(3));
        p.rect(0, 4, 8, 5, k).rect(0, 5, 7, 4, c('ice', 2)).rect(3, 5, 1, 4, k);
        p.rect(15, 10, 2, 2, c('glow', 3));
        if (frame) p.rect(17, 9, 3, 4, c('glow', 1));
      }
      blob(p, 8, 16, 3.4, 3.4, pal.r('ink'), 0, 1);
      p.rect(7, 15, 2, 2, c('grey', 3 + frame));
    }
    return p;
  };
  for (const f of [0, 1]) {
    book.add(`plowRear${f}`, vehicle('orange', false, f, true), hurtBy(-6));
    book.add(`plowFront${f}`, vehicle('orange', true, f, true), hurtBy(-6));
  }
  for (const f of [0, 1]) {
    book.add(`carRear${f}`, vehicle('siding', false, f, false), hurtBy(-5));
    book.add(`carFront${f}`, vehicle('siding', true, f, false), hurtBy(-5));
  }

  // A runaway shopping cart.
  const cart = (f: number) => {
    const p = new Pixels(20, 20, T);
    const g = c('grey', 4);
    p.rect(2, 5, 15, 9, c('grey', 2));
    for (let x = 2; x < 17; x += 3) p.rect(x, 5, 1, 9, g);
    for (let y = 5; y < 14; y += 3) p.rect(2, y, 15, 1, g);
    p.line(17, 5, 19, 2, c('coat', 3)).rect(18, 1, 2, 2, c('coat', 3));
    p.rect(3, 14, 13, 1, g);
    for (const x of [4, 14]) p.rect(x, 15 + f, 2, 2, c('ink', 0));
    blob(p, 8, 5, 6, 1.5, snow, 4, 6);
    return p;
  };
  book.add('cart0', rim(cart(0)), hurtBy(-4));
  book.add('cart1', rim(cart(1)), hurtBy(-4));

  // Another kid on a toboggan, cutting across the hill.
  const sledder = (f: number) => {
    const p = new Pixels(20, 20, T);
    p.rect(1, 14, 17, 3, c('wood', 3)).rect(1, 17, 17, 1, c('wood', 0));
    p.rect(17, 11, 2, 4, c('wood', 3)).set(19, 10, c('wood', 3));
    p.rect(5, 6, 7, 8, c('pine', 3)).rect(5, 12, 9, 2, c('jeans', 2));
    p.rect(6, 1, 5, 5, c('skin', 2)).rect(6, 0, 5, 2, c('gold', 3)).set(9, 3, c('ink', 0));
    p.rect(11, 8, 4, 2, c('pine', 2));
    for (const [x, y] of f
      ? [
          [0, 12],
          [2, 10],
        ]
      : [
          [0, 14],
          [1, 11],
        ])
      blob(p, x, y, 1.5, 1.5, snow, 4, 6);
    return p;
  };
  book.add('sledder0', sledder(0), hurtBy(-5));
  book.add('sledder1', sledder(1), hurtBy(-5));

  // A cardinal hopping in the snow (scenery; touching it does nothing).
  const bird = (f: number) => {
    const p = new Pixels(20, 20, T);
    blob(p, 10, 13 - f, 4, 3, pal.r('coat'), 1, 3);
    blob(p, 13, 10 - f, 2.5, 2.5, pal.r('coat'), 1, 3);
    p.set(14, 8 - f, c('coat', 3))
      .set(14, 10 - f, c('ink', 0))
      .set(16, 10 - f, c('orange', 3))
      .set(15, 10 - f, c('orange', 3));
    p.rect(4, 12 - f, 3, 1, c('coat', 1));
    p.set(9, 16, c('ink', 0)).set(11, 16, c('ink', 0));
    return p;
  };
  book.add('bird0', bird(0));
  book.add('bird1', bird(1));
  return book;
}
