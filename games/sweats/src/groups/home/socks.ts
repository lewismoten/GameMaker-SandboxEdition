// "Wore All the Weird Socks": seven socks, seven solitary souls, none alike: one striped like a
// carnival tent, one dotted like a distant galaxy, one plain yet stubbornly blue, the polka dots,
// the stripes, the floral swirl, the argyle. The epic, through the laundry room: the washing
// machine (a battlefield where no alliances were forged), the dryer stacked on it
// (the cruel trickster, separating companions with careless heat) spitting static lint, the
// clothesline over the shelves, matched pairs marching in lockstep (conformity), the neighbors
// at the window whispering "WHY?", the ironing board, Doc Leo asking if it's fashion. Seven socks
// and the front door lets him out in all of them: seven lonely socks are better than one lost pair.
//
// Layout (12 rows: the ceiling on row 0, the floor on row 10): the poet walks row 9; the washer
// and dryer stand stacked four rows tall (a laundry basket is the step up); the shelves under
// the clothesline are ledges on row 6, the ironing board a ledge on row 7.
import { Pixels } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace } from '../../common/characters';
import type { MapBuilder } from '../../levels/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { houseMonsters, wallpaper } from './house';
import { SOCKS_MON } from './ids';

/** Seven socks, none alike. */
export const SOCKS = 7;

/** A sock (toe to the right, cuff at the top) at (x, y): `pattern` paints its knit. */
function drawSock(p: Pixels, pal: Pal, x: number, y: number, base: [string, number], pattern: (px: number, py: number) => number | undefined): void {
  const c = pal.c;
  const inSock = (px: number, py: number) =>
    (px >= 0 && px < 6 && py >= 0 && py < 11) || (px >= 0 && px < 11 && py >= 8 && py < 14 && !(px > 8 && py === 8) && !(px === 10 && (py === 9 || py === 13)));
  for (let py = 0; py < 14; py++)
    for (let px = 0; px < 11; px++) {
      if (!inSock(px, py)) continue;
      const k = pattern(px, py);
      p.set(x + px, y + py, k ?? c(base[0], base[1]));
    }
  // the cuff, the heel, the toe
  p.rect(x, y, 6, 2, c('white', 2)).rect(x, y + 1, 6, 1, c('white', 1));
  p.rect(x, y + 11, 2, 3, c('white', 1)).rect(x + 9, y + 9, 2, 4, c('white', 1));
  for (let py = 0; py < 14; py++)
    for (let px = -1; px < 12; px++)
      if (!inSock(px, py) && (inSock(px - 1, py) || inSock(px + 1, py) || inSock(px, py - 1) || inSock(px, py + 1))) p.set(x + px, y + py, c('ink', 0));
}

export function socksBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => wallpaper(pal, seed);
  // the washer (its porthole full of suds) with the dryer stacked on top (its drum turning)
  {
    const pic = new Pixels(40, 80, 255);
    for (const [y0, dryer] of [
      [0, true],
      [40, false],
    ] as const) {
      pic
        .rect(1, y0 + 1, 38, 38, c('white', 2))
        .frame(1, y0 + 1, 38, 38, c('grey', 1))
        .rect(2, y0 + 2, 36, 7, c('white', 1))
        .rect(2, y0 + 9, 36, 1, c('grey', 2));
      pic
        .disc(8, y0 + 5, 2, c('grey', 1))
        .disc(14, y0 + 5, 2, c('grey', 1))
        .rect(24, y0 + 3, 10, 4, c('night', 1));
      micro(pic, 25, y0 + 3, dryer ? 'HOT' : 'WAR', c(dryer ? 'red' : 'ice', 2));
      pic
        .disc(20, y0 + 24, 12, c('grey', 2))
        .disc(20, y0 + 24, 10, c('grey', 0))
        .disc(20, y0 + 24, 9, c(dryer ? 'night' : 'ice', dryer ? 1 : 0));
      if (dryer) {
        // the drum tumbling: a lone sock flung round in careless heat, and the heat
        drawSock(pic, pal, 15, y0 + 17, ['red', 2], (x, y) => ((x + y) % 4 < 2 ? c('gold', 2) : undefined));
        for (const x of [12, 20, 28]) pic.line(x, y0 + 35, x + 1, y0 + 33, c('red', 2)).line(x + 1, y0 + 33, x, y0 + 31, c('red', 2));
      } else {
        for (const [x, y, r] of [
          [15, 22, 3],
          [22, 20, 4],
          [25, 27, 3],
          [17, 29, 2.5],
          [21, 25, 2],
        ])
          pic.disc(x, y0 + y, r, c('white', 2)).set(x - 1, y0 + y - 1, c('ice', 2));
      }
      pic
        .ring(20, y0 + 24, 12, c('grey', 2))
        .ring(20, y0 + 24, 11.5, c('grey', 2))
        .ring(20, y0 + 24, 9.6, c('white', 2));
      pic.rect(3, y0 + 36, 34, 2, c('grey', 1));
    }
    addPicture(book, 'tower', pic, wall(50), () => ({ solid: SOLID }));
  }
  // the laundry basket (solid: the step up), heaped with the socks that didn't make it
  const basket = wall(51);
  for (let y = 6; y < 20; y++) basket.rect(2 + Math.floor((y - 6) / 6), y, 16 - Math.floor((y - 6) / 3), 1, c('wood', y % 3 ? 3 : 2));
  for (let x = 3; x < 18; x += 3) basket.rect(x, 7, 1, 12, c('wood', 1));
  blob(basket, 7, 6, 4, 3, R('white'), 1, 2);
  blob(basket, 13, 5, 4, 3, R('teal'), 0, 2);
  basket.rect(2, 6, 16, 2, c('wood', 4));
  book.add('basket', basket, { solid: SOLID });
  // the clothesline (a cord with clothespins), strung over the shelves
  const line = (p: Pixels) => {
    p.rect(0, 2, 20, 1, c('white', 0)).rect(0, 3, 20, 1, c('grey', 1));
    return p;
  };
  book.add('line', line(wall(52)), AIR);
  // the dryer's vent where the line is tied: lint puffs out of it
  const vent = line(wall(55));
  vent.rect(0, 6, 9, 8, c('metal', 1)).rect(0, 6, 9, 1, c('metal', 2)).rect(9, 5, 3, 10, c('metal', 2)).rect(12, 6, 2, 8, c('grey', 0));
  for (let x = 1; x < 9; x += 2) vent.rect(x, 7, 1, 7, c('metal', 0));
  vent.set(15, 8, c('grey', 2)).set(17, 10, c('grey', 2)).set(16, 12, c('grey', 1)).rect(1, 1, 3, 4, c('wood', 3));
  book.add('vent', vent, { ...AIR, birthMon: SOCKS_MON.lint, birthTime: 160 });
  // the ironing board (a ledge), the iron on one end
  const board = (iron: boolean) => {
    const p = wall(53);
    p.rect(0, 0, 20, 3, c('quilt', 2)).rect(0, 0, 20, 1, c('quilt', 3)).rect(0, 3, 20, 1, c('metal', 0));
    for (let x = 0; x < 20; x += 4) p.set(x + 1, 1, c('quilt', 1));
    if (iron) p.line(4, 19, 16, 4, c('metal', 1)).line(16, 19, 4, 4, c('metal', 1));
    return p;
  };
  book.add('board', board(false), { solid: LEDGE, grav: GRAV.down });
  book.add('boardLegs', board(true), { solid: LEDGE, grav: GRAV.down });
  // the neighbors at the window, peering in and whispering: WHY THE MISMATCH?
  const peer = book.pics.get('win.0.0')!.crop(0, 0, 20, 20);
  for (const [x, hair] of [
    [10, 'hair'],
    [16, 'grey'],
  ] as const) {
    blob(peer, x, 13, 3, 3.4, R('skin'), 1, 3);
    peer
      .rect(x - 3, 9, 7, 2, c(hair, 1))
      .set(x - 1, 13, c('ink', 0))
      .set(x + 1, 13, c('ink', 0))
      .rect(x - 1, 16, 2, 1, c('ink', 0));
  }
  book.add('peer', peer, { ...AIR, birthMon: SOCKS_MON.why, birthTime: 110 });
  // the front door out: closed, then open onto the daylight
  const door = (open: boolean) => {
    const p = wall(54);
    p.rect(2, 0, 16, 20, open ? c('spot', 1) : c('wood', 3))
      .rect(2, 0, 16, 1, c('wood', 0))
      .rect(2, 0, 1, 20, c('wood', 0))
      .rect(17, 0, 1, 20, c('wood', 0));
    if (!open) {
      p.frame(5, 3, 10, 6, c('wood', 2)).frame(5, 11, 10, 7, c('wood', 2)).disc(14, 10, 1.2, c('gold', 2)).rect(7, 9, 6, 1, c('metal', 1));
      // the doormat says it all
      p.rect(0, 18, 20, 2, c('couch', 2));
    } else p.line(4, 19, 15, 6, c('spot', 0));
    return p;
  };
  book.add('doorOpen', door(true), { grav: GRAV.none });
  gate(book, 'frontDoor', door(false), 'doorOpen', SOCKS);
  // the seven socks, none alike
  const sock = (name: string, bg: string, base: [string, number], pattern: (x: number, y: number) => number | undefined, onLine = false) =>
    plotThing(book, bg, name, (p) => {
      if (onLine) line(p).rect(3, 1, 2, 4, c('wood', 3));
      drawSock(p, pal, 4, onLine ? 4 : 5, base, pattern);
    });
  sock('sock1', 'wallB', ['red', 2], (_x, y) => (y % 4 < 2 ? c('white', 2) : undefined));
  sock('sock2', 'wall', ['navy', 0], (x, y) => ((x * 7 + y * 5) % 9 === 0 ? c('white', 2) : (x * 3 + y) % 13 === 0 ? c('gold', 3) : undefined));
  sock('sock3', 'wallB', ['navy', 2], () => undefined);
  sock('sock4', 'line', ['pink', 1], (x, y) => ((x % 4 === 1 && y % 4 === 1) || (x % 4 === 3 && y % 4 === 3) ? c('white', 2) : undefined), true);
  sock('sock5', 'line', ['teal', 1], (x) => (x % 3 === 0 ? c('yellow', 2) : undefined), true);
  sock('sock6', 'wallB', ['green', 2], (x, y) =>
    (x - 3) ** 2 + (y - 6) ** 2 < 3 || (x - 7) ** 2 + (y - 11) ** 2 < 3 ? c('pink', 2) : (x + y) % 5 === 0 ? c('green', 3) : undefined,
  );
  sock('sock7', 'wall', ['purple', 1], (x, y) => (Math.abs(((x + y) % 6) - 3) + Math.abs(((x - y + 60) % 6) - 3) < 2 ? c('yellow', 2) : undefined));
}

export function socksSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // static lint off the dryer: a grey fuzzball crackling
  const lint = (f: number) => {
    const p = P();
    blob(p, 10, 11, 5.5, 5, pal.r('grey'), 1, 3);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + f * 0.3;
      p.set(10 + Math.cos(a) * 7, 11 + Math.sin(a) * 6.5, c('grey', 2));
    }
    p.line(1 + f * 2, 3, 4 + f * 2, 6, c('yellow', 2)).line(16 - f * 2, 2, 18 - f * 2, 5, c('yellow', 2));
    face(p, pal, 10, 10, { angry: true });
    return outline(p, ink);
  };
  book.add('lint0', lint(0), hurts(-4));
  book.add('lint1', lint(1), hurts(-4));
  // a perfectly matched pair, marching in step: conformity
  const pair = (f: number) => {
    const p = P();
    for (const x of [1, 9]) drawSock(p, pal, x, 5 - (f ? 1 : 0), ['grey', 2], (_x, y) => (y === 4 || y === 6 ? c('navy', 1) : undefined));
    p.set(3, 9 - f, ink)
      .set(5, 9 - f, ink)
      .set(11, 9 - f, ink)
      .set(13, 9 - f, ink);
    return outline(p, ink);
  };
  book.add('pair0', pair(0), hurts(-6));
  book.add('pair1', pair(1), hurts(-6));
  // a whisper: WHY?
  const why = (f: number) => {
    const p = P();
    p.rect(1, 4 + f, 18, 9, c('grey', 2)).rect(2, 5 + f, 16, 7, c('white', 1));
    p.set(5, 13 + f, c('grey', 2)).set(4, 14 + f, c('grey', 2));
    micro(p, 3, 6 + f, 'WHY?', c('purple', 1));
    return outline(p, ink);
  };
  book.add('why0', why(0), hurts(-3));
  book.add('why1', why(1), hurts(-3));
}

function socksMonsters(set: Monster[], mb: SpriteBook): void {
  houseMonsters(set, mb);
  // lint out of the dryer, under the shelves and up, and back along the clothesline at him
  set[SOCKS_MON.lint] = mon(anim(mb, 'lint0', 'lint1', 3), { power: POWER.foe, thru: 1, end: -1, newmon: SOCKS_MON.fluff }, [
    corner(0, 0, 2),
    corner(-10, 0, 2, 4),
  ]);
  set[SOCKS_MON.pair] = mon(anim(mb, 'pair0', 'pair1', 4), { power: POWER.foe, thru: 1, newmon: SOCKS_MON.fluff }, pace(3, 1));
  set[SOCKS_MON.why] = mon(anim(mb, 'why0', 'why1', 8), { power: POWER.foe, thru: 1, end: -1, newmon: SOCKS_MON.fluff }, [
    corner(0, 0, 1),
    corner(-1, 3, 1),
    corner(-2, 6, 1),
    corner(-8, 6, 1, 4),
  ]);
}

export const socks: Monologue = {
  file: 'socks',
  title: 'Wore All the Weird Socks',
  desc: 'The Weird Socks',
  filler: 'slab',
  legend: {
    '^': 'ceil',
    '*': 'ceilLamp',
    '.': 'wall',
    _: 'wallB',
    '=': 'floor',
    '#': 'slab',
    k: 'basket',
    l: 'line',
    v: 'vent',
    h: 'shelf',
    i: 'board',
    I: 'boardLegs',
    p: 'peer',
    D: 'frontDoor',
    $: 'coin@wallB',
    '&': 'coin@wall',
    b: 'bill@wallB',
    B: 'bill@wall',
    m: 'mug@wallB',
    '!': 'spot@wallB',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the house past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 18;
    const W = 62 + OFF;
    m.row(0, 0, W - 1, '^');
    for (let x = 5; x < W; x += 10) m.set(x, 0, '*');
    m.fill(0, 1, W, 8, '.')
      .row(9, 0, W - 1, '_')
      .row(10, 0, W - 1, '=')
      .row(11, 0, W - 1, '#');
    const win = (x: number, y: number, peer: boolean) => (placePicture(m, 'win', x, y, 2, 2), peer && m.set(x, y, 'p'));
    // seven socks: the carnival tent by the start; the basket and the shelf with the galaxy
    m.set(2, 9, '!').set(5, 9, 'sock1');
    m.set(8, 9, 'k').row(6, 9, 11, 'h').set(10, 5, 'sock2').set(11, 5, '&');
    m.set(13, 9, '$');
    // the neighbors at the window whispering; a matched pair marching; the plain stubborn blue
    win(14, 3, true);
    m.mon(SOCKS_MON.pair, 16, 9);
    m.set(19, 9, 'sock3');
    // the washer and dryer (the step up: a basket), the clothesline over the shelves
    m.set(21, 9, 'k');
    placePicture(m, 'tower', 22, 6, 2, 4);
    m.row(5, 24, 33, 'l').row(6, 24, 31, 'h').set(34, 5, 'v');
    m.set(26, 5, 'sock4').set(28, 5, 'B').set(30, 5, 'sock5').set(31, 4, '&');
    m.set(34, 9, 'b');
    // off the line: another pair, the floral swirl; the ironing board and the argyle
    m.mon(SOCKS_MON.pair, 37, 9);
    m.set(39, 9, 'sock6');
    win(41, 2, false);
    m.row(7, 44, 46, 'i').set(47, 7, 'I').set(46, 6, 'sock7');
    m.set(50, 9, 'm').set(52, 9, '$');
    // Doc Leo: is it fashion? The front door out.
    m.mon(MON.leo, 54, 9);
    m.set(58, 9, 'D');
    m.link(58 + OFF, 9, 'next');
    win(59, 3, false);
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: socksMonsters,
  song: 'home',
  clips: { open: 'socks_o', line: 'socks_l', punch: 'socks_p', word: 'socks_w' },
  view: [8, 3],
  card: ['Seven socks,', 'seven solitary souls.'],
};
