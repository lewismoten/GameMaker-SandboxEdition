// The Docks: A Pirate's Worst Surprise, Except
// Those Ones, Legend at the Water's Edge and Steam-Powered Summer.
import { Pixels } from '../../../../kit/pixels';
import { bevel, blob, micro } from '../../art/draw';
import { c, r } from '../../art/pal';
import { blank, figure, figureBack, floor, gwinn, mirror, on, sign, wall } from '../../art/kit';
import type { Area } from '../area';
import type { WingSpec } from '../wing';
import { WINGS } from '../../stories';

function mast(under: Pixels): Pixels {
  const p = on(under);
  p.rect(8, 0, 4, 20, c('wood', 2)).rect(8, 0, 1, 20, c('wood', 4));
  p.rect(12, 1, 7, 6, c('blue', 2)).rect(12, 1, 7, 1, c('paper', 4));
  p.disc(15, 4, 1.5, c('brass', 4)); // the queen's crown, more or less
  p.rect(4, 12, 12, 2, c('wood', 1));
  return p;
}

function crate(under: Pixels, label: string): Pixels {
  const p = on(under);
  bevel(p, 2, 3, 16, 16, r('wood'), 3, 1);
  p.line(3, 4, 16, 17, c('wood', 1)).line(16, 4, 3, 17, c('wood', 1));
  p.rect(1, 8, 18, 7, c('paper', 4));
  micro(p, 10 - Math.round((label.length * 4 - 1) / 2), 9, label, c('ink', 0));
  return p;
}

function chest(under: Pixels, open: boolean): Pixels {
  const p = on(under);
  p.rect(2, 9, 16, 10, c('wood', 2)).frame(2, 9, 16, 10, c('brass', 2)).rect(9, 12, 2, 3, c('brass', 4));
  if (open) {
    p.rect(2, 3, 16, 6, c('wood', 1)).frame(2, 3, 16, 6, c('brass', 2));
    p.rect(4, 10, 12, 3, c('ink', 0)); // nothing in it. nothing at all.
  } else p.rect(2, 6, 16, 4, c('wood', 3)).frame(2, 6, 16, 4, c('brass', 2));
  return p;
}

function barrel(under: Pixels): Pixels {
  const p = on(under);
  blob(p, 10, 11, 7, 8, r('wood'), 1, 4);
  p.rect(3, 6, 14, 1, c('gray', 2)).rect(3, 15, 14, 1, c('gray', 2));
  return p;
}

function cannon(under: Pixels): Pixels {
  const p = on(under);
  p.rect(2, 8, 13, 6, c('ink', 1)).rect(2, 8, 13, 1, c('gray', 3)).rect(14, 7, 4, 8, c('ink', 0));
  p.disc(6, 15, 3, c('wood', 2)).disc(12, 15, 3, c('wood', 2));
  return p;
}

const pirate = (step: number, color: string, view = figure) =>
  view({ shirt: [color, 3], pants: ['brown', 1], hat: { kind: 'bandana', color: ['red', 3] }, beard: ['ink', 1], face: 'eyepatch' }, step);

function parrot(frame: number): Pixels {
  const p = blank();
  const dy = frame ? 1 : 0;
  blob(p, 10, 10 + dy, 5, 6, r('green'), 1, 5);
  p.disc(12, 5 + dy, 3, c('red', 3)).set(13, 4 + dy, c('ink', 0));
  p.rect(14, 5 + dy, 3, 2, c('yellow', 3));
  p.rect(6, 15 + dy, 3, 4, c('blue', 3));
  if (frame) micro(p, 0, 0, 'ARR', c('red', 3));
  return p;
}

function table(under: Pixels, coins: boolean): Pixels {
  const p = on(under);
  p.rect(0, 6, 20, 8, c('wood', 3)).rect(0, 13, 20, 2, c('wood', 1)).rect(2, 15, 2, 4, c('wood', 1)).rect(16, 15, 2, 4, c('wood', 1));
  if (coins) {
    for (const [x, y, rr] of [
      [5, 9, 2],
      [9, 8, 1.5],
      [12, 10, 3.5],
      [15, 8, 1.5],
      [7, 11, 1.5],
    ] as const)
      p.disc(x, y, rr, c('brass', 4)).ring(x, y, rr, c('brass', 1));
    p.rect(3, 4, 4, 4, c('brown', 2)); // the little brown bag
  }
  return p;
}

function bigCoin(frame: number): Pixels {
  const p = blank();
  const w = frame ? 4 : 7;
  for (let y = 3; y < 17; y++)
    for (let x = 10 - w; x <= 10 + w; x++) if (((x - 10) / w) ** 2 + ((y - 10) / 7) ** 2 <= 1) p.set(x, y, c('brass', x < 10 ? 4 : 2));
  if (!frame) micro(p, 7, 8, '$', c('brass', 0));
  return p;
}

/** The pirate with Johnny's dagger in his hat. (It is a big hat.) */
function stabbedHat(under: Pixels): Pixels {
  const p = on(under, pirate(0, 'red'));
  p.line(11, 0, 9, 4, c('tin', 5)).rect(10, 0, 3, 1, c('brass', 3));
  micro(p, 13, 13, '!', c('red', 3));
  return p;
}

function reeds(under: Pixels): Pixels {
  const p = on(under);
  for (let i = 0; i < 6; i++) p.line(3 + i * 3, 19, 2 + i * 3 + (i % 2), 6 + (i % 3) * 2, c('green', 2 + (i % 2)));
  p.rect(5, 4, 2, 4, c('brown', 2)).rect(14, 6, 2, 4, c('brown', 2));
  return p;
}

function bench(under: Pixels): Pixels {
  const p = on(under);
  p.rect(1, 8, 18, 3, c('wood', 3)).rect(1, 12, 18, 2, c('wood', 2)).rect(3, 14, 2, 5, c('ink', 1)).rect(15, 14, 2, 5, c('ink', 1));
  return p;
}

function flutist(): Pixels {
  const p = figure({ shirt: ['green', 2], pants: ['brown', 1], hair: ['gray', 3], beard: ['gray', 4], hat: { kind: 'cap', color: ['brown', 2] } });
  p.line(9, 8, 17, 10, c('tin', 5));
  micro(p, 14, 0, '~', c('purple', 4));
  return p;
}

function fish(frame: number): Pixels {
  const p = blank();
  blob(p, 9, 10, 6, 3.5, r('orange'), 1, 3);
  p.rect(14, 8 - frame, 3, 5 + frame * 2, c('orange', 2));
  p.set(5, 9, c('ink', 0));
  return p;
}

function note(frame: number): Pixels {
  const p = blank();
  const dy = frame ? 2 : 0;
  p.disc(7, 14 - dy, 2.5, c('purple', 3))
    .rect(9, 4 - dy, 1, 10, c('purple', 3))
    .rect(9, 4 - dy, 5, 2, c('purple', 3));
  return p;
}

function paddle(frame: number): Pixels {
  const p = floor('water', 3);
  p.disc(10, 10, 9, c('red', 2)).disc(10, 10, 3, c('paper', 4));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + (frame ? Math.PI / 4 : 0);
    p.line(10, 10, 10 + Math.cos(a) * 9, 10 + Math.sin(a) * 9, c('paper', 4));
  }
  return p;
}

function calliope(frame: number, under: Pixels): Pixels {
  const p = on(under);
  bevel(p, 1, 9, 18, 10, r('red'), 2, 1);
  for (let i = 0; i < 6; i++) p.rect(2 + i * 3, 1 + (i % 3), 2, 9 - (i % 3), c('brass', 3 + (i % 2)));
  if (frame) for (const x of [3, 9, 15]) p.disc(x, 1, 1.5, c('gray', 5));
  p.rect(4, 13, 12, 2, c('paper', 4));
  return p;
}

function framedPhoto(under: Pixels): Pixels {
  const p = on(under);
  p.rect(1, 3, 18, 14, c('brass', 2)).rect(3, 5, 14, 10, c('sky', 3));
  p.rect(3, 12, 14, 3, c('blue', 2)).rect(6, 8, 8, 4, c('paper', 4)).rect(8, 6, 2, 2, c('ink', 0));
  p.disc(13, 11, 2, c('red', 2));
  return p;
}

function steam(frame: number): Pixels {
  const p = blank();
  blob(p, 10, 10 - frame, 6, 5, r('gray'), 3, 5);
  blob(p, 6, 13 - frame, 4, 3, r('gray'), 3, 5);
  return p;
}

const couple = (k: number) =>
  k
    ? figure({ shirt: ['pink', 2], dress: true, hair: ['brown', 1], hairStyle: 'long', hat: { kind: 'beret', color: ['blue', 3] } })
    : figure({ shirt: ['paper', 4], pants: ['blue', 1], hair: ['brown', 0], tie: ['red', 3] });

function art(a: Area): void {
  // A Pirate's Worst Surprise
  a.tile('plank', floor('deck', 1));
  a.solid('sea', floor('water', 1));
  a.solid('mast', mast(a.tiles.pic('plank')));
  a.solid('sugar', crate(a.tiles.pic('plank'), 'SUGAR'));
  a.solid('spice', crate(a.tiles.pic('plank'), 'SPICE'));
  a.solid('chestShut', chest(a.tiles.pic('plank'), false));
  a.solid('chestOpen', chest(a.tiles.pic('plank'), true));
  a.solid('cannon', cannon(a.tiles.pic('plank')));
  a.solid('barrel', barrel(a.tiles.pic('plank')));
  sign(['SUGAR & SPICE', 'AND NOTHING', 'ELSE, MATEY'], 3, { board: 'wood', ink: 'paper' }).forEach((px, i) => a.solid(`spicy${i}`, px));
  a.monster(
    'parrot',
    [
      [parrot(0), 5],
      [parrot(1), 5],
    ],
    {
      faces: 'right',
      hazard: true,
      path: [
        [4, 0, 2],
        [0, 2, 2],
        [-4, 0, 2],
        [0, -2, 2],
      ],
    },
  );
  a.walker(
    'jim',
    {
      front: [
        [pirate(0, 'blue'), 6],
        [pirate(1, 'blue'), 6],
      ],
      back: [
        [pirate(0, 'blue', figureBack), 6],
        [pirate(1, 'blue', figureBack), 6],
      ],
    },
    {
      path: [
        [0, 3, 1],
        [0, -3, 1],
      ],
    },
  );

  // Except Those Ones
  a.tile('tavern', floor('boards', 4));
  a.solid('coinTable', table(a.tiles.pic('tavern'), true));
  a.solid('table', table(a.tiles.pic('tavern'), false));
  a.solid('keg', barrel(a.tiles.pic('tavern')));
  a.prop('johnny', 'tavern', figure({ shirt: ['teal', 3], pants: ['brown', 1], hair: ['brown', 1], small: true }));
  a.solid('stabbed', stabbedHat(a.tiles.pic('tavern')));
  a.solid('tavernWall', wall('panel'));
  sign(['WHATEVER YOU', 'CHOOSE...', 'NOT THAT ONE'], 3, { board: 'paper' }).forEach((px, i) => a.solid(`choose${i}`, px));
  a.monster(
    'coin',
    [
      [bigCoin(0), 4],
      [bigCoin(1), 4],
    ],
    {
      hazard: true,
      path: [
        [3, 0, 1],
        [-3, 0, 1],
      ],
    },
  );
  a.patrol(
    'coin',
    [
      [0, 3, 1],
      [0, -3, 1],
    ],
    'coinV',
  );

  // Legend at the Water's Edge
  a.tile('lawn', floor('grass', 5));
  a.solid('pond', floor('water', 7));
  a.solid('reeds', reeds(a.tiles.pic('lawn')));
  a.solid('pbench', bench(a.tiles.pic('lawn')));
  a.solid('flutist', on(a.tiles.pic('lawn'), flutist()));
  a.prop('programmer', 'lawn', figure({ shirt: ['gray', 3], pants: ['blue', 1], hair: ['brown', 1], glasses: true }), true);
  sign(['NO FISHING', 'FOR', 'COMPLIMENTS'], 3, { board: 'green', ink: 'paper' }).forEach((px, i) => a.solid(`fishing${i}`, px));
  a.monster(
    'fish',
    [
      [fish(0), 6],
      [fish(1), 6],
    ],
    {
      faces: 'left',
      path: [
        [3, 0, 1],
        [0, 1, 1],
        [-3, 0, 1],
        [0, -1, 1],
      ],
    },
  );
  a.monster(
    'note',
    [
      [note(0), 5],
      [note(1), 5],
    ],
    {
      path: [
        [0, -2, 1],
        [2, 0, 1],
        [0, 2, 1],
        [-2, 0, 1],
      ],
    },
  );

  // Steam-Powered Summer
  a.tile('qdeck', floor('deck', 7));
  a.solid('river', floor('water', 9));
  a.solid('railing', wall('rail', 'blue', 2));
  a.solid('paddle0', paddle(0), { next: 'paddle1', ntime: 4 });
  a.solid('paddle1', paddle(1), { next: 'paddle0', ntime: 4 });
  a.solid('calliope0', calliope(0, a.tiles.pic('qdeck')), { next: 'calliope1', ntime: 5 });
  a.solid('calliope1', calliope(1, a.tiles.pic('qdeck')), { next: 'calliope0', ntime: 5 });
  a.prop('him', 'qdeck', couple(0));
  a.prop('her', 'qdeck', couple(1));
  a.solid('photo', framedPhoto(a.tiles.pic('qdeck')));
  sign(['CALLIOPE', 'LESSONS TODAY', 'CERTIFICATES!'], 3, { board: 'red', ink: 'paper' }).forEach((px, i) => a.solid(`lesson${i}`, px));
  a.monster(
    'steam',
    [
      [steam(0), 5],
      [steam(1), 5],
    ],
    {
      hazard: true,
      path: [
        [0, -3, 1],
        [0, 3, 1],
      ],
    },
  );

  // the hallway's guest: Gwinn, who is not allowed in the library, with a fish
  const fishy = (s: number) => {
    const p = mirror(gwinn(s));
    p.rect(0, 7, 4, 2, c('orange', 3));
    return p;
  };
  a.monster(
    'gwinnFish',
    [
      [fishy(0), 3],
      [fishy(1), 3],
    ],
    {
      faces: 'left',
      path: [
        [6, 0, 3],
        [-6, 0, 3],
      ],
    },
  );
}

export const DOCKS: WingSpec = {
  wing: WINGS[2],
  tint: 'blue',
  stamp: [
    ['sand', 3],
    ['blue', 3],
    ['pink', 2],
  ],
  signs: [
    ['ALL HANDS', 'ON DECK', '(QUIETLY)'],
    ['NO PARROTING', 'THE BOOKS', ''],
  ],
  guest: 'gwinnFish',
  art,
  books: [
    {
      n: 6,
      floor: 'plank',
      rows: [
        '################',
        '#ssssssssssssss#',
        '#o.uU..m..b.+.~#',
        '#~....P......o.#',
        '#*.c.......uU..#',
        '#+..o...@...J..#',
        '#..h.+..m...~..#',
        '#o.+....c..*.o.#',
        '#ssssssssssssEs#',
        '###123#X#####L##',
      ],
      legend: {
        s: 'sea',
        m: 'mast',
        u: 'sugar',
        U: 'spice',
        h: 'chestShut',
        c: 'cannon',
        b: 'barrel',
        '1': 'spicy0',
        '2': 'spicy1',
        '3': 'spicy2',
        P: { tile: '.', mon: 'parrot' },
        J: { tile: '.', mon: 'jim' },
      },
      note: "The ship flying the queen's flag. Mind the parrot; it repeats everything you say, and charges for it.",
      twist: {
        grid: [
          ['sugar', 'mast', 'spice'],
          ['m:jim#0', 'chestOpen', 'barrel'],
        ],
        caption: ['FIG. 6: A large chest, no booty.', "Tis only fer the capn's squire."],
      },
    },
    {
      n: 8,
      floor: 'tavern',
      rows: [
        '#ww123wwwwwwwww#',
        '#o...b.......+.#',
        '#.tt.....k...o.#',
        '#~...C...k..*..#',
        '#..CC.....j.s..#',
        '#+......@....+.#',
        '#.tt....D...tt.#',
        '#o..~....o...~.#',
        '#*....+...o..E.#',
        '#######X#####L##',
      ],
      legend: {
        w: 'tavernWall',
        t: 'table',
        C: 'coinTable',
        k: 'keg',
        b: 'keg',
        j: 'johnny',
        s: 'stabbed',
        '1': 'choose0',
        '2': 'choose1',
        '3': 'choose2',
        D: { tile: '.', mon: 'coin' },
      },
      note: 'A bag of coins, and a man who says take whichever you like. Except that one. The big shiny coins roll around; they take points, not change.',
      twist: {
        grid: [
          ['coinTable', 'coinTable', null],
          ['johnny', 'm:coin#0', 'stabbed'],
        ],
        caption: ['FIG. 8: "I will take them all."', 'Whatever you choose, Johnny.'],
      },
    },
    {
      n: 7,
      floor: 'lawn',
      rows: [
        '#####123########',
        '#o..+....r....*#',
        '#..rpppppppr...#',
        '#~.pppFppppp.o.#',
        '#..ppppppNpp...#',
        '#+.r....@..r.+.#',
        '#....b.f......~#',
        '#*.o....S..g.o.#',
        '#~..o.......+..E',
        '############X##L',
      ],
      legend: {
        p: 'pond',
        r: 'reeds',
        b: 'pbench',
        f: 'flutist',
        g: 'programmer',
        '1': 'fishing0',
        '2': 'fishing1',
        '3': 'fishing2',
        F: { tile: 'pond', mon: 'fish' },
        N: { tile: 'pond', mon: 'note' },
        S: { tile: '.', mon: 'shh' },
      },
      note: 'A quiet walk around a pond on a lunch break. Big fish, a flute, forty minutes. Take your time. Not too much.',
      twist: {
        grid: [
          ['reeds', 'm:note#0', 'pond', 'pond'],
          ['flutist', 'pbench', 'm:fish#0', 'pond'],
        ],
        caption: ['FIG. 7: A silly story without', 'an end. Then, back to work.'],
      },
    },
    {
      n: 30,
      floor: 'qdeck',
      rows: [
        '#vvvvvqvvvvvqvv#',
        '#RRRRRRRRRRRRRR#',
        '#o...h.H.....+.#',
        '#*............~#',
        '#..c..S...+..~.#',
        '#+..o...@...f..#',
        '#~.....o.......#',
        '#..+.Q.....*.o.#',
        '#o...123.......E',
        '#RRRRRRRRRRRXRRL',
      ],
      legend: {
        v: 'river',
        R: 'railing',
        c: 'calliope0',
        q: 'paddle0',
        h: 'him',
        H: 'her',
        f: 'photo',
        '1': 'lesson0',
        '2': 'lesson1',
        '3': 'lesson2',
        S: { tile: '.', mon: 'steam' },
        Q: { tile: '.', mon: 'steam' },
      },
      note: 'The Delta Queen on the Mississippi, a calliope, a certificate. The steam is harmless. To robots. It fines you anyway.',
      twist: {
        grid: [
          ['river', 'paddle0', 'river'],
          ['calliope0', 'photo', 'her'],
        ],
        caption: ['FIG. 30: She still cherished it.', 'Framed, on her wall, for decades.'],
      },
    },
  ],
};
