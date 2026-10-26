// The Backyard: Superpowers of Spooker Boy, Champion of the
// Backyard Games, Hung Out to Dry and Santa's Little OSHA Violation.
import { Pixels } from '../../../../kit/pixels';
import { bevel, blob, micro } from '../../art/draw';
import { c, r } from '../../art/pal';
import { blank, corgi, figure, floor, on, rot90, sign, wall } from '../../art/kit';
import type { Area } from '../area';
import type { WingSpec } from '../wing';
import { WINGS } from '../../stories';

/** A street light; lit, a warm pool of light on the sidewalk. */
function streetLight(under: Pixels, lit: boolean): Pixels {
  const p = on(under);
  if (lit) blob(p, 10, 16, 9, 4, r('yellow'), 0, 2);
  p.rect(9, 4, 2, 15, c('ink', 1)).rect(6, 2, 8, 3, c('ink', 1));
  p.rect(7, 4, 6, 2, lit ? c('yellow', 3) : c('grey', 2));
  return p;
}

function house(): Pixels {
  const p = wall('brick', 'brown', 4);
  p.rect(5, 4, 10, 9, c('ink', 0)).rect(6, 5, 8, 7, c('yellow', 1)).rect(9, 5, 1, 7, c('ink', 0));
  return p;
}

function ice(): Pixels {
  const p = floor('snow', 3);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x * 3 + y * 7) % 11 === 0) p.set(x, y, c('sky', 4));
  p.line(3, 6, 12, 11, c('grey', 3)).line(12, 11, 16, 9, c('grey', 3));
  return p;
}

function ball(under: Pixels): Pixels {
  const p = on(under);
  blob(p, 10, 12, 5, 5, r('red'), 1, 4);
  p.line(5, 12, 15, 12, c('paper', 4));
  return p;
}

function cat(frame: number): Pixels {
  const p = blank();
  p.rect(4, 10, 11, 5, c('ink', 1)).rect(13, 6, 5, 5, c('ink', 1)).set(13, 5, c('ink', 1)).set(17, 5, c('ink', 1));
  p.set(14, 8, c('yellow', 3)).set(16, 8, c('yellow', 3));
  p.line(4, 11, 1, 6 + frame, c('ink', 1));
  p.rect(5 + frame, 15, 2, 4, c('ink', 1)).rect(12 - frame, 15, 2, 4, c('ink', 1));
  return p;
}

function target(under: Pixels, speared: boolean): Pixels {
  const p = on(under);
  p.disc(10, 10, 9, c('paper', 4)).disc(10, 10, 6, c('red', 3)).disc(10, 10, 3, c('paper', 4));
  p.line(5, 5, 15, 15, c('red', 1)).line(15, 5, 5, 15, c('red', 1)).line(6, 5, 15, 14, c('red', 1)).line(14, 5, 5, 14, c('red', 1));
  if (speared) p.line(10, 10, 19, 1, c('green', 4)).line(10, 11, 19, 2, c('green', 2)).rect(9, 9, 3, 3, c('grey', 4));
  return p;
}

function medal(under: Pixels): Pixels {
  const p = on(under);
  p.rect(9, 2, 2, 16, c('wood', 2)).rect(5, 17, 10, 2, c('wood', 1));
  p.line(6, 3, 10, 9, c('purple', 3)).line(14, 3, 10, 9, c('purple', 3));
  p.disc(10, 11, 3, c('tin', 4)).ring(10, 11, 3, c('tin', 1));
  return p;
}

function gnome(under: Pixels): Pixels {
  const p = on(under);
  p.rect(7, 2, 6, 6, c('red', 3)).set(10, 1, c('red', 3));
  p.rect(7, 8, 6, 4, c('skin', 3)).rect(7, 11, 6, 3, c('paper', 4));
  p.rect(6, 14, 8, 5, c('blue', 3));
  micro(p, 0, 0, 'YAY', c('yellow', 3));
  return p;
}

function spear(frame: number): Pixels {
  const p = blank();
  p.line(2, 10 + frame, 17, 10 - frame, c('wood', 3)).rect(15, 8 - frame, 4, 3, c('green', 4));
  return p;
}

function laundry(kind: number): Pixels {
  const p = floor('grass', 11 + kind);
  p.rect(0, 3, 20, 1, c('grey', 4));
  const col = ['blue', 'pink', 'yellow', 'green'][kind];
  if (kind % 2) p.rect(3, 4, 14, 12, c(col, 3)).rect(1, 4, 3, 5, c(col, 3)).rect(16, 4, 3, 5, c(col, 3));
  else p.rect(4, 4, 4, 11, c(col, 3)).rect(12, 4, 4, 13, c(col, 2)).rect(12, 15, 7, 2, c(col, 2)).rect(1, 13, 7, 2, c(col, 3));
  for (const x of [5, 14]) p.rect(x, 2, 1, 3, c('wood', 3));
  return p;
}

function pole(): Pixels {
  const p = floor('grass', 14);
  p.rect(9, 0, 3, 20, c('grey', 3)).rect(0, 3, 20, 1, c('grey', 4));
  return p;
}

/** John, tied up in the clothesline with a great many pegs. */
function tiedJohn(under: Pixels): Pixels {
  const p = on(under, figure({ shirt: ['blue', 2], pants: ['brown', 1], hair: ['brown', 1], face: 'sad' }));
  for (let y = 9; y < 19; y += 3) p.rect(4, y, 12, 1, c('grey', 5));
  for (const [x, y] of [
    [5, 10],
    [13, 13],
    [8, 16],
    [11, 7],
    [6, 3],
  ])
    p.rect(x, y, 1, 3, c('wood', 4));
  return p;
}

function peg(frame: number): Pixels {
  const p = blank();
  if (frame) p.rect(9, 4, 2, 12, c('wood', 4)).rect(8, 9, 4, 2, c('grey', 3));
  else p.rect(4, 9, 12, 2, c('wood', 4)).rect(9, 8, 2, 4, c('grey', 3));
  return p;
}

function workbench(under: Pixels, tool: 'chainsaw' | 'grinder' | 'nailgun' | 'cnc' | 'plasma' | 'flame' | 'wood'): Pixels {
  const p = on(under);
  p.rect(0, 10, 20, 3, c('wood', 3)).rect(1, 13, 2, 6, c('wood', 1)).rect(17, 13, 2, 6, c('wood', 1));
  switch (tool) {
    case 'chainsaw':
      p.rect(2, 5, 8, 5, c('orange', 3)).rect(10, 6, 9, 3, c('grey', 4)).frame(10, 6, 9, 3, c('ink', 0));
      break;
    case 'grinder':
      p.rect(3, 6, 10, 3, c('yellow', 3)).disc(15, 6, 4, c('grey', 3)).disc(15, 6, 1, c('ink', 0));
      break;
    case 'nailgun':
      p.rect(3, 4, 12, 4, c('red', 3)).rect(5, 8, 3, 2, c('ink', 1)).rect(15, 5, 3, 2, c('grey', 4));
      break;
    case 'cnc':
      bevel(p, 1, 0, 18, 10, r('grey'), 3, 1);
      p.rect(9, 2, 2, 6, c('ink', 0)).rect(3, 8, 14, 1, c('wood', 4));
      micro(p, 3, 2, 'CNC', c('green', 4));
      break;
    case 'plasma':
      p.rect(3, 4, 6, 6, c('blue', 2)).line(9, 6, 17, 3, c('ink', 1)).set(18, 2, c('sky', 4)).set(17, 1, c('purple', 4));
      break;
    case 'flame':
      p.rect(3, 5, 10, 4, c('grey', 2)).rect(13, 6, 3, 2, c('ink', 1));
      blob(p, 18, 6, 2, 2, r('orange'), 1, 3);
      break;
    case 'wood':
      p.rect(6, 6, 9, 4, c('wood', 4)).rect(6, 6, 9, 1, c('wood', 5));
      break;
  }
  return p;
}

function spark(frame: number): Pixels {
  const p = blank();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + frame;
    p.line(10, 10, 10 + Math.cos(a) * (5 + (i % 2) * 3), 10 + Math.sin(a) * (5 + (i % 2) * 3), c(i % 2 ? 'yellow' : 'orange', 3));
  }
  return p;
}

function art(a: Area): void {
  // Superpowers of Spooker Boy
  a.tile('walk', floor('road', 3));
  const g = (k: number) => c('green', k);
  a.tile(
    'lawnN',
    floor('grass', 2).map((_, __, v) => (v === g(3) ? g(1) : v === g(2) ? g(0) : v === g(1) ? c('night', 1) : v)),
  );
  a.solid('fence', wall('fence', 'green', 5));
  a.solid('house', house());
  a.tile('ice', ice());
  a.solid('ball', ball(a.tiles.pic('lawnN')));
  // the street lights come on one by one, on their own timers, and stay on
  a.solid('lampOn', streetLight(a.tiles.pic('walk'), true));
  for (const [k, t] of [
    [1, 90],
    [2, 160],
    [3, 230],
    [4, 300],
  ] as const)
    a.solid(`lamp${k}`, streetLight(a.tiles.pic('walk'), false), { next: 'lampOn', ntime: t });
  a.prop('spooker', 'walk', figure({ shirt: ['purple', 3], pants: ['blue', 1], hair: ['ink', 1], hairStyle: 'wild', small: true, arms: 'up' }));
  a.prop('billy', 'walk', figure({ shirt: ['orange', 3], pants: ['blue', 2], hair: ['yellow', 3], small: true, hat: { kind: 'cap', color: ['red', 3] } }));
  sign(['MRS.', "HENDERSON'S", 'KEEP OUT'], 3, { board: 'wood', ink: 'paper' }).forEach((px, i) => a.solid(`hend${i}`, px));
  a.monster(
    'cat',
    [
      [cat(0), 4],
      [cat(1), 4],
    ],
    {
      faces: 'right',
      hazard: true,
      path: [
        [4, 0, 2],
        [-4, 0, 2],
      ],
    },
  );

  // Champion of the Backyard Games
  a.tile('yard', floor('grass', 7));
  a.solid('target', target(a.tiles.pic('yard'), false));
  a.solid('targetHit', target(a.tiles.pic('yard'), true));
  a.solid('medal', medal(a.tiles.pic('yard')));
  a.solid('gnome', gnome(a.tiles.pic('yard')));
  a.prop('harry', 'yard', figure({ shirt: ['paper', 4], pants: ['red', 2], hair: ['brown', 2], arms: 'up', face: 'happy' }));
  a.solid('hedge', wall('hedge', 'green', 7));
  sign(['BACKYARD', 'GAMES', 'EST. TODAY'], 3, { board: 'blue', ink: 'paper' }).forEach((px, i) => a.solid(`yardGames${i}`, px));
  a.monster(
    'spear',
    [
      [spear(0), 2],
      [spear(1), 2],
    ],
    {
      faces: 'right',
      hazard: true,
      path: [
        [8, 0, 3],
        [-8, 0, 3],
      ],
    },
  );

  // Hung Out to Dry
  a.tile('dryyard', floor('grass', 9));
  for (let k = 0; k < 4; k++) a.solid(`wash${k}`, laundry(k));
  a.solid('pole', pole());
  a.solid('tied', tiedJohn(a.tiles.pic('dryyard')));
  const nancy = figure({ shirt: ['red', 3], dress: true, hair: ['orange', 2], hairStyle: 'long', arms: 'out' });
  nancy.rect(14, 15, 6, 4, c('wood', 3));
  a.prop('nancy', 'dryyard', nancy);
  sign(['WE ARE OVER.', '(WERE WE', 'TOGETHER?)'], 3, { board: 'pink' }).forEach((px, i) => a.solid(`over${i}`, px));
  a.monster(
    'peg',
    [
      [peg(0), 2],
      [peg(1), 2],
    ],
    {
      hazard: true,
      path: [
        [0, 4, 3],
        [0, -4, 3],
      ],
    },
  );
  a.patrol(
    'peg',
    [
      [5, 0, 2],
      [-5, 0, 2],
    ],
    'pegH',
  );

  // Santa's Little OSHA Violation
  a.tile('garage', floor('tile', 8, 'grey'));
  for (const t of ['chainsaw', 'grinder', 'nailgun', 'cnc', 'plasma', 'flame', 'wood'] as const) a.solid(`wb${t}`, workbench(a.tiles.pic('garage'), t));
  a.prop('santa', 'garage', figure({ shirt: ['red', 3], pants: ['red', 2], hat: { kind: 'santa', color: ['red', 3] }, beard: ['paper', 4], arms: 'up' }));
  a.prop('timmy', 'garage', figure({ shirt: ['green', 3], pants: ['blue', 1], hair: ['brown', 2], small: true, face: 'happy' }));
  sign(['MORE POWER!', 'NEVER GIVE UP', '-SANTA'], 3, { board: 'red', ink: 'paper' }).forEach((px, i) => a.solid(`power${i}`, px));
  a.solid('garageWall', wall('panel'));
  a.monster(
    'spark',
    [
      [spark(0), 2],
      [spark(1), 2],
    ],
    {
      hazard: true,
      path: [
        [3, 0, 2],
        [0, 2, 2],
        [-3, 0, 2],
        [0, -2, 2],
      ],
    },
  );

  // the hallway's guest: Teddy, wearing a Santa hat
  const hat = (s: number) => {
    const p = corgi(s);
    p.rect(13, 1, 5, 2, c('red', 3)).rect(12, 3, 7, 1, c('paper', 4)).set(18, 0, c('paper', 4));
    return p;
  };
  a.monster(
    'teddySanta',
    [
      [hat(0), 4],
      [hat(1), 4],
    ],
    {
      faces: 'right',
      path: [
        [6, 0, 2],
        [-6, 0, 2],
      ],
    },
  );
  void rot90;
}

export const YARD: WingSpec = {
  wing: WINGS[3],
  tint: 'green',
  stamp: [
    ['grey', 5],
    ['blue', 3],
    ['red', 3],
  ],
  signs: [
    ['KEEP OFF THE', 'GRASS. KEEP', 'ON READING.'],
    ['LIGHTS ON?', 'TIME TO GO', 'HOME, BILLY'],
  ],
  guest: 'teddySanta',
  art,
  books: [
    {
      n: 15,
      floor: 'walk',
      rows: [
        '#hhhhhhhhhhhhhh#',
        '#1wwww2wwww3www#',
        '#o.......+...~o#',
        '#ffff.ffffffff.#',
        '#nnbnnnniinnn*~#',
        '#~nnnnnn@nnn+nn#',
        '#fff.fffff.ffff#',
        '#o..o.s..y..+..#',
        '#*.4.o...C..+..E',
        '##Q56####X#####L',
      ],
      legend: {
        h: 'house',
        w: 'walk',
        '1': 'lamp1',
        '2': 'lamp2',
        '3': 'lamp3',
        '4': 'lamp4',
        f: 'fence',
        n: 'lawnN',
        i: 'ice',
        b: 'ball',
        s: 'spooker',
        y: 'billy',
        Q: 'hend0',
        '5': 'hend1',
        '6': 'hend2',
        C: { tile: '.', mon: 'cat' },
      },
      note: "A street at dusk, and old Mrs. Henderson's yard. Spooker Boy has superpowers. The street lights have timers. Watch them.",
      twist: {
        grid: [
          ['lampOn', 'lampOn', 'lampOn'],
          ['spooker', 'walk', 'billy'],
        ],
        caption: ["FIG. 15: He hadn't noticed", 'the street lights.'],
      },
    },
    {
      n: 19,
      floor: 'yard',
      rows: [
        '#hhhhh123hhhhhh#',
        '#o.......g.g.+.#',
        '#.....S......o.#',
        '#~.H...........#',
        '#..........t.~.#',
        '#+..o...@...m..#',
        '#..........g...#',
        '#*.......+..o..#',
        '#o.~..+.....*..E',
        '#######X#######L',
      ],
      legend: {
        h: 'hedge',
        g: 'gnome',
        t: 'target',
        m: 'medal',
        H: 'harry',
        '1': 'yardGames0',
        '2': 'yardGames1',
        '3': 'yardGames2',
        S: { tile: '.', mon: 'spear' },
      },
      note: 'Harry has a minty spear and a big red X. The garden gnomes are the crowd. The spear goes where it likes; stay out of its way.',
      twist: {
        grid: [
          ['gnome', 'targetHit', 'gnome'],
          ['harry', 'medal', null],
        ],
        caption: ['FIG. 19: DEAD CENTER! The crowd', 'goes wild over the X Spear mint!'],
      },
    },
    {
      n: 20,
      floor: 'dryyard',
      rows: [
        '#hhhhhhhhhhhhhh#',
        '#o.......P...+.#',
        '#p0123p0123p...#',
        '#~.............#',
        '#.N....+...T.*.#',
        '#+.o....@....o.#',
        '#p3210p.~...p..#',
        '#o.q.....*..o..#',
        '#~....+....pE..#',
        '#X##########L###',
      ],
      legend: {
        h: 'hedge',
        p: 'pole',
        '0': 'wash0',
        '1': 'wash1',
        '2': 'wash2',
        '3': 'wash3',
        N: 'nancy',
        T: 'tied',
        P: { tile: '.', mon: 'pegH' },
        q: { tile: '.', mon: 'peg' },
      },
      note: 'Nancy has a supply of clothes pegs and a low-flying throw. John has questions. Keep your head down.',
      twist: {
        grid: [
          ['pole', 'wash1', 'wash2', 'pole'],
          ['nancy', 'm:peg#0', 'tied', null],
        ],
        caption: ['FIG. 20: "I love you?"', '"Fine."'],
      },
    },
    {
      n: 31,
      floor: 'garage',
      rows: [
        '#gggg123ggggggg#',
        '#o..........+..#',
        '#.cGNM....PFw..#',
        '#~.............#',
        '#*...S..T....o.#',
        '#+..o...@...s..#',
        '#..+.....~.....#',
        '#o.cGNM....PFw.#',
        '#~..+....*...o.E',
        '#####X#########L',
      ],
      legend: {
        g: 'garageWall',
        c: 'wbchainsaw',
        G: 'wbgrinder',
        N: 'wbnailgun',
        M: 'wbcnc',
        P: 'wbplasma',
        F: 'wbflame',
        w: 'wbwood',
        s: 'santa',
        T: 'timmy',
        '1': 'power0',
        '2': 'power1',
        '3': 'power2',
        S: { tile: '.', mon: 'spark' },
      },
      note: 'Timmy needs tools for a pinewood derby car. Santa has a bag. Hidey ho. The sparks are not festive; they cost points.',
      twist: {
        grid: [
          ['wbchainsaw', 'wbgrinder', 'wbcnc'],
          ['timmy', 'santa', 'wbflame'],
        ],
        caption: ['FIG. 31: "More power!"', 'Never give up. Never surrender.'],
      },
    },
  ],
};
