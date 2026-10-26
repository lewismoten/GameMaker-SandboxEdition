// "The Ants Have Spoken": the listing said "charming fixer-upper with character". Character means
// prehistoric grime, dirt in dimensions science hasn't mapped, a vent of dust from 1978, and the
// ants: they patrol in tiny helmets behind sandbags of stacked crumbs, they unionize (their note
// of demands is on the wall: sugar cubes, no mopping after seven), they strike, picket signs and
// all (you can't beat a union: hop over). He weeps into a roll of paper towels (composure back).
// When night falls the lights come on: the cockroach disco, its king in his white suit, and he
// screams opera (word balloons) and dances a murder ballet. The plot is the means of a someday
// clean kitchen: bleach, rubber gloves, a sponge and a prayer candle; with all four, the cupboard
// opens without a hiss.
//
// Layout (12 rows: the cracked ceiling on row 0, the walking row 9, the linoleum on row 10). The
// counter top (row 7) is a ledge, the fridge is solid (stand on it).
import { Pixels, rng } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing, spotlight } from '../../common/blocks';
import { anim, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { ANTS_MON } from './ids';
import { coinOn } from './street';

/** The last two sets' mugs mend less (common/blocks.ts loot()). */
const LATE = { mugHp: 10 };

/** Things for a clean kitchen someday. */
export const SUPPLIES = 4;

/** The fixer-upper's wallpaper: faded stripes gone yellow, stains, a crack. */
function grimeWall(pal: Pal, seed: number): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20);
  const r = rng(seed);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) p.set(x, y, x % 10 === 0 || (x % 10 === 5 && y % 4 === 0) ? c('grime', 1) : c('grime', r() < 0.07 ? 1 : 2));
  if (seed % 3 === 0) blob(p, 4 + r() * 12, 4 + r() * 12, 2.5, 1.5, pal.r('grime'), 1, 1);
  return p;
}

export function antsBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => grimeWall(pal, seed);
  book.add('kWall', wall(80), AIR);
  const base = wall(81);
  base.rect(0, 15, 20, 5, c('wood', 0)).rect(0, 15, 20, 1, c('wood', 1));
  for (const x of [3, 12, 17]) base.set(x, 17, c('ink', 0));
  book.add('kBase', base, AIR);
  // the linoleum, curling, checkered under the grime
  const lino = new Pixels(20, 20, c('lino', 1));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((Math.floor(x / 5) + Math.floor(y / 5)) % 2) lino.set(x, y, c('lino', 0));
  lino.rect(0, 0, 20, 2, c('lino', 2)).set(14, 1, c('grime', 0)).set(15, 1, c('grime', 0)).set(4, 0, c('grime', 1));
  book.add('lino', lino, { solid: SOLID });
  // the ceiling: cracked plaster with a water stain
  const ceil = new Pixels(20, 20, c('grime', 3));
  blob(ceil, 12, 9, 6, 3, R('grime'), 1, 2);
  ceil.line(0, 4, 6, 7, c('grime', 0)).line(6, 7, 9, 5, c('grime', 0)).rect(0, 18, 20, 2, c('grime', 1));
  book.add('kCeil', ceil, { solid: SOLID });
  // the front door, and the listing on the wall
  {
    const pic = new Pixels(20, 40, T);
    pic.rect(1, 2, 18, 38, c('wood', 2)).frame(1, 2, 18, 38, c('wood', 0)).rect(4, 6, 12, 12, c('wood', 1)).rect(4, 22, 12, 14, c('wood', 1));
    pic.disc(15, 24, 1.2, c('gold', 2)).rect(7, 9, 6, 6, c('sky', 1));
    addPicture(
      book,
      'frontDoor',
      pic,
      (_col, row) => (row ? base : wall(82)),
      () => AIR,
    );
  }
  const listing = wall(83);
  listing.rect(1, 2, 18, 15, c('white', 1)).frame(1, 2, 18, 15, c('red', 1));
  micro(listing, 2, 4, 'FIXR', c('red', 1));
  micro(listing, 2, 10, 'UPPR', c('ink', 1));
  listing.rect(14, 16, 2, 3, c('metal', 0));
  book.add('listing', listing, AIR);
  // the vent: dust since 1978
  const vent = base.crop(0, 0, 20, 20);
  vent.rect(2, 7, 16, 10, c('metal', 0)).frame(2, 7, 16, 10, c('metal', 1));
  for (let y = 9; y < 16; y += 2) vent.rect(4, y, 12, 1, c('ink', 1));
  micro(vent, 3, 1, '1978', c('grime', 0));
  book.add('vent', vent, { ...AIR, birthMon: ANTS_MON.dust, birthTime: 120 });
  // a sandbag wall of stacked crumbs (solid: hop it)
  const bags = base.crop(0, 0, 20, 20);
  for (const [x, y] of [
    [1, 15],
    [8, 15],
    [15, 15],
    [4, 10],
    [11, 10],
    [7, 5],
  ])
    blob(bags, x + 3, y + 2.5, 3.6, 2.6, R('coffee'), 1, 3);
  for (let i = 0; i < 12; i++) bags.set(2 + ((i * 7) % 17), 6 + ((i * 5) % 13), c('yellow', 2));
  book.add('sandbags', bags, { solid: SOLID });
  // the union's note of demands
  {
    const pic = new Pixels(40, 40, T);
    pic.rect(2, 2, 36, 37, c('white', 2)).frame(2, 2, 36, 37, c('white', 0)).line(2, 38, 37, 36, c('white', 0));
    pic.disc(20, 3, 1.5, c('red', 2));
    micro(pic, 6, 5, 'DEMANDS', c('red', 1));
    micro(pic, 4, 12, '1 SUGAR', c('ink', 1));
    micro(pic, 8, 18, 'CUBES', c('ink', 1));
    micro(pic, 4, 24, '2 NO MOP', c('ink', 1));
    micro(pic, 8, 30, 'AFTER 7', c('ink', 1));
    for (const [x, y] of [
      [33, 31],
      [35, 33],
      [31, 34],
    ])
      pic.set(x, y, c('ink', 0));
    addPicture(book, 'demands', pic, wall(84), () => AIR);
  }
  // the counter (its top a ledge), the cabinets under it, the paper towels he weeps into
  const counter = wall(85);
  counter.rect(0, 12, 20, 8, c('wood', 1)).rect(0, 12, 20, 3, c('lino', 2)).rect(0, 15, 20, 1, c('wood', 0));
  book.add('counter', counter, { solid: LEDGE, grav: GRAV.down });
  const cabinet = new Pixels(20, 20, c('wood', 1));
  cabinet.frame(1, 1, 18, 18, c('wood', 0)).rect(3, 3, 14, 14, c('wood', 2)).rect(14, 9, 2, 3, c('metal', 2));
  blob(cabinet, 6, 15, 3, 1.5, R('grime'), 0, 1);
  book.add('cabinet', cabinet, AIR);
  const towel = wall(86);
  towel
    .rect(5, 4, 10, 15, c('white', 2))
    .rect(5, 4, 10, 1, c('white', 1))
    .rect(9, 2, 2, 17, c('metal', 1))
    .rect(5, 11, 10, 1, c('teal', 1))
    .rect(13, 14, 3, 5, c('white', 1));
  book.add('towels', towel, { ...AIR, hp: 20, score: 10, touch: 'kWall' });
  // the fridge (stand on it)
  {
    const pic = new Pixels(20, 40, T);
    pic
      .rect(1, 1, 18, 39, c('white', 1))
      .rect(1, 1, 18, 1, c('white', 2))
      .rect(1, 14, 18, 1, c('gray', 1))
      .rect(15, 5, 2, 6, c('metal', 0))
      .rect(15, 18, 2, 10, c('metal', 0));
    pic.rect(4, 20, 4, 4, c('yellow', 2)).rect(9, 22, 3, 3, c('red', 2));
    blob(pic, 6, 35, 4, 2, R('grime'), 1, 2);
    addPicture(
      book,
      'fridge',
      pic,
      (_col, row) => (row ? base : wall(87)),
      () => ({ solid: SOLID }),
    );
  }
  // the bug disco: the dance floor (it blinks), the mirror ball
  const floor = (f: number) => {
    const p = new Pixels(20, 20, c('ink', 1));
    for (let k = 0; k < 4; k++) {
      const x = (k % 2) * 10;
      const y = Math.floor(k / 2) * 10;
      p.rect(x + 1, y + 1, 8, 8, (k + f) % 2 ? c('neonP', 1) : c('neonC', 1)).rect(x + 2, y + 2, 4, 2, (k + f) % 2 ? c('neonP', 2) : c('neonC', 2));
    }
    return p;
  };
  book.add('disco0', floor(0), { solid: SOLID, next: 'disco1', ntime: 8 });
  book.add('disco1', floor(1), { solid: SOLID, next: 'disco0', ntime: 8 });
  const ball = (f: number) => {
    const p = wall(88);
    p.rect(9, 0, 1, 6, c('metal', 0));
    p.disc(9.5, 11, 5.5, c('metal', 1));
    for (let y = 6; y < 17; y += 2) for (let x = 4; x < 16; x += 2) if (p.get(x, y) === c('metal', 1)) p.set(x + ((y / 2 + f) % 2), y, c('metal', 2));
    for (const [x, y] of f
      ? [
          [2, 4],
          [17, 15],
          [3, 17],
        ]
      : [
          [16, 3],
          [2, 13],
          [15, 18],
        ])
      p.set(x, y, c('neonC', 2)).set(x + 1, y, c('neonP', 2));
    return p;
  };
  // the walls at night, splashed with the mirror ball's spots
  const discoWall = wall(89);
  for (const [x, y, k] of [
    [3, 4, 0],
    [14, 2, 1],
    [9, 11, 1],
    [17, 15, 0],
    [5, 16, 1],
  ])
    discoWall.rect(x, y, 2, 2, k ? c('neonP', 1) : c('neonC', 1));
  book.add('discoWall', discoWall, AIR);
  book.add('ball0', ball(0), { ...AIR, next: 'ball1', ntime: 6 });
  book.add('ball1', ball(1), { ...AIR, next: 'ball0', ntime: 6 });
  // the cupboard that hisses (the last gate), and opened: quiet, clean, sparkling
  const cupboard = (open: boolean) => {
    const p = base.crop(0, 0, 20, 20);
    p.rect(1, 2, 18, 18, c('wood', 1)).frame(1, 2, 18, 18, c('wood', 0));
    if (open) {
      p.rect(3, 4, 14, 14, c('white', 2)).rect(3, 11, 14, 1, c('white', 0));
      for (const [x, y] of [
        [6, 7],
        [13, 14],
        [11, 6],
      ])
        p.set(x, y - 1, c('gold', 3))
          .set(x - 1, y, c('gold', 3))
          .set(x, y, c('gold', 3))
          .set(x + 1, y, c('gold', 3))
          .set(x, y + 1, c('gold', 3));
    } else {
      p.rect(9, 3, 1, 16, c('wood', 0)).rect(3, 4, 5, 14, c('wood', 2)).rect(11, 4, 6, 14, c('wood', 2));
      p.rect(7, 9, 1, 2, c('metal', 2)).rect(11, 9, 1, 2, c('metal', 2));
      p.set(9, 12, c('red', 3)).set(10, 12, c('red', 3)).set(9, 14, c('red', 3)).set(10, 14, c('red', 3));
      micro(p, 2, 0, 'SSS', c('white', 2));
    }
    return p;
  };
  book.add('cupboardOpen', cupboard(true), { grav: GRAV.none });
  gate(book, 'cupboard', cupboard(false), 'cupboardOpen', SUPPLIES);
  // the supplies: bleach, rubber gloves, a sponge, a prayer candle
  plotThing(book, 'kWall', 'bleach', (p) => {
    p.rect(6, 6, 9, 13, c('white', 2)).rect(8, 3, 4, 3, c('teal', 1)).rect(6, 10, 9, 5, c('teal', 2)).rect(13, 7, 3, 3, c('white', 1));
    micro(p, 7, 10, 'B', c('white', 2));
  });
  plotThing(book, 'kWall', 'gloves', (p) => {
    for (const x of [4, 11])
      p.rect(x, 8, 5, 10, c('yellow', 2))
        .rect(x, 4, 1, 4, c('yellow', 2))
        .rect(x + 1, 3, 1, 5, c('yellow', 2))
        .rect(x + 2, 3, 1, 5, c('yellow', 2))
        .rect(x + 3, 4, 1, 4, c('yellow', 2))
        .rect(x, 16, 5, 2, c('yellow', 1));
  });
  plotThing(book, 'kWall', 'sponge', (p) => {
    p.rect(4, 10, 12, 8, c('yellow', 2)).rect(4, 8, 12, 3, c('green', 2));
    for (const [x, y] of [
      [6, 13],
      [10, 15],
      [13, 12],
    ])
      p.set(x, y, c('yellow', 0));
  });
  plotThing(book, 'kBase', 'candle', (p) => {
    p.rect(6, 7, 8, 12, c('white', 1)).rect(7, 9, 6, 7, c('purple', 1)).rect(9, 10, 2, 5, c('gold', 2)).rect(8, 12, 4, 1, c('gold', 2));
    p.rect(9, 4, 2, 3, c('gold', 3)).set(9, 3, c('gold', 2));
  });
  loot(book, pal, 'kBase', LATE);
  coinOn(book, pal, 'kWall');
  spotlight(book, pal, 'kBase');
}

export function antsSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // a dust bunny from 1978: a gray fluff with ears and a scowl
  const dust = (f: number) => {
    const p = P();
    for (let k = 0; k < 16; k++) p.disc(10 + Math.cos(k) * 5, 14 - f + Math.sin(k * 1.3) * 3, 2, c('gray', 1 + (k % 2)));
    p.line(7, 10 - f, 6, 5 - f, c('gray', 2)).line(12, 10 - f, 13, 5 - f, c('gray', 2));
    face(p, pal, 10, 13 - f, { angry: true });
    return outline(p, ink);
  };
  book.add('dust0', dust(0), hurts(-3));
  book.add('dust1', dust(2), hurts(-3));
  // an ant: three segments, six legs, a tiny helmet (and a crumb, or a picket sign)
  const ant = (f: number, sign: boolean) => {
    const p = P();
    const y = 15;
    for (const [x, r] of [
      [4, 2.6],
      [9, 2],
      [14, 3.2],
    ])
      p.disc(x, y - (x === 14 ? 1 : 0), r, c('red', 0));
    p.set(13, y - 2, c('red', 2)).set(4, y - 1, c('red', 1));
    for (let k = 0; k < 3; k++) p.line(7 + k * 2, y + 1, 5 + k * 3 + (f ? 1 : -1) * (k % 2 ? 1 : -1), 19, ink);
    p.line(15, y - 4, 17, y - 7, ink).line(16, y - 4, 19, y - 6, ink);
    p.rect(12, y - 5, 5, 2, c('green', 1)).rect(11, y - 3, 7, 1, c('green', 0));
    p.set(15, y - 1, c('white', 2));
    if (sign) {
      // NO MOP takes the whole block (a 1px word gap): the sign has no side borders, and its
      // back (the other frame, as it turns) shows the words through the board, mirrored
      p.line(9, y - 2, 9, 3, c('wood', 1))
        .rect(0, 1, 20, 7, c('white', 2))
        .rect(0, 1, 20, 1, c('red', 1))
        .rect(0, 7, 20, 1, c('red', 1));
      if (f) {
        micro(p, 1, 2, 'NO', c('red', 1));
        micro(p, 9, 2, 'MOP', c('red', 1));
      } else {
        micro(p, 12, 2, 'ON', c('red', 1));
        p.rect(1, 3, 9, 2, c('red', 1));
      }
    } else p.rect(1, y - 6, 4, 3, c('yellow', 2));
    return outline(p, ink);
  };
  book.add('ant0', ant(0, false), hurts(-4));
  book.add('ant1', ant(1, false), hurts(-4));
  book.add('picket0', ant(0, true), hurts(-4));
  book.add('picket1', ant(1, true), hurts(-4));
  // a disco cockroach, dancing (arms up, arms down)
  const roach = (f: number, king: 0 | 1 | 2) => {
    const p = P();
    blob(p, 10, 13, 5, 6, pal.r('coffee'), 1, 3);
    p.line(10, 8, 10, 19, c('coffee', 0));
    p.line(8, 7, 5 - f * 2, 1, ink).line(12, 7, 15 + f * 2, 1, ink);
    p.line(5, 12, 1, f ? 7 : 15, ink)
      .line(15, 12, 19, f ? 15 : 7, ink)
      .line(6, 17, 3, 19, ink)
      .line(14, 17, 17, 19, ink);
    if (king) {
      p.rect(6, 12, 9, 7, c('white', 2)).rect(10, 12, 1, 7, c('white', 0)).rect(9, 12, 3, 1, c('red', 2));
      if (king === 1) p.rect(6, 3, 9, 2, c('white', 2)).rect(7, 0, 7, 3, c('white', 2)).rect(7, 2, 7, 1, c('ink', 1));
    }
    face(p, pal, 10, 9, { grin: king !== 2, angry: king === 2 });
    return outline(p, ink);
  };
  book.add('roach0', roach(0, 0), hurts(-5));
  book.add('roach1', roach(1, 0), hurts(-5));
  book.add('king0', roach(0, 1), hurts(-6));
  book.add('king1', roach(1, 1), hurts(-6));
  book.add('kingB0', roach(0, 2), hurts(-6));
  book.add('kingB1', roach(1, 2), hurts(-6));
}

function antsMonsters(set: Monster[], mb: SpriteBook): void {
  set[ANTS_MON.dust] = mon(anim(mb, 'dust0', 'dust1', 4), { power: POWER.foe, thru: 1, end: -1, newmon: ANTS_MON.poof }, [
    corner(0, 0, 2),
    corner(-6, 0, 2, 4),
  ]);
  set[ANTS_MON.ant] = mon(anim(mb, 'ant0', 'ant1', 3), { power: POWER.foe, thru: 1, newmon: ANTS_MON.poof }, pace(2, 1));
  set[ANTS_MON.picket] = mon(anim(mb, 'picket0', 'picket1', 12), { power: POWER.tough, thru: 1 }, pace(2, 1));
  set[ANTS_MON.roach] = mon(anim(mb, 'roach0', 'roach1', 4), { power: POWER.foe, thru: 1, newmon: ANTS_MON.poof }, pace(2, 2));
  set[ANTS_MON.king] = mon(anim(mb, 'king0', 'king1', 6), { power: POWER.foe, thru: 1, newmon: ANTS_MON.king2 }, pace(1, 1));
  set[ANTS_MON.king2] = mon(anim(mb, 'kingB0', 'kingB1', 3), { power: POWER.foe, thru: 1, newmon: ANTS_MON.poof }, pace(2, 2));
  set[ANTS_MON.poof] = mon(anim(mb, 'poof0', 'poof1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const ants: Monologue = {
  file: 'ants',
  title: 'The Ants Have Spoken',
  desc: 'Ants Have Spoken',
  filler: 'soil',
  // night falls, the lights come on: the house dim, the disco glowing
  light: {
    sky: [
      [8, 8, 30],
      [60, 50, 100],
      [30, 24, 60],
    ],
    mul: [0.7, 0.68, 0.82],
    add: [4, 0, 14],
  },
  legend: {
    '^': 'kCeil',
    '.': 'kWall',
    _: 'kBase',
    '=': 'lino',
    '#': 'soil',
    v: 'vent',
    S: 'sandbags',
    l: 'listing',
    T: 'counter',
    u: 'cabinet',
    t: 'towels',
    d: 'disco0',
    D: 'discoWall',
    o: 'ball0',
    $: 'coin@kBase',
    '%': 'bill@kBase',
    m: 'mug@kBase',
    '&': 'coin@kWall',
    '!': 'spot@kBase',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the kitchen past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 13;
    const W = 66 + OFF;
    m.row(0, 0, W - 1, '^')
      .fill(0, 1, W, 8, '.')
      .row(9, 0, W - 1, '_')
      .row(10, 0, W - 1, '=')
      .row(11, 0, W - 1, '#');
    // the front door, the listing, the spotlight, the vent of 1978
    placePicture(m, 'frontDoor', 0, 8, 1, 2);
    m.set(3, 6, 'l').set(2, 9, '!').set(4, 9, '$');
    m.set(8, 9, 'v');
    // the trenches: crumb sandbags, ants on patrol, coins on the bags
    m.set(12, 9, 'S').set(18, 9, 'S').set(24, 9, 'S');
    m.set(12, 8, '&').set(18, 8, '&');
    m.mon(ANTS_MON.ant, 14, 9).mon(ANTS_MON.ant, 20, 9);
    m.set(22, 9, '$');
    m.mon(MON.carl, 17, 4);
    // the union's demands, the counter, the paper towels, the bleach
    placePicture(m, 'demands', 27, 2, 2, 2);
    m.row(7, 29, 34, 'T').fill(29, 8, 6, 2, 'u');
    m.set(30, 6, 't').set(33, 6, 'bleach');
    m.set(36, 9, '%');
    // the picket line (gloves over it), the fridge (a sponge on it)
    m.mon(ANTS_MON.picket, 38, 9);
    m.set(39, 5, 'gloves');
    placePicture(m, 'fridge', 43, 8, 1, 2);
    m.set(43, 7, 'sponge');
    m.set(45, 9, 'm');
    // night: the bug disco, its mirror ball, the roaches, their king, the prayer candle
    m.row(10, 47, 59, 'd').fill(47, 1, 13, 8, 'D');
    m.set(53, 1, 'o');
    m.mon(ANTS_MON.roach, 48, 9).mon(ANTS_MON.roach, 55, 9);
    m.set(52, 9, 'candle').set(50, 9, '$').set(58, 9, '$');
    m.mon(ANTS_MON.king, 60, 9);
    // the cupboard that hisses
    m.set(63, 9, 'cupboard');
    m.link(63 + OFF, 9, 'next');
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: antsMonsters,
  song: 'home',
  clips: { open: 'ants_o', line: 'ants_l', punch: 'ants_p', word: 'ants_w' },
  view: [9, 4],
  card: ["They didn't march.", 'They patrolled.'],
};
