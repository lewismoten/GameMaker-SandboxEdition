// "The Day the Self-Checkout Tried to Destroy Me": last Tuesday, a simple trip to the grocery
// store, armed with a shopping list and misplaced confidence. The epic: aisle three, its shelves
// towering like canyon walls (the bread on the middle shelf, the suspiciously heavy bag of kale
// up top, the loyalty card he doesn't have flapping up and down the aisle), the dairy cooler
// (the milk), the free-sample taster, then the self-checkouts: UNEXPECTED ITEM IN BAGGING AREA
// drifting off one screen, the other locked out (ASSISTANCE NEEDED, its light flashing) and its
// scanner shooting BEEPs at the bread's barcode, the slowest employee on earth shuffling between
// them ("Try again"), and the milk jug, the final boss, in three stages. Then he forgot the
// eggs: back to aisle five, and the last self-checkout takes all four (one beep at a time).
//
// Layout (13 rows: the ceiling on row 0, the store's band on row 2, the linoleum on row 11):
// the shelves are ledges on rows 8 and 5 (hop up through them), the dairy cooler's top a ledge
// on row 4.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob, shadeAt } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing, spotlight } from '../../common/blocks';
import { anim, corner, mon, pace, still } from '../../common/characters';
import type { MapBuilder } from '../../common/maps';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { clear, cut, over } from './art';
import { CHECKOUT_MON as CM } from './ids';

/** The groceries: the bread, the kale, the milk, and the eggs he forgot. */
export const GROCERIES = 4;

/** The store's cream wall, faint panel seams. */
function storeWall(pal: Pal): Pixels {
  const p = new Pixels(20, 20);
  const r = rng(31);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, pal.c('cream', r() < 0.05 ? 2 : 3));
  p.rect(0, 0, 1, 20, pal.c('cream', 2));
  return p;
}

export function checkoutBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const ink = c('ink', 0);
  const wall = () => storeWall(pal);
  book.add('storeWall', wall(), AIR);
  // the band round the store: an orange stripe between two green lines
  const band = wall();
  band.rect(0, 5, 20, 1, c('green', 1)).rect(0, 7, 20, 7, c('orange', 2)).rect(0, 8, 20, 1, c('orange', 3)).rect(0, 15, 20, 1, c('green', 1));
  book.add('storeBand', band, AIR);
  // the walking row: the wall with its kick plate
  const base = wall();
  base.rect(0, 15, 20, 5, c('lino', 0)).rect(0, 15, 20, 1, c('lino', 1));
  book.add('storeBase', base, AIR);
  // the linoleum: big checks, polished
  const tile = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) tile.set(x, y, (Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? c('lino', 1) : c('cream', 2));
  tile.rect(0, 0, 20, 1, c('white', 2)).rect(0, 1, 20, 1, c('lino', 2));
  book.add('tile', tile, { solid: SOLID });
  const under = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) under.set(x, y, shadeAt(R('lino'), 0, 1, 0.5 - y / 60, x, y));
  book.add('tileUnder', under, { solid: SOLID });
  // the ceiling: tiles, and a long fluorescent tube
  const ceiling = (lit: boolean) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 10 === 0 || y % 10 === 0 ? c('cream', 1) : c('cream', 3));
    if (lit) p.rect(1, 12, 18, 5, c('spot', 1)).rect(1, 14, 18, 1, c('spot', 2)).frame(0, 11, 20, 7, c('metal', 1));
    p.rect(0, 18, 20, 2, c('cream', 0));
    return p;
  };
  book.add('storeCeil', ceiling(false), { solid: SOLID });
  book.add('storeCeilLit', ceiling(true), { solid: SOLID });

  // ---------- aisle three: the shelves (a pegboard back, a shelf at the bottom of each block) ----------
  type Goods = 'cans' | 'boxes' | 'eggs';
  const shelf = (goods: Goods, lip: boolean, seed: number) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (x % 4 === 1 && y % 4 === 1) ? c('lino', 0) : c('lino', 1));
    const r = rng(seed);
    const labels = ['red', 'green', 'yellow', 'navy', 'orange', 'teal'];
    if (goods === 'cans')
      for (let x = 1; x < 19; x += 5) {
        const l = labels[Math.floor(r() * labels.length)];
        p.rect(x, 9, 4, 8, c('metal', 2)).rect(x, 11, 4, 4, c(l, 2)).rect(x, 12, 4, 1, c(l, 3)).rect(x + 3, 9, 1, 8, c('metal', 0));
        p.rect(x, 4, 4, 5, c('metal', 1)).rect(x, 5, 4, 3, c(labels[(Math.floor(r() * 6) + 1) % 6], 1));
      }
    if (goods === 'boxes')
      for (let x = 1; x < 19; x += 6) {
        const l = labels[Math.floor(r() * labels.length)];
        const h = 9 + Math.floor(r() * 4);
        p.rect(x, 17 - h, 5, h, c(l, 2)).rect(x, 17 - h, 5, 2, c(l, 3)).rect(x + 4, 17 - h, 1, h, c(l, 1));
        p.rect(x + 1, 12 - Math.floor(h / 3), 3, 2, c('white', 2));
      }
    if (goods === 'eggs')
      for (const y of [6, 12]) {
        p.rect(1, y, 18, 5, c('cream', 1)).rect(1, y, 18, 1, c('cream', 2));
        for (let x = 2; x < 18; x += 4) p.disc(x + 1.5, y + 1, 1.6, c('white', 2));
      }
    p.rect(0, 17, 20, 3, c('metal', 1)).rect(0, 17, 20, 1, c('metal', 2));
    if (lip) {
      p.rect(0, 0, 20, 3, c('metal', 2)).rect(0, 3, 20, 1, c('metal', 0));
      p.rect(3, 1, 4, 3, c('orange', 3)).rect(12, 1, 4, 3, c('yellow', 2));
    }
    return p;
  };
  book.add('shelfCans', shelf('cans', false, 41), AIR);
  book.add('shelfBoxes', shelf('boxes', false, 42), AIR);
  book.add('shelfEggs', shelf('eggs', false, 43), AIR);
  book.add('lipCans', shelf('cans', true, 44), { solid: LEDGE, grav: GRAV.down });
  book.add('lipBoxes', shelf('boxes', true, 45), { solid: LEDGE, grav: GRAV.down });
  // the aisle signs hanging from the ceiling on wires: AISLE 3, AISLE 5
  const sign = (n: string) => {
    const p = clear(40, 20);
    p.line(8, 0, 8, 4, c('metal', 0)).line(31, 0, 31, 4, c('metal', 0));
    p.rect(3, 4, 34, 13, c('navy', 1)).rect(4, 5, 32, 11, c('navy', 2)).rect(3, 16, 34, 1, c('navy', 0));
    micro(p, 6, 8, 'AISLE', c('white', 2));
    micro(p, 27, 6, n, c('yellow', 2), 2);
    return outline(p, ink);
  };
  cut(book, 'aisle3', sign('3'), band, () => AIR);
  cut(book, 'aisle5', sign('5'), band, () => AIR, [[1, 0]]);
  // over the checkouts: SELF CHECKOUT, an arrow down; and the pennants strung along the store
  const selfSign = clear(60, 20);
  selfSign.line(10, 0, 10, 3, c('metal', 0)).line(49, 0, 49, 3, c('metal', 0));
  selfSign.rect(2, 3, 56, 14, c('red', 1)).rect(3, 4, 54, 12, c('red', 2)).rect(2, 16, 56, 1, c('red', 0));
  micro(selfSign, 5, 7, 'SELF CHECKOUT', c('white', 2));
  outline(selfSign, ink);
  cut(book, 'selfSign', selfSign, wall(), () => AIR);
  const pennants = wall();
  pennants.line(0, 2, 10, 4, c('metal', 0)).line(10, 4, 19, 2, c('metal', 0));
  for (const [x, y, col] of [[2, 3, 'red'], [8, 4, 'yellow'], [14, 4, 'teal']] as const) for (let k = 0; k < 6; k++) pennants.rect(x + Math.floor(k / 2), y + k, 4 - Math.floor(k / 1.5), 1, c(col, 2));
  book.add('pennants', pennants, AIR);

  // ---------- the dairy cooler: a lit glass case of milk ----------
  const coolerTop = wall();
  coolerTop.rect(0, 2, 20, 18, c('metal', 1)).rect(0, 2, 20, 2, c('metal', 2)).rect(0, 6, 20, 10, c('navy', 1));
  micro(coolerTop, 3, 8, 'MILK', c('white', 2));
  for (const [x, y] of [[1, 7], [17, 12], [18, 7]]) coolerTop.rect(x, y, 2, 2, c('white', 2));
  book.add('coolerTop', coolerTop, { solid: LEDGE, grav: GRAV.down });
  const coolerDoor = (cartons: boolean) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('lcd'), 1, 2, 0.6 - y / 50, x, y));
    p.rect(0, 0, 2, 20, c('metal', 1)).rect(18, 0, 2, 20, c('metal', 0)).rect(16, 6, 1, 8, c('metal', 2));
    p.rect(2, 18, 16, 2, c('metal', 1));
    if (!cartons)
      for (const x of [3, 9]) {
        p.rect(x, 9, 5, 9, c('white', 2)).rect(x + 1, 7, 3, 2, c('white', 1)).rect(x + 1, 6, 3, 1, c('navy', 2)).rect(x, 12, 5, 3, c('teal', 1));
      }
    else
      for (const x of [3, 8, 12]) {
        p.rect(x, 11, 4, 7, c('white', 2)).set(x + 1, 10, c('white', 1)).set(x + 2, 10, c('white', 1)).rect(x, 13, 4, 2, c(x === 8 ? 'pink' : 'red', 2));
      }
    for (let k = 0; k < 6; k++) p.set(3 + k, 2 + k, c('white', 2));
    return p;
  };
  book.add('coolerDoor', coolerDoor(false), AIR);
  book.add('coolerDoor2', coolerDoor(true), AIR);
  // the free-sample taster: a little table, toothpicks in cubes of cheese, a FREE card
  const sample = over(wall(), pal, (p) => {
    p.rect(3, 11, 14, 2, c('wood', 3)).rect(9, 13, 2, 7, c('metal', 1)).rect(5, 19, 10, 1, c('metal', 1));
    p.rect(4, 9, 12, 2, c('white', 1));
    for (const x of [5, 8, 11, 14]) p.rect(x, 7, 2, 2, c('yellow', 2)).set(x, 5, c('wood', 4)).set(x, 6, c('wood', 4));
    p.rect(6, 1, 8, 4, c('white', 2));
  });
  micro(sample, 6, 1, 'FREE', c('red', 1));
  book.add('sample', sample, AIR);
  // a stack of nested carts by the door
  const carts = over(storeWall(pal).rect(0, 15, 20, 5, c('lino', 0)).rect(0, 15, 20, 1, c('lino', 1)), pal, (p) => {
    for (const dx of [0, 3, 6]) {
      p.line(2 + dx, 8, 12 + dx, 8, c('red', 2)).line(3 + dx, 9, 3 + dx, 15, c('metal', 2)).line(12 + dx, 8, 11 + dx, 15, c('metal', 2));
      p.line(3 + dx, 12, 11 + dx, 12, c('metal', 1)).line(3 + dx, 15, 11 + dx, 15, c('metal', 2));
    }
    p.disc(5, 17, 1.5, c('ink', 1)).disc(16, 17, 1.5, c('ink', 1));
  });
  book.add('carts', carts, AIR);

  // ---------- the self-checkouts ----------
  // 2 x 3 blocks: the pole and its light, the screen, the scanner; the bag rack, the bagging area
  type Kiosk = { light: 'on' | 'off' | 'go'; text: [string, string]; textCol: number };
  const kiosk = (k: Kiosk) => {
    const p = clear(40, 60);
    // the pole and its light
    p.rect(8, 6, 3, 18, c('metal', 1)).rect(9, 6, 1, 18, c('metal', 2));
    const lamp = k.light === 'go' ? 'green' : 'red';
    p.rect(5, 0, 9, 7, c(lamp, k.light === 'off' ? 0 : 3)).rect(5, 0, 9, 2, c(lamp, k.light === 'off' ? 1 : 3)).rect(6, 2, 2, 4, c('white', k.light === 'off' ? 0 : 2));
    if (k.light === 'on') for (const [x, y] of [[2, 1], [16, 1], [1, 5], [17, 5]]) p.set(x, y, c('red', 3)).set(x + (x < 9 ? 1 : -1), y, c('red', 2));
    p.rect(11, 12, 6, 6, c('white', 2));
    micro(p, 12, 13, k.light === 'go' ? '1' : '4', ink);
    // the screen
    p.rect(1, 22, 18, 17, c('ink', 1)).rect(2, 23, 16, 14, c('lcd', 1)).rect(2, 23, 16, 4, c('lcd', 2));
    micro(p, 3, 24, k.text[0], k.textCol);
    micro(p, 3, 31, k.text[1], k.textCol);
    p.rect(8, 38, 4, 2, c('metal', 0));
    // the cabinet: the scanner glass with its red cross of laser, the card reader, the coin slot
    p.rect(0, 40, 20, 20, c('metal', 1)).rect(0, 40, 20, 4, c('metal', 2)).rect(2, 41, 16, 2, c('ink', 1));
    p.line(4, 41, 15, 42, c('red', 3)).line(4, 42, 15, 41, c('red', 3));
    p.rect(3, 47, 6, 8, c('ink', 1)).rect(4, 48, 4, 3, c('lcd', 0)).rect(12, 48, 5, 2, c('ink', 0)).rect(12, 52, 5, 1, c('ink', 0));
    p.rect(0, 58, 20, 2, c('metal', 0));
    // the bag rack and the bagging area (the scale that knows every item's sins)
    p.rect(21, 24, 2, 34, c('metal', 0)).rect(36, 24, 2, 34, c('metal', 0)).rect(21, 24, 17, 2, c('metal', 2));
    for (const x of [24, 30]) {
      p.rect(x, 26, 6, 15, c('white', 1)).rect(x + 1, 27, 4, 13, c('white', 2)).rect(x, 26, 1, 4, c('white', 0)).rect(x + 5, 26, 1, 4, c('white', 0));
    }
    p.rect(20, 43, 20, 3, c('metal', 2)).rect(20, 46, 20, 14, c('metal', 1)).rect(20, 46, 20, 1, c('metal', 0));
    micro(p, 23, 50, 'BAGS', c('metal', 0));
    p.rect(20, 58, 20, 2, c('metal', 0));
    return outline(p, ink);
  };
  const back = (_col: number, row: number) => (row === 2 ? base : wall());
  // kiosk A: UNEXPECTED ITEM (its screen breeds the warnings)
  cut(book, 'kioskA', kiosk({ light: 'on', text: ['ITEM', '???'], textCol: c('red', 1) }), back, (col, row) => (col === 0 && row === 1 ? { ...AIR, birthMon: CM.unexpected, birthTime: 150 } : col === 0 && row === 0 ? { ...AIR, next: 'kioskOff', ntime: 6 } : AIR), [[0, 0], [0, 1], [1, 1], [0, 2], [1, 2]]);
  // its light flashing ASSISTANCE NEEDED
  book.add('kioskOff', wall().blit(kiosk({ light: 'off', text: ['', ''], textCol: 0 }).crop(0, 0, 20, 20), 0, 0, 255), { ...AIR, next: 'kioskA.0.0', ntime: 6 });
  // kiosk B: locked out, HELP (its scanner shoots BEEPs at the barcode)
  cut(book, 'kioskB', kiosk({ light: 'on', text: ['HELP', 'LOCK'], textCol: c('red', 1) }), back, (_c, row) => (row === 2 ? { ...AIR, birthMon: CM.beep, birthTime: 110 } : AIR), [[0, 1], [0, 2]]);
  // the last self-checkout: SCAN. PAY. GO. (the gate: it takes all four groceries)
  const last = (open: boolean) => kiosk({ light: 'go', text: open ? ['THANK', 'YOU!'] : ['SCAN', 'PAY'], textCol: c('navy', 1) });
  cut(book, 'kioskC', last(false), back, () => AIR, [[0, 0], [0, 1]]);
  const cabinet = (open: boolean) => {
    const p = base.crop(0, 0, 20, 20).blit(last(open).crop(0, 40, 20, 20), 0, 0, 255);
    if (open) {
      p.rect(5, 2, 9, 14, c('white', 2)).rect(5, 2, 9, 1, c('white', 1));
      for (let y = 4; y < 15; y += 2) p.rect(6, y, 2 + ((y * 3) % 6), 1, c('grey', 1));
    } else micro(p, 4, 12, 'GO', c('green', 3));
    return p;
  };
  book.add('kioskOpen', cabinet(true), { grav: GRAV.none });
  gate(book, 'kioskGate', cabinet(false), 'kioskOpen', GROCERIES);

  // ---------- the groceries (the plot) ----------
  const bread = (p: Pixels) => {
    blob(p, 10, 12, 8, 5, R('wood'), 2, 4);
    p.rect(3, 10, 14, 1, c('wood', 1)).rect(17, 9, 2, 6, c('white', 1)).rect(18, 8, 1, 2, c('yellow', 2));
    for (const x of [6, 10, 14]) p.line(x, 8, x - 1, 11, c('wood', 2));
  };
  const kale = (p: Pixels) => {
    blob(p, 10, 13, 7, 6, R('white'), 0, 2);
    blob(p, 8, 9, 4, 4, R('green'), 0, 3);
    blob(p, 12, 8, 4, 4, R('green'), 0, 3);
    blob(p, 10, 6, 3, 3, R('green'), 1, 3);
    p.rect(6, 15, 8, 3, c('orange', 2));
    micro(p, 7, 15, '9LB', ink);
  };
  const milk = (p: Pixels) => {
    p.rect(4, 6, 12, 13, c('white', 2)).rect(4, 6, 2, 13, c('white', 1)).rect(7, 2, 5, 4, c('white', 2)).rect(7, 1, 5, 2, c('navy', 2));
    p.rect(13, 7, 4, 5, c('white', 1)).rect(14, 8, 2, 3, c('lcd', 1));
    p.rect(5, 11, 10, 4, c('navy', 2));
    micro(p, 6, 11, 'MLK', c('white', 2));
  };
  const eggs = (p: Pixels) => {
    p.rect(2, 10, 16, 8, c('cream', 2)).rect(2, 10, 16, 2, c('cream', 3)).rect(2, 16, 16, 2, c('cream', 1));
    for (const x of [4, 8, 12, 16]) p.disc(x, 9, 2, c('white', 2)).set(x - 1, 8, c('white', 2));
    micro(p, 5, 12, 'EGG', c('orange', 1));
  };
  plotThing(book, 'shelfBoxes', 'bread', (p) => p.blit(outlined(pal, bread), 0, 0, 255));
  plotThing(book, 'storeWall', 'kale', (p) => p.blit(outlined(pal, kale), 0, 0, 255));
  plotThing(book, 'coolerDoor', 'milk', (p) => p.blit(outlined(pal, milk), 0, 0, 255));
  plotThing(book, 'storeWall', 'eggs', (p) => p.blit(outlined(pal, eggs), 0, 0, 255));

  for (const bg of ['storeBase', 'storeWall']) loot(book, pal, bg);
  spotlight(book, pal, 'storeBase');
}

/** A thing drawn on a clear block and outlined. */
function outlined(pal: Pal, draw: (p: Pixels) => void): Pixels {
  const p = clear();
  draw(p);
  return outline(p, pal.c('ink', 0));
}

export function checkoutSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const done = (p: Pixels) => outline(p, ink);
  // the loyalty card: a plastic card with a gold stripe and a scowl, flapping
  const card = (f: number) => {
    const p = clear();
    const t = f ? 2 : 0;
    for (let y = 0; y < 10; y++) p.rect(3 + Math.round((y * t) / 10), 6 + y, 14, 1, c('orange', y < 2 ? 3 : 2));
    p.rect(3 + t / 2, 9, 14, 2, c('gold', 2));
    micro(p, 5, 12, 'VIP', c('white', 2));
    face(p, pal, 11, 7, { angry: true });
    return done(p);
  };
  book.add('card0', card(0), hurts(-6));
  book.add('card1', card(1), hurts(-6));
  // UNEXPECTED ITEM: a red warning triangle with a bang
  const unexpected = (f: number) => {
    const p = clear();
    for (let y = 0; y < 13; y++) p.rect(10 - Math.floor(y * 0.7), 3 + y + f, Math.floor(y * 1.4) + 1, 1, c('red', y < 2 ? 3 : 2));
    p.rect(9, 7 + f, 2, 5, c('white', 2)).rect(9, 13 + f, 2, 1, c('white', 2));
    p.set(2, 17, c('yellow', 2 + f)).set(17, 4, c('yellow', 3 - f));
    return done(p);
  };
  book.add('unexp0', unexpected(0), hurts(-6));
  book.add('unexp1', unexpected(1), hurts(-6));
  // BEEP: the barcode that will not scan, crossed by the red laser
  const beep = (f: number) => {
    const p = clear();
    p.rect(3, 8, 14, 9, c('white', 2));
    for (let x = 4; x < 16; x++) if ((x * 5) % 3 !== 1) p.rect(x, 9, 1, 6, ink);
    p.line(0, 12 + f, 19, 12 - f, c('red', 3));
    micro(p, 2, 1, 'BEEP', c('red', 2 + f));
    return done(p);
  };
  book.add('beep0', beep(0), hurts(-5));
  book.add('beep1', beep(1), hurts(-5));
  // the slowest employee on earth: hunched in his orange vest, the weight of a thousand lost carts
  const clerk = (f: number) => {
    const p = clear();
    p.rect(6, 15, 3, 5, c('navy', 1)).rect(11 + f, 15, 3, 5, c('navy', 1)).rect(5, 19, 4, 1, ink).rect(11 + f, 19, 4, 1, ink);
    p.rect(5, 8, 10, 8, c('teal', 1)).rect(6, 8, 8, 8, c('orange', 2)).rect(9, 8, 2, 8, c('teal', 1)).rect(11, 10, 3, 2, c('white', 2));
    blob(p, 9, 6, 3.4, 3.2, pal.r('skin'), 1, 3);
    p.rect(6, 2, 7, 2, c('hair', 0)).set(7, 6, ink).set(10, 6, ink).rect(7, 5, 2, 1, c('skin', 1)).rect(10, 5, 2, 1, c('skin', 1));
    p.rect(8, 8, 3, 1, ink);
    p.line(4, 9, 3, 14, c('teal', 1)).line(15, 9, 16, 14, c('teal', 1));
    if (f) {
      p.rect(12, 0, 8, 6, c('white', 2)).set(13, 6, c('white', 2));
      micro(p, 13, 0, 'TRY', ink);
    }
    return done(p);
  };
  book.add('clerk0', clerk(0), hurts(0));
  book.add('clerk1', clerk(1), hurts(0));
  // the milk jug: a gallon of attitude, then too big for the bagging area, then held mid-air
  const jug = (stage: number, f: number) => {
    const p = clear();
    const lean = stage === 1 ? (f ? 2 : -2) : 0;
    const lift = stage === 2 ? (f ? 3 : 5) : f;
    const y0 = 3 - lift + 2;
    for (let y = 0; y < 14; y++) p.rect(4 + Math.round((lean * (13 - y)) / 13), y0 + y, 12, 1, c('white', y < 3 ? 2 : 1));
    p.rect(5 + lean, y0 - 3, 5, 3, c('white', 2)).rect(5 + lean, y0 - 4, 5, 2, c('navy', 2));
    p.rect(13 + lean, y0, 3, 6, c('white', 0)).rect(14 + lean, y0 + 1, 1, 4, T);
    p.rect(5, y0 + 6, 10, 4, c('navy', 2));
    micro(p, 6, y0 + 6, stage === 1 ? 'BIG' : 'MLK', c('white', 2));
    face(p, pal, 9 + Math.round(lean / 2), y0 + 2, { angry: stage === 0, sad: stage === 2 });
    if (stage === 1) p.set(17, y0 + 12, c('white', 2)).set(18, y0 + 13, c('white', 2));
    if (stage === 2) {
      // the poet's hands under it, the lactose-powered trophy, and a sparkle
      p.rect(3, 17, 3, 2, c('skin', 2)).rect(14, 17, 3, 2, c('skin', 2));
      p.set(2, 2 + f, c('gold', 3)).set(17, 4 - f, c('gold', 3));
    }
    return done(p);
  };
  for (const [s, name] of [[0, 'jugA'], [1, 'jugB'], [2, 'jugC']] as const) {
    book.add(`${name}0`, jug(s, 0), hurts(-8));
    book.add(`${name}1`, jug(s, 1), hurts(-8));
  }
}

export function checkoutMonsters(set: Monster[], mb: SpriteBook): void {
  const foe = { power: POWER.foe, thru: 1, newmon: CM.poof };
  set[CM.card] = mon(anim(mb, 'card0', 'card1', 4), foe, pace(4, 2));
  set[CM.unexpected] = mon(anim(mb, 'unexp0', 'unexp1', 5), { ...foe, thru: 0, end: -1 }, [corner(0, 0, 2), corner(-1, 1, 2, 4), corner(-9, 0, 3, 4)]);
  set[CM.beep] = mon(anim(mb, 'beep0', 'beep1', 2), { ...foe, thru: 0, end: -1 }, [corner(0, 0, 3), corner(-8, 0, 3, 4)]);
  set[CM.clerk] = mon(anim(mb, 'clerk0', 'clerk1', 18), { power: POWER.tough, thru: 1 }, pace(2, 1));
  set[CM.jugA] = mon(anim(mb, 'jugA0', 'jugA1', 6), { ...foe, newmon: CM.jugB }, pace(2, 1));
  set[CM.jugB] = mon(anim(mb, 'jugB0', 'jugB1', 4), { ...foe, newmon: CM.jugC }, [corner(0, 0, 1), corner(-1, 0, 1, 4), corner(0, 0, 1, 0)]);
  set[CM.jugC] = mon(anim(mb, 'jugC0', 'jugC1', 8), foe, still);
  set[CM.poof] = mon(anim(mb, 'poof0', 'poof1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const checkout: Monologue = {
  file: 'checkout',
  title: 'The Day the Self-Checkout Tried to Destroy Me',
  desc: 'The Self-Checkout',
  filler: 'tileUnder',
  legend: {
    '^': 'storeCeil',
    '*': 'storeCeilLit',
    '.': 'storeWall',
    '-': 'storeBand',
    _: 'storeBase',
    '=': 'tile',
    '#': 'tileUnder',
    c: 'shelfCans',
    x: 'shelfBoxes',
    e: 'shelfEggs',
    C: 'lipCans',
    X: 'lipBoxes',
    K: 'coolerTop',
    d: 'coolerDoor',
    D: 'coolerDoor2',
    s: 'sample',
    k: 'carts',
    G: 'kioskGate',
    $: 'coin@storeBase',
    '%': 'coin@storeWall',
    b: 'bill@storeWall',
    B: 'bill@storeBase',
    m: 'mug@storeBase',
    '!': 'spot@storeBase',
    '1': 'bread',
    '2': 'kale',
    '3': 'milk',
    '4': 'eggs',
  },
  build: (m: MapBuilder) => {
    const W = 74;
    m.row(0, 0, W - 1, '^');
    for (let x = 2; x < W; x += 5) m.set(x, 0, '*');
    m.fill(0, 1, W, 9, '.').row(2, 0, W - 1, '-').row(3, 0, W - 1, 'pennants').row(10, 0, W - 1, '_').row(11, 0, W - 1, '=').row(12, 0, W - 1, '#');
    // the way in: the spotlight, the carts by the door
    m.set(2, 10, '!').set(4, 10, 'k').set(5, 10, '$');
    // aisle three: shelves from the floor to row 5, ledges on rows 8 and 5
    m.set(11, 2, 'aisle3.0.0').set(12, 2, 'aisle3.1.0');
    for (let x = 7; x <= 18; x++) {
      const odd = x % 2 === 1;
      m.set(x, 5, odd ? 'C' : 'X').set(x, 6, odd ? 'x' : 'c').set(x, 7, odd ? 'c' : 'x');
      m.set(x, 8, odd ? 'X' : 'C').set(x, 9, odd ? 'c' : 'x').set(x, 10, odd ? 'x' : 'c');
    }
    m.set(9, 7, '1');
    m.set(10, 4, '%').set(13, 4, 'b').set(16, 4, '2');
    m.mon(CM.card, 12, 7);
    m.mon(MON.carl, 14, 2);
    // the dairy cooler (its top a ledge), the milk on the walking row, a dollar on top
    m.row(4, 21, 25, 'K');
    for (let x = 21; x <= 25; x++) m.fill(x, 5, 1, 6, x % 2 ? 'd' : 'D');
    m.set(23, 10, '3').set(24, 3, 'b');
    // the free-sample taster and its coffee; the self-checkouts
    m.set(27, 10, 's').set(28, 10, 'm');
    for (const [name, x] of [['kioskA', 31], ['kioskB', 37]] as const) {
      m.set(x, 8, 'kioskA.0.0');
      m.set(x, 9, `${name}.0.1`).set(x, 10, `${name}.0.2`);
      m.set(x + 1, 9, 'kioskA.1.1').set(x + 1, 10, 'kioskA.1.2');
    }
    m.set(33, 5, 'selfSign.0.0').set(34, 5, 'selfSign.1.0').set(35, 5, 'selfSign.2.0');
    m.set(30, 10, '$').set(35, 7, '%');
    m.mon(CM.clerk, 34, 10);
    m.set(41, 10, '$').set(43, 10, 'B');
    m.mon(CM.card, 44, 10);
    // the milk jug, the final boss
    m.set(48, 10, '$');
    m.mon(CM.jugA, 53, 10);
    // aisle five: the eggs on top of a low shelf, Doc Leo shopping
    m.set(61, 2, 'aisle3.0.0').set(62, 2, 'aisle5.1.0');
    for (let x = 58; x <= 67; x++) m.set(x, 8, x % 2 ? 'X' : 'C').set(x, 9, 'e').set(x, 10, x % 2 ? 'c' : 'e');
    m.set(60, 7, '%').set(64, 7, '4').set(66, 7, '%');
    m.mon(MON.leo, 59, 10);
    // the last self-checkout: SCAN, PAY, GO
    m.set(70, 8, 'kioskC.0.0').set(70, 9, 'kioskC.0.1').set(70, 10, 'G');
    m.set(71, 9, 'kioskA.1.1').set(71, 10, 'kioskA.1.2');
    m.set(68, 10, '$');
    m.link(70, 10, 'next');
    return { start: [1, 10], size: [W, 13] };
  },
  monsters: checkoutMonsters,
  song: 'shop',
  clips: { open: 'kale_o', line: 'kale_l', punch: 'kale_p', word: 'kale_w' },
  view: [24, 5],
  card: ['Unexpected item', 'in the bagging area.'],
};
