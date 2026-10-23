// After Hours: the quiet ones. Where the Mountain
// Speaks, The Ledger of the Woods, Silence Has Teeth and The Incomplete Idiot.
import { Pixels } from '../../../../kit/pixels';
import { bevel, blob, micro } from '../../art/draw';
import { c, r } from '../../art/pal';
import { blank, docLeo, figure, floor, on, sign, wall } from '../../art/kit';
import { joe } from '../../sprites/joe';
import type { Area } from '../area';
import type { WingSpec } from '../wing';
import { WINGS } from '../../stories';

function rock(under: Pixels, seed: number): Pixels {
  const p = on(under);
  blob(p, 10 + (seed % 3) - 1, 12, 8, 7, r('grey'), 1, 4);
  blob(p, 6, 14, 4, 3, r('grey'), 1, 3);
  return p;
}

function hut(under: Pixels): Pixels {
  const p = on(under);
  p.rect(3, 9, 14, 10, c('wood', 2)).rect(8, 13, 4, 6, c('wood', 0));
  for (let i = 0; i < 8; i++) p.rect(1 + i, 9 - i, 18 - i * 2, 1, c('sand', 2));
  return p;
}

function shack(under: Pixels): Pixels {
  const p = on(under);
  p.rect(2, 6, 16, 13, c('wood', 1)).frame(2, 6, 16, 13, c('wood', 0));
  for (let x = 4; x < 18; x += 4) p.rect(x, 7, 1, 12, c('wood', 0));
  p.rect(1, 4, 18, 3, c('wood', 0));
  return p;
}

/** The mirror at the top of the mountain, and who is looking into it. */
function mirror(under: Pixels): Pixels {
  const p = on(under);
  p.rect(3, 0, 14, 20, c('brass', 2)).rect(5, 2, 10, 16, c('sky', 4));
  const me = joe('down', 0);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const v = me.get(x, y);
      if (v !== 255 && x >= 2 && x < 18 && y < 18 && (x - 2) % 2 === 0) p.set(5 + Math.floor((x - 2) / 2) * 1.25, 2 + Math.floor(y * 0.8), v);
    }
  p.line(6, 3, 8, 6, c('paper', 4));
  return p;
}

function mistPuff(frame: number): Pixels {
  const p = blank();
  blob(p, 8 + frame, 10, 7, 4, r('grey'), 4, 5);
  blob(p, 13 - frame, 12, 5, 3, r('grey'), 4, 5);
  return p;
}

function goat(frame: number): Pixels {
  const p = blank();
  p.rect(4, 8, 11, 6, c('paper', 3)).rect(13, 4, 5, 5, c('paper', 3)).set(13, 3, c('grey', 2)).set(16, 3, c('grey', 2));
  p.set(16, 6, c('ink', 0)).rect(15, 9, 2, 2, c('paper', 2));
  p.rect(5 + frame, 14, 2, 5, c('paper', 2)).rect(12 - frame, 14, 2, 5, c('paper', 2));
  return p;
}

function pine(under: Pixels, seed: number): Pixels {
  const p = on(under);
  p.rect(9, 15, 2, 5, c('brown', 1));
  for (let i = 0; i < 4; i++) {
    const w = 3 + i * 2 + (seed % 2);
    p.rect(10 - w, 2 + i * 3, w * 2, 4, c('green', i % 2 ? 1 : 0));
  }
  return p;
}

function owl(under: Pixels): Pixels {
  const p = on(under);
  p.rect(2, 16, 16, 3, c('brown', 1));
  blob(p, 10, 10, 6, 7, r('brown'), 1, 3);
  p.set(5, 3, c('brown', 1)).set(15, 3, c('brown', 1));
  p.disc(7, 8, 2.5, c('yellow', 3)).set(7, 8, c('ink', 0));
  p.rect(11, 7, 5, 2, c('ink', 0)); // the patch over the other eye
  p.rect(9, 11, 2, 2, c('orange', 2));
  return p;
}

function lollipopGuild(under: Pixels): Pixels {
  const p = on(under);
  const hair: [string, number][] = [
    ['orange', 2],
    ['yellow', 3],
    ['brown', 2],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 2 + i * 6;
    p.rect(x, 10, 4, 4, c('skin', 3))
      .rect(x, 9, 4, 2, c(hair[i][0], hair[i][1]))
      .rect(x - 1, 14, 6, 5, c(['blue', 'green', 'red'][i], 3));
    p.disc(x + 4, 6, 2, c(['pink', 'yellow', 'teal'][i], 3)).rect(x + 4, 8, 1, 5, c('paper', 4));
  }
  return p;
}

function ledger(under: Pixels): Pixels {
  const p = on(under);
  p.rect(3, 12, 14, 6, c('brown', 2)).rect(3, 12, 14, 1, c('brown', 3));
  p.rect(2, 5, 16, 8, c('green', 1)).rect(3, 6, 6, 6, c('paper', 4)).rect(11, 6, 6, 6, c('paper', 4));
  for (let y = 7; y < 12; y += 2) p.rect(4, y, 4, 1, c('grey', 2)).rect(12, y, 4, 1, c('red', 3));
  return p;
}

function campfire(frame: number, under: Pixels): Pixels {
  const p = on(under);
  p.line(4, 17, 16, 13, c('brown', 1)).line(4, 13, 16, 17, c('brown', 1));
  blob(p, 10, 11 - frame, 4, 6 + frame, r('orange'), 1, 3);
  blob(p, 10, 13, 2, 3, r('yellow'), 1, 3);
  return p;
}

function hoot(frame: number): Pixels {
  const p = blank();
  micro(p, 1, 7 + frame, 'WHOM', c('yellow', 3 - frame));
  return p;
}

function cot(under: Pixels): Pixels {
  const p = on(under);
  p.rect(1, 7, 18, 8, c('grey', 2)).rect(1, 7, 6, 4, c('paper', 4)).rect(1, 15, 2, 4, c('ink', 1)).rect(17, 15, 2, 4, c('ink', 1));
  return p;
}

function barredWindow(): Pixels {
  const p = wall('stone', 'grey', 3);
  p.rect(4, 3, 12, 11, c('night', 0));
  p.disc(12, 6, 2.5, c('paper', 4));
  for (let x = 5; x < 16; x += 3) p.rect(x, 3, 1, 11, c('grey', 2));
  return p;
}

function cellDoor(): Pixels {
  const p = wall('stone', 'grey', 5);
  bevel(p, 3, 2, 14, 18, r('grey'), 1, 1);
  p.rect(7, 5, 6, 4, c('ink', 0));
  for (let x = 8; x < 13; x += 2) p.rect(x, 5, 1, 4, c('grey', 3));
  return p;
}

function echo(frame: number): Pixels {
  const p = blank();
  blob(p, 10, 9, 9, 6, r('grey'), 3 - frame, 4);
  micro(p, 3, 7, frame ? 'SHUT' : 'UP!', c('ink', 0));
  return p;
}

function newspaperChair(under: Pixels): Pixels {
  const p = on(under);
  bevel(p, 1, 6, 18, 13, r('brown'), 2, 2);
  p.rect(4, 2, 12, 13, c('paper', 4)).rect(10, 2, 1, 13, c('grey', 3));
  micro(p, 5, 3, 'NEWS', c('ink', 0));
  for (let y = 9; y < 14; y += 2) p.rect(5, y, 4, 1, c('grey', 2)).rect(12, y, 3, 1, c('grey', 2));
  p.rect(3, 6, 2, 3, c('skin', 2)).rect(15, 6, 2, 3, c('skin', 2));
  return p;
}

function papers(under: Pixels): Pixels {
  const p = on(under);
  for (let i = 0; i < 6; i++) p.rect(3 + (i % 2), 17 - i * 3, 14, 3, c('paper', 3 + (i % 2))).rect(3 + (i % 2), 17 - i * 3, 14, 1, c('grey', 3));
  return p;
}

function diploma(): Pixels {
  const p = wall('wallpaper', 'green', 4);
  p.rect(3, 2, 14, 11, c('brass', 2)).rect(4, 3, 12, 9, c('paper', 4));
  micro(p, 6, 4, 'PHD', c('ink', 0));
  p.disc(13, 10, 1.5, c('red', 3));
  return p;
}

function flyingPaper(frame: number): Pixels {
  const p = blank();
  if (frame) p.rect(3, 7, 14, 7, c('paper', 4)).rect(3, 7, 14, 1, c('grey', 3));
  else p.rect(6, 4, 8, 12, c('paper', 4)).rect(6, 4, 1, 12, c('grey', 3));
  return p;
}

function art(a: Area): void {
  // Where the Mountain Speaks
  a.tile('mist', floor('mist', 1));
  a.solid('rock0', rock(a.tiles.pic('mist'), 0));
  a.solid('rock1', rock(a.tiles.pic('mist'), 1));
  a.solid('hut', hut(a.tiles.pic('mist')));
  a.solid('shack', shack(a.tiles.pic('mist')));
  a.solid('mirror', mirror(a.tiles.pic('mist')));
  a.prop('villager', 'mist', figure({ shirt: ['orange', 2], pants: ['brown', 1], hair: ['ink', 1], arms: 'up' }));
  sign(['WISDOM:', '2 DAYS UP', 'NO REFUNDS'], 3, { board: 'wood', ink: 'paper' }).forEach((px, i) => a.solid(`wisdom${i}`, px));
  a.monster(
    'puff',
    [
      [mistPuff(0), 9],
      [mistPuff(1), 9],
    ],
    {
      path: [
        [4, 0, 1],
        [-4, 0, 1],
      ],
    },
  );
  a.monster(
    'goat',
    [
      [goat(0), 4],
      [goat(1), 4],
    ],
    {
      hazard: true,
      path: [
        [0, 3, 1],
        [3, 0, 1],
        [0, -3, 1],
        [-3, 0, 1],
      ],
    },
  );

  // The Ledger of the Woods
  a.tile('forest', floor('night', 3));
  a.solid('pine0', pine(a.tiles.pic('forest'), 0));
  a.solid('pine1', pine(a.tiles.pic('forest'), 1));
  a.solid('owl', owl(a.tiles.pic('forest')));
  a.solid('guild', lollipopGuild(a.tiles.pic('forest')));
  a.solid('ledger', ledger(a.tiles.pic('forest')));
  a.solid('fire0', campfire(0, a.tiles.pic('forest')), { next: 'fire1', ntime: 4 });
  a.solid('fire1', campfire(1, a.tiles.pic('forest')), { next: 'fire0', ntime: 4 });
  sign(['ONLY YOU CAN', 'BALANCE THE', 'BOOKS'], 3, { board: 'brown', ink: 'paper' }).forEach((px, i) => a.solid(`ranger${i}`, px));
  a.monster(
    'hoot',
    [
      [hoot(0), 4],
      [hoot(1), 4],
    ],
    {
      hazard: true,
      path: [
        [0, 4, 2],
        [0, -4, 2],
      ],
    },
  );
  a.patrol(
    'hoot',
    [
      [5, 0, 2],
      [-5, 0, 2],
    ],
    'hootH',
  );

  // Silence Has Teeth
  a.tile('cellfloor', floor('stone', 9));
  a.solid('cellwall', wall('stone', 'grey', 7));
  a.solid('cot', cot(a.tiles.pic('cellfloor')));
  a.solid('bars', barredWindow());
  a.solid('celldoor', cellDoor());
  a.prop('warden', 'cellfloor', figure({ shirt: ['blue', 1], pants: ['ink', 1], hat: { kind: 'cap', color: ['blue', 0] }, face: 'plain' }));
  sign(['QUIET HOURS:', 'ALWAYS'], 3, { board: 'grey' }).forEach((px, i) => a.solid(`quiet${i}`, px));
  a.monster(
    'echo',
    [
      [echo(0), 6],
      [echo(1), 6],
    ],
    {
      hazard: true,
      path: [
        [5, 0, 1],
        [0, 2, 1],
        [-5, 0, 1],
        [0, -2, 1],
      ],
    },
  );

  // The Incomplete Idiot
  a.tile('den', floor('carpet', 3, 'green'));
  a.solid('denwall', wall('wallpaper', 'green', 5));
  a.solid('reader', newspaperChair(a.tiles.pic('den')));
  a.solid('papers', papers(a.tiles.pic('den')));
  a.solid('phd', diploma());
  a.prop('wife', 'den', figure({ shirt: ['teal', 3], dress: true, hair: ['grey', 4], hairStyle: 'bun', glasses: true, face: 'happy' }));
  sign(['THE DAILY', 'COMPLETE', 'IDIOT'], 3, { board: 'paper' }).forEach((px, i) => a.solid(`daily${i}`, px));
  a.monster(
    'paper',
    [
      [flyingPaper(0), 3],
      [flyingPaper(1), 3],
    ],
    {
      hazard: true,
      path: [
        [6, 0, 2],
        [-6, 0, 2],
      ],
    },
  );

  // the hallway's guest: Doc Leo, after hours, with his rubber chicken
  a.monster(
    'leoNight',
    [
      [docLeo(0), 6],
      [docLeo(1), 6],
    ],
    {
      path: [
        [5, 0, 1],
        [-5, 0, 1],
      ],
    },
  );
}

export const AFTER: WingSpec = {
  wing: WINGS[5],
  tint: 'purple',
  stamp: [
    ['red', 1],
    ['brass', 3],
    ['paper', 4],
  ],
  signs: [
    ['AFTER HOURS:', 'WHISPER', 'QUIETER'],
    ['PLEASE RETURN', 'THE SILENCE', 'BY MIDNIGHT'],
  ],
  guest: 'leoNight',
  art,
  books: [
    {
      n: 1,
      floor: 'mist',
      rows: [
        '################',
        '#o..R..sm...+..#',
        '#.r.....r...r+.#',
        '#~..r.P...R..*.#',
        '#..+....r......#',
        '#R..o...@...G.o#',
        '#..r.......r...#',
        '#*..~.v..v.+..~#',
        '#o...hh.o.hh...E',
        '#X123##########L',
      ],
      legend: {
        r: 'rock0',
        R: 'rock1',
        s: 'shack',
        m: 'mirror',
        h: 'hut',
        v: 'villager',
        '1': 'wisdom0',
        '2': 'wisdom1',
        '3': 'wisdom2',
        P: { tile: '.', mon: 'puff' },
        G: { tile: '.', mon: 'goat' },
      },
      note: "A village, a mountain shrouded in mist, a wise one at the top. Two days' climb. Mind the goat. The view from the top is very reflective.",
      twist: {
        grid: [
          ['rock0', 'shack', 'mirror', 'rock1'],
          ['m:puff#0', 'mist', 'mist', 'm:puff#1'],
        ],
        caption: ['FIG. 1: At the top, a shack with', 'only a mirror. Hello, Joe.'],
      },
    },
    {
      n: 16,
      floor: 'forest',
      rows: [
        '#PpPp123pPpPpPp#',
        '#o...........+.#',
        '#.p.O..l..p..~.#',
        '#*.....H.....o.#',
        '#..p.g.....P.~.#',
        '#+..o...@..f...#',
        '#.P.........p..#',
        '#~..+...h...*..#',
        '#o.......+...o.E',
        '##X############L',
      ],
      legend: {
        P: 'pine0',
        p: 'pine1',
        O: 'owl',
        l: 'ledger',
        g: 'guild',
        f: 'fire0',
        '1': 'ranger0',
        '2': 'ranger1',
        '3': 'ranger2',
        H: { tile: '.', mon: 'hootH' },
        h: { tile: '.', mon: 'hoot' },
      },
      note: 'A one-eyed owl with a chiseled jaw guards the forest, asking not who, but whom. Its hoots carry, and so do its fines.',
      twist: {
        grid: [
          ['pine0', 'owl', 'pine1'],
          ['guild', 'ledger', 'fire0'],
        ],
        caption: ['FIG. 16: Just a centralized', 'accounting of consumption.'],
      },
    },
    {
      n: 23,
      floor: 'cellfloor',
      rows: [
        '#wwwBww123wBwww#',
        '#o............+#',
        '#.~..........o.#',
        '#*.c....S......#',
        '#..............#',
        '#+..o...@.....~#',
        '#..............#',
        '#o..+.....*..o.#',
        '#~...........+.E',
        '#X######D######L',
      ],
      legend: {
        w: 'cellwall',
        B: 'bars',
        c: 'cot',
        D: 'celldoor',
        '1': 'quiet0',
        '2': 'quiet1',
        '3': 'quiet2',
        S: { tile: '.', mon: 'echo' },
      },
      note: 'Alone. In the dark. No one to tell to be quiet. The echoes are the noisiest thing in the universe, and they fine you for listening.',
      twist: {
        grid: [
          ['bars', 'cellwall', 'celldoor'],
          ['cot', 'cellfloor', 'warden'],
        ],
        caption: ['FIG. 23: Not escape. To make', 'peace with it. Good night.'],
      },
    },
    {
      n: 29,
      floor: 'den',
      rows: [
        '#ddDdd123ddDddd#',
        '#o..........+..#',
        '#..pp....R...~.#',
        '#*......w......#',
        '#.~............#',
        '#+..o...@....o.#',
        '#....S.....pp..#',
        '#~..+......*.o.#',
        '#o.......+.....E',
        '#####X#########L',
      ],
      legend: {
        d: 'denwall',
        D: 'phd',
        p: 'papers',
        R: 'reader',
        w: 'wife',
        '1': 'daily0',
        '2': 'daily1',
        '3': 'daily2',
        S: { tile: '.', mon: 'paper' },
      },
      note: 'A newspaper calls John an idiot. John calls the editor a complete idiot. His wife has a question about the incomplete kind. The papers fly.',
      twist: {
        grid: [
          ['phd', 'denwall', 'phd'],
          ['reader', 'm:paper#0', 'wife'],
        ],
        caption: ['FIG. 29: "As you wish."', 'They both have PhDs.'],
      },
    },
  ],
};
