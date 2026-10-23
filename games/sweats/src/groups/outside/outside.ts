// "This Is Why I Don't Go Outside": an otherwise uneventful Thursday, even the clouds too bored to
// bother. He leaves the pharmacy, five-foot receipt in hand, and the wind snatches it: down the
// sidewalk, through the parking lot between the minivans, past confused pedestrians ("IT'S MY
// RECEIPT!": a word scares them off), the elderly woman clutching her purse tighter, a runaway
// cart, the gusts that mock him, the park, the jogger, and at last the bush the wind launched it
// into. The plot is the receipt's four scraps (foot powder, the cream for extreme cases, the
// coupon for wipes he never bought, the total), each blown somewhere high: the street lamp, a
// minivan's roof, the gusts, the tree. With all four, the bush gives up the rest.
//
// Layout (12 rows: the sky, the skyline on row 8, the walking row 9, the ground on row 10).
import { Pixels, rng } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace, still } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hello, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { OUT_MON } from './ids';
import { skyAt, skylineAt, townAt } from './street';
import { person } from './people';

/** Scraps of the receipt to get back. */
export const SCRAPS = 4;

export function outsideBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const sky = (seed: number) => skyAt(pal, seed, 3);
  // the pharmacy he just left: its sign, the striped awning, the window, the door
  {
    const pic = new Pixels(60, 60, T);
    for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++) pic.set(x, y, (y % 6 === 5 || (x + (Math.floor(y / 6) % 2) * 5) % 10 === 0) && y > 2 ? c('brick2', 0) : c('brick2', 1 + ((x * 3 + y) % 7 === 0 ? 1 : 0)));
    pic.rect(0, 0, 60, 2, c('concrete', 2));
    pic.rect(5, 3, 50, 10, c('white', 2)).frame(5, 3, 50, 10, c('green', 1));
    micro(pic, 14, 5, 'PHARMACY', c('red', 1));
    for (const x of [9, 51]) pic.rect(x - 1, 5, 3, 7, c('green', 2)).rect(x - 3, 7, 7, 3, c('green', 2));
    for (let x = 0; x < 60; x++) {
      pic.rect(x, 15, 1, 5, c(Math.floor(x / 5) % 2 ? 'white' : 'red', 2));
      if (x % 5 === 2) pic.set(x, 20, c(Math.floor(x / 5) % 2 ? 'white' : 'red', 1));
    }
    pic.rect(0, 14, 60, 1, c('red', 0));
    // the window: shelves of remedies
    pic.rect(3, 24, 30, 28, c('glass', 1)).frame(3, 24, 30, 28, c('metal', 1));
    for (const y of [33, 42, 50]) pic.rect(4, y, 28, 1, c('metal', 2));
    const r = rng(60);
    for (const y of [27, 36, 45]) for (let x = 5; x < 31; x += 3) pic.rect(x, y + (r() < 0.3 ? 1 : 0), 2, 6 - (y === 45 ? 1 : 0), c(['red', 'teal', 'white', 'yellow', 'pink'][Math.floor(r() * 5)], 2));
    pic.line(6, 25, 12, 31, c('glass', 2)).line(8, 25, 14, 31, c('glass', 2));
    // the glass door, OPEN
    pic.rect(38, 23, 18, 37, c('metal', 1)).rect(40, 25, 14, 35, c('glass', 1)).rect(40, 25, 14, 1, c('glass', 2));
    pic.rect(42, 30, 10, 5, c('white', 2));
    micro(pic, 43, 30, 'OPEN', c('green', 0));
    pic.rect(41, 42, 2, 6, c('metal', 2));
    addPicture(book, 'pharmacy', pic, sky(61), () => AIR);
  }
  // the parking lot's asphalt (an oil stain, a parking line) and the park's grass
  const asphalt = (line: boolean) => {
    const p = new Pixels(20, 20, c('asphalt', 0));
    const r = rng(line ? 62 : 63);
    for (let i = 0; i < 50; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('asphalt', 1));
    p.rect(0, 0, 20, 2, c('asphalt', 2));
    if (line) p.rect(4, 0, 12, 2, c('white', 2)).rect(4, 2, 12, 1, c('white', 0));
    else blob(p, 12, 8, 4, 1.5, R('ink'), 0, 1);
    return p;
  };
  book.add('asphalt', asphalt(false), { solid: SOLID });
  book.add('asphaltLine', asphalt(true), { solid: SOLID });
  const grass = new Pixels(20, 20, c('soil', 1));
  const rg = rng(64);
  for (let i = 0; i < 30; i++) grass.set(Math.floor(rg() * 20), 6 + Math.floor(rg() * 14), c('soil', rg() < 0.5 ? 0 : 2));
  grass.rect(0, 0, 20, 5, c('green', 2)).rect(0, 5, 20, 1, c('green', 0));
  for (let x = 0; x < 20; x += 2) grass.set(x, 0, c('green', 3)).set(x + 1, 6, c('green', 1));
  book.add('grass', grass, { solid: SOLID });
  // a minivan (both the same model, both in the way): stand on its roof
  {
    const pic = new Pixels(60, 40, T);
    for (let y = 5; y < 34; y++) {
      const inset = y < 9 ? 9 - y : 0;
      const nose = y > 15 ? 0 : Math.max(0, 15 - y) * 0.6;
      pic.rect(2 + inset, y, 56 - inset - Math.round(nose) - (y < 9 ? 4 : 0), 1, c('van', y < 12 ? 2 : y < 26 ? 1 : 0));
    }
    pic.rect(6, 9, 34, 10, c('glass', 0)).rect(42, 10, 9, 9, c('glass', 0));
    pic.line(7, 10, 12, 18, c('glass', 2)).line(43, 11, 47, 18, c('glass', 2));
    for (const x of [17, 28, 40]) pic.rect(x, 9, 2, 10, c('van', 0));
    pic.rect(28, 21, 1, 11, c('van', 0)).rect(31, 22, 4, 1, c('metal', 2));
    pic.rect(2, 22, 56, 1, c('van', 2));
    pic.rect(55, 22, 3, 3, c('yellow', 2)).rect(2, 20, 2, 4, c('red', 2));
    pic.rect(2, 30, 56, 3, c('metal', 0));
    for (const x of [14, 46]) pic.disc(x, 33, 6, c('ink', 0)).disc(x, 33, 3, c('metal', 1)).disc(x, 33, 1.2, c('metal', 2));
    addPicture(book, 'van', pic, (_col, row) => (row ? townAt(pal, 65) : skylineAt(pal, 66)), () => ({ solid: SOLID }));
  }
  // a park bin to climb, and the park's tree: a broad, flat crown to stand on, its trunk
  const bin = townAt(pal, 67);
  bin.rect(4, 3, 12, 17, c('green', 0)).rect(3, 1, 14, 3, c('green', 1)).rect(3, 1, 14, 1, c('green', 2));
  for (let x = 6; x < 16; x += 3) bin.rect(x, 5, 1, 14, c('green', 1));
  book.add('bin', bin, { solid: SOLID });
  {
    const pic = new Pixels(40, 80, T);
    pic.rect(8, 14, 6, 66, c('wood', 1)).rect(8, 14, 2, 66, c('wood', 2)).rect(13, 14, 1, 66, c('wood', 0));
    pic.line(13, 22, 24, 12, c('wood', 1)).line(13, 23, 24, 13, c('wood', 0));
    for (let y = 30; y < 78; y += 9) pic.rect(9, y, 3, 1, c('wood', 0));
    pic.rect(4, 77, 14, 3, c('wood', 0));
    for (const [x, y, rx, ry] of [[10, 9, 10, 8], [22, 7, 11, 7], [32, 10, 8, 7], [17, 13, 12, 6]]) blob(pic, x, y, rx, ry, R('green'), 0, 3);
    addPicture(book, 'tree', pic, (_col, row) => (row === 0 ? sky(68) : row === 1 ? sky(69) : row === 2 ? skylineAt(pal, 70) : townAt(pal, 71)), (_col, row) => (row === 0 ? { solid: LEDGE, grav: GRAV.down } : AIR));
  }
  // the clouds, too bored to bother: one long cloud, half asleep
  {
    const pic = new Pixels(40, 20, T);
    for (const [x, y, rx, ry] of [[9, 12, 8, 5], [19, 9, 9, 7], [30, 12, 8, 5]]) blob(pic, x, y, rx, ry, R('white'), 0, 2);
    pic.rect(14, 10, 3, 1, c('grey', 1)).rect(22, 10, 3, 1, c('grey', 1)).rect(18, 14, 4, 1, c('grey', 1));
    addPicture(book, 'cloud', pic, skyAt(pal, 72, 2), () => AIR);
  }
  // the bush the wind launched it into: the rest of the receipt caught in it; then parted
  const bush = (open: boolean) => {
    const p = townAt(pal, 73);
    blob(p, 10, 11, 10, 9, R('green'), 0, 3);
    if (open) p.rect(6, 6, 8, 14, c('green', 0)).rect(7, 8, 6, 12, c('ink', 1));
    else {
      p.rect(5, 6, 9, 5, c('white', 2)).line(5, 6, 13, 10, c('white', 1)).line(6, 11, 12, 11, c('grey', 2));
      p.rect(11, 9, 5, 3, c('white', 1)).set(7, 8, c('grey', 1)).set(9, 8, c('grey', 1));
    }
    return p;
  };
  book.add('bushOpen', bush(true), { grav: GRAV.none });
  gate(book, 'bush', bush(false), 'bushOpen', SCRAPS);
  // the receipt's scraps, each with its awful truth
  const scrap = (lines: string[]) => (p: Pixels) => {
    p.rect(1, 2, 18, 17, c('white', 2)).frame(1, 2, 18, 17, c('white', 0));
    for (let x = 1; x < 19; x += 2) p.set(x, 18, c('sky', 3));
    p.line(15, 2, 18, 5, c('sky', 3)).line(15, 3, 17, 5, c('white', 0));
    lines.forEach((s, i) => micro(p, 2, 4 + i * 5, s, c('ink', 1)));
  };
  plotThing(book, 'sky', 'scrap1', scrap(['FOOT', 'PWD', 'X3']));
  plotThing(book, 'sky', 'scrap2', scrap(['CHAF', 'CRM', 'XL']));
  plotThing(book, 'sky', 'scrap3', scrap(['ACNE', 'WIPE', 'CPN']));
  plotThing(book, 'sky', 'scrap4', scrap(['TOTL', '$$$', '***']));
}

export function outsideSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // the receipt itself, curling on the wind, smirking
  const receipt = (f: number) => {
    const p = P();
    for (let x = 1; x < 19; x++) {
      const y = 9 + Math.round(Math.sin((x + f * 5) / 3) * 4);
      p.rect(x, y - 3, 1, 6, c('white', 2)).set(x, y + 3, c('white', 0));
      if (x % 2) p.set(x, y - 1, c('grey', 2)).set(x, y + 1, c('grey', 2));
    }
    face(p, pal, 10, 7 + Math.round(Math.sin((10 + f * 5) / 3) * 4), { wink: true });
    return outline(p, ink);
  };
  book.add('receipt0', receipt(0));
  book.add('receipt1', receipt(1));
  // a confused pedestrian (a "?"), and the same afraid (arms up, a "!")
  book.add('ped0', person(pal, { hair: 'hair', shirt: 'teal', pants: 'navy', step: 0, mark: '?' }), hurts(-4));
  book.add('ped1', person(pal, { hair: 'hair', shirt: 'teal', pants: 'navy', step: 1, mark: '?' }), hurts(-4));
  book.add('pedRun0', person(pal, { hair: 'hair', shirt: 'teal', pants: 'navy', step: 0, mark: '!', arms: 'up', shout: true }));
  book.add('pedRun1', person(pal, { hair: 'hair', shirt: 'teal', pants: 'navy', step: 1, mark: '!', arms: 'up', shout: true }));
  // the elderly woman, clutching her purse tighter
  const granny = (f: number) => {
    const p = person(pal, { hair: 'white', shirt: 'purple', pants: 'purple', step: 0, skirt: true, bun: true, glasses: true, raw: true });
    p.rect(8 - f, 10, 6 + f, 5 - f, c('red', 1)).rect(8 - f, 10, 6 + f, 1, c('red', 2)).line(9, 9, 12, 9, c('red', 0));
    if (f) p.set(7, 6, ink).set(13, 6, ink);
    return outline(p, ink);
  };
  book.add('granny0', granny(0), hurts(0));
  book.add('granny1', granny(1), hurts(0));
  // a runaway shopping cart
  const cart = (f: number) => {
    const p = P();
    p.line(2, 4, 5, 5, c('metal', 1));
    for (let y = 5; y < 13; y += 2) p.rect(4, y, 15 - (y - 5) / 3, 1, c('metal', 2));
    for (let x = 4; x < 19; x += 3) p.line(x, 5, x + 1, 13, c('metal', 1));
    p.rect(5, 14, 13, 1, c('metal', 0)).line(6, 13, 6, 16, c('metal', 0)).line(16, 13, 16, 16, c('metal', 0));
    for (const x of [6, 16]) p.disc(x, 17.5, 1.8, c('ink', 1)).set(x + (f ? 1 : -1), 17, c('grey', 2));
    if (f) p.set(1, 9, c('white', 2)).set(0, 11, c('white', 2));
    return outline(p, ink);
  };
  book.add('cart0', cart(0), hurts(-5));
  book.add('cart1', cart(1), hurts(-5));
  // the jogger in his headband (the receipt stuck to his calf a moment)
  book.add('jog0', person(pal, { hair: 'hair', shirt: 'yellow', pants: 'navy', step: 0, band: true, shorts: true }), hello);
  book.add('jog1', person(pal, { hair: 'hair', shirt: 'yellow', pants: 'navy', step: 1, band: true, shorts: true, scrap: true }), hello);
  // jogging on (no more hellos)
  book.add('jogOn0', person(pal, { hair: 'hair', shirt: 'yellow', pants: 'navy', step: 0, band: true, shorts: true, arms: 'up' }));
  book.add('jogOn1', person(pal, { hair: 'hair', shirt: 'yellow', pants: 'navy', step: 1, band: true, shorts: true, arms: 'up' }));
}

export function outsideMonsters(set: Monster[], mb: SpriteBook): void {
  set[OUT_MON.receipt] = mon(anim(mb, 'receipt0', 'receipt1', 6), { power: POWER.tough, thru: 0 }, [corner(0, 0, 1), corner(2, -1, 1), corner(4, 0, 1), corner(2, 1, 1, 4), corner(0, 0, 1, 4)]);
  set[OUT_MON.ped] = mon(anim(mb, 'ped0', 'ped1', 5), { power: POWER.foe, thru: 1, newmon: OUT_MON.pedRun }, pace(3, 1));
  set[OUT_MON.pedRun] = mon(anim(mb, 'pedRun0', 'pedRun1', 2), { power: POWER.tough, thru: 0, end: 26 }, [corner(0, 0, 4), corner(8, -1, 4, 0)]);
  set[OUT_MON.granny] = mon(anim(mb, 'granny0', 'granny1', 14), { power: POWER.tough, thru: 1 }, still);
  set[OUT_MON.cart] = mon(anim(mb, 'cart0', 'cart1', 2), { power: POWER.tough, thru: 1 }, pace(3, 2));
  set[OUT_MON.jogger] = mon(anim(mb, 'jog0', 'jog1', 3), { power: POWER.friend, thru: 1, newmon: OUT_MON.jogOff }, pace(5, 3));
  set[OUT_MON.jogOff] = mon(anim(mb, 'jogOn0', 'jogOn1', 2), { power: POWER.tough, thru: 0, end: 30 }, [corner(0, 0, 4), corner(9, 0, 4, 0)]);
}

export const outside: Monologue = {
  file: 'outside',
  title: 'This Is Why I Don’t Go Outside',
  desc: 'Don\'t Go Outside',
  // a dull Thursday afternoon: a pale, washed-out sky
  light: { sky: [[96, 132, 178], [222, 230, 236], [160, 186, 212]], mul: [1, 1, 1], add: [0, 0, 0] },
  filler: 'soil',
  legend: {
    H: 'skyHi',
    s: 'sky',
    k: 'skyline',
    t: 'town',
    '=': 'walk',
    a: 'asphalt',
    A: 'asphaltLine',
    g: 'grass',
    '#': 'soil',
    h: 'lampHead',
    p: 'lampPole',
    c: 'calmLine',
    C: 'calmTown',
    b: 'bin',
    B: 'bush',
    $: 'coin@town',
    '%': 'bill@town',
    m: 'mug@town',
    '&': 'coin@sky',
    '!': 'spot@town',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the park past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 2;
    const W = 70 + OFF;
    m.fill(0, 0, W, 3, 'H').row(3, 0, W - 1, 'skyMid').fill(0, 4, W, 4, 's').row(8, 0, W - 1, 'k').row(9, 0, W - 1, 't').row(11, 0, W - 1, '#');
    // the ground: the sidewalk, the parking lot, the park
    m.row(10, 0, 23, '=').row(10, 24, 47, 'a').row(10, 48, W - 1, 'g');
    for (const x of [24, 31, 32, 40, 47]) m.set(x, 10, 'A');
    // too bored to bother
    placePicture(m, 'cloud', 12, 1, 2, 1);
    placePicture(m, 'cloud', 33, 2, 2, 1);
    placePicture(m, 'cloud', 58, 1, 2, 1);
    // the pharmacy he just left, the spotlight, the street lamp (the first scrap on its head)
    placePicture(m, 'pharmacy', 0, 7, 3, 3);
    m.set(4, 9, '!').set(7, 9, '$');
    m.set(10, 8, 'h').set(10, 9, 'p').set(10, 7, 'scrap1');
    m.mon(MON.leo, 14, 9);
    m.set(17, 9, '$');
    m.mon(OUT_MON.ped, 20, 9);
    // the parking lot: two minivans (a coin on each roof, a scrap above the second), the cart between
    placePicture(m, 'van', 26, 8, 3, 2);
    placePicture(m, 'van', 36, 8, 3, 2);
    m.set(27, 7, '&').set(37, 7, '&').set(37, 5, 'scrap2');
    m.mon(OUT_MON.cart, 31, 9);
    m.mon(MON.carl, 31, 4);
    m.mon(OUT_MON.receipt, 22, 3);
    m.mon(OUT_MON.granny, 41, 9);
    // the gusts that mock him (a scrap twirling in them)
    m.row(8, 43, 47, 'c').row(9, 43, 47, 'C');
    m.set(45, 7, 'scrap3');
    m.set(49, 9, 'm');
    // the park: the bin, the tree (the last scrap on its crown), the jogger
    m.set(51, 9, 'b');
    placePicture(m, 'tree', 52, 6, 2, 4);
    m.set(52, 5, '&').set(53, 5, 'scrap4');
    m.mon(OUT_MON.receipt, 50, 2);
    m.mon(OUT_MON.jogger, 56, 9);
    m.set(60, 9, '%').set(64, 9, '$');
    m.mon(OUT_MON.ped, 63, 9);
    // the bush, and in it the rest of the receipt
    m.set(67, 9, 'B');
    m.link(67 + OFF, 9, 'next');
    return { start: [3, 9], size: [W, 12] };
  },
  monsters: outsideMonsters,
  song: 'outside',
  clips: { open: 'out_o', line: 'out_l', punch: 'out_p', word: 'out_w' },
  view: [22, 4],
  card: ['Now, I staple my receipts.', 'I respect the wind.'],
};
