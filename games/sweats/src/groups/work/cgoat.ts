// "The Coffee Goat in the Breakroom": "Jeremy, can you make me a coffee?" Simple. Harmless. Then
// the wall: sugar or cream first? His brain goes full static. The fridge: the empty creamer,
// lovingly put back. The powdered creamer from the supply closet, half its label gone
// (experimental). It fizzes. He delivers it anyway, and is promoted: brew coordinator, a lanyard
// appears. And now every time he blinks he sees a goat.
//
// The epic: the breakroom counter (a step up; the upper cabinets are ledges), the boss's mug, the
// coffee, the sugar on top of the cabinets with the static fuzzing about, the open fridge that
// keeps sending out the empty creamer, the supply closet's top shelf (the powdered creamer), the
// giant fizzing cup, the goats he sees when he blinks (and the real one, the third from the
// left), and the boss's door: it takes the four things and hands him a lanyard.
//
// Layout (12 rows: the ceiling on row 0, the floor on row 10, the poet walks row 9): the counter
// is solid on row 9 (he walks along its top on row 8), the upper cabinets are ledges on row 6.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../common/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { CGOAT_MON } from './ids';
import { officeBase, officeWall } from './office';

/** The things for the boss's coffee: his mug, the coffee, the sugar, the powdered creamer. */
export const COFFEE_THINGS = 4;

export function cgoatBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => officeWall(pal, seed);
  // the backsplash: little mint tiles
  const tile = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) tile.set(x, y, x % 5 === 0 || y % 5 === 0 ? c('mint', 0) : c('mint', (x + y) % 9 === 1 ? 2 : 1));
  book.add('tile', tile, AIR);
  // the counter (solid: he walks its top), cabinet doors under a laminate top
  const counter = new Pixels(20, 20);
  counter.rect(0, 0, 20, 20, c('wood', 2)).rect(0, 0, 20, 4, c('white', 1)).rect(0, 0, 20, 1, c('white', 2)).rect(0, 4, 20, 1, c('wood', 0));
  counter.frame(1, 6, 18, 12, c('wood', 1)).rect(4, 8, 2, 1, c('metal', 2)).rect(0, 18, 20, 2, c('ink2', 0)).rect(10, 6, 1, 12, c('wood', 1));
  book.add('counter', counter, { solid: SOLID });
  // the upper cabinets (ledges: stand on top of them, hop up through them)
  const upper = wall(30);
  upper.rect(0, 0, 20, 17, c('wood', 3)).rect(0, 0, 20, 2, c('wood', 4)).rect(0, 16, 20, 1, c('wood', 0)).frame(2, 3, 7, 12, c('wood', 2)).frame(11, 3, 7, 12, c('wood', 2));
  upper.rect(7, 12, 1, 2, c('metal', 2)).rect(12, 12, 1, 2, c('metal', 2));
  book.add('upperCab', upper, { solid: LEDGE, grav: GRAV.down });
  // the coffee maker (two blocks tall): the reservoir, the basket, the drip onto an empty plate,
  // the BREW button glowing
  const maker = new Pixels(20, 40, 255);
  maker.rect(2, 4, 16, 34, c('ink', 1)).rect(2, 4, 16, 2, c('ink2', 1)).rect(3, 7, 4, 12, c('blue', 2)).rect(4, 8, 1, 10, c('blue', 3));
  maker.rect(8, 8, 9, 7, c('ink2', 1)).rect(10, 15, 5, 2, c('ink', 0)).rect(2, 34, 16, 4, c('ink2', 0)).rect(6, 33, 10, 2, c('metal', 1));
  maker.rect(7, 18, 11, 15, c('mint', 2)).rect(7, 18, 11, 15, c('mint', 2));
  for (let y = 18; y < 33; y++) maker.rect(7, y, 11, 1, c('mint', y % 5 === 0 ? 0 : 1));
  for (const y of [18, 23, 28]) maker.set(12, y, c('coffee', 1));
  maker.rect(3, 26, 3, 3, c('red', 3)).set(4, 27, c('white', 2));
  micro(maker, 3, 21, 'B', c('white', 1));
  addPicture(book, 'maker', maker, tile, () => AIR);
  // the microwave, and the sink full of everybody's mugs
  const micro_ = tile.crop(0, 0, 20, 20);
  micro_.rect(0, 6, 20, 14, c('white', 1)).rect(0, 6, 20, 1, c('white', 2)).rect(2, 8, 11, 9, c('ink', 1)).rect(3, 9, 9, 7, c('ink2', 1));
  micro_.rect(14, 8, 4, 3, c('green', 3)).rect(14, 12, 4, 5, c('white', 0));
  micro(micro_, 14, 8, '0', c('ink', 0));
  book.add('microwave', micro_, { solid: SOLID });
  const sink = tile.crop(0, 0, 20, 20);
  sink.rect(12, 6, 2, 10, c('metal', 2)).rect(7, 6, 7, 2, c('metal', 2)).rect(7, 8, 1, 2, c('metal', 1));
  for (const [x, y, col] of [[2, 14, 'red'], [6, 12, 'white'], [3, 9, 'teal'], [9, 15, 'yellow']] as const) sink.rect(x, y, 5, 5, c(col, 2)).rect(x, y, 5, 1, c(col, 1)).set(x + 5, y + 2, c(col, 1));
  sink.rect(0, 19, 20, 1, c('metal', 1));
  book.add('sink', sink, { solid: SOLID });
  // the fridge, its door flung open (two blocks wide, three tall): the light on, the shelves, a
  // lonely lemon, the door's bottles; its top a ledge
  const fridge = new Pixels(40, 60, 255);
  fridge.rect(0, 0, 26, 60, c('white', 1)).rect(0, 0, 26, 2, c('white', 2)).rect(2, 4, 22, 53, c('fluor', 0));
  for (let y = 4; y < 57; y++) for (let x = 2; x < 24; x++) if ((x + y) % 7 === 0) fridge.set(x, y, c('fluor', 1));
  fridge.disc(13, 6, 2, c('white', 2)).rect(2, 4, 22, 1, c('mint', 0));
  for (const y of [20, 36]) fridge.rect(2, y, 22, 2, c('mint', 1)).rect(2, y + 2, 22, 1, c('mint', 0));
  blob(fridge, 7, 17, 3, 2.4, R('yellow'), 0, 2);
  fridge.rect(13, 12, 8, 8, c('white', 2)).rect(13, 12, 8, 2, c('red', 1)).rect(4, 28, 9, 8, c('wood', 4)).rect(4, 28, 9, 1, c('wood', 2));
  micro(fridge, 5, 30, '?', c('red', 1));
  fridge.rect(15, 30, 6, 6, c('green', 2)).rect(15, 30, 6, 1, c('green', 1));
  fridge.rect(2, 44, 22, 12, c('mint', 0)).rect(3, 45, 20, 10, c('mint', 2)).rect(2, 57, 24, 3, c('ink2', 0));
  // the door, swung open toward us: its inner side, two shelves of bottles
  fridge.rect(28, 2, 12, 58, c('white', 0)).rect(29, 3, 10, 56, c('white', 1)).rect(26, 6, 2, 6, c('metal', 1)).rect(26, 46, 2, 6, c('metal', 1));
  for (const y of [22, 42]) {
    fridge.rect(29, y, 10, 3, c('mint', 1));
    fridge.rect(30, y - 9, 3, 9, c('red', 1)).rect(30, y - 10, 3, 1, c('red', 0)).rect(34, y - 7, 4, 7, c('yellow', 2)).rect(35, y - 8, 2, 1, c('white', 2));
  }
  addPicture(book, 'fridge', fridge, (col, row) => (row === 2 ? officeBase(pal) : wall(31 + col)), (col, row) => ({ ...(row ? AIR : { solid: LEDGE, grav: GRAV.down }), ...(col === 1 && row === 2 ? { birthMon: CGOAT_MON.creamer, birthTime: 90 } : {}) }));
  // the soda machine (two blocks tall), humming
  const vend = new Pixels(20, 40, 255);
  vend.rect(1, 1, 18, 38, c('red', 1)).rect(1, 1, 18, 1, c('red', 3)).rect(3, 3, 10, 22, c('ink2', 0));
  for (let y = 4; y < 24; y += 5) for (let x = 4; x < 12; x += 3) vend.rect(x, y, 2, 4, c(['blue', 'yellow', 'green', 'red'][(x + y) % 4], 2));
  vend.rect(14, 4, 4, 6, c('fluor', 0)).rect(15, 12, 2, 4, c('ink', 0)).rect(3, 29, 14, 5, c('ink', 1)).rect(1, 37, 18, 2, c('ink', 0));
  micro(vend, 3, 26, 'SODA', c('white', 2));
  addPicture(book, 'vend', vend, (_c, row) => (row ? officeBase(pal) : wall(33)), () => AIR);
  // the breakroom notice
  const notice = wall(34);
  notice.rect(1, 2, 18, 15, c('white', 2)).rect(1, 2, 18, 1, c('red', 1)).set(10, 1, c('red', 2));
  micro(notice, 1, 4, 'LABEL', c('red', 1));
  micro(notice, 3, 10, 'FOOD', c('ink', 0));
  book.add('notice', notice, AIR);
  // the coffee that should not fizz: his mug, giant (2 x 2), foaming over (solid; bubbles off its top)
  const cup = new Pixels(40, 40, 255);
  cup.rect(2, 8, 30, 31, c('white', 2)).rect(2, 8, 2, 31, c('white', 1)).rect(28, 8, 4, 31, c('white', 0)).rect(4, 38, 26, 2, c('white', 0));
  cup.rect(32, 14, 6, 3, c('white', 1)).rect(35, 14, 3, 16, c('white', 1)).rect(32, 27, 6, 3, c('white', 1));
  cup.rect(4, 8, 24, 3, c('coffee', 2));
  const rr = rng(35);
  for (let k = 0; k < 18; k++) cup.disc(4 + rr() * 26, 4 + rr() * 6, 1.2 + rr() * 2, c('coffee', 3));
  for (let k = 0; k < 10; k++) cup.disc(4 + rr() * 26, 10 + rr() * 2, 1 + rr(), c('coffee', 3));
  micro(cup, 8, 20, 'NON', c('ink', 1));
  micro(cup, 6, 27, 'DAIRY', c('ink', 1));
  addPicture(book, 'fizzCup', cup, (_c, row) => (row ? officeBase(pal) : wall(36)), (col, row) => ({ solid: SOLID, ...(row || col ? {} : { birthMon: CGOAT_MON.fizz, birthTime: 70 }) }));
  // the breakroom table (its top a ledge), two chairs tucked under it, someone's lunch
  const table = new Pixels(40, 20, 255);
  table.rect(2, 4, 36, 3, c('white', 1)).rect(2, 4, 36, 1, c('white', 2)).rect(19, 7, 3, 12, c('metal', 1)).rect(13, 18, 15, 2, c('metal', 0));
  for (const x of [3, 29]) table.rect(x, 2, 2, 9, c('teal', 0)).rect(x - 1, 10, 9, 2, c('teal', 1)).rect(x, 12, 1, 7, c('metal', 1)).rect(x + 6, 12, 1, 7, c('metal', 1));
  table.rect(12, 1, 7, 3, c('wood', 4)).rect(23, 2, 4, 2, c('red', 2));
  addPicture(book, 'bTable', table, officeBase(pal), () => ({ solid: LEDGE, grav: GRAV.down }));
  // employee of the month: a goat (he blinks, and there it is)
  const eom = wall(38);
  eom.rect(2, 1, 16, 18, c('wood', 1)).rect(4, 3, 12, 11, c('daylight', 2));
  blob(eom, 10, 9, 3.4, 3, R('grey'), 1, 3);
  eom.line(7, 6, 5, 3, c('grey', 1)).line(13, 6, 15, 3, c('grey', 1)).set(9, 8, c('ink', 0)).set(11, 8, c('ink', 0)).rect(9, 12, 3, 2, c('grey', 2)).rect(4, 13, 12, 1, c('navy', 1));
  eom.rect(4, 15, 12, 3, c('gold', 2));
  micro(eom, 5, 15, 'NO1', c('ink', 0));
  book.add('goatPortrait', eom, AIR);
  // the boss's door: BOSS on a brass plate. It takes his coffee, and opens: a lanyard on the hook
  const door = (open: boolean) => {
    const p = wall(37);
    p.rect(2, 0, 16, 20, open ? c('ink2', 0) : c('wood', 3)).rect(2, 0, 16, 1, c('wood', 0)).rect(2, 0, 1, 20, c('wood', 0)).rect(17, 0, 1, 20, c('wood', 0));
    if (open) {
      p.line(6, 1, 10, 9, c('blue', 2)).line(14, 1, 10, 9, c('blue', 2)).rect(7, 9, 7, 9, c('white', 2)).rect(7, 9, 7, 2, c('blue', 2));
      micro(p, 7, 12, 'BRW', c('ink', 0));
    } else {
      p.rect(2, 3, 17, 7, c('gold', 2)).frame(2, 3, 17, 7, c('gold', 0)).disc(14, 12, 1.2, c('gold', 3));
      micro(p, 3, 4, 'BOSS', c('ink', 0));
    }
    return p;
  };
  book.add('bossDoorOpen', door(true), { grav: GRAV.none });
  gate(book, 'bossDoor', door(false), 'bossDoorOpen', COFFEE_THINGS);
  // the four things: the boss's mug, the fresh pot, the sugar, the powdered creamer
  plotThing(book, 'tile', 'bossMug@tile', (p) => {
    p.rect(5, 10, 9, 10, c('red', 2)).rect(5, 10, 9, 1, c('red', 3)).rect(14, 12, 3, 1, c('red', 1)).rect(16, 12, 1, 5, c('red', 1)).rect(14, 16, 3, 1, c('red', 1));
    micro(p, 6, 13, '1', c('white', 2));
    p.set(10, 14, c('white', 2)).set(11, 13, c('white', 2)).set(11, 15, c('white', 2));
  });
  plotThing(book, 'tile', 'pot@tile', (p) => {
    p.rect(5, 9, 10, 2, c('ink', 0)).rect(4, 11, 12, 9, c('white', 0)).rect(5, 13, 10, 7, c('coffee', 1)).rect(5, 13, 10, 1, c('coffee', 2));
    p.rect(16, 11, 2, 7, c('ink', 0)).set(6, 12, c('white', 2)).set(8, 7, c('white', 0)).set(9, 6, c('white', 0)).set(11, 7, c('white', 0));
  });
  plotThing(book, 'officeWall', 'sugar@officeWall', (p) => {
    p.rect(4, 8, 12, 12, c('white', 2)).rect(4, 8, 12, 2, c('metal', 1)).rect(4, 19, 12, 1, c('white', 0));
    micro(p, 4, 12, 'SUGR', c('blue', 1));
  });
  plotThing(book, 'closet', 'creamer@closet', (p) => {
    p.rect(5, 7, 10, 13, c('white', 1)).rect(5, 5, 10, 2, c('yellow', 1)).rect(5, 11, 10, 6, c('beige', 3));
    for (let x = 10; x < 15; x++) p.set(x, 11 + (x % 3), c('white', 1)).set(x, 12 + (x % 2), c('white', 1));
    micro(p, 5, 12, 'EX', c('red', 1));
    p.rect(5, 17, 10, 1, c('white', 0));
  });
}

export function cgoatSprites(book: SpriteBook, pal: Pal): void {
  const { c, r: R } = pal;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // the static: a fuzz of grey dots round a question mark (SUGAR? CREAM?)
  const fuzz = (f: number) => {
    const p = P();
    const r = rng(40 + f);
    for (let k = 0; k < 90; k++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 8;
      p.set(10 + Math.cos(a) * d, 10 + Math.sin(a) * d * 0.9, c('grey', 1 + Math.floor(r() * 3)));
    }
    micro(p, 7, 6 + f, '?', c('white', 2), 2);
    return p;
  };
  book.add('fuzz0', fuzz(0), hurts(-5));
  book.add('fuzz1', fuzz(1), hurts(-5));
  // the empty creamer: a little plastic bottle, its cap on tight, nothing inside; hopping, sulking
  const creamer = (f: number) => {
    const p = P();
    const y = f ? 2 : 4;
    p.rect(6, y + 4, 9, 13, c('white', 2)).rect(7, y + 2, 7, 2, c('white', 1)).rect(8, y, 5, 2, c('blue', 2)).rect(6, y + 4, 1, 13, c('white', 1));
    p.rect(6, y + 9, 9, 4, c('blue', 1));
    micro(p, 8, y + 9, 'E', c('white', 2));
    face(p, pal, 10, y + 6, { sad: true });
    p.line(8, y + 17, 7 - f, 19, ink).line(12, y + 17, 13 + f, 19, ink);
    return outline(p, ink);
  };
  book.add('creamer0', creamer(0), hurts(-6));
  book.add('creamer1', creamer(1), hurts(-6));
  // a fizz bubble: three wobbling bubbles of coffee foam
  const bubble = (f: number) => {
    const p = P();
    for (const [x, y, rr] of [[8, 9, 4], [14, 13 - f, 2.6], [6, 15 + f, 2]] as [number, number, number][]) {
      p.ring(x + f, y, rr, c('coffee', 3)).set(x - 1 + f, y - 1, c('white', 2));
    }
    return p;
  };
  book.add('fizz0', bubble(0), hurts(-4, 0));
  book.add('fizz1', bubble(1), hurts(-4, 0));
  // a goat he sees when he blinks: pale, purple, flickering
  const mirage = (f: number) => {
    const p = P();
    const g = R('purple');
    for (const x of [6, 9, 13, 16]) p.rect(x, 14, 1, 5, g[1]);
    blob(p, 11, 11, 6.5, 3.8, g, 1, 2);
    blob(p, 4.5, 8, 2.8, 2.6, g, 1, 2);
    p.line(3, 5, 1, 3, g[0]).line(5, 5, 6, 2, g[0]).set(4, 8, c('pink', 2)).line(17, 9, 19, 8, g[2]);
    if (f) p.map((x, y, v) => (v !== T && (x + y) % 2 ? T : v));
    return p;
  };
  book.add('mirage0', mirage(0), hurts(-6));
  book.add('mirage1', mirage(1), hurts(-6));
}

export function cgoatMonsters(set: Monster[], mb: SpriteBook): void {
  set[CGOAT_MON.static] = mon(anim(mb, 'fuzz0', 'fuzz1', 3), { power: POWER.foe, thru: 1, newmon: CGOAT_MON.puff }, pace(3, 1));
  set[CGOAT_MON.creamer] = mon(anim(mb, 'creamer0', 'creamer1', 4), { power: POWER.foe, thru: 0, end: -1, newmon: CGOAT_MON.puff }, [corner(0, 0, 1), corner(3, 0, 1)]);
  set[CGOAT_MON.fizz] = mon(anim(mb, 'fizz0', 'fizz1', 4), { power: POWER.foe, thru: 0, end: -1, newmon: CGOAT_MON.puff }, [corner(0, 0, 2), corner(0, -4, 2)]);
  set[CGOAT_MON.mirage] = mon(anim(mb, 'mirage0', 'mirage1', 6), { power: POWER.foe, thru: 1, newmon: CGOAT_MON.puff }, pace(2, 1));
  set[CGOAT_MON.puff] = mon(anim(mb, 'ink0', 'ink1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const cgoat: Monologue = {
  file: 'cgoat',
  title: 'The Coffee Goat in the Breakroom',
  desc: 'The Coffee Goat',
  filler: 'slab',
  legend: {
    '^': 'ceiling',
    '*': 'ceilingLit',
    '.': 'officeWall',
    _: 'base',
    '=': 'carpet',
    t: 'tile',
    K: 'counter',
    U: 'upperCab',
    w: 'microwave',
    k: 'sink',
    y: 'blinds',
    C: 'closet',
    s: 'shelf',
    p: 'shelfPens',
    n: 'shelfNotes',
    d: 'closetDoor',
    e: 'closetDoor2',
    x: 'closetBoxes',
    D: 'bossDoor',
    M: 'bossMug@tile',
    P: 'pot@tile',
    S: 'sugar@officeWall',
    Q: 'creamer@closet',
    $: 'coin@base',
    '&': 'coin@officeWall',
    '(': 'coin@closet',
    b: 'bill@base',
    m: 'mug@base',
    '!': 'spot@base',
  },
  build: (m: MapBuilder) => {
    const W = 64;
    m.row(0, 0, W - 1, '^');
    for (let x = 3; x < W; x += 6) m.set(x, 0, '*');
    m.fill(0, 1, W, 8, '.').row(9, 0, W - 1, '_').row(10, 0, W - 1, '=').row(11, 0, W - 1, 'slab');
    // the way in: the spotlight, a coffee for the road, the HOPE poster
    m.set(2, 9, '!').set(4, 9, 'm').set(2, 4, 'poster');
    // the breakroom counter: the backsplash, the cabinets above, the microwave, the boss's mug,
    // the coffee maker and its pot, the sink; the sugar on top of the cabinets
    m.row(9, 6, 15, 'K').fill(6, 7, 10, 2, 't');
    m.row(6, 6, 9, 'U').row(6, 12, 15, 'U');
    m.set(7, 8, 'M').set(12, 8, 'w').set(15, 8, 'k');
    placePicture(m, 'maker', 10, 7, 1, 2);
    m.set(11, 8, 'P');
    m.set(7, 5, '&').set(14, 5, 'S').set(11, 4, 'notice');
    m.mon(CGOAT_MON.static, 8, 8);
    // the fridge, flung open (its top a ledge); the empty creamer keeps hopping out of it
    placePicture(m, 'fridge', 17, 7, 2, 3);
    m.set(18, 6, '&').set(21, 3, 'y');
    // the soda machine, a coin under the blinds
    placePicture(m, 'vend', 21, 8, 1, 2);
    m.set(23, 9, '$');
    // the supply closet: its shelves (ledges), the powdered creamer on the top one
    m.set(25, 9, 'e').set(25, 8, 'd');
    m.fill(26, 1, 9, 9, 'C');
    m.row(7, 27, 29, 'p').row(4, 30, 33, 'n').row(7, 32, 34, 's');
    m.set(32, 3, 'Q').set(28, 6, '(').set(29, 9, '(');
    m.set(33, 9, 'x').set(34, 9, 'x').set(34, 8, 'x');
    m.mon(CGOAT_MON.static, 27, 9);
    // the coffee that should not fizz
    m.set(36, 9, 'm');
    placePicture(m, 'fizzCup', 39, 8, 2, 2);
    m.set(40, 4, 'thermostat').set(44, 3, 'y');
    // every time he blinks: a goat, a goat, and the third goat from the left (the real one)
    m.mon(CGOAT_MON.mirage, 44, 9).mon(CGOAT_MON.mirage, 49, 9).mon(MON.goat, 55, 9);
    placePicture(m, 'bTable', 45, 9, 2, 1);
    placePicture(m, 'credenza', 50, 9, 2, 1);
    m.set(48, 9, '$').set(52, 9, 'b').set(50, 3, 'y').set(55, 4, 'goatPortrait');
    placePicture(m, 'plant', 58, 8, 1, 2);
    // the boss's door
    m.set(61, 9, 'D').set(61, 8, 'clock');
    m.link(61, 9, 'next');
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: cgoatMonsters,
  song: 'blues',
  clips: { open: 'goat_o', line: 'goat_l', punch: 'goat_p', word: 'goat_w' },
  view: [5, 3],
  card: ['Coffee should not fizz.', 'I see a goat.'],
};
