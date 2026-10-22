// Other Dimensions (the Orbit Egg from Maximus): Nip from Another Dimension, Relativity
// Detour, Crime, Panic, and... Mustard, and Repeat Until Texture Is Uniform.
import { Pixels } from '../../../../kit/pixels';
import { bevel, blob, micro } from '../../art/draw';
import { c, r } from '../../art/pal';
import { blank, corgi, figure, floor, on, sign, wall } from '../../art/kit';
import type { Area } from '../area';
import type { WingSpec } from '../wing';
import { WINGS } from '../../stories';

function feast(under: Pixels, k: number): Pixels {
  const p = on(under);
  p.rect(0, 8, 20, 6, c('paper', 4)).rect(0, 14, 20, 2, c('red', 2)).rect(2, 16, 2, 3, c('wood', 1)).rect(16, 16, 2, 3, c('wood', 1));
  if (k === 0) p.disc(6, 7, 3, c('brown', 2)).rect(9, 6, 5, 3, c('red', 2)).disc(15, 7, 2, c('pink', 3));
  else p.disc(5, 7, 2, c('yellow', 3)).disc(10, 6, 3, c('green', 3)).disc(15, 7, 2, c('orange', 3));
  return p;
}

function nipPlant(under: Pixels): Pixels {
  const p = on(under);
  p.rect(6, 13, 8, 6, c('purple', 1)).rect(6, 13, 8, 1, c('purple', 3));
  for (let i = 0; i < 5; i++) blob(p, 5 + i * 2.5, 9 - (i % 2) * 3, 2.5, 2, r('green'), 2, 5);
  micro(p, 5, 15, 'NIP', c('paper', 4));
  return p;
}

function lounging(under: Pixels): Pixels {
  const p = on(under);
  blob(p, 9, 13, 7, 4, r('orange'), 1, 3);
  p.rect(14, 7, 5, 5, c('orange', 2)).set(14, 6, c('orange', 2)).set(18, 6, c('orange', 2));
  p.rect(15, 9, 1, 1, c('green', 4)).rect(17, 9, 1, 1, c('purple', 4)); // eyes of different dimensions
  p.line(2, 13, 0, 8, c('orange', 2));
  return p;
}

function meltingClock(frame: number): Pixels {
  const p = blank();
  blob(p, 10, 9 + frame, 7, 6 + frame, r('yellow'), 1, 3);
  p.disc(10, 9 + frame, 4.5, c('paper', 4));
  p.line(10, 9 + frame, 10, 6 + frame, c('ink', 0)).line(10, 9 + frame, 13, 10 + frame, c('ink', 0));
  p.rect(9, 15 + frame, 3, 4 - frame, c('yellow', 2));
  return p;
}

function colorSound(frame: number): Pixels {
  const p = blank();
  const cols = ['red', 'yellow', 'green', 'blue', 'purple'];
  for (let i = 0; i < 5; i++) p.disc(4 + i * 3, 10 + Math.sin(i + frame * 2) * 4, 1.6, c(cols[(i + frame) % 5], 3));
  return p;
}

function stairs(seed: number): Pixels {
  const p = new Pixels(20, 20, c('paper', 4));
  for (let i = 0; i < 5; i++) {
    const s = seed % 2 ? i : 4 - i;
    p.rect(i * 4, 16 - s * 4, 4, 4 + s * 4, c('grey', 3)).rect(i * 4, 16 - s * 4, 4, 1, c('ink', 1)).rect(i * 4, 16 - s * 4, 1, 4 + s * 4, c('ink', 1));
  }
  if (seed > 1) p.line(0, 0, 19, 19, c('ink', 1));
  return p;
}

function sketchFloor(): Pixels {
  const p = new Pixels(20, 20, c('paper', 4));
  for (let i = 0; i < 20; i += 5) p.rect(i, 0, 1, 20, c('sky', 4)).rect(0, i, 20, 1, c('sky', 4));
  return p;
}

function pencil(under: Pixels): Pixels {
  const p = on(under);
  p.line(3, 17, 15, 5, c('yellow', 3)).line(4, 17, 16, 5, c('yellow', 2)).line(3, 16, 15, 4, c('yellow', 3));
  p.rect(15, 2, 3, 3, c('pink', 3)).set(3, 17, c('ink', 0)).set(2, 18, c('ink', 0));
  return p;
}

function vanishingPoint(frame: number, under: Pixels): Pixels {
  const p = on(under);
  for (let k = 0; k < 4; k++) p.ring(10, 10, 2 + k * 2 + (frame ? 1 : 0), c(k % 2 ? 'ink' : 'grey', k % 2 ? 0 : 2));
  p.disc(10, 10, 2, c('ink', 0));
  return p;
}

/** Jim, half drawn: one side colored in, the other only pencil lines. */
function halfJim(): Pixels {
  const p = figure({ shirt: ['blue', 3], pants: ['brown', 1], hair: ['brown', 2], face: 'sad', arms: 'out' });
  for (let y = 0; y < 20; y++)
    for (let x = 10; x < 20; x++) {
      const v = p.get(x, y);
      if (v !== 255) p.set(x, y, (x + y) % 3 === 0 ? c('grey', 2) : 255);
    }
  return p;
}

function eraser(frame: number): Pixels {
  const p = blank();
  bevel(p, 4, 6 + frame, 12, 8, r('pink'), 2, 1);
  p.rect(4, 11 + frame, 12, 3, c('blue', 3));
  return p;
}

function building(seed: number): Pixels {
  const p = wall('brick', seed % 2 ? 'grey' : 'brown', seed);
  for (const x of [3, 12]) p.rect(x, 4, 5, 6, c('ink', 0)).rect(x + 1, 5, 3, 4, c(seed % 3 ? 'yellow' : 'sky', 2));
  return p;
}

function subShop(): Pixels {
  const p = wall('brick', 'red', 6);
  p.rect(1, 2, 18, 6, c('green', 2));
  micro(p, 3, 3, 'SUBS', c('yellow', 4));
  p.rect(5, 10, 10, 10, c('ink', 0)).rect(6, 11, 8, 9, c('sky', 2));
  return p;
}

function poupon(under: Pixels): Pixels {
  const p = on(under);
  p.rect(6, 6, 8, 12, c('yellow', 1)).rect(6, 6, 8, 1, c('yellow', 3)).rect(5, 3, 10, 3, c('ink', 1));
  p.rect(7, 9, 6, 5, c('paper', 4));
  micro(p, 7, 10, 'GP', c('ink', 0));
  return p;
}

function sandwichLady(under: Pixels): Pixels {
  const p = on(under, figure({ shirt: ['pink', 3], dress: true, hair: ['brown', 2], hairStyle: 'long', face: 'sad', arms: 'out' }));
  p.rect(14, 10, 6, 3, c('sand', 3)).rect(14, 11, 6, 1, c('pink', 2));
  return p;
}

/** Underwood: cape, mask, and his underwear on the outside. */
function underwood(frame: number): Pixels {
  const p = figure({ shirt: ['blue', 3], pants: ['blue', 3], hair: ['ink', 1], face: 'shades', arms: 'up' }, frame);
  p.rect(5, 14, 10, 3, c('red', 3)); // the underwear, over the pants
  p.rect(2, 10, 3, 9, c('red', 2)).rect(15, 10, 3, 9, c('red', 2)); // cape
  micro(p, 7, 10, 'U', c('yellow', 3));
  return p;
}

function bird(frame: number): Pixels {
  const p = blank();
  p.rect(7, 9, 7, 4, c('grey', 3)).rect(13, 8, 3, 3, c('grey', 4)).set(16, 9, c('orange', 3));
  if (frame) p.line(9, 9, 5, 3, c('grey', 2)).line(11, 9, 14, 3, c('grey', 2));
  else p.line(9, 12, 4, 15, c('grey', 2)).line(11, 12, 15, 15, c('grey', 2));
  return p;
}

function conveyor(frame: number): Pixels {
  const p = new Pixels(20, 20, c('ink', 1));
  p.rect(0, 4, 20, 12, c('grey', 2));
  for (let x = (frame * 3) % 6; x < 20; x += 6) p.rect(x, 4, 2, 12, c('grey', 1));
  p.rect(0, 3, 20, 1, c('grey', 4)).rect(0, 16, 20, 1, c('grey', 4));
  // corn on the belt
  p.rect(3 + frame * 2, 7, 6, 4, c('yellow', 3)).rect(3 + frame * 2, 7, 6, 1, c('green', 3));
  return p;
}

function chipper(part: number, frame: number): Pixels {
  const big = new Pixels(40, 20, c('ink', 1));
  bevel(big, 0, 0, 40, 20, r('red'), 2, 2);
  big.rect(4, 4, 12, 12, c('ink', 0));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + frame * 0.5;
    big.line(10, 10, 10 + Math.cos(a) * 5, 10 + Math.sin(a) * 5, c('grey', 4));
  }
  micro(big, 20, 4, 'CHIP', c('yellow', 3));
  micro(big, 20, 11, 'PER', c('paper', 4));
  return big.crop(part * 20, 0, 20, 20);
}

function husk(under: Pixels): Pixels {
  const p = on(under);
  for (let i = 0; i < 3; i++) blob(p, 5 + i * 5, 12 - i, 3, 6, r('green'), 1, 3);
  p.rect(8, 6, 4, 9, c('yellow', 3));
  return p;
}

function chip(frame: number): Pixels {
  const p = blank();
  const pts = frame ? [[4, 6], [16, 8], [9, 16]] : [[5, 14], [15, 4], [14, 15]];
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const [[ax, ay], [bx, by], [cx, cy]] = pts;
      const s = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      const t = (cx - bx) * (y - by) - (cy - by) * (x - bx);
      const u = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);
      if ((s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0)) p.set(x, y, c('yellow', (x + y) % 5 ? 3 : 2));
    }
  return p;
}

function art(a: Area): void {
  // Nip from Another Dimension
  a.tile('cosmos', floor('space', 3, 'pink'));
  a.solid('feast0', feast(a.tiles.pic('cosmos'), 0));
  a.solid('feast1', feast(a.tiles.pic('cosmos'), 1));
  a.solid('nip', nipPlant(a.tiles.pic('cosmos')));
  a.solid('cat', lounging(a.tiles.pic('cosmos')));
  sign(['FANCY CATNIP:', 'OUT OF THIS', 'WORLD'], 3, { board: 'purple', ink: 'paper' }).forEach((px, i) => a.solid(`fancy${i}`, px));
  a.monster('clock', [[meltingClock(0), 8], [meltingClock(1), 8]], { hazard: true, path: [[3, 0, 1], [0, 3, 1], [-3, 0, 1], [0, -3, 1]] });
  a.monster('sound', [[colorSound(0), 4], [colorSound(1), 4]], { path: [[0, 2, 1], [4, 0, 1], [0, -2, 1], [-4, 0, 1]] });

  // Relativity Detour
  a.tile('sketch', sketchFloor());
  for (let k = 0; k < 4; k++) a.solid(`stairs${k}`, stairs(k));
  a.solid('pencil', pencil(a.tiles.pic('sketch')));
  a.solid('vanish0', vanishingPoint(0, a.tiles.pic('sketch')), { next: 'vanish1', ntime: 5 });
  a.solid('vanish1', vanishingPoint(1, a.tiles.pic('sketch')), { next: 'vanish0', ntime: 5 });
  a.prop('jim', 'sketch', halfJim());
  sign(['VANISHING', 'POINT: DO NOT', 'STAND HERE'], 3, { board: 'paper' }).forEach((px, i) => a.solid(`vp${i}`, px));
  a.monster('eraser', [[eraser(0), 4], [eraser(1), 4]], { hazard: true, path: [[5, 0, 2], [-5, 0, 2]] });

  // Crime, Panic, and... Mustard
  a.tile('street', floor('road', 6));
  a.solid('bldg0', building(1));
  a.solid('bldg1', building(2));
  a.solid('subshop', subShop());
  a.solid('poupon', poupon(a.tiles.pic('street')));
  a.solid('lady', sandwichLady(a.tiles.pic('street')));
  sign(['SUBS: NO', 'CONDIMENTS', '(APPARENTLY)'], 3, { board: 'green', ink: 'paper' }).forEach((px, i) => a.solid(`subs${i}`, px));
  a.monster('underwood', [[underwood(0), 5], [underwood(1), 5]], { path: [[6, 0, 2], [0, 2, 2], [-6, 0, 2], [0, -2, 2]] });
  a.monster('bird', [[bird(0), 3], [bird(1), 3]], { hazard: true, path: [[0, 4, 2], [0, -4, 2]] });

  // Repeat Until Texture Is Uniform
  a.tile('factory', floor('tile', 6, 'grey'));
  for (let f = 0; f < 3; f++) a.solid(`belt${f}`, conveyor(f), { next: `belt${(f + 1) % 3}`, ntime: 3 });
  for (let f = 0; f < 2; f++) for (let k = 0; k < 2; k++) a.solid(`chipper${k}${f}`, chipper(k, f), { next: `chipper${k}${1 - f}`, ntime: 4 });
  a.solid('husk', husk(a.tiles.pic('factory')));
  a.prop('paul', 'factory', figure({ shirt: ['blue', 2], pants: ['blue', 1], hat: { kind: 'helmet', color: ['yellow', 3] }, face: 'sad', arms: 'up' }));
  a.prop('charles', 'factory', figure({ shirt: ['orange', 2], pants: ['blue', 1], hat: { kind: 'helmet', color: ['yellow', 3] }, face: 'sad' }));
  sign(['CHARLES:', 'HANDS IN', 'PLACE!'], 3, { board: 'yellow' }).forEach((px, i) => a.solid(`hands${i}`, px));
  a.monster('chip', [[chip(0), 2], [chip(1), 2]], { hazard: true, path: [[0, 3, 2], [4, 0, 2], [0, -3, 2], [-4, 0, 2]] });

  // the hallway's guest: Teddy in a fishbowl space helmet
  const astro = (s: number) => {
    const p = corgi(s);
    p.ring(15, 8, 6, c('sky', 4));
    return p;
  };
  a.monster('teddySpace', [[astro(0), 4], [astro(1), 4]], { path: [[6, 0, 1], [0, -2, 1], [-6, 0, 1], [0, 2, 1]] });
}

export const OTHER: WingSpec = {
  wing: WINGS[6],
  tint: 'pink',
  egg: [['night', 3], ['grey', 5], ['purple', 3]],
  signs: [
    ['MIND THE', 'VANISHING', 'POINTS'],
    ['IN SPACE NO', 'ONE CAN HEAR', 'YOU SHUSH'],
  ],
  guest: 'teddySpace',
  art,
  books: [
    {
      n: 17,
      floor: 'cosmos',
      rows: [
        '#######123######',
        '#o..n.......+..#',
        '#.ffF.....n..~.#',
        '#*.......C.....#',
        '#..n.......o...#',
        '#+..o...@...c..#',
        '#~....s.....n..#',
        '#o..+......*...#',
        '#.n.~...+..o...E',
        '#####X#########L',
      ],
      legend: {
        f: 'feast0',
        F: 'feast1',
        n: 'nip',
        c: 'cat',
        '1': 'fancy0',
        '2': 'fancy1',
        '3': 'fancy2',
        C: { tile: '.', mon: 'clock' },
        s: { tile: '.', mon: 'sound' },
      },
      note: 'A feast fit for a ruler of house cats, and the fancy catnip. Time melts here. The melting clocks take words; the colorful sounds just hum.',
      twist: {
        grid: [
          ['m:clock#0', 'nip', 'm:sound#0'],
          ['feast0', 'cat', 'feast1'],
        ],
        caption: ['FIG. 17: Time shaking hands with', 'colorful sounds. The cat\'s meow.'],
      },
    },
    {
      n: 18,
      floor: 'sketch',
      rows: [
        '#SSss123SSssSSs#',
        '#o...........+.#',
        '#.SS...v...ss~.#',
        '#*......Z......#',
        '#..s.......S...#',
        '#+..o...@...j..#',
        '#.ss.......p...#',
        '#~..+......*.o.#',
        '#o..~...+....o.E',
        '#X#############L',
      ],
      legend: {
        S: 'stairs0',
        s: 'stairs1',
        v: 'vanish0',
        p: 'pencil',
        j: 'jim',
        '1': 'vp0',
        '2': 'vp1',
        '3': 'vp2',
        Z: { tile: '.', mon: 'eraser' },
      },
      note: 'A drawing of impossible stairs, after M.C. Escher. A vanishing point that eats pencils. And Jim. The eraser takes words, and possibly Jim.',
      twist: {
        grid: [
          ['stairs0', 'vanish0', 'stairs1'],
          ['stairs2', 'jim', 'pencil'],
        ],
        caption: ['FIG. 18: Half of his hands drawn.', 'A hole, closing on the classroom.'],
      },
    },
    {
      n: 4,
      floor: 'street',
      rows: [
        '#BbBbS123bBbBbB#',
        '#o...........+.#',
        '#~..U.....b....#',
        '#*.............#',
        '#..+.....g.....#',
        '#o..o...@...l..#',
        '#~..........w..#',
        '#+..o......*...#',
        '#o.~.....+.....E',
        '###X###########L',
      ],
      legend: {
        B: 'bldg0',
        b: 'bldg1',
        S: 'subshop',
        g: 'poupon',
        l: 'lady',
        w: 'bldg1',
        '1': 'subs0',
        '2': 'subs1',
        '3': 'subs2',
        U: { tile: '.', mon: 'underwood' },
      },
      note: 'Gotcha City. A bologna sandwich with no condiments. A cry for help. Look! It\'s a bird! The birds take words. Underwood takes his time.',
      twist: {
        grid: [
          ['subshop', 'm:underwood#0', 'bldg0'],
          ['lady', 'poupon', 'street'],
        ],
        caption: ['FIG. 4: "But your under wear', 'is over your pants."'],
      },
    },
    {
      n: 26,
      floor: 'factory',
      rows: [
        '#123############',
        '#o.......+.....#',
        '#bbbbbbbcC.~.o.#',
        '#*.............#',
        '#..h...P.....*.#',
        '#+..o...@...p..#',
        '#.....q.....~..#',
        '#bbbbbbbcC..~..#',
        '#o..+......+.hoE',
        '###X###########L',
      ],
      legend: {
        b: 'belt0',
        c: 'chipper00',
        C: 'chipper10',
        h: 'husk',
        p: 'paul',
        q: 'charles',
        '1': 'hands0',
        '2': 'hands1',
        '3': 'hands2',
        P: { tile: '.', mon: 'chip' },
      },
      note: 'A corn chipper, Paul, and Charles, who should have kept his hands in place. Read the first letters. Then do not. The flying chips take words.',
      twist: {
        grid: [
          ['belt0', 'chipper00', 'chipper10'],
          ['husk', 'm:chip#0', 'paul'],
        ],
        caption: ['FIG. 26: Curiously, hints', 'irresistibly palatable. C.H.I.P.'],
      },
    },
  ],
};
