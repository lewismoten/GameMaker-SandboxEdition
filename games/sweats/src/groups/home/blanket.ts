// "She Took the Blanket (and Left My Soul on the Floor)": she knew he sleeps cold. The weighted,
// double-stitched blanket, their burrito of warmth through the flu and the flat-pack furniture;
// she left, and she took it ("that was metaphorical"). The epic, by night through the house:
// the armchair and the throw pillow he sobbed into, the photo of the burrito of warmth, the
// half-built flat-pack bookcase and its hopping allen keys, the dish towel he curled round,
// the cold radiator, chills drifting in off the windows, and the new blanket with the stupid
// built-in foot pocket (it doesn't know his scent) in three stages. Five pieces of his soul lie
// on the floor; with all of them, the colder side of the bed turns down for him.
//
// Layout (12 rows: the ceiling on row 0, the floor on row 10): the poet walks row 9; the
// bookcase is a solid cabinet with two ledges of shelf above it.
import { Pixels } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Lighting, Pal } from '../../art/pal';
import { AIR, BlockBook, LEDGE, SOLID, GRAV, gate, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../common/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { houseMonsters, wallpaper } from './house';
import { BLANKET_MON } from './ids';

/** Pieces of his soul to gather off the floor. */
export const SOULS = 5;

/** Night: the house in blue moonlight. */
export const NIGHT: Lighting = { sky: [[6, 8, 26], [60, 70, 120], [24, 30, 60]], mul: [0.66, 0.74, 0.98], add: [0, 4, 22] };

export function blanketBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => wallpaper(pal, seed);
  // the thermostat: 58, and dropping
  const thermo = wall(30);
  thermo.rect(5, 4, 10, 12, c('white', 1)).frame(5, 4, 10, 12, c('grey', 1)).rect(7, 6, 6, 5, c('ice', 1));
  micro(thermo, 7, 7, '58', c('night', 0));
  thermo.disc(10, 13, 1.4, c('red', 1));
  book.add('thermo', thermo, AIR);
  // the armchair and the throw pillow he sobbed into (it smells like betrayal and air freshener)
  {
    const pic = new Pixels(40, 40, 255);
    blob(pic, 20, 14, 15, 13, R('couch'), 0, 3);
    pic.rect(4, 22, 32, 12, c('couch', 2)).rect(4, 22, 32, 2, c('couch', 3));
    blob(pic, 5, 24, 4, 7, R('couch'), 1, 3);
    blob(pic, 35, 24, 4, 7, R('couch'), 1, 3);
    for (const x of [7, 31]) pic.rect(x, 34, 3, 6, c('wood', 1));
    // the throw pillow, tear-stained
    blob(pic, 20, 17, 7, 5, R('quilt'), 1, 3);
    pic.set(14, 12, c('quilt', 3)).set(26, 12, c('quilt', 3)).set(14, 22, c('quilt', 3)).set(26, 22, c('quilt', 3));
    for (const [x, y] of [[18, 16], [20, 18], [22, 15], [19, 20]]) pic.set(x, y, c('ice', 1));
    addPicture(book, 'chair', pic, (col, row) => (row ? wall(31 + col) : wall(33 + col)), (_col, row) => (row ? { solid: SOLID } : AIR));
  }
  // the photo on the wall: the burrito of warmth (two heads out of one rolled-up blanket)
  {
    const pic = new Pixels(40, 20, 255);
    pic.rect(2, 2, 36, 16, c('wood', 3)).rect(4, 4, 32, 12, c('night', 3));
    blob(pic, 20, 12, 13, 4, R('quilt'), 1, 3);
    for (let x = 9; x < 32; x += 4) pic.line(x, 9, x + 2, 15, c('quilt', 1));
    blob(pic, 15, 8, 2.6, 2.6, R('skin'), 1, 4);
    blob(pic, 25, 8, 2.6, 2.6, R('skin'), 1, 4);
    pic.rect(23, 5, 5, 2, c('hair', 2)).set(14, 8, c('ink', 0)).set(16, 8, c('ink', 0)).set(24, 8, c('ink', 0)).set(26, 8, c('ink', 0));
    pic.disc(20, 6, 1.2, c('red', 2));
    addPicture(book, 'photo', pic, wall(35), () => AIR);
  }
  // the flat-pack bookcase, half built and leaning: a cabinet (solid), two shelves (ledges)
  {
    const pic = new Pixels(40, 60, 255);
    const lean = (y: number) => Math.round((60 - y) / 12);
    for (let y = 0; y < 60; y++) {
      const d = lean(y);
      pic.rect(3 + d, y, 3, 1, c('wood', 3)).rect(34 + d, y, 3, 1, c('wood', 2));
      if (y > 2) pic.rect(6 + d, y, 28, 1, c('wood', 0));
    }
    // the planks: the top, the middle shelf, the cabinet's top
    for (const y of [0, 20, 40]) pic.rect(2 + lean(y), y, 36, 3, c('wood', 4)).rect(2 + lean(y), y + 3, 36, 1, c('wood', 1));
    // the flu: a box of tissues; the books; the cabinet door hanging off one hinge, the screws
    pic.rect(9, 11, 9, 7, c('ice', 2)).rect(12, 9, 3, 2, c('white', 2));
    for (const [x, h, k] of [[22, 13, 'red'], [25, 11, 'teal'], [28, 14, 'gold']] as const) pic.rect(x, 39 - h, 3, h, c(k, 1)).rect(x, 39 - h, 1, h, c(k, 2));
    pic.line(9, 44, 21, 58, c('wood', 3)).line(10, 44, 22, 58, c('wood', 2)).line(21, 44, 9, 58, c('wood', 1));
    for (const x of [26, 29, 32]) pic.set(x, 56, c('metal', 2)).set(x, 57, c('metal', 1));
    addPicture(book, 'case', pic, wall(36), (_col, row) => (row === 2 ? { solid: SOLID } : { solid: LEDGE, grav: GRAV.down }));
  }
  // the instructions: STEP 1 OF 94
  const sheet = wall(37);
  sheet.rect(3, 2, 14, 16, c('white', 2)).frame(3, 2, 14, 16, c('grey', 1));
  micro(sheet, 4, 3, 'STEP', c('ink', 0));
  micro(sheet, 4, 9, '1/94', c('red', 1));
  sheet.rect(5, 15, 8, 1, c('grey', 1)).line(9, 14, 11, 12, c('grey', 1));
  book.add('sheet', sheet, AIR);
  // the dish towel he curled round, on its hook
  const towel = wall(38);
  towel.rect(8, 2, 4, 2, c('metal', 2)).rect(5, 4, 10, 13, c('white', 2));
  for (let y = 6; y < 17; y += 3) towel.rect(5, y, 10, 1, c('red', 1));
  towel.rect(5, 16, 10, 1, c('white', 0));
  book.add('towel', towel, AIR);
  // the radiator: stone cold, frosted over (solid: hop over it)
  const rad = wall(39);
  rad.rect(0, 14, 20, 6, c('white', 1)).rect(0, 14, 20, 1, c('white', 2));
  for (let x = 2; x < 19; x += 4) rad.rect(x, 4, 3, 15, c('metal', 1)).rect(x, 4, 1, 15, c('metal', 2));
  rad.rect(1, 17, 18, 2, c('metal', 0));
  for (const [x, y] of [[3, 5], [7, 9], [11, 6], [15, 10], [8, 4], [16, 5]]) rad.set(x, y, c('ice', 2)).set(x + 1, y, c('ice', 1));
  book.add('radiator', rad, { solid: SOLID });
  // the nightstand with its little lamp (solid: stand on it)
  const stand = wall(40);
  stand.rect(2, 8, 16, 12, c('wood', 2)).rect(2, 8, 16, 2, c('wood', 4)).rect(4, 12, 12, 3, c('wood', 1)).set(10, 13, c('gold', 2));
  stand.rect(9, 3, 2, 5, c('gold', 1));
  blob(stand, 10, 3, 4, 2.6, R('gold'), 1, 3);
  book.add('nightstand', stand, { solid: SOLID });
  // the window the chills come in at
  book.add('winDraft', book.pics.get('win.1.0')!.crop(0, 0, 20, 20), { ...AIR, birthMon: BLANKET_MON.chill, birthTime: 120 });
  // the bed: the headboard on the right, the bare mattress, the outline where the blanket was;
  // the foot of it (the colder side) is the gate: it turns down with all five pieces of his soul
  const bed = new Pixels(80, 40, 255);
  {
    bed.rect(70, 0, 8, 40, c('wood', 2)).rect(70, 0, 8, 3, c('wood', 4)).rect(72, 5, 4, 30, c('wood', 1));
    bed.rect(4, 16, 66, 12, c('white', 2)).rect(4, 16, 66, 2, c('white', 1)).rect(4, 26, 66, 2, c('white', 0));
    bed.rect(4, 28, 66, 5, c('wood', 2)).rect(4, 28, 66, 1, c('wood', 3));
    for (const x of [6, 66]) bed.rect(x, 33, 3, 7, c('wood', 1));
    blob(bed, 61, 14, 8, 4, R('white'), 1, 2);
    // where the blanket was: a dotted outline, and frost on the colder side
    for (let x = 10; x < 54; x += 3) bed.set(x, 18, c('quilt', 1)).set(x, 25, c('quilt', 1));
    for (let y = 18; y < 26; y += 3) bed.set(10, y, c('quilt', 1)).set(53, y, c('quilt', 1));
    for (const [x, y] of [[14, 21], [22, 23], [30, 20], [38, 22], [46, 21], [26, 24]]) bed.set(x, y, c('ice', 1)).set(x + 1, y, c('ice', 2));
    bed.rect(0, 10, 5, 30, c('wood', 2)).rect(0, 10, 5, 2, c('wood', 4)).rect(1, 14, 2, 20, c('wood', 1));
  }
  addPicture(book, 'bed', bed, wall(42), () => AIR);
  const foot = (open: boolean) => {
    const p = book.pics.get('bed.0.1')!.crop(0, 0, 20, 20);
    if (open) {
      // the sheet turned down, a thin one, waiting
      p.rect(0, 0, 20, 8, c('white', 2)).line(0, 7, 19, 3, c('ice', 2)).rect(5, 8, 15, 5, c('white', 1));
    } else {
      for (const [x, y] of [[7, 2], [12, 4], [16, 1]]) p.set(x, y, c('ice', 2)).set(x - 1, y + 1, c('ice', 2)).set(x + 1, y + 1, c('ice', 2)).set(x, y + 2, c('ice', 2));
    }
    return p;
  };
  book.add('bedOpen', foot(true), { grav: GRAV.none });
  gate(book, 'bedFoot', foot(false), 'bedOpen', SOULS);
  // the pieces of his soul: pale wisps, sad little faces, left on the floor
  const soul = (p: Pixels) => {
    blob(p, 10, 13, 5, 4.6, R('ice'), 0, 2);
    p.line(10, 8, 12, 4, c('ice', 1)).set(12, 3, c('ice', 2)).set(7, 17, c('ice', 1)).set(13, 18, c('ice', 1));
    p.set(8, 12, c('night', 0)).set(12, 12, c('night', 0)).set(9, 15, c('night', 0)).set(10, 14, c('night', 0)).set(11, 15, c('night', 0));
  };
  for (const bg of ['wall', 'wallB']) plotThing(book, bg, `soul@${bg}`, soul);
}

export function blanketSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // a chill: a snowflake with a grudge
  const chill = (f: number) => {
    const p = P();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + f * 0.26;
      p.line(10, 10, 10 + Math.cos(a) * 8, 10 + Math.sin(a) * 8, c('ice', 2));
      p.set(10 + Math.cos(a) * 5 + Math.cos(a + 1) * 2, 10 + Math.sin(a) * 5 + Math.sin(a + 1) * 2, c('ice', 1));
    }
    p.disc(10, 10, 3.6, c('ice', 2)).disc(10, 10, 2.6, c('white', 2));
    face(p, pal, 10, 9, { angry: true });
    return outline(p, ink);
  };
  book.add('chill0', chill(0), hurts(-4, 0));
  book.add('chill1', chill(1), hurts(-4, 0));
  // an allen key off the flat-pack bookcase: an L of steel with a scowl, hopping
  const key = (f: number) => {
    const p = P();
    const y = f ? 1 : 4;
    p.rect(11, y + 2, 3, 13, c('metal', 1)).rect(11, y + 2, 1, 13, c('metal', 2));
    p.rect(4, y + 12, 10, 3, c('metal', 1)).rect(4, y + 12, 10, 1, c('metal', 2));
    face(p, pal, 12, y + 6, { angry: true });
    if (f) p.set(6, 19, c('metal', 2)).set(16, 19, c('metal', 2));
    return outline(p, ink);
  };
  book.add('key0', key(0), hurts(-6));
  book.add('key1', key(1), hurts(-6));
  // the new blanket with its stupid built-in foot pocket, haunting the house: whole, crumpled, folded
  const newb = (stage: number, f: number) => {
    const p = P();
    if (stage === 0) {
      for (let y = 2; y < 19; y++) {
        const w = 6 + Math.min(4, (y - 2) / 2);
        p.rect(10 - w, y, w * 2, 1, c('ice', y < 4 ? 2 : 1));
      }
      for (let x = 1; x < 19; x += 3) p.rect(x, 18 + ((x + f) % 2), 2, 1, c('ice', 1));
      p.rect(12, 13, 6, 5, c('ice', 0)).rect(12, 13, 6, 1, c('ice', 2));
      face(p, pal, 9, 7, { angry: true });
    } else if (stage === 1) {
      blob(p, 10, 13, 8, 6, pal.r('ice'), 0, 2);
      p.line(4, 11, 15, 16, c('ice', 0)).line(6, 16, 16, 10, c('ice', 0));
      p.rect(12, 15, 5, 4, c('ice', 0));
      face(p, pal, 9, 11 - f, { angry: true });
    } else {
      p.rect(3, 11, 14, 8, c('ice', 1)).rect(3, 11, 14, 2, c('ice', 2)).rect(3, 15, 14, 1, c('ice', 0)).rect(12, 16, 4, 3, c('ice', 0));
      face(p, pal, 10, 13 + f, { sad: true });
    }
    return outline(p, ink);
  };
  for (let s = 0; s < 3; s++) {
    book.add(`new${s}a`, newb(s, 0), hurts(-8));
    book.add(`new${s}b`, newb(s, 1), hurts(-8));
  }
}

export function blanketMonsters(set: Monster[], mb: SpriteBook): void {
  houseMonsters(set, mb);
  // chills drift in off the window, down to the floor and away to the left
  set[BLANKET_MON.chill] = mon(anim(mb, 'chill0', 'chill1', 4), { power: POWER.foe, thru: 1, end: -1, newmon: BLANKET_MON.fluff }, [corner(0, 0, 1), corner(-1, 2, 1), corner(-2, 4, 1), corner(-3, 6, 1), corner(-9, 6, 1, 4)]);
  set[BLANKET_MON.key] = mon(anim(mb, 'key0', 'key1', 4), { power: POWER.foe, thru: 1, newmon: BLANKET_MON.fluff }, pace(3, 2));
  set[BLANKET_MON.newA] = mon(anim(mb, 'new0a', 'new0b', 8), { power: POWER.foe, thru: 1, newmon: BLANKET_MON.newB }, pace(3, 1));
  set[BLANKET_MON.newB] = mon(anim(mb, 'new1a', 'new1b', 6), { power: POWER.foe, thru: 1, newmon: BLANKET_MON.newC }, pace(2, 1));
  set[BLANKET_MON.newC] = mon(anim(mb, 'new2a', 'new2b', 10), { power: POWER.foe, thru: 1, newmon: BLANKET_MON.fluff }, pace(1, 1));
}

export const blanket: Monologue = {
  file: 'blanket',
  title: 'She Took the Blanket (and Left My Soul on the Floor)',
  desc: 'She Took Blanket',
  light: NIGHT,
  filler: 'slab',
  legend: {
    '^': 'ceil',
    '*': 'ceilLamp',
    '.': 'wall',
    _: 'wallB',
    '=': 'floor',
    '#': 'slab',
    W: 'winDraft',
    h: 'shelf',
    B: 'bill@wall',
    t: 'thermo',
    s: 'sheet',
    o: 'towel',
    r: 'radiator',
    n: 'nightstand',
    D: 'bedFoot',
    S: 'soul@wall',
    Z: 'soul@wallB',
    $: 'coin@wallB',
    '&': 'coin@wall',
    b: 'bill@wallB',
    m: 'mug@wallB',
    '!': 'spot@wallB',
  },
  build: (m: MapBuilder) => {
    const W = 64;
    m.row(0, 0, W - 1, '^');
    for (let x = 4; x < W; x += 10) m.set(x, 0, '*');
    m.fill(0, 1, W, 8, '.').row(9, 0, W - 1, '_').row(10, 0, W - 1, '=').row(11, 0, W - 1, '#');
    const win = (x: number, y: number, draft: boolean) => (placePicture(m, 'win', x, y, 2, 2), draft && m.set(x + 1, y, 'W'));
    // the living room: the thermostat, the armchair and its throw pillow, a shelf, the photo
    m.set(2, 9, '!').set(4, 5, 't');
    placePicture(m, 'chair', 6, 8, 2, 2);
    m.row(6, 8, 10, 'h').set(9, 5, 'B');
    placePicture(m, 'photo', 9, 3, 2, 1);
    m.set(11, 9, 'Z').set(13, 9, '$');
    win(14, 3, true);
    // the flat-pack corner: the leaning bookcase (climb it: a piece of his soul on top), a shelf
    // above, the instructions, the allen keys
    placePicture(m, 'case', 18, 7, 2, 3);
    m.set(18, 6, 'S').set(19, 6, '&').set(16, 4, 's');
    m.row(4, 21, 23, 'h').set(22, 3, '&');
    m.mon(BLANKET_MON.key, 21, 9).mon(BLANKET_MON.key, 25, 9);
    m.set(27, 9, '$');
    // the kitchen nook: the dish towel he curled round, the cold radiator, Teddy keeping warm
    win(28, 2, false);
    m.set(31, 5, 'o').set(31, 9, 'Z');
    m.set(33, 9, 'r').set(35, 9, 'b');
    m.mon(MON.carl, 29, 7);
    m.mon(MON.teddy, 37, 9);
    m.set(40, 9, 'm');
    // the bedroom: the nightstand (a piece of his soul on it), a shelf, the drafty window, the new blanket
    m.set(42, 9, 'n').set(42, 8, 'S');
    m.row(6, 44, 45, 'h').set(45, 5, '&');
    win(48, 3, false);
    m.mon(BLANKET_MON.newA, 49, 9);
    m.set(53, 9, 'Z').set(54, 9, '$');
    // the bed: the colder side
    placePicture(m, 'bed', 56, 8, 4, 2);
    m.set(56, 9, 'D');
    m.mon(MON.gwinn, 58, 8);
    m.link(56, 9, 'next');
    win(61, 3, false);
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: blanketMonsters,
  song: 'home',
  clips: { open: 'blnkt_o', line: 'blnkt_l', punch: 'blnkt_p', word: 'blnkt_w' },
  view: [4, 4],
  card: ['She knew I sleep cold.', 'And she took the blanket.'],
};
