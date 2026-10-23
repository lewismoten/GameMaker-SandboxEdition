// "Gerald the Ficus is Dead": water the plants, the boss said. A key under the mat, a sticky
// note: "Be gentle with Gerald, he's moody." And then he saw them: crispy. The ficus keeled over
// like it fainted in a soap opera, the fern, the succulents shriveled like ancient scrolls. Holy
// mist, plant CPR, Mozart by the window, the sun lamp held overhead. Nothing. So: every nursery in
// ten miles, then Peggy in a drugstore parking lot (a spider plant, a fresh fern, a succulent
// named Randy; cash only, no questions asked). The scene staged, labeled like a museum exhibit,
// a sticky note: "Gerald's perky today." The boss comes home: "They've never looked better."
//
// The epic: the boss's living room (Gerald toppled, the shelf of dead plants dropping crispy
// leaves, fungus gnats, the sun lamp, the record player playing Mozart, the sofa), out the back
// door into the night (the nursery: closed), the drugstore parking lot (a runaway cart, Peggy at
// her open trunk with the three plants), back in to stage it all (the sticky note, the museum
// label), and the front door: the boss comes home, takes the four things, and hands him Randy.
//
// Layout (12 rows: the crown molding on row 0, the floor on row 10, he walks row 9).
import { Pixels, rng } from '../../../../kit/pixels';
import { blob, shadeAt } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing, spotlight } from '../../common/blocks';
import { anim, corner, mon, pace, still } from '../../common/characters';
import type { MapBuilder } from '../../common/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hello, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { FICUS_MON } from './ids';

/** The staging: a spider plant, a fresh fern, Randy, the sticky note. */
export const STAGED = 4;

/** The boss's rose wallpaper: stripes and little sprigs. */
function paper(pal: Pal, seed: number): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20);
  const r = rng(seed);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('rose', x % 10 < 5 ? 2 : r() < 0.05 ? 1 : 2));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (x % 10 === 4 || x % 10 === 5) p.set(x, y, c('rose', 1));
  for (const [x, y] of [[2, 4], [7, 14]]) p.set(x, y, c('red', 2)).set(x + 1, y, c('green', 2)).set(x, y + 1, c('green', 1));
  return p;
}

/** The wallpaper with its white baseboard (the row he walks). */
function paperBase(pal: Pal): Pixels {
  const p = paper(pal, 51);
  return p.rect(0, 14, 20, 6, pal.c('white', 1)).rect(0, 14, 20, 1, pal.c('white', 2)).rect(0, 19, 20, 1, pal.c('white', 0));
}

/** The night outside: dark sky, a few stars, the glow of the town low down. */
function night(pal: Pal, seed: number): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20);
  const r = rng(seed);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(pal.r('night'), 0, 2, 0.3, x, y));
  for (let k = 0; k < 3; k++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('white', r() < 0.5 ? 1 : 2));
  return p;
}

export function ficusBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  // ---- the house
  book.add('paper', paper(pal, 50), AIR);
  book.add('paperBase', paperBase(pal), AIR);
  const floor = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) floor.set(x, y, c('wood', ((x + (Math.floor(y / 5) % 2) * 9) % 18 === 0 ? 1 : (y % 5 === 0 ? 2 : 3))));
  floor.rect(0, 0, 20, 1, c('wood', 4));
  book.add('hardwood', floor, { solid: SOLID });
  const crown = paper(pal, 52);
  crown.rect(0, 0, 20, 12, c('white', 2)).rect(0, 12, 20, 2, c('white', 1)).rect(0, 14, 20, 1, c('white', 0));
  for (let x = 1; x < 20; x += 4) crown.rect(x, 9, 2, 3, c('white', 1));
  book.add('crown', crown, { solid: SOLID });
  // the window, its curtains tied back, the street at night
  const win = paper(pal, 53);
  win.rect(4, 2, 12, 14, c('white', 2));
  for (let y = 3; y < 15; y++) for (let x = 5; x < 15; x++) win.set(x, y, shadeAt(R('night'), 0, 2, y / 14, x, y));
  win.rect(9, 3, 1, 12, c('white', 2)).rect(5, 8, 10, 1, c('white', 2)).set(7, 5, c('white', 2)).set(12, 11, c('yellow', 2));
  win.rect(1, 1, 18, 1, c('wood', 1)).rect(1, 2, 4, 15, c('red', 1)).rect(15, 2, 4, 15, c('red', 1)).rect(2, 2, 1, 15, c('red', 2)).rect(16, 2, 1, 15, c('red', 2));
  book.add('curtains', win, AIR);
  // the front door he came in by: the sticky note on it ("Be gentle with Gerald, he's moody")
  const front = paperBase(pal);
  front.rect(3, 0, 14, 20, c('wood', 2)).frame(5, 2, 10, 7, c('wood', 1)).frame(5, 11, 10, 7, c('wood', 1)).disc(14, 11, 1.2, c('gold', 3));
  front.rect(7, 4, 6, 5, c('yellow', 2)).rect(8, 5, 4, 1, c('ink', 1)).rect(8, 7, 3, 1, c('ink', 1));
  book.add('frontDoor', front, AIR);
  // Gerald, keeled over like he fainted in a soap opera (2 x 2: the toppled pot, the crispy
  // crown across the floor; his trunk is a ledge)
  const gerald = new Pixels(40, 40, 255);
  gerald.rect(1, 25, 13, 12, c('red', 1)).rect(1, 25, 2, 12, c('red', 2)).rect(0, 23, 15, 3, c('red', 2));
  blob(gerald, 8, 34, 6, 3, R('coffee'), 0, 1);
  gerald.line(13, 30, 30, 24, c('wood', 1)).line(13, 31, 30, 25, c('wood', 0)).line(22, 27, 26, 18, c('wood', 1));
  const r = rng(54);
  for (let k = 0; k < 40; k++) {
    const a = r() * Math.PI * 2;
    const d = r() * 9;
    const x = 30 + Math.cos(a) * d;
    const y = 24 + Math.sin(a) * d * 0.8;
    blob(gerald, x, y, 1.8, 1.1, R('crisp'), 0, 2);
  }
  for (let k = 0; k < 8; k++) gerald.set(16 + r() * 22, 37 + r() * 2, c('crisp', 1));
  addPicture(book, 'gerald', gerald, (_c, row) => (row ? paperBase(pal) : paper(pal, 55)), (_c, row) => (row ? AIR : { solid: LEDGE, grav: GRAV.down }));
  // the shelf of the dead: the fern that witnessed unspeakable horrors, the succulents shriveled
  // like ancient scrolls (a ledge; crispy leaves let go of it)
  const shelf = paper(pal, 56);
  shelf.rect(0, 16, 20, 2, c('wood', 3)).rect(0, 18, 20, 1, c('wood', 0)).rect(2, 11, 6, 5, c('red', 1)).rect(12, 12, 6, 4, c('teal', 1));
  for (let k = 0; k < 6; k++) shelf.line(5, 11, 1 + k * 1.5, 3 + (k % 2) * 3, c('crisp', k % 3));
  for (const x of [13, 15, 17]) shelf.rect(x - 1, 9, 2, 3, c('crisp', 0)).set(x - 1, 8, c('crisp', 1));
  book.add('deadShelf', shelf, { solid: LEDGE, grav: GRAV.down, birthMon: FICUS_MON.leaf, birthTime: 70 });
  // the sun lamp on its little table, the record player playing Mozart
  const lamp = paperBase(pal);
  lamp.rect(4, 12, 12, 2, c('wood', 3)).rect(5, 14, 1, 6, c('wood', 1)).rect(14, 14, 1, 6, c('wood', 1)).rect(9, 5, 2, 7, c('metal', 1));
  lamp.rect(4, 0, 12, 5, c('metal', 2)).rect(5, 4, 10, 2, c('spot', 1)).set(3, 7, c('spot', 0)).set(17, 7, c('spot', 0)).set(10, 8, c('spot', 0));
  book.add('sunLamp', lamp, AIR);
  const phono = paperBase(pal);
  phono.rect(3, 9, 14, 4, c('wood', 2)).rect(4, 8, 12, 1, c('ink', 1)).rect(5, 13, 1, 7, c('wood', 1)).rect(14, 13, 1, 7, c('wood', 1));
  phono.line(15, 7, 11, 8, c('metal', 2)).set(10, 8, c('red', 2));
  for (const [x, y] of [[4, 3], [11, 1], [16, 4]]) phono.rect(x, y, 1, 4, c('ink', 0)).rect(x - 2, y + 3, 2, 2, c('ink', 0)).set(x + 1, y, c('ink', 0));
  book.add('phono', phono, AIR);
  // the sofa (2 x 1, its cushions a ledge), a crocheted blanket over the back
  const sofa = new Pixels(40, 20, 255);
  sofa.rect(0, 4, 40, 12, c('teal', 1)).rect(0, 4, 5, 14, c('teal', 0)).rect(35, 4, 5, 14, c('teal', 0)).rect(4, 9, 32, 5, c('teal', 2)).rect(20, 9, 1, 5, c('teal', 0));
  sofa.rect(8, 2, 14, 5, c('yellow', 1));
  for (let x = 8; x < 22; x += 2) sofa.set(x, 2 + (x % 4 ? 1 : 3), c('red', 2));
  sofa.rect(2, 16, 2, 4, c('wood', 0)).rect(36, 16, 2, 4, c('wood', 0));
  addPicture(book, 'sofa', sofa, paperBase(pal), () => ({ solid: LEDGE, grav: GRAV.down }));
  // the back door: open on the night
  const back = paperBase(pal);
  back.rect(3, 0, 14, 20, c('wood', 1));
  for (let y = 1; y < 20; y++) for (let x = 4; x < 16; x++) back.set(x, y, shadeAt(R('night'), 0, 2, y / 30, x, y));
  back.rect(4, 17, 12, 3, c('grey', 0)).rect(15, 1, 2, 19, c('wood', 3));
  book.add('backDoor', back, AIR);
  // ---- outside: the night, the parking lot
  book.add('night', night(pal, 60), AIR);
  const lot = night(pal, 62);
  lot.rect(0, 14, 20, 6, c('grey', 0)).rect(0, 14, 20, 1, c('grey', 2)).rect(0, 15, 20, 1, c('grey', 1));
  for (let x = 0; x < 20; x += 5) lot.set(x + 2, 17, c('grey', 1));
  lot.rect(6, 18, 8, 1, c('yellow', 1));
  book.add('lot', lot, AIR);
  const asphalt = new Pixels(20, 20);
  const ar = rng(63);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) asphalt.set(x, y, c('ink', ar() < 0.15 ? 1 : 0));
  asphalt.rect(0, 0, 20, 1, c('grey', 0));
  book.add('asphalt', asphalt, { solid: SOLID });
  // the nursery's sandwich board: CLOSED (they all were)
  const closed = lot.crop(0, 0, 20, 20);
  closed.line(4, 19, 8, 3, c('wood', 3)).line(16, 19, 12, 3, c('wood', 3)).rect(5, 3, 10, 12, c('green', 1)).frame(5, 3, 10, 12, c('wood', 2));
  micro(closed, 6, 5, 'NO', c('white', 2));
  micro(closed, 6, 10, ':(', c('white', 2));
  book.add('closedSign', closed, AIR);
  // a lamppost (two tall), its pool of light
  const post = new Pixels(20, 40, 255);
  post.rect(9, 6, 2, 34, c('grey', 1)).rect(5, 2, 10, 4, c('grey', 2)).rect(6, 6, 8, 2, c('spot', 2));
  for (let y = 8; y < 34; y++) for (let x = 0; x < 20; x++) if (Math.abs(x - 10) < (y - 8) * 0.3 + 3 && (x + y) % 3 === 0 && post.get(x, y) === 255) post.set(x, y, c('spot', 0));
  addPicture(book, 'lamppost', post, (_c, row) => (row ? lot : night(pal, 64)), () => AIR);
  // the drugstore's sign on its pole, glowing (2 x 1)
  const sign = new Pixels(40, 20, 255);
  sign.rect(1, 1, 38, 13, c('white', 2)).frame(1, 1, 38, 13, c('red', 1)).rect(18, 14, 4, 6, c('grey', 1));
  micro(sign, 3, 3, 'DRUGSTORE', c('red', 1));
  micro(sign, 11, 8, 'OPEN', c('blue', 1));
  addPicture(book, 'drugSign', sign, (col) => night(pal, 65 + col), () => AIR);
  // Peggy's car, its trunk up (2 x 1)
  const car = new Pixels(40, 20, 255);
  car.rect(0, 6, 40, 9, c('navy', 1)).rect(0, 6, 40, 1, c('navy', 2)).rect(2, 0, 36, 3, c('navy', 2)).line(2, 3, 2, 6, c('ink', 1)).line(37, 3, 37, 6, c('ink', 1));
  car.rect(2, 7, 36, 4, c('ink', 1)).rect(4, 15, 7, 5, c('ink', 0)).rect(29, 15, 7, 5, c('ink', 0)).rect(6, 16, 3, 3, c('metal', 1)).rect(31, 16, 3, 3, c('metal', 1));
  car.rect(0, 11, 3, 2, c('red', 3)).rect(37, 11, 3, 2, c('red', 3));
  blob(car, 12, 7, 4, 2, R('green'), 0, 3);
  blob(car, 26, 7, 3.4, 2, R('green'), 1, 3);
  addPicture(book, 'car', car, lot, () => AIR);
  // Gerald's portrait, in better days (2018), and the ceiling light
  const portrait = paper(pal, 58);
  portrait.rect(2, 1, 16, 18, c('gold', 1)).rect(3, 2, 14, 16, c('gold', 2)).rect(4, 3, 12, 14, c('white', 2));
  portrait.rect(7, 13, 6, 4, c('red', 1));
  blob(portrait, 10, 8, 5, 4.6, R('green'), 0, 3);
  portrait.rect(9, 11, 2, 2, c('wood', 1));
  book.add('portrait', portrait, AIR);
  const light = paper(pal, 59);
  light.rect(0, 0, 20, 12, c('white', 2)).rect(0, 12, 20, 2, c('white', 1)).rect(0, 14, 20, 1, c('white', 0));
  light.rect(9, 14, 2, 1, c('metal', 1)).rect(5, 15, 10, 4, c('spot', 1)).rect(6, 19, 8, 1, c('spot', 0)).rect(5, 15, 10, 1, c('gold', 2));
  book.add('ceilingLight', light, { solid: SOLID });
  // ---- the staging
  const label = paper(pal, 57);
  label.rect(0, 3, 20, 15, c('white', 2)).frame(0, 3, 20, 15, c('gold', 1));
  micro(label, 1, 5, 'GERLD', c('ink', 0));
  micro(label, 2, 11, '2018', c('green', 1));
  book.add('museumLabel', label, AIR);
  // the front door again, the boss home: it takes the four things; open, he hands over Randy
  const door = (open: boolean) => {
    const p = paperBase(pal);
    if (!open) {
      p.rect(3, 0, 14, 20, c('wood', 2)).frame(3, 0, 14, 20, c('wood', 0)).rect(6, 2, 8, 6, c('spot', 1)).disc(14, 11, 1.2, c('gold', 3));
      blob(p, 10, 6, 2.4, 2.6, R('ink'), 0, 1);
      p.rect(7, 7, 6, 1, c('ink', 0));
    } else {
      p.rect(3, 0, 14, 20, c('night', 0)).rect(3, 0, 1, 20, c('wood', 0)).rect(16, 0, 1, 20, c('wood', 0));
      p.rect(7, 14, 6, 5, c('red', 1)).rect(6, 13, 8, 2, c('red', 2));
      for (const [x, y] of [[8, 11], [10, 9], [12, 11], [9, 12], [11, 12]]) p.rect(x, y, 2, 3, c('green', 2));
    }
    return p;
  };
  book.add('homeOpen', door(true), { grav: GRAV.none });
  gate(book, 'bossHome', door(false), 'homeOpen', STAGED);
  // the four things: the spider plant, the fresh fern, Randy the succulent, the sticky note
  const pot = (p: Pixels, col: string) => p.rect(6, 14, 8, 6, c(col, 1)).rect(5, 13, 10, 2, c(col, 2));
  plotThing(book, 'lot', 'spider@lot', (p) => {
    pot(p, 'white');
    for (let k = 0; k < 7; k++) p.line(10, 13, 3 + k * 2.3, 4 + (k % 2) * 3, c(k % 2 ? 'green' : 'white', 2));
  });
  plotThing(book, 'lot', 'fern@lot', (p) => {
    pot(p, 'wood');
    for (let k = 0; k < 6; k++) blob(p, 4 + k * 2.4, 8 + Math.abs(k - 2.5) * 1.2, 2.6, 1.3, R('green'), 1, 3);
  });
  plotThing(book, 'lot', 'randy@lot', (p) => {
    pot(p, 'red');
    blob(p, 10, 10, 4, 3.4, R('teal'), 1, 2);
    p.line(10, 7, 10, 13, c('teal', 2)).line(7, 10, 13, 10, c('teal', 2));
    face(p, pal, 10, 9, { grin: true });
  });
  plotThing(book, 'paperBase', 'postit@paperBase', (p) => {
    p.rect(5, 4, 10, 9, c('yellow', 2)).rect(5, 4, 10, 1, c('yellow', 1)).set(14, 12, c('yellow', 0));
    p.rect(6, 6, 7, 1, c('blue', 1)).rect(6, 8, 5, 1, c('blue', 1)).rect(6, 10, 6, 1, c('blue', 1)).set(12, 8, c('red', 2));
  });
  loot(book, pal, 'paperBase');
  spotlight(book, pal, 'paperBase');
}

export function ficusSprites(book: SpriteBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // a crispy leaf, see-sawing down, with a scowl
  const leaf = (f: number) => {
    const p = P();
    const tip = f ? 3 : -3;
    for (let k = -6; k <= 6; k++) {
      const w = Math.round(3.4 * Math.sqrt(1 - (k * k) / 40));
      p.rect(10 + k, 10 + Math.round((k * tip) / 6) - w + 1, 1, w * 2 - 1, c('crisp', 1 + (k % 2 ? 1 : 0)));
    }
    p.line(4, 10 - tip, 16, 10 + tip, c('crisp', 0));
    face(p, pal, 10, 9, { angry: true });
    return outline(p, ink);
  };
  book.add('leaf0', leaf(0), hurts(-5, 0));
  book.add('leaf1', leaf(1), hurts(-5, 0));
  // fungus gnats: a buzzing knot of specks
  const gnats = (f: number) => {
    const p = P();
    const r = rng(70 + f);
    for (let k = 0; k < 40; k++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 6;
      const x = 10 + Math.cos(a) * d;
      const y = 11 + Math.sin(a) * d * 0.7;
      p.set(x, y, k % 3 ? ink : c('crisp', 0)).set(x + 1, y - 1, c('white', 1));
    }
    return p;
  };
  book.add('gnat0', gnats(0), hurts(-3, 0));
  book.add('gnat1', gnats(1), hurts(-3, 0));
  // a runaway shopping cart, rattling
  const cart = (f: number) => {
    const p = P();
    for (let y = 5; y < 13; y += 2) p.line(4, y, 17, y, c('metal', 2));
    for (let x = 4; x < 18; x += 3) p.line(x, 5, x + 1, 13, c('metal', 1));
    p.line(17, 5, 19, 2, c('red', 2)).line(3, 13, 17, 13, c('metal', 1)).line(5, 13, 5, 16, c('metal', 1)).line(15, 13, 15, 16, c('metal', 1));
    p.rect(4 + f, 17, 3, 3, c('ink', 1)).rect(14 - f, 17, 3, 3, c('ink', 1));
    return outline(p, ink);
  };
  book.add('pcart0', cart(0), hurts(-10));
  book.add('pcart1', cart(1), hurts(-10));
  // Peggy: grey curls, cat-eye glasses, a lilac cardigan, cash only, no questions asked
  const peggy = (f: number) => {
    const p = P();
    p.rect(5, 8, 10, 9, c('purple', 2)).rect(5, 8, 10, 1, c('purple', 3)).rect(9, 9, 2, 8, c('white', 2)).rect(6, 17, 3, 3, c('navy', 1)).rect(11, 17, 3, 3, c('navy', 1));
    blob(p, 10, 4.5, 3.4, 3.4, pal.r('skin'), 2, 4);
    for (const [x, y] of [[6, 2], [8, 1], [10, 0], [12, 1], [14, 2], [6, 4], [14, 4]]) p.disc(x, y + 1, 1.3, c('grey', 3));
    p.rect(7, 4, 3, 2, c('pink', 1)).rect(11, 4, 3, 2, c('pink', 1)).set(8, 5, ink).set(12, 5, ink).rect(9, 7, 3, 1, c('red', 1));
    p.rect(14, 10, 4, 3, c('green', 1 + f)).rect(15, 12, 3, 2, c('white', 2));
    return outline(p, ink);
  };
  book.add('peggy0', peggy(0), hello);
  book.add('peggy1', peggy(1), hello);
}

export function ficusMonsters(set: Monster[], mb: SpriteBook): void {
  set[FICUS_MON.leaf] = mon(anim(mb, 'leaf0', 'leaf1', 5), { power: POWER.foe, thru: 0, end: -1, newmon: FICUS_MON.puff }, [corner(0, 0, 1), corner(-1, 1, 1), corner(1, 1, 1), corner(-1, 1, 1), corner(1, 1, 1)]);
  set[FICUS_MON.gnat] = mon(anim(mb, 'gnat0', 'gnat1', 2), { power: POWER.foe, thru: 1, newmon: FICUS_MON.puff }, pace(3, 1));
  set[FICUS_MON.cart] = mon(anim(mb, 'pcart0', 'pcart1', 2), { power: POWER.tough, thru: 1 }, pace(4, 2));
  set[FICUS_MON.peggy] = mon(anim(mb, 'peggy0', 'peggy1', 16), { power: POWER.friend, thru: 0, newmon: FICUS_MON.peggyOff }, still);
  set[FICUS_MON.peggyOff] = mon(anim(mb, 'peggy1', 'peggy0', 4), { power: POWER.tough, thru: 0, end: 30 }, [corner(0, 0, 2), corner(4, 0, 2)]);
  set[FICUS_MON.puff] = mon(anim(mb, 'ink0', 'ink1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const ficus: Monologue = {
  file: 'ficus',
  title: 'Gerald the Ficus is Dead',
  desc: 'Gerald the Ficus',
  filler: 'slab',
  legend: {
    '^': 'crown',
    '.': 'paper',
    _: 'paperBase',
    '=': 'hardwood',
    w: 'curtains',
    S: 'deadShelf',
    n: 'night',
    l: 'lot',
    a: 'asphalt',
    D: 'bossHome',
    P: 'spider@lot',
    F: 'fern@lot',
    Y: 'randy@lot',
    K: 'postit@paperBase',
    $: 'coin@paperBase',
    b: 'bill@paperBase',
    m: 'mug@paperBase',
    '!': 'spot@paperBase',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the house past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 6;
    const W = 64 + OFF;
    // the house, inside: crown molding, wallpaper, the hardwood floor
    m.row(0, 0, W - 1, '^').fill(0, 1, W, 8, '.').row(9, 0, W - 1, '_').row(10, 0, W - 1, '=').row(11, 0, W - 1, 'slab');
    // in by the front door (the sticky note), the spotlight, a coffee
    m.set(0, 9, 'frontDoor').set(2, 9, '!').set(4, 9, 'm');
    // the living room: Gerald, keeled over (gnats over his soil), the shelf of the dead
    m.set(5, 5, 'w').set(10, 4, 'portrait').set(7, 0, 'ceilingLight').set(20, 0, 'ceilingLight');
    placePicture(m, 'gerald', 8, 8, 2, 2);
    m.set(12, 9, '$').row(6, 14, 15, 'S').set(17, 5, 'w').mon(FICUS_MON.gnat, 8, 9);
    // the sun lamp held up, Mozart by the window, the sofa; Carl, who loves a dead plant
    m.set(17, 9, 'sunLamp').set(19, 9, 'phono').set(23, 5, 'w');
    placePicture(m, 'sofa', 21, 9, 2, 1);
    m.set(24, 9, '$').mon(MON.carl, 26, 7);
    // out the back door into the night
    m.set(26, 9, 'backDoor');
    m.fill(27, 0, 21, 9, 'n').row(9, 27, 47, 'l').row(10, 27, 47, 'a').row(11, 27, 47, 'a');
    // every nursery in ten miles: closed
    m.set(29, 9, 'closedSign');
    placePicture(m, 'lamppost', 31, 8, 1, 2);
    // the drugstore parking lot: a runaway cart, Peggy at her trunk with the plants
    placePicture(m, 'drugSign', 36, 4, 2, 1);
    m.mon(FICUS_MON.cart, 34, 9);
    m.set(40, 9, 'P').set(41, 9, 'F').mon(FICUS_MON.peggy, 42, 9);
    placePicture(m, 'car', 43, 9, 2, 1);
    m.set(45, 9, 'Y');
    placePicture(m, 'lamppost', 46, 8, 1, 2);
    // back in to stage it: the museum label, the sticky note, the sofa, the front door
    m.set(48, 9, 'backDoor');
    m.set(51, 5, 'w').set(53, 5, 'portrait').set(53, 7, 'museumLabel').set(55, 9, 'K').set(57, 5, 'w').set(55, 0, 'ceilingLight');
    placePicture(m, 'sofa', 58, 9, 2, 1);
    m.set(52, 9, 'b').set(60, 9, '$');
    m.set(62, 9, 'D');
    m.link(62 + OFF, 9, 'next');
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: ficusMonsters,
  song: 'home',
  clips: { open: 'ficus_o', line: 'ficus_l', punch: 'ficus_p', word: 'ficus_w' },
  view: [4, 3],
  card: ['Be gentle with Gerald,', "he's moody."],
};
