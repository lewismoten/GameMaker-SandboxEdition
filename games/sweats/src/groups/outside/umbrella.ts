// "Shelter Me Gently, You Wounded Beast", the finale: the wind, cruel as the fates, has snatched
// his umbrella's canopy and shattered its ribs. He will not abandon it. The odyssey: out in the
// rain (scowling storm clouds drop rain on him as if the heavens wished him to fail, the gusts
// blow back along the street) to the hardware store and its aisles of fluorescent peril
// (flickering tubes, price tags that mock his budget, Teddy and Gwinn asleep in the aisle), the
// checkout ("paper or plastic?": the bags flap at him), and back out into the storm to the stand
// where the wounded beast waits. The plot is what mends it: a patch of fabric blown onto the
// street lamp, the wrench, the screwdriver, the endless tape; with all four, a crooked
// Frankenstein canopy, a shelter nonetheless: the man who fought the storm and won.
//
// Layout (12 rows: the rain above, the store's ceiling on row 2 from x 16 to 44, the walking row
// 9). The shelves' planks (rows 7 and 4) are ledges; the checkout counter is solid.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { UMBR_MON } from './ids';
import { coinOn, skyAt } from './street';

/** What mends the umbrella. */
export const MENDS = 4;
/** Ticks between drops from a storm cloud. */
export const DROP_EVERY = 46;

export function umbrellaBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  // the rain: the sky streaked
  const rain = (seed: number, k: number) => {
    const p = skyAt(pal, seed, k);
    const r = rng(seed + 1);
    for (let i = 0; i < 7; i++) {
      const x = Math.floor(r() * 20);
      const y = Math.floor(r() * 20);
      p.line(x, y, x - 1, y + 3, c('drop', i % 2));
    }
    return p;
  };
  book.add('rainHi', rain(120, 2), AIR);
  book.add('rain', rain(122, 3), AIR);
  book.add('rainMid', rain(130, 2).map((x, y, v) => (y > 4 && (x * 7 + y * 3) % 16 < y - 4 && v === c('sky', 2) ? c('sky', 3) : v)), AIR);
  // a storm cloud, scowling: its left half rains on him
  {
    const pic = new Pixels(40, 20, T);
    for (const [x, y, rx, ry] of [[9, 11, 9, 6], [21, 8, 11, 8], [32, 12, 8, 6]]) blob(pic, x, y, rx, ry, R('grey'), 0, 2);
    pic.line(13, 7, 17, 9, c('ink', 1)).line(27, 7, 23, 9, c('ink', 1)).set(16, 10, c('ink', 0)).set(24, 10, c('ink', 0));
    pic.line(17, 14, 23, 14, c('ink', 1)).set(16, 15, c('ink', 1)).set(24, 15, c('ink', 1));
    addPicture(book, 'storm', pic, rain(124, 2), (col) => (col ? AIR : { ...AIR, birthMon: UMBR_MON.drop, birthTime: DROP_EVERY }));
  }
  // a puddle on the sidewalk
  const puddle = book.pics.get('walk')!.crop(0, 0, 20, 20);
  puddle.rect(2, 0, 16, 2, c('drop', 0)).rect(4, 0, 9, 1, c('drop', 1)).set(15, 0, c('white', 2));
  book.add('puddle', puddle, { solid: SOLID });
  // the hardware store: its sign on the roofline, the drop ceiling and its fluorescent peril
  {
    const pic = new Pixels(60, 20, c('orange', 1));
    pic.rect(0, 0, 60, 2, c('orange', 2)).rect(0, 17, 60, 3, c('metal', 0));
    micro(pic, 14, 5, 'HARDWARE', c('white', 2), 1);
    pic.rect(4, 6, 6, 3, c('metal', 2)).rect(6, 9, 2, 6, c('wood', 2));
    pic.rect(50, 5, 2, 9, c('metal', 2)).disc(51, 5, 2.5, c('metal', 2)).rect(50, 4, 2, 2, c('orange', 1));
    micro(pic, 14, 11, 'AISLES', c('yellow', 2));
    addPicture(book, 'hardware', pic, pic, () => ({ solid: SOLID }));
  }
  const ceiling = (tube: 0 | 1 | 2) => {
    const p = new Pixels(20, 20, c('concrete', 2));
    for (let i = 0; i < 20; i++) p.set(i, 9, c('concrete', 1)).set(9, i, c('concrete', 1));
    p.rect(0, 17, 20, 3, c('metal', 0));
    if (tube) p.rect(2, 12, 16, 4, c('fluor2', tube === 1 ? 1 : 0)).rect(2, 12, 16, 1, c('metal', 1));
    else p.rect(2, 12, 16, 4, c('grey', 1)).rect(2, 12, 16, 1, c('metal', 1));
    return p;
  };
  book.add('sCeil', ceiling(2), { solid: SOLID });
  book.add('sCeilA', ceiling(1), { solid: SOLID, next: 'sCeilB', ntime: 23 });
  book.add('sCeilB', ceiling(0), { solid: SOLID, next: 'sCeilA', ntime: 3 });
  // the pegboard walls, the kickplate, the tile floor
  const peg = (seed: number) => {
    const p = new Pixels(20, 20, c('wood', 3));
    const r = rng(seed);
    for (let y = 2; y < 20; y += 4) for (let x = 2; x < 20; x += 4) p.set(x, y, c('wood', 1));
    for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('wood', 2));
    return p;
  };
  book.add('sWall', peg(126), AIR);
  const sBase = peg(127);
  sBase.rect(0, 14, 20, 6, c('orange', 0)).rect(0, 14, 20, 1, c('orange', 1));
  book.add('sBase', sBase, AIR);
  const tile = new Pixels(20, 20, c('concrete', 1));
  tile.rect(0, 0, 20, 2, c('concrete', 2)).rect(0, 10, 20, 1, c('concrete', 0)).rect(9, 0, 1, 20, c('concrete', 0)).rect(3, 3, 4, 1, c('white', 1));
  book.add('sFloor', tile, { solid: SOLID });
  // the shelves: an orange plank (stand on it) over the stock
  const shelf = (what: 'tools' | 'paint' | 'tape') => {
    const p = peg(128);
    p.rect(0, 0, 20, 3, c('orange', 2)).rect(0, 3, 20, 1, c('orange', 0)).rect(0, 4, 1, 16, c('orange', 1)).rect(19, 4, 1, 16, c('orange', 1));
    if (what === 'tools')
      for (const x of [4, 10, 15]) {
        p.line(x, 6, x, 16, c('metal', 1)).rect(x - 1, 6, 3, 1, c('metal', 0));
        if (x === 10) p.rect(x - 2, 14, 5, 3, c('red', 1));
        else p.ring(x, 17, 1.5, c('metal', 2));
      }
    if (what === 'paint')
      for (const [x, col] of [[2, 'red'], [8, 'teal'], [14, 'yellow']] as const) p.rect(x, 9, 5, 10, c(col, 2)).rect(x, 9, 5, 1, c('metal', 2)).rect(x + 1, 13, 3, 3, c('white', 2));
    if (what === 'tape') for (const [x, y] of [[5, 9], [13, 9], [5, 15], [13, 15]]) p.disc(x, y, 3.4, c('grey', 2)).disc(x, y, 1.6, c('wood', 3)).ring(x, y, 3.4, c('grey', 1));
    return p;
  };
  book.add('shelfTools', shelf('tools'), { solid: LEDGE, grav: GRAV.down });
  book.add('shelfPaint', shelf('paint'), { solid: LEDGE, grav: GRAV.down });
  book.add('shelfTape', shelf('tape'), { solid: LEDGE, grav: GRAV.down });
  // the checkout: the register (paper bags flap off it), the bagging end (plastic ones billow)
  const checkout = (end: boolean) => {
    const p = sBase.crop(0, 0, 20, 20);
    p.rect(0, 6, 20, 14, c('white', 1)).rect(0, 6, 20, 2, c('ink', 1)).rect(0, 12, 20, 1, c('orange', 2));
    if (end) p.rect(4, 0, 10, 6, c('white', 2)).line(6, 0, 6, 2, c('white', 0)).line(11, 0, 11, 2, c('white', 0));
    else p.rect(4, 0, 12, 6, c('ink', 1)).rect(6, 1, 8, 2, c('green', 2)).rect(5, 4, 10, 2, c('metal', 1));
    micro(p, 2, 14, end ? 'BAGS' : '$$$$', c('ink', 1));
    return p;
  };
  book.add('register', checkout(false), { solid: SOLID, birthMon: UMBR_MON.paper, birthTime: 80 });
  book.add('bagging', checkout(true), { solid: SOLID, birthMon: UMBR_MON.plastic, birthTime: 95 });
  // the wounded beast in its stand, and mended: a crooked Frankenstein canopy, a shelter nonetheless
  const beast = (mended: boolean) => {
    const p = book.pics.get('town')!.crop(0, 0, 20, 20);
    p.rect(5, 15, 10, 5, c('metal', 0)).rect(5, 15, 10, 1, c('metal', 1));
    if (mended) {
      for (let x = 1; x < 20; x++) {
        const top = 2 + Math.round(Math.abs(x - 9) * 0.45) + (x > 13 ? 1 : 0);
        p.rect(x, top, 1, 9 - Math.round(Math.abs(x - 9) * 0.45), c('red', x % 5 === 0 ? 1 : 2));
      }
      for (const [x, y] of [[5, 5], [14, 6]]) p.line(x - 2, y - 2, x + 2, y + 2, c('grey', 2)).line(x - 2, y + 2, x + 2, y - 2, c('grey', 2));
      p.line(9, 2, 10, 16, c('metal', 1)).set(9, 1, c('gold', 3)).set(16, 0, c('gold', 3)).set(2, 1, c('gold', 3));
    } else {
      p.line(10, 4, 10, 18, c('metal', 1));
      for (const [x, y] of [[3, 2], [6, 8], [16, 1], [18, 9], [13, 12]]) p.line(10, 5, x, y, c('metal', 2));
      p.rect(2, 2, 4, 3, c('red', 1)).rect(15, 1, 3, 2, c('red', 1)).line(17, 9, 19, 12, c('red', 0));
    }
    return p;
  };
  book.add('beastMended', beast(true), { grav: GRAV.none });
  gate(book, 'beast', beast(false), 'beastMended', MENDS);
  // what mends it: a patch of fabric, the wrench, the screwdriver, the endless tape
  plotThing(book, 'rain', 'patch', (p) => {
    p.rect(4, 5, 12, 11, c('red', 2)).rect(4, 5, 12, 1, c('red', 3));
    for (let x = 5; x < 16; x += 2) p.set(x, 7, c('white', 2)).set(x, 14, c('white', 2));
    p.line(15, 15, 18, 18, c('red', 1));
  });
  plotThing(book, 'sWall', 'wrench', (p) => {
    p.line(5, 17, 13, 7, c('metal', 2)).line(6, 17, 14, 7, c('metal', 1));
    p.disc(15, 5, 3.4, c('metal', 2)).rect(15, 2, 3, 3, c('wood', 3)).disc(4.5, 17.5, 2, c('metal', 1));
  });
  plotThing(book, 'sWall', 'screwdriver', (p) => {
    p.rect(3, 13, 7, 4, c('yellow', 2)).rect(3, 13, 7, 1, c('yellow', 1)).rect(1, 14, 2, 2, c('yellow', 1));
    p.line(10, 15, 18, 15, c('metal', 2)).line(10, 14, 17, 14, c('metal', 1));
  });
  plotThing(book, 'sWall', 'tape', (p) => {
    p.disc(10, 11, 6.5, c('grey', 2)).ring(10, 11, 6.5, c('grey', 1)).disc(10, 11, 3, c('wood', 3)).ring(10, 11, 3, c('grey', 0));
    p.line(15, 15, 18, 19, c('grey', 2)).line(16, 15, 19, 19, c('grey', 1));
  });
  loot(book, pal, 'sBase');
  coinOn(book, pal, 'sWall');
}

export function umbrellaSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // a raindrop, scowling
  const drop = (f: number) => {
    const p = P();
    for (let y = 4; y < 17; y++) {
      const w = y < 10 ? (y - 4) * 0.8 : 5 - Math.max(0, y - 13) * 1.2;
      p.rect(Math.round(10 - w), y + f, Math.round(w * 2) + 1, 1, c('drop', y < 9 ? 1 : 0));
    }
    p.set(8, 9 + f, c('white', 2));
    face(p, pal, 10, 12 + f, { angry: true });
    return outline(p, ink);
  };
  book.add('drop0', drop(0), hurts(-3, 0));
  book.add('drop1', drop(1), hurts(-3, 0));
  const splash = (f: number) => {
    const p = P();
    for (let k = 0; k < 5; k++) p.line(10, 19, 10 + (k - 2) * (3 + f * 2), 14 - (k % 2) * 2 - f * 2, c('drop', 1));
    return p;
  };
  book.add('splash0', splash(0));
  book.add('splash1', splash(1));
  // a price tag, mocking his budget
  const tag = (f: number) => {
    const p = P();
    const s = f ? 1 : 0;
    p.line(10, 0, 9 + s * 2, 5, c('white', 0));
    p.rect(3 + s, 5, 14, 11, c('yellow', 2)).rect(3 + s, 5, 14, 1, c('yellow', 1));
    p.disc(10 + s, 7, 1, c('ink', 1));
    micro(p, 4 + s, 9, '$99', c('red', 1));
    face(p, pal, 10 + s, 16, { grin: true });
    return outline(p, ink);
  };
  book.add('tag0', tag(0), hurts(-4));
  book.add('tag1', tag(1), hurts(-4));
  // "paper or plastic?": a paper bag flapping, a plastic bag billowing
  const paper = (f: number) => {
    const p = P();
    p.rect(4, 6, 12, 13, c('coffee', 3)).rect(4, 6, 12, 1, c('coffee', 2));
    for (let x = 4; x < 16; x += 2) p.set(x, 5 - f, c('coffee', 3));
    p.line(4, 7, 1, 4 + f * 3, c('coffee', 3));
    micro(p, 8, 8, '?', c('ink', 1));
    face(p, pal, 10, 14, { angry: true });
    return outline(p, ink);
  };
  book.add('paper0', paper(0), hurts(-3));
  book.add('paper1', paper(1), hurts(-3));
  const plastic = (f: number) => {
    const p = P();
    blob(p, 10, 11 + f, 6 + f, 6 - f, pal.r('white'), 0, 2);
    p.ring(6, 4 + f, 2, c('white', 1)).ring(14, 4 + f, 2, c('white', 1));
    face(p, pal, 10, 11 + f, { grin: true });
    return outline(p, ink);
  };
  book.add('plastic0', plastic(0), hurts(-3));
  book.add('plastic1', plastic(1), hurts(-3));
}

export function umbrellaMonsters(set: Monster[], mb: SpriteBook): void {
  set[UMBR_MON.drop] = mon(anim(mb, 'drop0', 'drop1', 3), { power: POWER.foe, thru: 0, end: -1, newmon: UMBR_MON.splash }, [corner(0, 0, 3), corner(0, 8, 3)]);
  set[UMBR_MON.splash] = mon(anim(mb, 'splash0', 'splash1', 3), { power: POWER.friend, thru: 0, end: 6 });
  set[UMBR_MON.tag] = mon(anim(mb, 'tag0', 'tag1', 6), { power: POWER.foe, thru: 1, newmon: UMBR_MON.poof }, pace(2, 1));
  set[UMBR_MON.paper] = mon(anim(mb, 'paper0', 'paper1', 4), { power: POWER.foe, thru: 0, end: -1, newmon: UMBR_MON.poof }, [corner(0, 0, 1), corner(-6, 0, 1, 4)]);
  set[UMBR_MON.plastic] = mon(anim(mb, 'plastic0', 'plastic1', 5), { power: POWER.foe, thru: 0, end: -1, newmon: UMBR_MON.poof }, [corner(0, 0, 1), corner(-6, 0, 1, 4)]);
  set[UMBR_MON.poof] = mon(anim(mb, 'poof0', 'poof1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const umbrella: Monologue = {
  file: 'umbrella',
  title: 'Shelter Me Gently, You Wounded Beast',
  desc: 'Shelter Me Gently',
  filler: 'soil',
  // the downpour: a slate sky, everything wet and dim (the store's tubes keep their glare)
  light: { sky: [[34, 40, 56], [124, 134, 148], [72, 82, 100]], mul: [0.76, 0.8, 0.9], add: [0, 4, 14] },
  legend: {
    R: 'rainHi',
    r: 'rain',
    k: 'skyline',
    t: 'town',
    '=': 'walk',
    u: 'puddle',
    '#': 'soil',
    h: 'lampHead',
    p: 'lampPole',
    c: 'calmLine',
    C: 'calmTown',
    '^': 'sCeil',
    '*': 'sCeilA',
    '.': 'sWall',
    _: 'sBase',
    '-': 'sFloor',
    o: 'shelfTools',
    P: 'shelfPaint',
    O: 'shelfTape',
    $: 'coin@town',
    '%': 'bill@town',
    m: 'mug@town',
    '(': 'coin@sBase',
    ')': 'bill@sBase',
    M: 'mug@sBase',
    '&': 'coin@sWall',
    '!': 'spot@town',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the street past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 22;
    const W = 70 + OFF;
    m.fill(0, 0, W, 3, 'R').row(3, 0, W - 1, 'rainMid').fill(0, 4, W, 4, 'r').row(8, 0, W - 1, 'k').row(9, 0, W - 1, 't').row(10, 0, W - 1, '=').row(11, 0, W - 1, '#');
    for (const x of [6, 11, 49, 57, 63]) m.set(x, 10, 'u');
    // the rain: the spotlight, a storm cloud, the street lamp (the patch blown onto it), a gust
    m.set(2, 9, '!').set(4, 9, '$');
    placePicture(m, 'storm', 6, 1, 2, 1);
    m.set(9, 8, 'h').set(9, 9, 'p').set(9, 7, 'patch');
    m.row(8, 12, 14, 'c').row(9, 12, 14, 'C');
    // the hardware store: the sign, the ceiling and its tubes, the pegboard, the floor
    placePicture(m, 'hardware', 16, 2, 3, 1);
    m.row(2, 19, 44, '^');
    for (const x of [21, 29, 37, 43]) m.set(x, 2, '*');
    m.fill(16, 3, 29, 6, '.').row(9, 16, 44, '_').row(10, 16, 44, '-');
    // aisle one: tools below, paint above (the wrench on top), a price tag on each plank
    m.row(7, 20, 24, 'o').row(4, 21, 23, 'P');
    m.set(22, 3, 'wrench').set(21, 6, '&');
    m.mon(UMBR_MON.tag, 25, 9).mon(UMBR_MON.tag, 22, 6);
    m.mon(MON.teddy, 28, 9);
    // aisle two: tape below (a roll on it), tools above (the screwdriver on top)
    m.row(7, 31, 35, 'O').row(4, 32, 34, 'o');
    m.set(35, 6, 'tape').set(33, 3, 'screwdriver').set(32, 6, '&');
    m.set(30, 9, ')').mon(UMBR_MON.tag, 32, 9);
    m.mon(MON.gwinn, 37, 9);
    m.set(39, 9, '(');
    // the checkout: paper or plastic?
    m.set(41, 9, 'register').set(42, 9, 'bagging');
    m.set(45, 9, 'M');
    // back out into the storm: the goat, the gusts, the clouds, the wounded beast
    m.mon(MON.goat, 47, 9);
    m.row(8, 50, 54, 'c').row(9, 50, 54, 'C');
    m.set(52, 9, '$').set(56, 9, 'm');
    placePicture(m, 'storm', 58, 1, 2, 1);
    placePicture(m, 'storm', 63, 1, 2, 1);
    m.set(61, 9, '$').set(65, 9, '%');
    m.set(67, 9, 'beast');
    m.link(67 + OFF, 9, 'next');
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: umbrellaMonsters,
  song: 'epic',
  clips: { open: 'umbr_o', line: 'umbr_l', punch: 'umbr_p', word: 'umbr_w' },
  view: [17, 3],
  card: ['A Frankenstein of', 'waterproof dreams.'],
};
