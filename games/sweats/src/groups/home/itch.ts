// "Janet, This Is Not About You (It's About the Itch)": the forbidden itch, deep in the left
// nostril, just past dignity: a tickle like a ghost with a feather who held a personal grudge.
// The epic (PG, cartoonish): at Janet's dinner table the fake scratch ("Interesting idea,
// Janet"), the napkin ninja folding his napkin thirteen times, the hall mirror where his own
// reflection shakes its head; out the door to the lot behind the bank: the toddler in his
// stroller staring, someone else's eyebrow hair (still unexplained), the onlookers' TSKs, the
// HONK of the horn, the itch's ghosts bobbing; the dumpster to climb. With the napkin, the keys,
// the tinted glasses and the hand sanitizer, the car parked behind the bank opens: alone at
// last, he strikes gold. Pick with pride. Just maybe sanitize after.
//
// Layout (12 rows): indoors (x 0..17) the ceiling on row 0, the floor on row 10, the table top a
// ledge on row 7; outdoors (x 18..) the sky over the bank's brick back wall, the asphalt lot on
// rows 10..11. The poet walks row 9.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob, shadeAt } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Lighting, Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, SOLID, gate, loot, plotThing } from '../../common/blocks';
import { anim, bob, corner, mon, pace, still } from '../../common/characters';
import type { MapBuilder } from '../../common/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { houseMonsters, wallpaper } from './house';
import { ITCH_MON } from './ids';

/** The napkin, the car keys, the tinted glasses, the hand sanitizer. */
export const KIT = 4;

/** A clear afternoon over the lot. */
export const AFTERNOON: Lighting = { sky: [[70, 120, 200], [214, 232, 250], [140, 184, 236]], mul: [1, 1, 1], add: [0, 0, 0] };

/** The bank's brick back wall (`curb`: the walking row, a strip of sidewalk at its foot). */
function brickWall(pal: Pal, seed: number, curb: boolean): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20);
  const r = rng(seed);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const row = Math.floor(y / 5);
      const mortar = y % 5 === 4 || (x + (row % 2) * 5) % 10 === 9;
      p.set(x, y, mortar ? c('grey', 2) : c('brick', r() < 0.15 ? 0 : r() < 0.2 ? 2 : 1));
    }
  if (curb) p.rect(0, 15, 20, 5, c('grey', 2)).rect(0, 15, 20, 1, c('grey', 3)).rect(0, 19, 20, 1, c('grey', 1));
  return p;
}

export function itchBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => wallpaper(pal, seed);
  // outdoors: the sky, the brick, the asphalt
  const sky = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) sky.set(x, y, shadeAt(pal.r('sky'), 1, 4, y / 20, x, y));
  book.add('sky', sky, AIR);
  const roofline = brickWall(pal, 70, false);
  roofline.rect(0, 0, 20, 4, c('grey', 1)).rect(0, 0, 20, 1, c('grey', 3)).rect(0, 4, 20, 1, c('ink', 1));
  book.add('brickTop', roofline, AIR);
  book.add('brick', brickWall(pal, 71, false), AIR);
  book.add('brickB', brickWall(pal, 72, true), AIR);
  const lot = new Pixels(20, 20);
  const r = rng(73);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) lot.set(x, y, c('asphalt', r() < 0.3 ? 0 : 1));
  lot.rect(0, 0, 20, 1, c('asphalt', 2)).rect(8, 4, 12, 2, c('yellow', 1));
  book.add('lot', lot, { solid: SOLID });
  loot(book, pal, 'brickB');
  // the bank's sign over its back door, in stone
  {
    const pic = new Pixels(60, 20, 255);
    pic.rect(2, 2, 56, 16, c('grey', 3)).frame(2, 2, 56, 16, c('grey', 1)).rect(4, 4, 52, 1, c('white', 2));
    micro(pic, 8, 6, 'BANK', c('navy', 0), 2);
    micro(pic, 41, 8, 'EST', c('grey', 1));
    addPicture(book, 'bank', pic, brickWall(pal, 74, false), () => AIR);
  }
  // the dumpster behind the bank (solid: climb it)
  {
    const pic = new Pixels(40, 20, 255);
    pic.rect(1, 3, 38, 15, c('green', 1)).rect(1, 3, 38, 2, c('green', 2)).rect(0, 1, 40, 3, c('green', 0));
    for (let x = 6; x < 36; x += 8) pic.rect(x, 7, 2, 9, c('green', 0));
    pic.rect(3, 18, 3, 2, c('ink', 0)).rect(34, 18, 3, 2, c('ink', 0));
    addPicture(book, 'dumpster', pic, brickWall(pal, 75, true), () => ({ solid: SOLID }));
  }
  // the car, parked behind the bank: windows slightly tinted; its door is the gate
  const car = new Pixels(60, 40, 255);
  {
    // the body, the roof and the tinted glass, the wheels
    car.rect(2, 20, 56, 13, c('teal', 1)).rect(2, 20, 56, 2, c('teal', 2)).rect(2, 31, 56, 2, c('teal', 0));
    for (let y = 6; y < 20; y++) {
      const inset = Math.max(0, 12 - Math.floor(y * 1.0));
      car.rect(12 + inset, y, 34 - inset * 2 + Math.floor(inset / 2), 1, c('teal', 1));
    }
    car.rect(16, 9, 12, 10, c('night', 1)).rect(31, 9, 12, 10, c('night', 1)).rect(29, 8, 2, 12, c('teal', 1));
    car.line(17, 10, 21, 10, c('night', 3)).line(32, 10, 35, 10, c('night', 3));
    car.rect(55, 22, 3, 4, c('yellow', 2)).rect(2, 22, 2, 4, c('red', 2)).rect(28, 23, 4, 1, c('metal', 2));
    for (const wx of [13, 47]) car.disc(wx, 33, 6, c('ink', 0)).disc(wx, 33, 3, c('metal', 1)).disc(wx, 33, 1, c('metal', 0));
  }
  const back = (_col: number, row: number) => (row === 0 ? brickWall(pal, 76, false) : brickWall(pal, 77, true));
  addPicture(book, 'car', car, back, (col) => ({ ...AIR, ...(col === 2 ? { birthMon: ITCH_MON.honk, birthTime: 150 } : {}) }));
  const door = (open: boolean) => {
    const p = book.pics.get('car.1.1')!.crop(0, 0, 20, 20);
    if (open) {
      // the door open, alone at last: he strikes gold
      p.rect(2, 0, 16, 12, c('ink', 1)).rect(2, 0, 2, 12, c('teal', 2));
      for (const [x, y] of [[9, 4], [13, 7], [7, 9], [12, 2]]) p.set(x, y, c('gold', 3)).set(x - 1, y, c('gold', 2)).set(x + 1, y, c('gold', 2)).set(x, y - 1, c('gold', 2)).set(x, y + 1, c('gold', 2));
    } else p.rect(6, 4, 6, 1, c('metal', 2));
    return p;
  };
  book.add('carOpen', door(true), { grav: GRAV.none });
  gate(book, 'carDoor', door(false), 'carOpen', KIT);
  // indoors: Janet at the dinner table (she judges: TSK), the hall mirror, the door out
  {
    const pic = new Pixels(20, 40, 255);
    blob(pic, 10, 33, 8, 9, R('teal'), 0, 2);
    blob(pic, 10, 15, 6, 7, R('skin'), 1, 4);
    blob(pic, 10, 9, 7.5, 5, R('hair'), 0, 2);
    pic.rect(3, 9, 3, 12, c('hair', 1)).rect(14, 9, 3, 12, c('hair', 1));
    pic.set(7, 15, c('ink', 0)).set(13, 15, c('ink', 0)).line(6, 13, 8, 13, c('ink', 0)).line(12, 12, 14, 13, c('ink', 0));
    pic.rect(8, 19, 4, 1, c('red', 1)).set(9, 24, c('gold', 3)).set(10, 25, c('gold', 3));
    addPicture(book, 'janet', pic, wall(78), (_c, row) => (row === 0 ? { ...AIR, birthMon: ITCH_MON.tsk, birthTime: 140 } : AIR));
  }
  const mirror = wall(79);
  mirror.rect(3, 1, 14, 18, c('wood', 3)).rect(5, 3, 10, 14, c('ice', 2));
  for (let y = 4; y < 16; y++) mirror.set(5 + ((y * 3) % 9), y, c('white', 2));
  // his reflection: the bald dome, the beard, shaking its head
  blob(mirror, 10, 10, 3.2, 3.4, R('skin'), 1, 4);
  mirror.set(9, 10, c('ink', 0)).set(11, 10, c('ink', 0)).rect(9, 13, 3, 2, c('hair', 0)).line(6, 8, 7, 7, c('ink', 0)).line(14, 8, 13, 7, c('ink', 0));
  mirror.rect(7, 15, 7, 2, c('white', 2));
  book.add('mirror', mirror, AIR);
  const out = wall(80);
  out.rect(2, 0, 16, 20, c('spot', 1)).rect(2, 0, 2, 20, c('wood', 2)).rect(16, 0, 2, 20, c('wood', 2)).rect(4, 12, 12, 8, c('green', 1));
  book.add('doorOut', out, AIR);
  // the kit
  plotThing(book, 'wall', 'kit1', (p) => {
    // the napkin, folded fifteen times, to the size of a cork
    p.rect(7, 12, 6, 6, c('white', 2)).line(7, 12, 12, 17, c('white', 0)).rect(7, 17, 6, 1, c('white', 0));
    for (const [x, y] of [[4, 8], [15, 9], [10, 6]]) p.set(x, y, c('gold', 3));
  });
  plotThing(book, 'brickB', 'kit2', (p) => {
    // the car keys on their ring
    p.ring(7, 9, 3, c('metal', 2)).rect(9, 10, 8, 3, c('metal', 2)).rect(14, 13, 2, 2, c('metal', 1)).rect(11, 13, 1, 2, c('metal', 1));
    p.rect(3, 11, 4, 5, c('ink', 1)).set(4, 12, c('red', 2));
  });
  plotThing(book, 'brickB', 'kit3', (p) => {
    // the tinted glasses
    p.rect(3, 9, 6, 4, c('ink', 0)).rect(11, 9, 6, 4, c('ink', 0)).rect(9, 9, 2, 1, c('ink', 0)).line(2, 9, 1, 7, c('ink', 0)).line(17, 9, 18, 7, c('ink', 0));
    p.set(4, 10, c('night', 3)).set(12, 10, c('night', 3));
  });
  plotThing(book, 'brick', 'kit4', (p) => {
    // the hand sanitizer: just maybe sanitize after
    p.rect(6, 8, 8, 11, c('ice', 2)).rect(7, 10, 6, 8, c('ice', 1)).rect(8, 4, 4, 4, c('white', 2)).rect(11, 4, 4, 1, c('white', 2));
    p.rect(7, 13, 6, 3, c('white', 2)).set(9, 14, c('teal', 0)).set(10, 14, c('teal', 0));
  });
}

export function itchSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // the itch: a little ghost with a feather and a personal grudge
  const ghost = (f: number) => {
    const p = P();
    blob(p, 10, 9, 6, 6, pal.r('white'), 1, 2);
    p.rect(4, 9, 13, 6, c('white', 2));
    for (let x = 4; x < 17; x += 3) p.rect(x, 15, 2, 2 + ((x + f) % 2), c('white', 1));
    face(p, pal, 10, 8, { angry: true });
    // the feather, waving
    p.line(15, 11, 19, 4 + f * 2, c('pink', 2)).line(16, 10, 18, 6 + f * 2, c('pink', 1)).line(17, 11, 19, 7 + f * 2, c('pink', 1));
    return outline(p, ink);
  };
  book.add('ghost0', ghost(0), hurts(-5));
  book.add('ghost1', ghost(1), hurts(-5));
  // a judging look: TSK
  const tsk = (f: number) => {
    const p = P();
    p.rect(1, 4 + f, 18, 9, c('teal', 1)).rect(2, 5 + f, 16, 7, c('white', 2));
    p.set(15, 13 + f, c('teal', 1)).set(16, 14 + f, c('teal', 1));
    micro(p, 4, 6 + f, 'TSK', c('teal', 0));
    return outline(p, ink);
  };
  book.add('tsk0', tsk(0), hurts(-3));
  book.add('tsk1', tsk(1), hurts(-3));
  // someone else's eyebrow hair, wriggling (still unexplained)
  const brow = (f: number) => {
    const p = P();
    for (let x = 2; x < 18; x++) p.rect(x, 13 + Math.round(Math.sin(x * 0.7 + f * 2) * 2), 1, 2, c('hair', 0));
    p.disc(17, 13 + Math.round(Math.sin(17 * 0.7 + f * 2) * 2), 1.6, c('hair', 0));
    p.set(16, 12 + Math.round(Math.sin(16 * 0.7 + f * 2) * 2), c('white', 2));
    return outline(p, ink);
  };
  book.add('brow0', brow(0), hurts(-4));
  book.add('brow1', brow(1), hurts(-4));
  // HONK
  const honk = (f: number) => {
    const p = P();
    p.rect(1, 5 + f, 18, 9, c('yellow', 2)).rect(2, 6 + f, 16, 7, c('white', 2));
    for (let k = 0; k < 3; k++) p.set(19, 6 + k * 3 + f, c('yellow', 2));
    micro(p, 2, 7 + f, 'HONK', c('red', 1));
    return outline(p, ink);
  };
  book.add('honk0', honk(0), hurts(-3));
  book.add('honk1', honk(1), hurts(-3));
  // the toddler in his stroller, making direct eye contact (hop over him)
  const toddler = (f: number) => {
    const p = P();
    p.rect(3, 9, 13, 6, c('red', 1)).rect(3, 9, 13, 1, c('red', 2)).line(3, 9, 6, 3, c('red', 1)).line(6, 3, 11, 3, c('red', 1));
    blob(p, 11, 7, 3.2, 3.2, pal.r('skin'), 1, 4);
    p.set(10 + f, 7, c('ink', 0)).set(12 + f, 7, c('ink', 0)).set(11, 9, c('ink', 0)).set(11, 4, c('yellow', 2));
    p.line(16, 9, 18, 5, c('metal', 1));
    for (const x of [5, 14]) p.disc(x, 17, 2.2, c('ink', 0)).set(x, 17, c('metal', 2));
    return outline(p, ink);
  };
  book.add('toddler0', toddler(0), hurts(0));
  book.add('toddler1', toddler(1), hurts(0));
}

export function itchMonsters(set: Monster[], mb: SpriteBook): void {
  houseMonsters(set, mb);
  set[ITCH_MON.ghost] = mon(anim(mb, 'ghost0', 'ghost1', 6), { power: POWER.foe, thru: 1, newmon: ITCH_MON.fluff }, bob(2, 1));
  set[ITCH_MON.tsk] = mon(anim(mb, 'tsk0', 'tsk1', 8), { power: POWER.foe, thru: 1, end: -1, newmon: ITCH_MON.fluff }, [corner(0, 0, 1), corner(-1, 1, 1), corner(-6, 1, 1, 4)]);
  set[ITCH_MON.brow] = mon(anim(mb, 'brow0', 'brow1', 4), { power: POWER.foe, thru: 1, newmon: ITCH_MON.fluff }, pace(3, 1));
  set[ITCH_MON.honk] = mon(anim(mb, 'honk0', 'honk1', 4), { power: POWER.foe, thru: 1, end: -1, newmon: ITCH_MON.fluff }, [corner(0, 0, 2), corner(-1, 1, 2), corner(-10, 1, 2, 4)]);
  set[ITCH_MON.toddler] = mon(anim(mb, 'toddler0', 'toddler1', 20), { power: POWER.tough, thru: 1 }, still);
}

export const itch: Monologue = {
  file: 'itch',
  title: 'Janet, This Is Not About You (It’s About the Itch)',
  desc: 'The Itch',
  light: AFTERNOON,
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
    M: 'mirror',
    o: 'doorOut',
    s: 'sky',
    r: 'brickTop',
    k: 'brick',
    K: 'brickB',
    a: 'lot',
    D: 'carDoor',
    $: 'coin@wallB',
    '%': 'coin@brickB',
    b: 'bill@wallB',
    B: 'bill@brickB',
    m: 'mug@wallB',
    n: 'mug@brickB',
    '!': 'spot@wallB',
  },
  build: (m: MapBuilder) => {
    const W = 64;
    const IN = 18;
    // indoors: Janet's dining room
    m.row(0, 0, IN - 1, '^').set(5, 0, '*').set(14, 0, '*');
    m.fill(0, 1, IN, 8, '.').row(9, 0, IN - 1, '_').row(10, 0, IN - 1, '=').row(11, 0, IN - 1, '#');
    // outdoors: the sky, the bank's brick back wall, the lot
    m.fill(IN, 0, W - IN, 3, 's').row(3, IN, W - 1, 'r').fill(IN, 4, W - IN, 5, 'k').row(9, IN, W - 1, 'K').fill(IN, 10, W - IN, 2, 'a');
    m.set(2, 9, '!');
    placePicture(m, 'win', 3, 3, 2, 2);
    // the dinner table: Janet (TSK), the napkin to fold, an itch ghost over the table
    m.row(7, 6, 13, 'T').fill(6, 8, 8, 2, 'u').col(7, 8, 9, 'l').col(12, 8, 9, 'l');
    placePicture(m, 'janet', 11, 5, 1, 2);
    m.set(8, 6, 'c').set(13, 6, 'kit1');
    m.mon(ITCH_MON.ghost, 9, 6);
    m.set(15, 9, 'm').set(15, 4, 'M');
    m.set(17, 9, 'o');
    // the lot behind the bank: the toddler, the keys, the eyebrow hair, the tinted glasses
    m.set(20, 9, '%');
    m.mon(ITCH_MON.toddler, 23, 9);
    m.set(26, 9, 'kit2').set(28, 9, 'B');
    placePicture(m, 'bank', 29, 5, 3, 1);
    m.mon(ITCH_MON.brow, 32, 9);
    m.set(37, 9, 'kit3');
    m.mon(ITCH_MON.ghost, 40, 9);
    m.set(41, 9, '%');
    // the dumpster: climb it for the sanitizer; Carl buzzing over it
    placePicture(m, 'dumpster', 44, 9, 2, 1);
    m.set(45, 8, 'kit4');
    m.mon(MON.carl, 46, 7);
    m.set(48, 9, 'n');
    m.mon(ITCH_MON.ghost, 53, 9);
    m.set(51, 9, '%');
    // the car (it honks); its door the gate
    placePicture(m, 'car', 56, 8, 3, 2);
    m.set(57, 9, 'D');
    m.link(57, 9, 'next');
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: itchMonsters,
  song: 'chase',
  clips: { open: 'itch_o', line: 'itch_l', punch: 'itch_p', word: 'itch_w' },
  view: [12, 3],
  card: ['Pick with pride.', 'Just maybe sanitize after.'],
};
