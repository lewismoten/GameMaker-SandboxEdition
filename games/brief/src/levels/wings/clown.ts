// Clown Alley: The Scissor Situation,
// A very Cultured Performance, Bubble Rap and The Interest We Lost.
import { Pixels } from '../../../../kit/pixels';
import { bevel, blob, micro } from '../../art/draw';
import { c, r } from '../../art/pal';
import { blank, bubble, docLeoSide, figure, figureBack, figureSide, floor, on, plinth, rot90, sign, wall } from '../../art/kit';
import type { Area } from '../area';
import type { WingSpec } from '../wing';
import { WINGS } from '../../stories';

/** The ring curb: red and white stripes. */
function curb(): Pixels {
  const p = floor('sawdust', 3);
  p.rect(0, 4, 20, 12, c('ink', 0));
  for (let x = 0; x < 20; x++) p.rect(x, 5, 1, 10, Math.floor(x / 5) % 2 ? c('paper', 4) : c('red', 3));
  p.rect(0, 5, 20, 1, c('brass', 3));
  return p;
}

/** The audience: children on a bench, laughing at the spectacle. */
function kids(seed: number): Pixels {
  const p = new Pixels(20, 20, c('red', 0));
  p.rect(0, 15, 20, 5, c('wood', 2));
  const hair: [string, number][] = [
    ['brown', 1],
    ['yellow', 2],
    ['ink', 1],
    ['orange', 2],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 1 + i * 6 + (seed % 2);
    const h = hair[(i + seed) % 4];
    p.rect(x, 6, 5, 5, c('skin', 2 + ((i + seed) % 2))).rect(x, 5, 5, 2, c(h[0], h[1]));
    p.set(x + 1, 8, c('ink', 0))
      .set(x + 3, 8, c('ink', 0))
      .rect(x + 1, 9, 3, 1, c('red', 1));
    p.rect(x - 1, 11, 7, 4, c(['blue', 'green', 'purple'][(i + seed) % 3], 3));
  }
  return p;
}

function scissors(open: boolean): Pixels {
  const p = blank();
  const s = c('tin', 5);
  const d = c('tin', 2);
  if (open) {
    p.line(3, 3, 13, 11, s).line(4, 3, 14, 11, d);
    p.line(17, 3, 7, 11, s).line(16, 3, 6, 11, d);
  } else {
    p.line(9, 1, 10, 11, s).line(10, 1, 11, 11, d);
  }
  p.ring(6, 15, 3, c('red', 3)).ring(14, 15, 3, c('red', 3));
  p.disc(10, 11, 1, c('brass', 3));
  return p;
}

function cot(under: Pixels): Pixels {
  const p = on(under);
  p.rect(1, 7, 18, 6, c('paper', 4)).frame(1, 7, 18, 6, c('gray', 2));
  p.rect(8, 8, 4, 4, c('red', 3)).rect(9, 7, 2, 6, c('paper', 4)).rect(7, 9, 6, 2, c('paper', 4)).rect(9, 8, 2, 4, c('red', 3)).rect(8, 9, 4, 2, c('red', 3));
  p.rect(2, 13, 2, 4, c('gray', 2)).rect(16, 13, 2, 4, c('gray', 2));
  return p;
}

/** Balloon sculptures for the gallery. */
function balloonArt(kind: 'dog' | 'sword' | 'flower' | 'hat'): Pixels {
  const p = blank();
  const tube = (x0: number, y0: number, x1: number, y1: number, ramp: string) => {
    const n = 6;
    for (let i = 0; i <= n; i++) blob(p, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 2, 2, r(ramp), 1, r(ramp).length - 1);
  };
  if (kind === 'dog') {
    tube(5, 10, 14, 10, 'red');
    tube(14, 10, 15, 4, 'red');
    tube(5, 10, 4, 15, 'red');
    tube(13, 10, 13, 15, 'red');
    blob(p, 16, 3, 2, 2, r('red'), 1, 5);
  } else if (kind === 'sword') {
    tube(10, 1, 10, 13, 'teal');
    tube(5, 12, 15, 12, 'yellow');
    tube(10, 13, 10, 16, 'yellow');
  } else if (kind === 'flower') {
    tube(10, 8, 10, 16, 'green');
    for (const [x, y] of [
      [7, 4],
      [13, 4],
      [7, 9],
      [13, 9],
      [10, 2],
    ])
      blob(p, x, y, 2.5, 2.5, r('pink'), 1, 3);
    blob(p, 10, 6, 2, 2, r('yellow'), 1, 3);
  } else {
    tube(4, 12, 16, 12, 'purple');
    tube(6, 12, 10, 3, 'blue');
    tube(14, 12, 10, 3, 'blue');
  }
  return p;
}

/** The cheesy cover band: a grill sizzling with cheese. */
function grill(frame: number): Pixels {
  const p = floor('marble', 5);
  p.rect(2, 8, 16, 9, c('ink', 1)).rect(2, 8, 16, 2, c('gray', 2));
  for (let x = 3; x < 17; x += 3) p.rect(x, 10, 1, 6, c('gray', 3));
  p.rect(4, 5, 7, 4, c('yellow', 3)).rect(11, 6, 5, 3, c('orange', 3));
  if (frame) p.set(6, 2, c('gray', 4)).set(8, 1, c('gray', 4)).set(13, 3, c('gray', 4));
  else p.set(7, 3, c('gray', 4)).set(12, 1, c('gray', 4)).set(14, 2, c('gray', 4));
  return p;
}

function cheddar(): Pixels {
  const p = blank();
  blob(p, 10, 12, 8, 5, r('orange'), 1, 3);
  p.rect(2, 11, 16, 3, c('orange', 2));
  blob(p, 10, 10, 8, 4, r('yellow'), 1, 3);
  p.rect(10, 8, 7, 3, c('yellow', 1));
  return p;
}

function aisle(seed: number): Pixels {
  const p = new Pixels(20, 20, c('gray', 3));
  const pals = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
  for (const top of [1, 8, 15]) {
    for (let x = 1; x < 19; x += 4) p.rect(x, top, 3, 5, c(pals[(x + top + seed) % 6], 3)).rect(x, top, 3, 1, c('paper', 4));
    p.rect(0, top + 5, 20, 1, c('gray', 1));
  }
  return p;
}

function elfOnShelf(): Pixels {
  const p = aisle(2);
  p.rect(6, 6, 8, 2, c('red', 3)); // he sits on the shelf edge
  p.rect(7, 1, 6, 5, c('red', 3)).rect(8, 2, 4, 3, c('skin', 3)).set(9, 3, c('ink', 0)).set(11, 3, c('ink', 0));
  p.rect(7, 0, 6, 1, c('paper', 4)).set(12, 0, c('red', 3)).set(13, 0, c('paper', 4));
  p.rect(7, 8, 2, 3, c('red', 3)).rect(11, 8, 2, 3, c('red', 3));
  return p;
}

function cabinet(): Pixels {
  const p = blank();
  bevel(p, 2, 0, 16, 20, r('gray'), 3, 1);
  for (const y of [2, 8, 14])
    p.rect(4, y, 12, 5, c('gray', 4))
      .rect(8, y + 2, 4, 1, c('gray', 1))
      .rect(6, y + 1, 8, 1, c('paper', 4));
  return p;
}

function desk(under: Pixels): Pixels {
  const p = on(under);
  p.rect(0, 9, 20, 6, c('wood', 2)).rect(0, 9, 20, 1, c('wood', 4)).rect(1, 15, 2, 4, c('wood', 1)).rect(17, 15, 2, 4, c('wood', 1));
  bevel(p, 4, 1, 12, 9, r('paper'), 2, 1);
  p.rect(6, 3, 8, 5, c('teal', 1));
  micro(p, 6, 3, 'C:', c('green', 4));
  return p;
}

function cloud(dy: number): Pixels {
  const p = blank();
  for (const [x, y, s] of [
    [6, 10, 4],
    [11, 8, 5],
    [15, 11, 3.5],
  ])
    blob(p, x, y + dy, s, s * 0.8, r('gray'), 3, 5);
  micro(p, 1, 13 + dy, 'CLOUD', c('blue', 1));
  return p;
}

function art(a: Area): void {
  // The Scissor Situation
  a.tile('saw', floor('sawdust', 1));
  a.solid('ringc', curb());
  a.solid('kids1', kids(1));
  a.solid('kids2', kids(2));
  a.prop('tippy', 'saw', rot90(figure({ face: 'whiteface', shirt: ['blue', 4], pants: ['blue', 4], hat: { kind: 'cap', color: ['red', 3] } })));
  const molly = figure({ face: 'auguste', hairStyle: 'wild', hair: ['orange', 3], shirt: ['yellow', 3], pants: ['green', 2], arms: 'up' });
  micro(molly, 0, 0, 'STOP', c('red', 3));
  a.prop('molly', 'saw', molly);
  a.solid('cot', cot(a.tiles.pic('saw')));
  sign(['NO RUNNING', 'WITH SCISSORS', '(OR SLOWLY)'], 3).forEach((px, i) => a.solid(`scis${i}`, px));
  a.monster(
    'doc',
    [
      [docLeoSide(0), 4],
      [docLeoSide(1), 4],
    ],
    {
      faces: 'right',
      path: [
        [5, 0, 2],
        [-5, 0, 2],
      ],
    },
  );
  a.monster(
    'scissors',
    [
      [scissors(true), 3],
      [scissors(false), 3],
    ],
    {
      hazard: true,
      path: [
        [3, 0, 2],
        [0, 2, 2],
        [-5, 0, 2],
        [0, -2, 2],
        [2, 0, 2],
      ],
    },
  );

  // A very Cultured Performance
  a.tile('marble', floor('marble', 2));
  for (const k of ['dog', 'sword', 'flower', 'hat'] as const) a.solid(`b${k}`, plinth(a.tiles.pic('marble'), balloonArt(k)));
  a.solid('grill0', grill(0), { next: 'grill1', ntime: 4 });
  a.solid('grill1', grill(1), { next: 'grill0', ntime: 4 });
  a.prop('mozz', 'marble', figure({ shirt: ['paper', 4], pants: ['ink', 1], hat: { kind: 'beret', color: ['ink', 1] }, arms: 'out', hair: ['brown', 1] }));
  a.prop('cheddar', 'marble', cheddar());
  a.solid(
    'rope',
    on(
      floor('marble', 2),
      (() => {
        const p = blank();
        p.rect(2, 4, 2, 14, c('brass', 2))
          .rect(16, 4, 2, 14, c('brass', 2))
          .line(3, 6, 17, 6, c('red', 2))
          .line(3, 7, 10, 9, c('red', 2))
          .line(10, 9, 17, 7, c('red', 2));
        return p;
      })(),
    ),
  );
  sign(['PLEASE DO NOT', 'POP THE ART'], 3, { board: 'brass' }).forEach((px, i) => a.solid(`gal${i}`, px));
  const guide = (arms: 'up' | 'down', view = figure) => view({ shirt: ['red', 3], dress: true, hair: ['yellow', 2], hairStyle: 'bun', arms });
  a.walker(
    'guide',
    {
      front: [
        [guide('up'), 6],
        [guide('down'), 6],
      ],
      back: [
        [guide('up', figureBack), 6],
        [guide('down', figureBack), 6],
      ],
    },
    {
      path: [
        [0, 3, 1],
        [0, -3, 1],
      ],
    },
  );
  a.monster(
    'static',
    [
      [bubble(4, 'pink'), 5],
      [bubble(4, 'pink', 1), 5],
    ],
    {
      hazard: true,
      path: [
        [3, 0, 1],
        [0, 2, 1],
        [-3, 0, 1],
        [0, -2, 1],
      ],
    },
  );

  // Bubble Rap
  a.tile('lino', floor('lino', 3, 'green'));
  a.solid('aisle', aisle(1));
  a.solid('aisle2', aisle(4));
  a.solid('elf', elfOnShelf());
  const joker = figure({ face: 'happy', shirt: ['purple', 3], pants: ['green', 3], hat: { kind: 'top', color: ['green', 2] } });
  joker.line(16, 8, 16, 19, c('brass', 3)).disc(16, 7, 1.5, c('brass', 4));
  a.prop('joker', 'lino', joker);
  sign(['BUBBLE PACK', 'AISLE 3', 'POP AT RANDOM'], 3, { board: 'yellow' }).forEach((px, i) => a.solid(`wrap${i}`, px));
  a.monster(
    'bubbig',
    [
      [bubble(7), 6],
      [bubble(7, 'sky', 1), 6],
    ],
    {
      power: 1,
      path: [
        [0, 2, 1],
        [0, -2, 1],
      ],
    },
  );
  a.monster(
    'bubsmall',
    [
      [bubble(3), 4],
      [bubble(3, 'sky', 1), 4],
    ],
    {
      power: 1,
      path: [
        [2, 0, 1],
        [-2, 0, 1],
      ],
    },
  );

  // The Interest We Lost
  a.tile('office', floor('carpet', 4, 'blue'));
  a.prop('cabinet', 'office', cabinet());
  a.solid('desk', desk(a.tiles.pic('office')));
  a.prop('mara', 'office', figure({ shirt: ['teal', 3], dress: true, hair: ['brown', 0], hairStyle: 'long', glasses: true, arms: 'up' }));
  a.monster(
    'cloud',
    [
      [cloud(0), 8],
      [cloud(1), 8],
    ],
    {
      path: [
        [3, 0, 1],
        [-3, 0, 1],
      ],
    },
  );
  const peton = (s: number) => figureSide({ face: 'auguste', shirt: ['paper', 4], tie: ['red', 3], pants: ['ink', 1], hair: ['ink', 1] }, s);
  a.monster(
    'peton',
    [
      [peton(0), 5],
      [peton(1), 5],
    ],
    {
      faces: 'right',
      path: [
        [0, 2, 1],
        [4, 0, 1],
        [0, -2, 1],
        [-4, 0, 1],
      ],
    },
  );
  sign(['ACCOUNTS', 'PAYABLE', '(MOSTLY)'], 3, { board: 'gray' }).forEach((px, i) => a.solid(`acct${i}`, px));
  a.solid('brick', wall('brick', 'red', 3));

  // the hallway's guest: Doc Leo himself, browsing
  a.monster(
    'leo',
    [
      [docLeoSide(0), 6],
      [docLeoSide(1), 6],
    ],
    {
      faces: 'right',
      path: [
        [6, 0, 1],
        [0, -2, 1],
        [-6, 0, 1],
        [0, 2, 1],
      ],
    },
  );
}

export const CLOWN: WingSpec = {
  wing: WINGS[0],
  tint: 'red',
  stamp: [
    ['paper', 4],
    ['red', 3],
    ['orange', 3],
  ],
  signs: [
    ['HONK IF YOU', 'LOVE BOOKS', '(QUIETLY)'],
    ['LOST: ONE RED', 'NOSE. ASK AT', 'THE DESK'],
  ],
  guest: 'leo',
  art,
  books: [
    {
      n: 13,
      floor: 'saw',
      rows: [
        '################',
        '#kKkKkKLkKkKkKk#',
        '#o..+..ED.....*#',
        '#.RRRR...RRRR..#',
        '#.R~.......o.R+#',
        '#.R..t..@.m..R.#',
        '#.R+....C...R.o#',
        '#.RRRR...RRRR..#',
        '#*..o~...p..o+~#',
        '#######X##123###',
      ],
      legend: {
        k: 'kids1',
        K: 'kids2',
        R: 'ringc',
        t: 'tippy',
        m: 'molly',
        p: 'cot',
        D: { tile: '.', mon: 'doc' },
        C: { tile: '.', mon: 'scissors' },
        '1': 'scis0',
        '2': 'scis1',
        '3': 'scis2',
      },
      note: 'The scissors are not a toy. They are a monster. That is worse. Walk. Do not run. Do not run in slow motion either.',
      twist: {
        grid: [
          ['ringc', 'ringc', 'ringc', 'ringc'],
          ['tippy', 'cot', 'molly', 'm:scissors#0'],
        ],
        caption: ['FIG. 13: Clown paramedics.', 'They shrug professionally.'],
      },
    },
    {
      n: 25,
      floor: 'marble',
      rows: [
        '#######123######',
        '#.d..o...s..~.+#',
        '#.....V........#',
        '#*.f....h....o.#',
        '#...~.....+..o.#',
        '#.gq...o@..G...#',
        '#.gq.+.....c.~.#',
        '#.........+....#',
        '#E...z.r.r.*.o.#',
        '#L############X#',
      ],
      legend: {
        d: 'bdog',
        s: 'bsword',
        f: 'bflower',
        h: 'bhat',
        g: 'grill0',
        q: 'grill1',
        '1': 'gal0',
        '2': 'gal1',
        '3': 'gal2',
        c: 'cheddar',
        r: 'rope',
        z: 'mozz',
        V: { tile: '.', mon: 'guide' },
        G: { tile: '.', mon: 'static' },
      },
      note: 'A balloon museum with a live cheese band. Do not touch the sculptures. They are touchy. Static electricity will try to hug you. That costs points.',
      twist: {
        grid: [
          ['bdog', 'bsword', 'bflower', 'bhat'],
          ['grill0', 'mozz', 'cheddar', null],
        ],
        caption: ['FIG. 25: The artist, twisting.', 'The band, melting. Very cultured.'],
      },
    },
    {
      n: 24,
      floor: 'lino',
      rows: [
        '################',
        '#o.AAAe.AAAA.+.#',
        '#..+......B..~.#',
        '#~.AAAA.aaAA.o.#',
        '#..b.......*.o.#',
        '#+..j...@....~.#',
        '#..AAAA.AAaA.S.#',
        '#o....+....b.o.#',
        '#*.123........E#',
        '#X############L#',
      ],
      legend: {
        A: 'aisle',
        a: 'aisle2',
        e: 'elf',
        j: 'joker',
        '1': 'wrap0',
        '2': 'wrap1',
        '3': 'wrap2',
        B: { tile: '.', mon: 'bubbig' },
        b: { tile: '.', mon: 'bubsmall' },
        S: { tile: '.', mon: 'shh' },
      },
      note: 'A jokester blows bubbles through his cane. Pop them if you like. Nobody here will judge you. Except the elf.',
      twist: {
        grid: [
          ['aisle', 'elf', 'aisle'],
          ['m:bubbig#0', 'joker', 'm:bubsmall#0'],
        ],
        caption: ['FIG. 24: Fred. Holly. And the third', 'one. We do not talk about the third.'],
      },
    },
    {
      n: 11,
      floor: 'office',
      rows: [
        '#####123########',
        '#ccc.......cccc#',
        '#..o..+..o....*#',
        '#.dd..C..dd..~.#',
        '#o...........m.#',
        '#~.+...P@....o.#',
        '#.dd.....dd..+.#',
        '#.+..S......o..#',
        '#*.~..bbb.....E#',
        '######X#######L#',
      ],
      legend: {
        c: 'cabinet',
        d: 'desk',
        m: 'mara',
        b: 'brick',
        '1': 'acct0',
        '2': 'acct1',
        '3': 'acct2',
        C: { tile: '.', mon: 'cloud' },
        P: { tile: '.', mon: 'peton' },
        S: { tile: '.', mon: 'shh' },
      },
      note: 'An accounts office, after the move to the cloud. The office clown is harmless. His puns are not.',
      twist: {
        grid: [
          ['cabinet', 'm:cloud#0', 'cabinet'],
          ['desk', 'm:peton#0', 'mara'],
        ],
        caption: ['FIG. 11: Peton, a former banker.', 'He lost interest. Mara did too.'],
      },
    },
  ],
};
