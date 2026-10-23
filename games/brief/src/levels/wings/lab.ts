// The Laboratory: Great Minds, Strange Priorities;
// Duplicate Daughters, Divided Dad; Becoming Purple; and Church of the First of Zero.
import { Pixels } from '../../../../kit/pixels';
import { bevel, blob, micro } from '../../art/draw';
import { c, r } from '../../art/pal';
import { blank, corgi, figure, floor, on, sign, wall } from '../../art/kit';
import type { Area } from '../area';
import type { WingSpec } from '../wing';
import { WINGS } from '../../stories';

const professor = (step = 0, arms: 'down' | 'up' = 'down') =>
  figure({ shirt: ['paper', 4], pants: ['grey', 2], hair: ['grey', 4], hairStyle: 'wild', glasses: true, arms }, step);

function pipes(seed: number): Pixels {
  const p = new Pixels(20, 20, c('grey', 1));
  p.rect(0, 5, 20, 4, c('tin', 3)).rect(0, 5, 20, 1, c('tin', 5));
  p.rect(seed % 2 ? 4 : 12, 0, 4, 20, c('brass', 2)).rect(seed % 2 ? 4 : 12, 0, 1, 20, c('brass', 4));
  p.disc(seed % 2 ? 6 : 14, 7, 3, c('red', 3)).set(seed % 2 ? 6 : 14, 7, c('ink', 0));
  p.rect(0, 14, 20, 3, c('tin', 2));
  micro(p, 1, 0, seed % 2 ? 'PSI' : 'H2O', c('yellow', 3));
  return p;
}

function wires(): Pixels {
  const p = new Pixels(20, 20, c('grey', 1));
  const cols = ['red', 'blue', 'yellow', 'green'];
  for (let i = 0; i < 4; i++) for (let x = 0; x < 20; x++) p.set(x, Math.round(10 + Math.sin(x * 0.5 + i * 1.7) * (3 + i)), c(cols[i], 3));
  p.rect(6, 6, 8, 8, c('grey', 2)).frame(6, 6, 8, 8, c('ink', 0));
  micro(p, 7, 8, '?!', c('yellow', 3));
  return p;
}

function ductTape(under: Pixels): Pixels {
  const p = on(under);
  blob(p, 10, 10, 8, 8, r('grey'), 2, 4);
  p.disc(10, 10, 3.5, c('wood', 3));
  p.rect(14, 12, 6, 4, c('grey', 3));
  return p;
}

/** The VCR, blinking 12:00 forever. */
function vcr(lit: boolean): Pixels {
  const p = floor('tile', 3, 'teal');
  bevel(p, 1, 6, 18, 9, r('ink'), 1, 1);
  p.rect(3, 8, 7, 2, c('ink', 0));
  p.rect(11, 8, 7, 5, c('ink', 0));
  if (lit) micro(p, 11, 8, '12', c('green', 5));
  p.rect(3, 12, 2, 1, c('red', 3));
  return p;
}

function crowd(seed: number): Pixels {
  const p = new Pixels(20, 20, c('grey', 1));
  const shirts = ['blue', 'red', 'green', 'brown', 'purple'];
  for (let i = 0; i < 3; i++) {
    const x = 1 + i * 6;
    p.rect(x, 4 + (i % 2), 5, 5, c('skin', 1 + ((i + seed) % 3))).rect(x, 3 + (i % 2), 5, 2, c('brown', (i + seed) % 3));
    p.rect(x - 1, 10, 7, 10, c(shirts[(i + seed) % 5], 2));
  }
  return p;
}

function cloner(part: number): Pixels {
  const big = new Pixels(40, 40, c('tin', 1));
  bevel(big, 0, 0, 40, 40, r('tin'), 3, 2);
  big.rect(6, 8, 14, 30, c('ink', 0)).rect(8, 10, 10, 26, c('teal', 1));
  big.rect(9, 11, 3, 24, c('teal', 3));
  for (let i = 0; i < 4; i++) big.disc(28, 10 + i * 7, 2.5, c(['red', 'green', 'yellow', 'blue'][i], 3));
  micro(big, 23, 34, 'X2', c('ink', 0));
  return big.crop((part % 2) * 20, Math.floor(part / 2) * 20, 20, 20);
}

/** The professor, after the cloning machine ran in reverse: half the man he used to be. */
function halfProfessor(): Pixels {
  const p = professor(0, 'up');
  for (let y = 0; y < 20; y++) for (let x = 10; x < 20; x++) p.set(x, y, 255);
  p.rect(10, 9, 1, 11, c('ink', 0));
  return p;
}

const sally = (step: number) =>
  figure({ shirt: ['pink', 2], dress: true, hair: ['yellow', 3], hairStyle: 'pigtails', skin: 'tin', face: 'happy', small: true }, step);

function peapod(under: Pixels): Pixels {
  const p = on(under);
  p.rect(6, 12, 8, 7, c('red', 1)).rect(6, 12, 8, 1, c('red', 3));
  p.line(10, 12, 10, 3, c('green', 2));
  blob(p, 7, 6, 5, 2.5, r('green'), 1, 4);
  for (const x of [4, 7, 10]) p.disc(x, 6, 1.2, c('green', 5));
  return p;
}

function bench(under: Pixels, ooze = false): Pixels {
  const p = on(under);
  p.rect(0, 8, 20, 4, c('grey', 4)).rect(0, 12, 20, 1, c('grey', 1)).rect(2, 13, 2, 6, c('grey', 2)).rect(16, 13, 2, 6, c('grey', 2));
  p.rect(4, 3, 3, 6, c('sky', 4)).rect(4, 3, 3, 1, c('paper', 4));
  p.rect(10, 5, 5, 4, ooze ? c('purple', 3) : c('green', 3)).rect(11, 2, 3, 3, c('sky', 4));
  return p;
}

function oozeFloor(): Pixels {
  const p = floor('tile', 5, 'purple');
  blob(p, 10, 11, 7, 4, r('purple'), 1, 3);
  p.set(7, 9, c('purple', 4));
  return p;
}

/** The ooze, wearing one of its three silly cartoon masks. */
function ooze(mask: number): Pixels {
  const p = blank();
  blob(p, 10, 12, 8, 7, r('purple'), 0, 4);
  p.rect(2, 17, 16, 2, c('purple', 1));
  const face = [
    () => p.disc(10, 10, 4, c('yellow', 3)).set(8, 9, c('ink', 0)).set(12, 9, c('ink', 0)).rect(8, 12, 5, 1, c('ink', 0)),
    () => p.disc(10, 10, 4, c('paper', 4)).disc(6, 6, 2, c('ink', 0)).disc(14, 6, 2, c('ink', 0)).set(10, 11, c('red', 3)),
    () => p.disc(10, 10, 4, c('orange', 3)).rect(7, 8, 6, 1, c('ink', 0)).rect(9, 12, 3, 1, c('red', 2)).set(5, 7, c('orange', 3)).set(15, 7, c('orange', 3)),
  ];
  face[mask % 3]();
  return p;
}

function masks(): Pixels {
  const p = wall('panel');
  p.disc(4, 9, 3, c('yellow', 3)).disc(10, 9, 3, c('paper', 4)).disc(16, 9, 3, c('orange', 3));
  for (const x of [3, 5, 9, 11, 15, 17]) p.set(x, 8, c('ink', 0));
  return p;
}

function stainedGlass(bits: string): Pixels {
  const p = new Pixels(20, 20, c('grey', 2));
  p.rect(3, 2, 14, 18, c('ink', 0));
  p.disc(10, 5, 7, c('ink', 0));
  const cols = ['blue', 'red', 'yellow', 'green', 'purple'];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) p.rect(4 + x * 4, 5 + y * 4, 3, 3, c(cols[(x + y * 2 + bits.length) % 5], 3));
  micro(p, 6, 8, bits, c('paper', 4));
  return p;
}

function pew(under: Pixels): Pixels {
  const p = on(under);
  p.rect(0, 6, 20, 4, c('wood', 2)).rect(0, 10, 20, 6, c('wood', 3)).rect(0, 16, 2, 3, c('wood', 1)).rect(18, 16, 2, 3, c('wood', 1));
  micro(p, 7, 11, '()', c('brass', 3));
  return p;
}

function altar(part: number): Pixels {
  const big = new Pixels(40, 20, c('grey', 1));
  bevel(big, 0, 4, 40, 16, r('paper'), 3, 1);
  micro(big, 4, 10, 'COMPILER', c('ink', 0));
  big.rect(18, 0, 4, 5, c('brass', 3));
  return big.crop(part * 20, 0, 20, 20);
}

function candle(lit: number, under: Pixels): Pixels {
  const p = on(under);
  p.rect(8, 8, 4, 10, c('paper', 4)).rect(6, 17, 8, 2, c('brass', 2));
  blob(p, 10, 5 - lit, 2, 3 + lit, r('orange'), 1, 3);
  micro(p, 9, 10, lit ? '1' : '0', c('ink', 1));
  return p;
}

function exception(frame: number): Pixels {
  const p = blank();
  blob(p, 10, 10, 6, 6, r('red'), 1, 5);
  p.rect(9, 5 + frame, 2, 6, c('paper', 4)).rect(9, 13 + frame, 2, 2, c('paper', 4));
  return p;
}

const reporter = (step: number) => figure({ shirt: ['brown', 2], pants: ['ink', 1], hat: { kind: 'fedora', color: ['brown', 1] }, arms: 'out' }, step);

function art(a: Area): void {
  // Great Minds, Strange Priorities
  a.tile('labtile', floor('tile', 1, 'teal'));
  a.solid('pipes0', pipes(0));
  a.solid('pipes1', pipes(1));
  a.solid('wires', wires());
  a.solid('tape', ductTape(a.tiles.pic('labtile')));
  a.solid('vcrOn', vcr(true), { next: 'vcrOff', ntime: 9 });
  a.solid('vcrOff', vcr(false), { next: 'vcrOn', ntime: 9 });
  a.solid('crowd1', crowd(1));
  a.solid('crowd2', crowd(2));
  const tools = blank();
  tools.line(3, 15, 12, 6, c('grey', 4)).line(3, 16, 12, 7, c('grey', 2)).rect(11, 4, 4, 4, c('grey', 3));
  tools.line(8, 17, 17, 14, c('red', 3)).rect(14, 12, 4, 3, c('grey', 4));
  a.prop('tools', 'labtile', tools, false);
  sign(['EUREKA!', 'PLEASE STAND', 'BACK'], 3, { board: 'yellow' }).forEach((px, i) => a.solid(`eureka${i}`, px));
  a.monster(
    'inventor',
    [
      [professor(0, 'up'), 6],
      [professor(1, 'up'), 6],
    ],
    {
      path: [
        [0, 3, 1],
        [0, -3, 1],
      ],
    },
  );
  a.monster(
    'reporter',
    [
      [reporter(0), 4],
      [reporter(1), 4],
    ],
    {
      hazard: true,
      path: [
        [5, 0, 1],
        [-5, 0, 1],
      ],
    },
  );

  // Duplicate Daughters, Divided Dad
  a.tile('pinktile', floor('tile', 2, 'pink'));
  for (let i = 0; i < 4; i++) a.solid(`clone${i}`, cloner(i));
  a.prop('halfprof', 'pinktile', halfProfessor());
  a.solid('peapod', peapod(a.tiles.pic('pinktile')));
  sign(['CLONING:', 'ONE AT A TIME', 'PLEASE'], 3, { board: 'teal', ink: 'paper' }).forEach((px, i) => a.solid(`clone${i}s`, px));
  a.monster(
    'sally',
    [
      [sally(0), 5],
      [sally(1), 5],
    ],
    {
      path: [
        [3, 0, 1],
        [0, 2, 1],
        [-3, 0, 1],
        [0, -2, 1],
      ],
    },
  );
  a.patrol(
    'sally',
    [
      [0, 3, 1],
      [3, 0, 1],
      [0, -3, 1],
      [-3, 0, 1],
    ],
    'sally2',
  );

  // Becoming Purple
  a.tile('vtile', floor('tile', 4, 'purple'));
  a.tile('puddle', oozeFloor());
  a.solid('bench', bench(a.tiles.pic('vtile')));
  a.solid('benchOoze', bench(a.tiles.pic('vtile'), true));
  a.solid('masks', masks());
  sign(['NANITES:', 'DO NOT INJECT', 'ANYONE'], 3, { board: 'purple', ink: 'paper' }).forEach((px, i) => a.solid(`nano${i}`, px));
  a.monster(
    'ooze',
    [
      [ooze(0), 10],
      [ooze(1), 10],
      [ooze(2), 10],
    ],
    {
      hazard: true,
      path: [
        [0, 2, 1],
        [4, 0, 1],
        [0, -2, 1],
        [-4, 0, 1],
      ],
    },
  );
  a.monster('doctor', [[figure({ shirt: ['paper', 4], pants: ['ink', 1], hair: ['brown', 1], glasses: true, skin: 'purple' }), 8]]);

  // Church of the First of Zero
  a.tile('nave', floor('stone', 6));
  for (const bits of ['0', '1', '01', '10']) a.solid(`glass${bits}`, stainedGlass(bits));
  a.solid('pew', pew(a.tiles.pic('nave')));
  a.solid('altar0', altar(0));
  a.solid('altar1', altar(1));
  a.solid('candle0', candle(0, a.tiles.pic('nave')), { next: 'candle1', ntime: 6 });
  a.solid('candle1', candle(1, a.tiles.pic('nave')), { next: 'candle0', ntime: 7 });
  sign(['ALL CLASSES', 'WELCOME', 'NO EXCEPTIONS*'], 3, { board: 'grey' }).forEach((px, i) => a.solid(`zero${i}`, px));
  a.monster(
    'thrown',
    [
      [exception(0), 3],
      [exception(1), 3],
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
    'thrown',
    [
      [6, 0, 1],
      [-6, 0, 1],
    ],
    'thrownH',
  );

  // the hallway's guest: Teddy in safety goggles
  const goggled = (s: number) => {
    const p = corgi(s);
    p.rect(14, 7, 4, 2, c('teal', 4));
    return p;
  };
  a.monster(
    'teddyLab',
    [
      [goggled(0), 4],
      [goggled(1), 4],
    ],
    {
      path: [
        [5, 0, 2],
        [-5, 0, 2],
      ],
    },
  );
}

export const LAB: WingSpec = {
  wing: WINGS[1],
  tint: 'teal',
  stamp: [
    ['grey', 1],
    ['green', 4],
    ['red', 3],
  ],
  signs: [
    ['DO NOT FEED', 'THE OOZE', ''],
    ['MAD SCIENCE', 'IS A PHASE', '(HOPEFULLY)'],
  ],
  guest: 'teddyLab',
  art,
  books: [
    {
      n: 3,
      floor: 'labtile',
      rows: [
        '################',
        '#11221PwPwP.o.+#',
        '#.........r..~.#',
        '#*.ccDd....T...#',
        '#..CcCc.......o#',
        '#~......@......#',
        '#+.vV..I.....*.#',
        '#....o......o..#',
        '#+.~..o.+E..xyz#',
        '#######X#L######',
      ],
      legend: {
        P: 'pipes0',
        p: 'pipes1',
        w: 'wires',
        T: 'tape',
        v: 'vcrOn',
        V: 'vcrOff',
        c: 'crowd1',
        C: 'crowd2',
        D: 'pipes1',
        d: 'wires',
        r: 'tools',
        '1': 'crowd1',
        '2': 'crowd2',
        x: 'eureka0',
        y: 'eureka1',
        z: 'eureka2',
        I: { tile: '.', mon: 'inventor' },
      },
      note: 'An all-night inventor, a crowd, some reporters. The reporters want a quote, and charge you for it.',
      twist: {
        grid: [
          ['pipes0', 'wires', 'pipes1'],
          ['tape', 'vcrOn', 'm:inventor#0'],
        ],
        caption: ['FIG. 3: It programs the clock', 'on a VCR. It blinks 12:00.'],
      },
    },
    {
      n: 5,
      floor: 'pinktile',
      rows: [
        '################',
        '#o..123......*.#',
        '#.........gG...#',
        '#.+..S....hH.~.#',
        '#q..........o..#',
        '#~..+...@.....o#',
        '#q.......t.....#',
        '#*..o.......+..#',
        '#q..o....s.E.+~#',
        '########X##L####',
      ],
      legend: {
        g: 'clone0',
        G: 'clone1',
        h: 'clone2',
        H: 'clone3',
        t: 'halfprof',
        q: 'peapod',
        '1': 'clone0s',
        '2': 'clone1s',
        '3': 'clone2s',
        S: { tile: '.', mon: 'sally' },
        s: { tile: '.', mon: 'sally2' },
      },
      note: 'The cloning machine works. That is the problem. The two Sallys are harmless. The professor is mostly harmless, and only half there.',
      twist: {
        grid: [
          ['clone0', 'clone1', null],
          ['clone2', 'clone3', 'halfprof'],
          ['m:sally#0', 'peapod', 'm:sally#1'],
        ],
        caption: ['FIG. 5: Peas in a pod. The', 'professor, only half the man.'],
      },
    },
    {
      n: 10,
      floor: 'vtile',
      rows: [
        '#####M#123#M####',
        '#o.bb.....BB.+.#',
        '#....u.......o.#',
        '#~..O...uu...*.#',
        '#.........u....#',
        '#+..u...@....b.#',
        '#.b...u....D..~#',
        '#o..+......o...#',
        '#*..~...o..E.+.#',
        '#X#########L####',
      ],
      legend: {
        b: 'bench',
        B: 'benchOoze',
        u: 'puddle',
        M: 'masks',
        '1': 'nano0',
        '2': 'nano1',
        '3': 'nano2',
        O: { tile: '.', mon: 'ooze' },
        D: { tile: '.', mon: 'doctor' },
      },
      note: 'A purple ooze in three silly cartoon masks. Do not let it absorb you. It fines on contact.',
      twist: {
        grid: [
          ['benchOoze', 'masks', 'bench'],
          ['m:ooze#0', 'puddle', 'm:doctor#0'],
        ],
        caption: ['FIG. 10: As she absorbed him,', 'he turned purple too.'],
      },
    },
    {
      n: 12,
      floor: 'nave',
      rows: [
        '##0#1#a#b#0#1###',
        '#*....cQqd....+#',
        '#...k...+...k..#',
        '#.PP..T..PP....#',
        '#~......t....~.#',
        '#.PP...o@PP..o.#',
        '#+...........+.#',
        '#.PP.....PP..o.#',
        '#~..o.E.*....o.#',
        '##xyz#L####X####',
      ],
      legend: {
        '0': 'glass0',
        '1': 'glass1',
        a: 'glass01',
        b: 'glass10',
        P: 'pew',
        Q: 'altar0',
        q: 'altar1',
        c: 'candle0',
        d: 'candle1',
        k: 'candle1',
        x: 'zero0',
        y: 'zero1',
        z: 'zero2',
        T: { tile: '.', mon: 'thrownH' },
        t: { tile: '.', mon: 'thrown' },
      },
      note: 'All classes welcome. Some exceptions are thrown at those who call. Duck.',
      twist: {
        grid: [
          ['glass0', 'glass01', 'glass10', 'glass1'],
          ['candle1', 'altar0', 'altar1', 'candle0'],
        ],
        caption: ['FIG. 12: Execution is our purpose.', 'In the end, you will be refactored.'],
      },
    },
  ],
};
