// The blocks of the parade's five added levels, in the poster inks:
//   roofTile, awning, crate   Bakery Row's tar roofs, a striped shop awning (stand on it) and a wooden crate
//   donut                     a pink-iced donut worth 15, and a hit point
//   addMeter                  a countdown meter like the gust meter, with its own two-letter label
//   shutter                   a roll-up shutter that stands open until its meter runs out, then shuts
//   fuse, truck               the Cannon Truck's three fuse boxes and the truck's rear door
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { LEDGE, PULL, SOLID } from '../../kit/starter/book';
import type { PBook } from './base';
import { onPaper } from './blocks';
import { halftone, inkLine, paperOf, stripes, type Pal } from './print';

const T = 255;
const air = { grav: PULL.down };
/** The counter the Cannon Truck's fuse boxes add to. */
export const FUSES = 26;
export const FUSES_WANTED = 3;
export const DONUT_POINTS = 15;
/** Hit points a donut gives back (the bakery's, eaten on the run). */
export const DONUT_HEAL = 1;

/** A tar roof tile, a stucco crate and a striped awning. */
export function addRoofs(book: PBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  {
    const p = new Pixels(20, 20, c('blue', 2));
    for (let y = 0; y < 20; y += 5) {
      p.rect(0, y, 20, 1, ink);
      const off = (y / 5) % 2 ? 0 : 6;
      for (let x = off; x < 20; x += 12) p.rect(x, y, 1, 5, ink);
    }
    halftone(p, 0, 0, 20, 20, c('blue', 1), 2, [c('blue', 2)]);
    p.rect(0, 0, 20, 2, c('blue', 3));
    book.add('roofTile', p, { solid: SOLID });
  }
  {
    const p = new Pixels(20, 20, c('wood', 2));
    p.rect(0, 0, 20, 2, c('wood', 3)).rect(0, 18, 20, 2, c('wood', 1));
    p.line(2, 2, 17, 17, c('wood', 1)).line(17, 2, 2, 17, c('wood', 1));
    p.rect(0, 0, 20, 1, ink).rect(0, 19, 20, 1, ink).rect(0, 0, 1, 20, ink).rect(19, 0, 1, 20, ink);
    halftone(p, 1, 1, 18, 18, c('wood', 0), 4, [c('wood', 2)]);
    book.add('crate', p, { solid: SOLID });
  }
  {
    const p = new Pixels(20, 20, paperOf(pal));
    p.rect(0, 0, 20, 8, c('paper', 3));
    stripes(p, 0, 0, 20, 8, c('red', 2), 10, 5);
    for (let x = 0; x < 20; x += 5) p.rect(x, 8, 5, 2, (x / 5) % 2 ? c('red', 2) : c('paper', 3));
    p.rect(0, 0, 20, 1, ink).rect(0, 10, 20, 1, ink);
    halftone(p, 0, 3, 20, 5, c('red', 1), 2, [c('red', 2)]);
    book.add('awning', p, { solid: LEDGE, grav: PULL.down });
  }
  {
    const p = new Pixels(20, 20, T);
    p.disc(10, 10, 7, c('orange', 3)).disc(10, 10, 2.2, T);
    p.disc(10, 9, 6, c('pink', 3)).disc(10, 10, 2.2, T);
    for (const [x, y] of [
      [6, 7],
      [13, 7],
      [8, 13],
      [14, 12],
    ])
      p.set(x, y, c('white', 3)).set(x + 1, y, c('red', 2));
    book.add('donut', onPaper(pal, p), { ...air, score: DONUT_POINTS, hp: DONUT_HEAL, touch: 'sky' });
  }
}

/** Mill Creek's water: a rippled surface, the deep body of the creek and its pebbled bed (the only solid one). */
export function addCreek(book: PBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const top = new Pixels(20, 20, c('teal', 2));
  top.rect(0, 0, 20, 4, paperOf(pal)).rect(0, 4, 20, 1, ink);
  for (const x of [2, 11]) top.rect(x, 7, 6, 1, c('teal', 4));
  halftone(top, 0, 8, 20, 12, c('teal', 1), 2, [c('teal', 2)]);
  book.add('creekTop', top, air);
  const body = new Pixels(20, 20, c('teal', 2));
  halftone(body, 0, 0, 20, 20, c('teal', 1), 2, [c('teal', 2)]);
  for (const [x, y] of [
    [4, 5],
    [14, 13],
  ])
    body.rect(x, y, 4, 1, c('teal', 4));
  book.add('creek', body, air);
  const bed = new Pixels(20, 20, c('teal', 1));
  halftone(bed, 0, 0, 20, 20, c('teal', 0), 3);
  for (const [x, y] of [
    [3, 3],
    [11, 8],
    [6, 14],
    [15, 15],
  ])
    bed.rect(x, y, 3, 2, c('stone', 2));
  book.add('creekBed', bed, { solid: SOLID });
}

/** A countdown meter: `labels` on a navy plate, `segments` bars that go dark one after another, and an end cap. */
export function addMeter(book: PBook, pal: Pal, id: string, labels: [string, string], segments: number, ticksEach: number): void {
  const { c } = pal;
  const panel = (): Pixels => {
    const p = new Pixels(20, 20, paperOf(pal));
    p.rect(0, 5, 20, 13, c('blue', 1)).rect(0, 5, 20, 1, c('ink', 0)).rect(0, 17, 20, 1, c('ink', 0));
    return p;
  };
  labels.forEach((s, i) => {
    const p = panel();
    // the first pair hugs its tile's right edge and the second its left, so the four letters read as one word
    text(p, i === 0 ? 20 - s.length * 8 : 0, 8, s, c('paper', 3), 1, true);
    book.add(`${id}Label${i}`, p, air);
  });
  const cap = panel();
  cap.rect(17, 5, 3, 13, c('ink', 0));
  book.add(`${id}Cap`, cap, air);
  const off = panel();
  off.rect(1, 7, 18, 9, c('blue', 0));
  halftone(off, 1, 7, 18, 9, c('blue', 2), 1);
  book.add(`${id}Off`, off, air);
  for (let i = 0; i < segments; i++) {
    const p = panel();
    p.rect(1, 7, 18, 9, c('orange', 3));
    stripes(p, 1, 7, 18, 9, c('orange', 4), 10, 3);
    book.add(`${id}${i}`, p, air);
    book.time(`${id}${i}`, `${id}Off`, ticksEach * (i + 1));
  }
}

/** A roll-up shutter over a doorway: open at the start of the level, shut (a solid gray wall) after `ticks`. */
export function addShutter(book: PBook, pal: Pal, ticks: number): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const open = new Pixels(20, 20, paperOf(pal));
  open.rect(0, 0, 20, 5, c('stone', 2)).rect(0, 5, 20, 1, ink);
  for (let x = 0; x < 20; x += 4) open.rect(x, 0, 1, 5, c('stone', 1));
  book.add('shutterUp', open, air);
  const shut = new Pixels(20, 20, c('stone', 3));
  for (let y = 0; y < 20; y += 4) shut.rect(0, y, 20, 1, ink).rect(0, y + 1, 20, 1, c('stone', 4));
  halftone(shut, 0, 0, 20, 20, c('stone', 1), 2, [c('stone', 3)]);
  shut.rect(0, 0, 1, 20, ink).rect(19, 0, 1, 20, ink);
  book.add('shutterDown', shut, { solid: SOLID });
  book.time('shutterUp', 'shutterDown', ticks);
}

/** The Cannon Truck: a fuse box that counts when touched, and the truck's rear door that wants all three. */
export function addTruck(book: PBook, pal: Pal): void {
  const { c } = pal;
  const box = (lit: boolean): Pixels => {
    const p = new Pixels(20, 20, T);
    p.rect(3, 3, 14, 14, c('stone', 2)).rect(3, 3, 14, 2, c('stone', 4));
    halftone(p, 3, 10, 14, 7, c('stone', 0), 2, [c('stone', 2)]);
    p.rect(6, 7, 8, 5, c('ink', 1)).rect(7, 8, 6, 3, lit ? c('teal', 4) : c('red', 2));
    p.rect(9, 12, 2, 4, c('gold', 3));
    return onPaper(pal, p);
  };
  book.add('fuse', box(false), { ...air, score: 100, effect: FUSES, eamt: 1, touch: 'fuseDone' });
  book.add('fuseDone', box(true), air);
  const door = (open: boolean): Pixels => {
    const p = new Pixels(20, 20, c('purple', 3));
    p.rect(0, 0, 20, 2, c('purple', 4)).rect(0, 18, 20, 2, c('purple', 1));
    for (let y = 3; y < 18; y += 4) p.rect(2, y, 16, 1, c('purple', 1));
    halftone(p, 0, 0, 20, 20, c('purple', 2), 2, [c('purple', 3)]);
    if (open) p.rect(3, 3, 14, 15, c('ink', 1));
    else p.rect(8, 8, 4, 4, c('gold', 3)).rect(9, 9, 2, 2, c('ink', 0));
    return inkLine(p, c('ink', 0));
  };
  book.add('truckDoor', door(false), { solid: SOLID, effect: FUSES, eamt: -FUSES_WANTED, score: 200, touch: 'truckOpen' });
  book.add('truckOpen', door(true), air);
  const body = new Pixels(20, 20, c('purple', 3));
  halftone(body, 0, 0, 20, 20, c('purple', 2), 2, [c('purple', 3)]);
  body.rect(0, 0, 20, 3, c('purple', 4)).rect(0, 17, 20, 3, c('stone', 1));
  stripes(body, 0, 3, 20, 3, c('orange', 3), 8, 4);
  book.add('truckBody', inkLine(body, c('ink', 0)), { solid: SOLID });
  const gun = new Pixels(20, 20, c('purple', 3));
  halftone(gun, 0, 0, 20, 20, c('purple', 2), 2, [c('purple', 3)]);
  gun.rect(6, 0, 8, 9, c('stone', 1)).rect(7, 0, 6, 2, c('orange', 3)).rect(0, 17, 20, 3, c('stone', 1));
  book.add('truckGun', inkLine(gun, c('ink', 0)), { solid: SOLID });
}
