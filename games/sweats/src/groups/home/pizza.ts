// "How the Cat Won the Pizza War": the last slice of pepperoni (just the right amount of grease,
// the crust between cardboard and baguette), and the battlefield treacherous: the table cluttered
// with empty soda cans, a rogue salad fork and a suspiciously sticky napkin. Kevin, with the
// reflexes of a cat and the appetite of a bear, eyeing the slice; Aunt Marge demanding who
// sneezed on the dip. The epic, along the dinner table: five ploys to gather (the glasses of the
// slow reach, the tissues of the sneeze ploy, the cheesecake and the pet cactus of the
// negotiations, the trusty spatula), pizza cutters rolling, the smoke alarm beeping, the light
// flickering, and the cat, too tough for words. With all five he makes his move on the box, and
// it's empty: in the chaos, Kevin snatched the slice. Take your spatula. Make your move.
//
// Layout (12 rows: the ceiling on row 0, the floor on row 10): the poet walks row 9; the table
// top is a ledge on row 7 (he walks along it on row 6, past Kevin and Aunt Marge sitting behind
// it); a shelf over the end of the table holds the cactus.
import { Pixels } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace, still } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { houseMonsters, wallpaper } from './house';
import { PIZZA_MON } from './ids';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../../kit/easterEgg';

/** The ploys: the slow reach, the sneeze, the cheesecake, the cactus, the spatula. */
export const PLOYS = 5;

/** A slice of pepperoni pizza, point down-left, at (x, y) (14 x 12). */
function drawSlice(p: Pixels, pal: Pal, x: number, y: number): void {
  const c = pal.c;
  for (let k = 0; k < 12; k++) p.rect(x, y + k, Math.max(1, 14 - Math.floor(k * 1.15)), 1, c('yellow', k % 3 ? 2 : 1));
  p.rect(x, y, 14, 2, c('crust', 2)).rect(x, y + 2, 14, 1, c('crust', 0));
  for (const [dx, dy] of [
    [3, 4],
    [8, 4],
    [5, 7],
    [2, 9],
  ])
    p.disc(x + dx, y + dy, 1.3, c('red', 1)).set(x + dx - 1, y + dy - 1, c('red', 2));
}

/**
 * A painted Easter egg rolled under the dinner table (added after every other HOME.BBL block, so
 * they keep their numbers). Decoration only: no points, so no sound (the score sound here is a
 * monologue's opening line).
 */
export function pizzaEggBlocks(book: BlockBook, pal: Pal): void {
  const c = pal.c;
  // two frames of its shine (the plain egg and one glint): HOME.BBL has room for just two
  const frames = Math.min(2, EGG_SHINE_FRAMES);
  for (let k = 0; k < frames; k++)
    book.add(
      `egg${k || ''}`,
      drawEasterEgg(
        book.pics.get('underTable')!.crop(0, 0, 20, 20),
        {
          ink: c('ink', 0),
          shell: [c('teal', 0), c('teal', 1), c('teal', 2)],
          paint: [c('yellow', 1), c('yellow', 2)],
          accent: c('pink', 2),
          white: c('white', 2),
        },
        'zigzag',
        k,
      ),
      {
        ...AIR,
        touch: 'underTable',
        next: `egg${(k + 1) % frames || ''}`,
        ntime: k ? 3 : 60,
      },
    );
}

export function pizzaBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => wallpaper(pal, seed);
  // the dinner table: its top (a ledge) cluttered, the dark under it, legs
  const top = (what: 'plain' | 'cans' | 'glass') => {
    const p = wall(60);
    p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 2, c('wood', 1)).rect(0, 6, 20, 14, c('rose', 0));
    p.rect(0, 6, 20, 2, c('white', 2)).rect(0, 8, 20, 1, c('white', 0));
    for (let x = 1; x < 20; x += 4) p.rect(x, 8, 2, 2, c('white', 1));
    if (what === 'cans') p.rect(14, 10, 4, 6, c('red', 2)).rect(14, 10, 4, 1, c('metal', 2)).rect(15, 15, 6, 4, c('teal', 1)).rect(15, 15, 1, 4, c('metal', 2));
    return p;
  };
  book.add('tableTop', top('plain'), { solid: LEDGE, grav: GRAV.down });
  book.add(
    'underTable',
    (() => {
      const p = new Pixels(20, 20);
      p.rect(0, 0, 20, 20, c('rose', 0));
      for (let y = 1; y < 20; y += 3) p.rect(0, y, 20, 1, c('ink', 1));
      return p;
    })(),
    AIR,
  );
  const leg = book.pics.get('underTable')!.crop(0, 0, 20, 20);
  leg.rect(7, 0, 6, 20, c('wood', 2)).rect(8, 0, 1, 20, c('wood', 3)).rect(6, 17, 8, 3, c('wood', 1));
  book.add('tableLeg', leg, AIR);
  // the clutter on top: empty soda cans, the glass of water (the cat's), the pizza crusts
  const clutter = (cans: boolean) => {
    const p = wall(61);
    p.rect(0, 16, 20, 4, c('wood', 3)).rect(0, 16, 20, 1, c('wood', 4));
    if (cans) {
      for (const [x, k] of [
        [2, 'red'],
        [8, 'teal'],
        [13, 'red'],
      ] as const)
        p.rect(x, 7, 5, 9, c(k, 2))
          .rect(x, 7, 5, 1, c('metal', 2))
          .rect(x + 1, 10, 1, 4, c('white', 1));
      p.rect(14, 13, 6, 3, c('metal', 1));
    } else {
      p.rect(7, 6, 6, 10, c('ice', 2)).rect(8, 9, 4, 6, c('ice', 1)).rect(7, 6, 6, 1, c('white', 2));
      p.rect(14, 14, 5, 2, c('crust', 1)).rect(1, 14, 4, 2, c('crust', 2));
    }
    return p;
  };
  book.add('cans', clutter(true), AIR);
  book.add('glass', clutter(false), AIR);
  // Kevin, behind the table: the reflexes of a cat, the appetite of a bear, eyeing that slice
  {
    const pic = new Pixels(40, 40, 255);
    blob(pic, 20, 32, 17, 12, R('couch'), 0, 3);
    pic.rect(4, 30, 32, 10, c('couch', 2)).rect(19, 24, 2, 16, c('couch', 1));
    blob(pic, 20, 13, 9, 10, R('skin'), 1, 4);
    // the beard, the cap on backward, the cat's eyes narrowed on the slice
    blob(pic, 20, 20, 8, 5, R('hair'), 0, 2);
    pic.rect(11, 3, 18, 5, c('navy', 1)).rect(11, 3, 18, 1, c('navy', 2)).rect(7, 6, 6, 2, c('navy', 0));
    for (const ex of [16, 25])
      pic
        .rect(ex - 2, 12, 5, 2, c('white', 2))
        .rect(ex, 12, 2, 2, c('green', 1))
        .set(ex + 1, 12, c('ink', 0));
    pic.line(13, 10, 18, 11, c('hair', 0)).line(22, 11, 27, 10, c('hair', 0));
    pic.rect(17, 18, 6, 1, c('red', 1)).set(23, 17, c('red', 1));
    addPicture(book, 'kevin', pic, wall(62), () => AIR);
  }
  // Aunt Marge: a gray bun, cat-eye glasses, pearls; she demands to know who sneezed on the dip
  {
    const pic = new Pixels(20, 40, 255);
    blob(pic, 10, 32, 8, 10, R('purple'), 0, 2);
    blob(pic, 10, 14, 6, 7, R('skin'), 1, 4);
    blob(pic, 10, 5, 5, 4, R('gray'), 2, 3);
    blob(pic, 10, 1.5, 2.6, 2.2, R('gray'), 2, 3);
    pic
      .frame(5, 12, 4, 3, c('teal', 0))
      .frame(11, 12, 4, 3, c('teal', 0))
      .set(4, 11, c('teal', 0))
      .set(15, 11, c('teal', 0))
      .set(7, 13, c('ink', 0))
      .set(13, 13, c('ink', 0));
    pic.rect(8, 18, 4, 2, c('ink', 0)).set(9, 19, c('red', 2));
    for (let x = 5; x < 16; x += 2) pic.set(x, 23 + (x === 9 || x === 11 ? 1 : 0), c('white', 2));
    pic.line(17, 26, 19, 21, c('skin', 2));
    addPicture(book, 'marge', pic, wall(63), (_c, row) => (row === 0 ? { ...AIR, birthMon: PIZZA_MON.dip, birthTime: 150 } : AIR));
  }
  // the smoke alarm on the ceiling, beeping; the light over the table, flickering (the power)
  const alarm = book.pics.get('ceil')!.crop(0, 0, 20, 20);
  alarm.disc(10, 15, 6, c('white', 2)).ring(10, 15, 6, c('gray', 1)).disc(10, 16, 1.6, c('red', 2)).rect(5, 13, 10, 1, c('gray', 1));
  book.add('alarm', alarm, { solid: SOLID, birthMon: PIZZA_MON.beep, birthTime: 140 });
  const flicker = (on: boolean) => {
    const p = book.pics.get(on ? 'ceilLamp' : 'ceil')!.crop(0, 0, 20, 20);
    if (!on) {
      p.rect(9, 14, 2, 3, c('gold', 0));
      blob(p, 10, 19, 5, 3, R('gray'), 0, 1);
    } else
      for (const [x, y] of [
        [3, 17],
        [17, 17],
        [10, 12],
      ])
        p.set(x, y, c('spot', 1));
    return p;
  };
  book.add('lightOn', flicker(true), { solid: SOLID, next: 'lightOff', ntime: 40 });
  book.add('lightOff', flicker(false), { solid: SOLID, next: 'lightOn', ntime: 6 });
  // the last slice in its box (the gate): it takes the five ploys and opens... empty
  const box = (empty: boolean) => {
    const p = wallpaper(pal, 64);
    p.rect(0, 14, 20, 6, c('white', 1)).rect(0, 14, 20, 1, c('white', 2)).rect(0, 19, 20, 1, c('wood', 0));
    // the lid up behind, the box's floor
    p.rect(1, 2, 18, 9, c('crust', 1)).frame(1, 2, 18, 9, c('crust', 0));
    micro(p, 3, 4, empty ? 'GONE' : 'LAST', c('red', 1));
    p.rect(0, 11, 20, 7, c('crust', 2)).rect(0, 11, 20, 1, c('crust', 0)).rect(2, 12, 16, 5, c('white', 1));
    if (empty) {
      p.ring(10, 14, 3, c('crust', 1));
      for (const [x, y] of [
        [5, 13],
        [14, 15],
        [8, 16],
        [12, 13],
      ])
        p.set(x, y, c('crust', 0));
    } else drawSlice(p, pal, 3, 12);
    return p;
  };
  book.add('boxEmpty', box(true), { grav: GRAV.none });
  gate(book, 'pizzaBox', box(false), 'boxEmpty', PLOYS);
  // the five ploys
  plotThing(book, 'wall', 'ploy1', (p) => {
    // the slow reach: his glasses, as if adjusting them
    p.ring(6, 12, 3.4, c('ink', 0))
      .ring(14, 12, 3.4, c('ink', 0))
      .line(9, 11, 11, 11, c('ink', 0))
      .line(2, 11, 0, 9, c('ink', 0))
      .line(18, 11, 20, 9, c('ink', 0));
    p.disc(6, 12, 2.4, c('ice', 2)).disc(14, 12, 2.4, c('ice', 2)).set(5, 11, c('white', 2)).set(13, 11, c('white', 2));
  });
  plotThing(book, 'wall', 'ploy2', (p) => {
    // the sneeze ploy: a box of tissues, ACHOO!
    p.rect(3, 10, 14, 9, c('teal', 1)).rect(3, 10, 14, 2, c('teal', 2)).rect(7, 6, 6, 5, c('white', 2)).line(8, 6, 10, 3, c('white', 2));
    micro(p, 4, 13, 'ACH', c('white', 2));
  });
  plotThing(book, 'wall', 'ploy3', (p) => {
    // the negotiations: his last slice of cheesecake, on a saucer
    p.rect(2, 16, 16, 2, c('white', 2)).rect(4, 18, 12, 1, c('white', 0));
    for (let k = 0; k < 8; k++) p.rect(4 + k, 8 + k, 12 - k, 1, c('yellow', 2));
    p.line(4, 8, 15, 15, c('crust', 1)).rect(10, 14, 6, 2, c('crust', 1)).disc(14, 9, 2, c('red', 2));
  });
  plotThing(book, 'wall', 'ploy4', (p) => {
    // "I'll adopt your pet cactus": a cactus in a terracotta pot
    p.rect(5, 13, 10, 6, c('brick', 2)).rect(4, 12, 12, 2, c('brick', 1));
    p.rect(8, 3, 4, 10, c('green', 2))
      .rect(9, 3, 1, 10, c('green', 3))
      .rect(4, 6, 2, 4, c('green', 2))
      .rect(4, 9, 4, 2, c('green', 2))
      .rect(14, 5, 2, 4, c('green', 2))
      .rect(12, 8, 4, 2, c('green', 2));
    p.disc(10, 2.5, 1.4, c('pink', 2));
  });
  plotThing(book, 'wallB', 'ploy5', (p) => {
    // the trusty spatula
    p.line(4, 18, 11, 9, c('wood', 1)).line(5, 18, 12, 9, c('wood', 2));
    p.rect(11, 2, 6, 8, c('metal', 1)).rect(11, 2, 6, 1, c('metal', 2));
    for (const x of [12, 14]) p.rect(x, 3, 1, 5, c('metal', 0));
  });
}

export function pizzaSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // the rogue salad fork, hopping
  const fork = (f: number) => {
    const p = P();
    const y = f ? 1 : 4;
    for (const x of [7, 9, 11, 13]) p.rect(x, y, 1, 6, c('metal', 2));
    p.rect(7, y + 6, 7, 2, c('metal', 2))
      .rect(9, y + 8, 3, 7, c('metal', 1))
      .rect(10, y + 8, 1, 7, c('metal', 2));
    face(p, pal, 10, y + 11, { angry: true });
    return outline(p, ink);
  };
  book.add('fork0', fork(0), hurts(-6));
  book.add('fork1', fork(1), hurts(-6));
  // the suspiciously sticky napkin, creeping (may or may not have been used)
  const napkin = (f: number) => {
    const p = P();
    for (let y = 9; y < 19; y++) p.rect(3 - (y > 15 && f ? 1 : 0), y, 14 + (y > 15 && f ? 2 : 0), 1, c('white', y % 3 ? 2 : 1));
    p.line(3, 9, 16, 18, c('white', 0));
    for (const [x, y] of [
      [6, 16],
      [13, 12],
      [9, 11],
    ])
      p.disc(x, y, 1.4, c('gold', 1));
    p.rect(2 + f, 19, 3, 1, c('gold', 1)).rect(14 - f, 19, 3, 1, c('gold', 1));
    face(p, pal, 10, 13, { wink: f === 1 });
    return outline(p, ink);
  };
  book.add('napkin0', napkin(0), hurts(-5));
  book.add('napkin1', napkin(1), hurts(-5));
  // a pizza cutter, rolling
  const cutter = (f: number) => {
    const p = P();
    p.disc(9, 13, 6, c('metal', 2)).ring(9, 13, 6, c('metal', 0)).disc(9, 13, 1.5, c('metal', 0));
    const a = f ? 0.8 : 0;
    p.line(9 + Math.cos(a) * 5, 13 + Math.sin(a) * 5, 9 - Math.cos(a) * 5, 13 - Math.sin(a) * 5, c('metal', 1));
    p.line(10, 12, 18, 4, c('red', 1)).line(11, 12, 19, 4, c('red', 2));
    face(p, pal, 9, 12, { angry: true });
    return outline(p, ink);
  };
  book.add('cutter0', cutter(0), hurts(-6));
  book.add('cutter1', cutter(1), hurts(-6));
  // Aunt Marge's question: WHO SNEEZED ON THE DIP?
  const dip = (f: number) => {
    const p = P();
    p.rect(1, 4 + f, 18, 9, c('purple', 2)).rect(2, 5 + f, 16, 7, c('white', 2));
    p.set(15, 13 + f, c('purple', 2)).set(16, 14 + f, c('purple', 2));
    micro(p, 3, 6 + f, 'DIP?', c('red', 1));
    return outline(p, ink);
  };
  book.add('dip0', dip(0), hurts(-3));
  book.add('dip1', dip(1), hurts(-3));
  // the smoke alarm's BEEP
  const beep = (f: number) => {
    const p = P();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      p.line(10 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 10 + Math.cos(a) * (8 + f), 10 + Math.sin(a) * (8 + f), c('red', 2));
    }
    p.disc(10, 10, 6, c('red', 2 + f)).disc(10, 10, 5, c('white', 2));
    micro(p, 5, 8, 'BEP', c('red', 1));
    return outline(p, ink);
  };
  book.add('beep0', beep(0), hurts(-3));
  book.add('beep1', beep(1), hurts(-3));
  // the cat: a gray tabby, sitting smug by the glass of water, tail flicking (too tough for words)
  const cat = (f: number) => {
    const p = P();
    blob(p, 10, 14, 5.5, 5.5, pal.r('gray'), 1, 3);
    blob(p, 10, 7, 4.2, 3.8, pal.r('gray'), 1, 3);
    p.line(6, 5, 7, 2, c('gray', 2)).line(7, 2, 8, 4, c('gray', 2)).line(14, 5, 13, 2, c('gray', 2)).line(13, 2, 12, 4, c('gray', 2));
    for (const y of [11, 14, 17]) p.line(6, y, 9, y, c('gray', 0));
    p.set(8, 7, c('green', 2)).set(12, 7, c('green', 2)).set(8, 8, ink).set(12, 8, ink).set(10, 9, c('pink', 2));
    p.line(15, 18, 18, 14 - f * 3, c('gray', 2)).line(18, 14 - f * 3, 17, 11 - f * 4, c('gray', 2));
    return outline(p, ink);
  };
  book.add('cat0', cat(0), hurts(0));
  book.add('cat1', cat(1), hurts(0));
}

function pizzaMonsters(set: Monster[], mb: SpriteBook): void {
  houseMonsters(set, mb);
  set[PIZZA_MON.fork] = mon(anim(mb, 'fork0', 'fork1', 4), { power: POWER.foe, thru: 1, newmon: PIZZA_MON.fluff }, pace(2, 2));
  set[PIZZA_MON.napkin] = mon(anim(mb, 'napkin0', 'napkin1', 8), { power: POWER.foe, thru: 1, newmon: PIZZA_MON.fluff }, pace(2, 1));
  set[PIZZA_MON.cutter] = mon(anim(mb, 'cutter0', 'cutter1', 3), { power: POWER.foe, thru: 1, newmon: PIZZA_MON.fluff }, pace(3, 2));
  // Aunt Marge's question drifts left along the table at whoever's there
  set[PIZZA_MON.dip] = mon(anim(mb, 'dip0', 'dip1', 8), { power: POWER.foe, thru: 1, end: -1, newmon: PIZZA_MON.fluff }, [
    corner(0, 0, 1),
    corner(-1, 1, 1),
    corner(-7, 1, 1, 4),
  ]);
  // the BEEP drops off the ceiling to the floor and away left
  set[PIZZA_MON.beep] = mon(anim(mb, 'beep0', 'beep1', 5), { power: POWER.foe, thru: 1, end: -1, newmon: PIZZA_MON.fluff }, [
    corner(0, 0, 2),
    corner(0, 9, 2),
    corner(-7, 9, 2, 4),
  ]);
  set[PIZZA_MON.cat] = mon(anim(mb, 'cat0', 'cat1', 12), { power: POWER.tough, thru: 1 }, still);
}

export const pizza: Monologue = {
  file: 'pizza',
  title: 'How the Cat Won the Pizza War',
  desc: 'The Pizza War',
  filler: 'slab',
  legend: {
    '^': 'ceil',
    '*': 'ceilLamp',
    '.': 'wall',
    _: 'wallB',
    '=': 'floor',
    '#': 'slab',
    T: 'tableTop',
    u: 'underTable',
    l: 'tableLeg',
    c: 'cans',
    g: 'glass',
    a: 'alarm',
    L: 'lightOn',
    h: 'shelf',
    D: 'pizzaBox',
    $: 'coin@wallB',
    '&': 'coin@wall',
    b: 'bill@wallB',
    B: 'bill@wall',
    m: 'mug@wallB',
    '!': 'spot@wallB',
    E: 'egg',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the living room past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 6;
    const W = 60 + OFF;
    m.row(0, 0, W - 1, '^');
    for (let x = 4; x < W; x += 10) m.set(x, 0, '*');
    m.fill(0, 1, W, 8, '.')
      .row(9, 0, W - 1, '_')
      .row(10, 0, W - 1, '=')
      .row(11, 0, W - 1, '#');
    // the way in: the smoke alarm beeping, a window
    m.set(2, 9, '!').set(5, 9, '$').set(8, 0, 'a');
    placePicture(m, 'win', 4, 3, 2, 2);
    // the dinner table: the top a ledge, the dark under it, the clutter; Kevin and Aunt Marge behind it
    m.row(7, 11, 38, 'T').fill(11, 8, 28, 2, 'u');
    for (const x of [12, 25, 37]) m.col(x, 8, 9, 'l');
    m.set(15, 6, 'c').set(34, 6, 'c').set(30, 6, 'g');
    placePicture(m, 'kevin', 19, 5, 2, 2);
    placePicture(m, 'marge', 27, 5, 1, 2);
    m.set(24, 0, 'L');
    // along the table: the glasses (the slow reach), the sticky napkin, the tissues (the sneeze),
    // the fork, the coins, the cat by its glass of water, the cheesecake
    m.set(13, 6, 'ploy1').set(17, 6, '&');
    m.mon(PIZZA_MON.napkin, 16, 6);
    m.set(23, 6, 'ploy2').set(26, 6, 'B');
    m.mon(PIZZA_MON.fork, 21, 6);
    m.mon(PIZZA_MON.cat, 31, 6);
    // under the table: a painted egg
    m.set(30, 9, 'E');
    m.set(33, 6, 'ploy3');
    // the shelf over the end of the table: the pet cactus
    m.row(4, 35, 37, 'h').set(36, 3, 'ploy4').set(37, 3, '&');
    // down off the table: the pizza cutters, the spatula, the goat, the box
    m.mon(PIZZA_MON.cutter, 41, 9);
    m.set(44, 9, 'b').set(46, 9, 'ploy5').set(48, 9, 'm');
    // the living room, whose respect he won: the armchair, the bookcase, the photo; the goat
    placePicture(m, 'chair', 49, 8, 2, 2);
    placePicture(m, 'photo', 44, 4, 2, 1);
    m.mon(MON.goat, 53, 9);
    m.set(54, 9, '$');
    m.set(57, 9, 'D');
    m.link(57 + OFF, 9, 'next');
    placePicture(m, 'win', 52, 3, 2, 2);
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: pizzaMonsters,
  song: 'epic',
  clips: { open: 'pizza_o', line: 'pizza_l', punch: 'pizza_p', word: 'pizza_w' },
  view: [12, 3],
  card: ['It was pepperoni,', 'but not just pepperoni.'],
};
