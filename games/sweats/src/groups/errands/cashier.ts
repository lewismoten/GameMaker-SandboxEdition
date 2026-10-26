// "How I Earned a Nod from the Smoking Cashier": Tuesday, cloudy skies, unforgiving humidity,
// the kind of day when even the asphalt sweats. Outside the mega-mart, groceries loaded, there
// it is: the cart, alone, abandoned, rogue. Cart return seven is thirty feet away, uphill
// against the wind, in a lot designed by chaotic neutral architects. The epic: the devil on his
// shoulder ("Everyone else leaves it"), gnats like vengeful soup fairies, the beige minivan
// reversing into his personal space (its driver eating corn on the cob, one-handed), a rogue
// receipt stuck to his leg, a child screaming at a balloon, a goose hissing in the distance, a
// traitorous flip-flop, the wind off the hill, and at the top cart return seven, bathed in
// golden light. It takes the cart (and the receipt, and the flip-flop: scars of honor), and
// the cashier behind the dumpsters gives him a nod.
//
// Layout (14 rows: the lot's asphalt top on row 12 at the store, stepping up a row at x 28, 42
// and 54: thirty feet uphill). The parked cars' roofs are ledges.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob, shadeAt } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing, spotlight } from '../../common/blocks';
import { anim, bob, corner, mon, pace, still } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { T, face, hello, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { MUGGY, clear, cut } from './art';
import { CASHIER_MON as CM } from './ids';

/** The scars of honor: the rogue cart, the receipt stuck to his leg, the traitorous flip-flop. */
export const SCARS = 3;

export function cashierBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const ink = c('ink', 0);
  // the muggy sky: high, and low over the lot (a haze of heat off the asphalt)
  const sky = (low: boolean) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sky'), 2, 5, low ? 0.72 : 0.5, x, y));
    return p;
  };
  const skyHigh = sky(false);
  const skyLow = sky(true);
  book.add('skyHigh', skyHigh, AIR);
  book.add('skyLow', skyLow, AIR);
  // a heavy gray cloud
  const cloud = clear(40, 20);
  blob(cloud, 12, 12, 10, 6, R('gray'), 1, 3);
  blob(cloud, 24, 9, 11, 8, R('gray'), 1, 3);
  blob(cloud, 32, 13, 7, 5, R('gray'), 1, 3);
  cloud.rect(3, 16, 36, 2, c('gray', 1));
  cut(book, 'cloud', cloud, skyHigh, () => AIR);
  // the asphalt (sweating), a stall's yellow line, and under it
  const asphalt = (line: boolean) => {
    const p = new Pixels(20, 20);
    const r = rng(line ? 61 : 62);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('asphalt', r() < 0.2 ? 0 : r() < 0.1 ? 2 : 1));
    p.rect(0, 0, 20, 2, c('asphalt', 3)).rect(0, 2, 20, 1, c('asphalt', 2));
    if (line) p.rect(8, 0, 4, 2, c('yellow', 2)).rect(8, 2, 4, 1, c('yellow', 1));
    // a puddle of humidity glinting
    if (!line) p.set(13, 1, c('white', 1)).set(14, 1, c('white', 2));
    return p;
  };
  book.add('asphalt', asphalt(false), { solid: SOLID });
  book.add('asphaltLine', asphalt(true), { solid: SOLID });
  const under = new Pixels(20, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) under.set(x, y, shadeAt(R('asphalt'), 0, 1, 0.6 - y / 40, x, y));
  book.add('asphaltUnder', under, { solid: SOLID });

  // ---------- the mega-mart: its sign, its wall, its sliding doors ----------
  const facade = (seed: number) => {
    const p = new Pixels(20, 20);
    const r = rng(seed);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('facade', y % 10 === 9 ? 0 : r() < 0.08 ? 2 : 1));
    return p;
  };
  book.add('facade', facade(63), { solid: SOLID });
  const sign = new Pixels(60, 20);
  sign.blit(facade(64), 0, 0).blit(facade(65), 20, 0).blit(facade(66), 40, 0);
  sign.rect(2, 2, 56, 15, c('red', 1)).rect(3, 3, 54, 13, c('red', 2)).rect(2, 16, 56, 1, c('red', 0));
  micro(sign, 6, 5, 'MEGA', c('yellow', 2), 2);
  micro(sign, 37, 5, 'MART', c('white', 2));
  micro(sign, 37, 11, 'OPEN', c('yellow', 2));
  sign.rect(33, 4, 1, 11, c('yellow', 2));
  cut(book, 'megaSign', sign, facade(64), () => ({ solid: SOLID }));
  const doors = new Pixels(40, 40);
  doors.blit(facade(67), 0, 0).blit(facade(68), 20, 0).blit(facade(69), 0, 20).blit(facade(70), 20, 20);
  doors.rect(2, 4, 36, 36, c('metal', 1));
  for (const x of [4, 21]) {
    for (let y = 6; y < 40; y++) for (let xx = x; xx < x + 15; xx++) doors.set(xx, y, shadeAt(R('sky'), 1, 3, (xx - x + y / 3) / 24, xx, y));
    doors.line(x + 3, 10, x + 8, 5 + 10, c('white', 2)).line(x + 4, 10, x + 9, 15, c('white', 1));
  }
  doors.rect(19, 4, 2, 36, c('metal', 0)).rect(2, 4, 36, 2, c('metal', 2));
  micro(doors, 9, 23, 'IN', c('white', 2));
  micro(doors, 25, 23, 'OUT', c('white', 2));
  cut(book, 'megaDoors', doors, facade(67), () => AIR);

  // ---------- a parked car (its roof a ledge) ----------
  const car = clear(60, 40);
  car.rect(2, 18, 56, 14, c('teal', 1)).rect(2, 18, 56, 3, c('teal', 2)).rect(2, 30, 56, 2, c('teal', 0));
  for (let y = 0; y < 16; y++) car.rect(14 - Math.floor(y * 0.5), 3 + y, 32 + Math.floor(y * 1.0), 1, c('teal', y < 2 ? 2 : 1));
  car.rect(14, 5, 14, 11, c('navy', 1)).rect(31, 5, 14, 11, c('navy', 1)).line(15, 6, 20, 6, c('white', 1));
  car.disc(14, 33, 5.5, ink).disc(14, 33, 2.5, c('metal', 1)).disc(46, 33, 5.5, ink).disc(46, 33, 2.5, c('metal', 1));
  car.rect(54, 22, 4, 3, c('yellow', 2)).rect(2, 22, 3, 3, c('red', 2)).rect(26, 22, 5, 1, c('teal', 0));
  outline(car, ink);
  cut(book, 'car', car, skyLow, (_col, row) => (row === 0 ? { solid: LEDGE, grav: GRAV.down } : AIR));
  // a lamp post: its head and its pole
  const lampHead = skyLow.crop(0, 0, 20, 20);
  lampHead.rect(2, 6, 16, 4, c('metal', 0)).rect(3, 10, 14, 2, c('yellow', 2)).rect(9, 10, 2, 10, c('metal', 0)).rect(9, 2, 2, 4, c('metal', 0));
  book.add('lampHead', lampHead, AIR);
  const lampPole = skyLow.crop(0, 0, 20, 20);
  lampPole.rect(9, 0, 2, 20, c('metal', 0)).rect(9, 0, 1, 20, c('metal', 1));
  book.add('lampPole', lampPole, AIR);
  // the crooked sign of the chaotic neutral architects: CART RETURN, an arrow each way (the wind comes off it)
  const post = skyLow.crop(0, 0, 20, 20);
  post.rect(9, 6, 2, 14, c('metal', 0));
  // CART RETURN 7 this way, and CART RETURN 7 that way
  const arrow = (y: number, right: boolean, col: string) => {
    post.rect(3, y, 14, 6, c(col, 2)).frame(3, y, 14, 6, ink);
    micro(post, right ? 5 : 11, y + 1, '7', c('white', 2));
    const tip = right ? 18 : 1;
    for (let k = 0; k < 3; k++)
      post
        .rect(right ? tip - k - 1 : tip + k, y + 3 - k, 1, 1 + k * 2 - 1 || 1, c(col, 2))
        .rect(right ? tip - k - 1 : tip + k, y + 2 - k + 1, 1, k * 2 + 1, c(col, 2));
    post.line(right ? 10 : 6, y + 3, right ? 14 : 10, y + 3, c('white', 2));
  };
  arrow(1, true, 'navy');
  arrow(9, false, 'green');
  book.add('crookedSign', post, { ...AIR, birthMon: CM.gust, birthTime: 90 });
  // the child screaming at a balloon
  const child = skyLow.crop(0, 0, 20, 20).blit(outline(childArt(pal), ink), 0, 0, T);
  book.add('child', child, AIR);
  // the dumpsters, behind which the cashier smokes
  const dump = clear(40, 20);
  for (const x of [1, 21]) {
    dump
      .rect(x, 6, 18, 12, c('green', 1))
      .rect(x, 6, 18, 2, c('green', 2))
      .rect(x - 1, 4, 20, 3, c('green', 0))
      .rect(x + 2, 9, 14, 1, c('green', 0));
    dump.disc(x + 3, 18, 1.5, ink).disc(x + 15, 18, 1.5, ink);
  }
  micro(dump, 4, 11, 'TRASH', c('green', 3));
  outline(dump, ink);
  cut(book, 'dumpsters', dump, skyLow, () => AIR);

  // ---------- cart return seven, bathed in golden light (the gate) ----------
  const glowSky = (seed: number) => {
    const p = skyLow.crop(0, 0, 20, 20);
    const r = rng(seed);
    for (let i = 0; i < 70; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('spot', r() < 0.5 ? 0 : 1));
    return p;
  };
  const corral = (open: boolean) => {
    const p = clear(40, 40);
    // rays of golden light from above
    p.rect(2, 2, 36, 13, c('navy', 1)).rect(3, 3, 34, 11, c('navy', 2)).rect(18, 15, 4, 6, c('metal', 0));
    micro(p, 4, 3, 'CART', c('white', 2));
    micro(p, 4, 9, 'RETURN', c('white', 2));
    micro(p, 29, 3, '7', c('gold', 3), 2);
    // the corral rails, the carts already in it (and, opened, his, locked in with a mighty clank)
    p.rect(1, 21, 38, 2, c('metal', 2)).rect(1, 30, 38, 2, c('metal', 1)).rect(1, 21, 2, 19, c('metal', 1)).rect(37, 21, 2, 19, c('metal', 1));
    for (const dx of open ? [4, 9, 22, 27] : [22, 27]) {
      p.line(dx, 25, dx + 9, 25, c('red', 2))
        .line(dx + 1, 26, dx + 1, 35, c('metal', 2))
        .line(dx + 9, 25, dx + 8, 35, c('metal', 2))
        .line(dx + 1, 35, dx + 8, 35, c('metal', 2));
      p.disc(dx + 2, 37, 1.2, ink).disc(dx + 8, 37, 1.2, ink);
    }
    if (open)
      for (const [x, y] of [
        [3, 20],
        [14, 19],
        [8, 23],
      ])
        p.set(x, y, c('gold', 3))
          .set(x + 1, y - 1, c('gold', 3))
          .set(x - 1, y + 1, c('gold', 3));
    return outline(p, ink);
  };
  // the golden light pouring down on it (or possibly the glow of someone's vape)
  const beam = skyHigh.crop(0, 0, 20, 20);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) if ((x + y * 3) % 4 === 0 || (x > 5 && x < 15 && (x + y) % 2 === 0)) beam.set(x, y, c('spot', x > 6 && x < 13 ? 1 : 0));
  book.add('beam', beam, AIR);
  cut(
    book,
    'cartReturn',
    corral(false),
    (col, row) => glowSky(70 + col + row * 2),
    () => AIR,
    [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
  );
  const gateOpen = glowSky(72).blit(corral(true).crop(0, 20, 20, 20), 0, 0, T);
  book.add('cartReturnOpen', gateOpen, { grav: GRAV.none });
  gate(book, 'cartReturnGate', glowSky(72).blit(corral(false).crop(0, 20, 20, 20), 0, 0, T), 'cartReturnOpen', SCARS);

  // ---------- the scars of honor (the plot) ----------
  const thing = (draw: (p: Pixels) => void) => (p: Pixels) => {
    const t = clear();
    draw(t);
    p.blit(outline(t, ink), 0, 0, T);
  };
  plotThing(
    book,
    'skyLow',
    'rogueCart',
    thing((p) => {
      // the cart, alone, abandoned, rogue, with its cold, wobbly eyes
      p.line(1, 6, 4, 6, c('red', 2)).line(4, 6, 6, 9, c('metal', 2));
      p.rect(6, 8, 13, 2, c('red', 2)).line(6, 10, 8, 16, c('metal', 2)).line(18, 10, 17, 16, c('metal', 2));
      for (let x = 8; x < 18; x += 3) p.line(x, 10, x, 15, c('metal', 1));
      p.line(8, 13, 17, 13, c('metal', 1)).line(8, 16, 17, 16, c('metal', 2));
      p.disc(9, 18, 1.4, ink).disc(16, 18, 1.4, ink);
      p.disc(10, 4, 2.2, c('white', 2)).disc(15, 4, 2.2, c('white', 2)).set(11, 5, ink).set(14, 3, ink);
    }),
  );
  plotThing(
    book,
    'skyLow',
    'receipt',
    thing((p) => {
      for (let y = 2; y < 18; y++) p.rect(5 + Math.round(Math.sin(y / 3) * 2), y, 9, 1, c('white', y % 2 ? 2 : 1));
      for (let y = 4; y < 16; y += 2) p.rect(7 + Math.round(Math.sin(y / 3) * 2), y, 3 + ((y * 5) % 4), 1, c('gray', 1));
      p.rect(6, 17, 9, 1, c('gray', 2));
    }),
  );
  plotThing(
    book,
    'skyLow',
    'flipflop',
    thing((p) => {
      // the traitorous flip-flop, folded like a politician mid-scandal
      for (let k = 0; k < 14; k++) p.rect(3 + k, 13 - Math.round(Math.abs(k - 7) * 0.9), 2, 4, c('pink', 2));
      p.line(10, 6, 7, 12, c('teal', 2)).line(10, 6, 13, 12, c('teal', 2));
      p.set(15, 4, c('lcd', 2)).set(16, 6, c('lcd', 2));
    }),
  );

  loot(book, pal, 'skyLow');
  spotlight(book, pal, 'skyLow');
}

/** The child screaming at a balloon (the balloon is a foe of its own). */
function childArt(pal: Pal): Pixels {
  const c = pal.c;
  const ink = c('ink', 0);
  const p = clear();
  p.rect(7, 15, 2, 5, c('navy', 1)).rect(11, 15, 2, 5, c('navy', 1));
  p.rect(6, 10, 8, 6, c('yellow', 2)).line(6, 11, 3, 6, c('skin', 3)).line(13, 11, 16, 6, c('skin', 3));
  blob(p, 10, 7, 3.4, 3.4, pal.r('skin'), 1, 4);
  p.rect(7, 3, 6, 2, c('hair', 2));
  p.set(8, 6, ink).set(12, 6, ink).rect(9, 8, 3, 2, ink).set(10, 9, c('red', 2));
  p.set(4, 2, c('white', 2)).set(16, 2, c('white', 2)).set(3, 4, c('white', 2)).set(17, 4, c('white', 2));
  return p;
}

export function cashierSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const done = (p: Pixels) => outline(p, ink);
  // the devil on his shoulder: little, red, a pitchfork, LEAVE IT
  const devil = (f: number) => {
    const p = clear();
    blob(p, 9, 12, 4, 4.5, pal.r('red'), 1, 3);
    p.set(6, 7 - f, c('red', 3))
      .set(5, 6 - f, c('red', 3))
      .set(12, 7 - f, c('red', 3))
      .set(13, 6 - f, c('red', 3));
    p.line(15, 4, 15, 18, c('gold', 1)).line(14, 4, 14, 6, c('gold', 1)).line(16, 4, 16, 6, c('gold', 1));
    p.line(5, 15, 2, 18 + f, c('red', 1)).set(1, 18 + f, c('red', 2));
    p.line(5, 9 + f, 1, 7 + f, c('red', 1)).line(13, 9 - f, 17, 10, c('red', 1));
    face(p, pal, 9, 11, { grin: true, angry: true });
    return done(p);
  };
  book.add('devil0', devil(0), hurts(-6));
  book.add('devil1', devil(1), hurts(-6));
  // gnats: a cloud of specks with little wings, vengeful soup fairies
  const gnats = (f: number) => {
    const p = clear();
    const r = rng(80 + f);
    for (let k = 0; k < 14; k++) {
      const x = 3 + Math.floor(r() * 14);
      const y = 3 + Math.floor(r() * 14);
      p.rect(x, y, 2, 2, ink)
        .set(x - 1, y - 1 + f, c('white', 2))
        .set(x + 2, y - 1 + f, c('white', 2))
        .set(x, y, c('red', 2));
    }
    return p;
  };
  book.add('gnats0', gnats(0), hurts(-4));
  book.add('gnats1', gnats(1), hurts(-4));
  // the beige minivan reversing: its back (lights flashing), its front (the driver, the corn on the cob)
  const van = (f: number) => {
    const p = clear(40, 20);
    p.rect(1, 6, 38, 10, c('van', 1)).rect(1, 6, 38, 2, c('van', 2)).rect(1, 15, 38, 1, c('van', 0));
    for (let y = 0; y < 5; y++) p.rect(3 + y, 1 + y, 26 + 0 * y, 1, c('van', y === 0 ? 2 : 1));
    p.rect(3, 2, 2, 4, c('van', 1));
    p.rect(5, 2, 9, 5, c('navy', 0)).rect(16, 2, 9, 5, c('navy', 0)).rect(27, 3, 7, 4, c('navy', 1));
    for (let y = 3; y < 7; y++) p.rect(29 + y - 3, y, 1, 1, c('van', 1));
    p.rect(1, 9, 3, 3, c('red', f ? 3 : 1)).rect(1, 12, 3, 2, c('white', f ? 2 : 0));
    p.rect(37, 9, 2, 2, c('yellow', 2)).line(18, 8, 18, 14, c('van', 0));
    p.disc(9, 16, 3.5, ink).disc(9, 16, 1.5, c('metal', 1)).disc(31, 16, 3.5, ink).disc(31, 16, 1.5, c('metal', 1));
    // the driver, one-handed, corn on the cob
    blob(p, 30, 4.5, 2.4, 2.4, pal.r('skin'), 1, 3);
    p.set(31, 4, ink);
    p.rect(26, 5 + f, 2, 5, c('yellow', 2))
      .rect(26, 5 + f, 2, 1, c('green', 2))
      .set(27, 7 + f, c('yellow', 3));
    if (f) micro(p, 6, 9, 'BEEP', c('van', 0));
    return done(p);
  };
  for (const f of [0, 1]) {
    const v = van(f);
    book.add(`vanRear${f}`, v.crop(0, 0, 20, 20), hurts(-3));
    book.add(`vanFront${f}`, v.crop(20, 0, 20, 20), hurts(-3));
  }
  // the balloon, bobbing, its string trailing
  const balloon = (f: number) => {
    const p = clear();
    blob(p, 10, 7, 5, 6, pal.r('red'), 1, 3);
    p.set(10, 13, c('red', 1)).line(10, 14, 9 + f * 2, 19, c('white', 1));
    face(p, pal, 10, 6, { grin: true });
    return done(p);
  };
  book.add('balloon0', balloon(0), hurts(-5));
  book.add('balloon1', balloon(1), hurts(-5));
  // the goose, hissing
  const goose = (f: number) => {
    const p = clear();
    blob(p, 11, 14, 6, 4, pal.r('white'), 0, 2);
    p.rect(13, 13, 5, 2, c('white', 0)).rect(5, 5 + f, 3, 10 - f, c('white', 1));
    blob(p, 5, 5 + f, 3, 2.4, pal.r('white'), 0, 2);
    p.rect(0, 5 + f, 3, 2, c('orange', 2)).set(0, 7 + f, c('orange', 1));
    p.set(5, 4 + f, ink).set(4, 3 + f, ink);
    if (f) (p.line(0, 2, 2, 3, c('white', 2)), p.line(0, 9, 2, 8, c('white', 2)));
    p.rect(9, 18, 1, 2, c('orange', 2)).rect(13, 18, 1, 2, c('orange', 2));
    return done(p);
  };
  book.add('goose0', goose(0), hurts(-6));
  book.add('goose1', goose(1), hurts(-6));
  // a gust of wind off the hill
  const gust = (f: number) => {
    const p = clear();
    for (const [y, w] of [
      [6, 14],
      [10, 10],
      [14, 16],
    ]) {
      p.line(2 + f * 2, y, 2 + w, y, c('white', 2));
      p.set(2 + w + 1, y - 1, c('white', 1)).set(2 + w + 1, y - 2, c('white', 1));
    }
    return p;
  };
  book.add('gust0', gust(0), hurts(-4));
  book.add('gust1', gust(1), hurts(-4));
  // the cashier on her break behind the dumpsters: the red smock, the wisp of smoke, the nod
  const cashier = (f: number) => {
    const p = clear();
    p.rect(7, 15, 2, 5, c('navy', 0)).rect(11, 15, 2, 5, c('navy', 0));
    p.rect(5, 8, 10, 8, c('red', 2)).rect(5, 8, 10, 1, c('red', 3)).rect(11, 10, 3, 2, c('white', 2));
    blob(p, 10, 5 + f, 3.4, 3.2, pal.r('skin'), 1, 4);
    p.rect(6, 1 + f, 8, 3, c('hair', 0)).rect(5, 2 + f, 2, 7, c('hair', 0));
    p.rect(9, 6 + f, 1, 1, ink)
      .rect(12, 6 + f, 1, 1, ink)
      .rect(10, 8 + f, 3, 1, c('skin', 1));
    p.line(14, 9, 16, 7, c('red', 2)).rect(16, 6, 3, 1, c('white', 2)).set(19, 6, c('orange', 3));
    p.set(18, 3 - f, c('gray', 2))
      .set(17, 1 - f, c('gray', 2))
      .set(19, 2 - f, c('gray', 3));
    return done(p);
  };
  book.add('cashier0', cashier(0), hello);
  book.add('cashier1', cashier(1), hello);
}

function cashierMonsters(set: Monster[], mb: SpriteBook): void {
  const foe = { power: POWER.foe, thru: 1, newmon: CM.poof };
  set[CM.devil] = mon(anim(mb, 'devil0', 'devil1', 7), foe, pace(3, 1));
  set[CM.gnats] = mon(anim(mb, 'gnats0', 'gnats1', 2), { ...foe, thru: 0 }, [
    corner(0, 0, 1),
    corner(2, -1, 1, 0),
    corner(3, 0, 1, 0),
    corner(1, 1, 1, 4),
    corner(0, 0, 1, 4),
  ]);
  // the van reverses two blocks into the lane and pulls forward again: no word stops it
  const reverse = [corner(0, 0, 2), corner(-2, 0, 2, 0), corner(0, 0, 1, 0)];
  set[CM.vanRear] = mon(anim(mb, 'vanRear0', 'vanRear1', 5), { power: POWER.tough, thru: 0 }, reverse);
  set[CM.vanFront] = mon(anim(mb, 'vanFront0', 'vanFront1', 5), { power: POWER.tough, thru: 0 }, reverse);
  set[CM.balloon] = mon(anim(mb, 'balloon0', 'balloon1', 10), { ...foe, thru: 0 }, bob(1, 1));
  set[CM.goose] = mon(anim(mb, 'goose0', 'goose1', 6), foe, pace(3, 1));
  set[CM.gust] = mon(anim(mb, 'gust0', 'gust1', 3), { ...foe, thru: 0, end: -1 }, [corner(0, 0, 3), corner(-8, 0, 3, 0)]);
  set[CM.poof] = mon(anim(mb, 'poof0', 'poof1', 3), { power: POWER.friend, thru: 0, end: 8 });
  set[CM.cashier] = mon(
    [
      [mb.n('cashier0'), 40],
      [mb.n('cashier1'), 8],
    ],
    { power: POWER.friend, thru: 0, newmon: CM.cashierOff },
    still,
  );
  set[CM.cashierOff] = mon(
    [
      [mb.n('cashier1'), 12],
      [mb.n('cashier0'), 30],
    ],
    { power: POWER.tough, thru: 0, end: 60 },
    still,
  );
}

export const cashier: Monologue = {
  file: 'cashier',
  title: 'How I Earned a Nod from the Smoking Cashier',
  desc: 'Cart Return Seven',
  light: MUGGY,
  filler: 'asphaltUnder',
  legend: {
    '.': 'skyHigh',
    ',': 'skyLow',
    '=': 'asphalt',
    '|': 'asphaltLine',
    '#': 'asphaltUnder',
    F: 'facade',
    P: 'lampPole',
    L: 'lampHead',
    S: 'crookedSign',
    k: 'child',
    G: 'cartReturnGate',
    $: 'coin@skyLow',
    b: 'bill@skyLow',
    m: 'mug@skyLow',
    '!': 'spot@skyLow',
    '1': 'rogueCart',
    '2': 'receipt',
    '3': 'flipflop',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the parking lot past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 12;
    const W = 72 + OFF;
    const H = 14;
    m.fill(0, 0, W, 6, '.').fill(0, 6, W, H - 6, ',');
    // the lot steps up a row at x 28, 42 and 54: thirty feet uphill
    const ground = (x0: number, x1: number, top: number) => {
      for (let x = x0; x <= x1; x++) {
        m.set(x, top, x % 4 === 1 ? '|' : '=');
        m.col(x, top + 1, H - 1, '#');
      }
    };
    ground(0, 27, 12);
    ground(28, 41, 11);
    ground(42, 53, 10);
    ground(54, W - 1, 9);
    // the clouds
    for (const [x, y] of [
      [5, 1],
      [19, 3],
      [33, 1],
      [47, 2],
      [62, 1],
    ])
      m.set(x, y, 'cloud.0.0').set(x + 1, y, 'cloud.1.0');
    // the mega-mart behind him: the sign, the wall, the doors out
    m.fill(0, 6, 3, 6, 'F');
    m.set(0, 6, 'megaSign.0.0').set(1, 6, 'megaSign.1.0').set(2, 6, 'megaSign.2.0');
    m.set(1, 10, 'megaDoors.0.0').set(2, 10, 'megaDoors.1.0').set(1, 11, 'megaDoors.0.1').set(2, 11, 'megaDoors.1.1');
    m.set(4, 11, '!');
    // the rogue cart; the devil on his shoulder; the lamp post
    m.set(6, 11, '1').set(9, 11, '$').set(13, 11, '$');
    m.mon(CM.devil, 9, 11);
    m.set(11, 7, 'L').col(11, 8, 11, 'P');
    // a parked car (its roof a ledge, a dollar on it), the gnats, the minivan reversing
    for (let c = 0; c < 3; c++) m.set(15 + c, 10, `car.${c}.0`).set(15 + c, 11, `car.${c}.1`);
    m.set(16, 9, 'b');
    m.mon(CM.gnats, 19, 9);
    m.mon(CM.vanRear, 24, 11).mon(CM.vanFront, 25, 11);
    m.set(27, 11, '$');
    // up the first step: the receipt, the child and the balloon, another car, a coin on its roof
    m.set(31, 10, '2').set(34, 10, 'k');
    m.mon(CM.balloon, 36, 10);
    for (let c = 0; c < 3; c++) m.set(38 + c, 9, `car.${c}.0`).set(38 + c, 10, `car.${c}.1`);
    m.set(39, 8, '$').set(41, 10, '$');
    // up the second: the lamp, the goose, the flip-flop, a coffee
    m.set(44, 6, 'L').col(44, 7, 9, 'P');
    m.mon(CM.goose, 46, 9);
    m.set(45, 9, '$').set(51, 9, '3').set(53, 9, 'm');
    // the top: the crooked sign (the wind off the hill), the dumpsters and the cashier, cart return seven
    m.set(56, 8, 'S').set(58, 8, '$').set(60, 8, '$');
    m.mon(MON.carl, 59, 7);
    m.fill(68, 1, 2, 6, 'beam');
    m.set(62, 8, 'dumpsters.0.0').set(63, 8, 'dumpsters.1.0');
    m.mon(CM.cashier, 64, 8);
    m.set(66, 8, 'b');
    m.set(68, 7, 'cartReturn.0.0').set(69, 7, 'cartReturn.1.0').set(68, 8, 'G').set(69, 8, 'cartReturn.1.1');
    m.link(68 + OFF, 8, 'next');
    return { start: [3, 11], size: [W, H] };
  },
  monsters: cashierMonsters,
  song: 'outside',
  clips: { open: 'cart_o', line: 'cart_l', punch: 'cart_p', word: 'cart_w' },
  view: [12, 6],
  card: ['Thirty feet uphill', 'against the wind.'],
};
