// The virus's creatures, drawn once and colored per stage: each is a pair of animation
// frames from ASCII art (left halves, mirrored) with these keys:
//   o outline   1-5 main color (dark to light)   a b c accent (dark, mid, light)
//   w white     k dark grey   r red   y yellow   s S h steel (dark, mid, light)
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, blob } from '../art/draw';
import { sym } from '../characters/enemies';
import type { Pal } from '../art/pal';

export interface Scheme {
  main: string;
  accent: string;
}

export function keyOf(p: Pal, s: Scheme): Record<string, number> {
  const m = p.r(s.main);
  const a = p.r(s.accent);
  const at = (r: number[], k: number) => r[Math.max(0, Math.min(r.length - 1, k))];
  return {
    o: p.c('ink', 0),
    '1': at(m, 0),
    '2': at(m, 1),
    '3': at(m, 2),
    '4': at(m, 3),
    '5': at(m, 4),
    a: at(a, 1),
    b: at(a, Math.floor(a.length / 2)),
    c: at(a, a.length - 1),
    w: p.c('grey', 7),
    k: p.c('grey', 2),
    r: p.c('red', 2),
    y: p.c('gold', 4),
    s: p.c('steel', 2),
    S: p.c('steel', 4),
    h: p.c('steel', 6),
  };
}

type Pair = [Pixels, Pixels];
const two = (k: Record<string, number>, a: string[], b: string[]): Pair => [sym(a, k), sym(b, k)];

/** Bit Mite: a little spider. */
export const mite = (k: Record<string, number>): Pair =>
  two(
    k,
    [
      '..........',
      '...1......',
      '....1.....',
      '.....1.ooo',
      '......o33c',
      '111..o3444',
      '...1o333c4',
      '...1o33333',
      '111..o3333',
      '......o333',
      '.....1.ooo',
      '....1.....',
      '...1......',
    ],
    [
      '..........',
      '..........',
      '..1.......',
      '...11.1ooo',
      '......o33c',
      '.111.o3444',
      '....o333c4',
      '....o33333',
      '.111.o3333',
      '......o333',
      '...11.1ooo',
      '..1.......',
      '..........',
    ],
  );

/** Brain Shard: a jagged splinter of GLITCH's brain with one glowing eye. */
export const shard = (k: Record<string, number>): Pair =>
  two(
    k,
    [
      '......o...',
      '.....o4o..',
      '....o424o.',
      '...o42224o',
      '..o4222cc4',
      '.o422cccww',
      'o4222cccww',
      '.o4222cc22',
      '..o422222o',
      '...o4224o.',
      '....o42o..',
      '.....oo...',
    ],
    [
      '.....o....',
      '....o4o...',
      '...o424o..',
      '..o42224oo',
      '.o4222cc44',
      'o422ccc22w',
      '.o222ccc22',
      '..o4222c22',
      '...o42222o',
      '....o424o.',
      '.....o4o..',
      '......o...',
    ],
  );

/** Opcode: a tiny instruction chip with pins and glowing hex digits that flicker. */
export const opcode = (k: Record<string, number>): Pair =>
  two(
    k,
    [
      '.....o.o.o',
      '.....s.s.s',
      '..oooooooo',
      'ss12222222',
      '.o2cc2c2cc',
      'ss2c22c2c2',
      '.o2cc2cc2c',
      'ss2c22c22c',
      '.o12222222',
      '..oooooooo',
      '.....s.s.s',
      '.....o.o.o',
    ],
    [
      '.....o.o.o',
      '.....S.S.S',
      '..oooooooo',
      'SS12222222',
      '.o22c2cc22',
      'SS2c2c22c2',
      '.o22c2cc2c',
      'SS2c2c2c22',
      '.o12222222',
      '..oooooooo',
      '.....S.S.S',
      '.....o.o.o',
    ],
  );

/** Clock Spike: a jagged bolt off the CPU's clock that dives like a wasp. */
export const spike = (k: Record<string, number>): Pair =>
  two(
    k,
    [
      '.........o',
      '........oc',
      '.......oc4',
      '......oc44',
      '.....oc434',
      '....oc4334',
      '...ow43332',
      '....o4333y',
      '.....o433y',
      '......o43y',
      '.......o4y',
      '........oy',
      '.........o',
    ],
    [
      '.........o',
      '........ow',
      '.......ow4',
      '......oc44',
      '.....oc434',
      '....oc4334',
      '...oc43332',
      '....o433yy',
      '.....o43yy',
      '......o4yy',
      '.......oyy',
      '........oy',
      '.........o',
    ],
  );

/** Byte Biter: a chomping ball. */
export const biter = (k: Record<string, number>): Pair => {
  const top = ['......oooo', '....oo4444', '...o444444', '..o4442444', '..o442cc44', '.o442coc42', '.o42222242', '.o22222222'];
  const bottom = ['.o22222222', '..o2222222', '..oo222222'];
  return two(k, [...top, '.owwwowwwo', '.orrrrrrrr', '.orrrrrrrr', '.owwwowwwo', ...bottom], [...top, '.owowowowo', '.orrrrrrrr', '.owowowowo', ...bottom]);
};

/** Glitch Moth: flapping wings. */
export const moth = (k: Record<string, number>): Pair =>
  two(
    k,
    ['.......oo.', 'oooo...oa.', 'o444oo.oa.', 'o42224ooaa', 'o42y224oaa', '.o42224oaa', '..o444oaaa', '..o422oaaa', '.o42224oaa', '.o42y44oa.', '..ooooo.o.'],
    ['.......oo.', '.......oa.', '..oooo.oa.', '.o4444ooaa', 'o422y44oaa', 'o4222224aa', '.o44444aaa', '..o422oaaa', '..o4224oaa', '...ooooa..', '.......o..'],
  );

/** Logic Bomb body (the middle of a heavy). */
export const bomb = (k: Record<string, number>): Pair => {
  const body = [
    '.ooooooooo',
    'osSSSSSSSS',
    'os22222222',
    'os24444444',
    'os24rrr444',
    'os24ryyr44',
    'os24rrr444',
    'os24444444',
    'os22222222',
    'osSSSSSSSS',
    'osooosooos',
    '.oo.ooo.oo',
  ];
  return two(k, body, [...body.slice(0, 4), 'os24yyy444', 'os24yrry44', 'os24yyy444', ...body.slice(7)]);
};

/** A heavy's pincer (left side; mirror it for the right). */
export function claw(k: Record<string, number>, open: boolean): Pixels {
  const t = new Pixels(20, 20, CLEAR);
  const rows = open
    ? [
        '.......ooooooooo....',
        '.....ooSSSSSSSSSoo..',
        '....oSSssssssssSSSo.',
        '...oSsoooooooosssSoo',
        '..oSso.......ooosSSo',
        '.oSso..........ooSSo',
        '.oSo............oSSo',
        '.oSso..........ooSSo',
        '..oSso.......ooosSSo',
        '...oSsoooooooosssSoo',
        '....oSSssssssssSSSo.',
        '.....ooSSSSSSSSSoo..',
        '.......ooooooooo....',
      ]
    : [
        '.......ooooooooo....',
        '.....ooSSSSSSSSSoo..',
        '....oSSssssssssSSSo.',
        '...oSsoooooooosssSoo',
        '...oSSso.....ooosSSo',
        '....oSSso......ooSSo',
        '.....oSSo.......oSSo',
        '....oSSso......ooSSo',
        '...oSSso.....ooosSSo',
        '...oSsoooooooosssSoo',
        '....oSSssssssssSSSo.',
        '.....ooSSSSSSSSSoo..',
        '.......ooooooooo....',
      ];
  return t.draw(0, 4, rows, k);
}

/** Corrupt Cluster: a mine of broken bits. */
export function cluster(p: Pal, s: Scheme): Pair {
  const k = keyOf(p, s);
  const junk = (n: number) => {
    const t = new Pixels(20, 20, CLEAR);
    const r = rng(7 + n);
    blob(t, 10, 10, 7, 7, p.r(s.main), 1, 4);
    for (let i = 0; i < 9; i++) {
      const x = 3 + Math.floor(r() * 12);
      const y = 3 + Math.floor(r() * 12);
      t.rect(x, y, 3, 2, i % 2 ? k.a : k.c).rect(x, y + 2, 3, 1, k.o);
    }
    for (let i = 0; i < 4; i++) {
      const a2 = i * 1.57 + n * 0.4;
      t.rect(10 + Math.cos(a2) * 8, 10 + Math.sin(a2) * 8, 2, 2, k['5']);
    }
    return t;
  };
  return [junk(0), junk(1)];
}

/** Leak Slug: a drooling blob on eye stalks. */
export const slug = (k: Record<string, number>): Pair =>
  two(
    k,
    [
      '..o.......',
      '.oco......',
      '..o.......',
      '...o......',
      '...o..oooo',
      '....oo4444',
      '...o444444',
      '..o4442444',
      '.o44222244',
      '.o42222222',
      '.o42222222',
      'o422222222',
      'o222222222',
      'o2c2222c22',
      '.oooooooo2',
      '......c..o',
    ],
    [
      '..........',
      '.o........',
      'oco.......',
      '.o........',
      '..o...oooo',
      '...ooo4444',
      '..o4444444',
      '.o44424444',
      'o442222244',
      'o422222222',
      'o422222222',
      'o422222222',
      'o222222222',
      'o22c2222c2',
      '.ooooooooo',
      '..........',
    ],
  );

/** Parity Bat. */
export const bat = (k: Record<string, number>): Pair =>
  two(
    k,
    ['..........', 'o.........', 'oo........', 'o4o.....oo', 'o44o...o44', 'o444o.o444', 'o4444o4c4w', '.o4444444o', '..o444444o', '...o4o4o44', '....o.o.oo'],
    ['..........', '..........', '..........', '........oo', '.......o44', '......o444', 'oooooooc4w', 'o44444444o', '.o4444444o', '..oo4o4o44', '....o.o.oo'],
  );

/** Note-head: an angry eighth note. */
export const note = (k: Record<string, number>): Pixels[] => {
  const rows = (flag: boolean) => [
    '..........oo........',
    '..........o4o.......',
    '..........o44o......',
    flag ? '..........o4o44o....' : '..........o4.o4o....',
    flag ? '..........o4..o4o...' : '..........o4..o4o...',
    '..........o4...o4o..',
    '..........o4...o4o..',
    '..........o4..o44o..',
    '..........o4..oo....',
    '..........o4........',
    '.....oooooo4........',
    '...oo444444o........',
    '..o4444w44w4o.......',
    '..o44444r4444o......',
    '...o44444444o.......',
    '....oooooooo........',
  ];
  return [0, 1].map((n) => new Pixels(20, 20, CLEAR).draw(2, 2, rows(n === 0), k));
};

/** Feedback Wasp. */
export const wasp = (k: Record<string, number>): Pair => {
  const body = ['.........o', '........oy', '.......oyk', '.......oyy', '.......okk', '.......oyy', '.......okk', '.......oyy', '........ok', '.........o'];
  return two(
    k,
    ['..oo......', '.occo.....', 'occcco....', '.occcco...', '..ooocco..', ...body.slice(0, 5).map((r) => r), ...body.slice(5)],
    ['..........', '..........', 'oooo......', 'occcoo....', '.oocccco..', ...body],
  );
};

/** Watcher: a floating eyeball with tendrils. */
export const eye = (k: Record<string, number>): Pair => {
  const ball = [
    '......oooo',
    '....oowwww',
    '...owwwwww',
    '..owwwwwww',
    '..owwwcccc',
    '.owwwcccc1',
    '.owwwccc1o',
    '.owwwccc1o',
    '.owwwcccc1',
    '..owwwcccc',
    '..owwwwwww',
    '...owwwwww',
    '....oowwww',
    '......oooo',
  ];
  return two(
    k,
    [...ball, '.....o.o.o', '....o.o.o.'],
    [...ball.slice(0, 5), '.owwwccccc', '.owwwccc1o', '.owwwccc1o', '.owwwccccc', ...ball.slice(9), '......o.o.', '.....o.o.o'],
  );
};

/** Frag Disc: a spinning shard of platter. */
export function disc(p: Pal, s: Scheme): Pair {
  const k = keyOf(p, s);
  const f = (n: number) => {
    const t = new Pixels(20, 20, CLEAR);
    blob(t, 10, 10, 8, 8, p.r(s.main), 1, 4);
    for (let i = 0; i < 3; i++) {
      const a = n * 0.5 + (i * Math.PI * 2) / 3;
      for (let r = 2; r < 8; r++) t.set(10 + Math.cos(a) * r, 10 + Math.sin(a) * r, k.c);
    }
    blob(t, 10, 10, 2, 2, p.r('grey'), 0, 1);
    return t;
  };
  return [f(0), f(1)];
}

/** Glitch Skull: a pixel skull that flickers. */
export const skull = (k: Record<string, number>): Pair => {
  const s = [
    '...ooooooo',
    '..o4444444',
    '.o44444444',
    '.o44444444',
    '.o4ooo4444',
    '.o4occo444',
    '.o4ooo4444',
    '.o44444o44',
    '..o4444o44',
    '...o44oooo',
    '...o4wowow',
    '...oowowow',
    '.....ooooo',
  ];
  return two(k, s, [...s.slice(0, 4), '.o4ccc4444', '.o4coc4444', '.o4ccc4444', ...s.slice(7)]);
};

/** Crawler: a many-legged bug seen from above. */
export const crawler = (k: Record<string, number>): Pair =>
  two(
    k,
    [
      '......oo..',
      '.....occo.',
      '..o..o44o.',
      '.o.oo4444o',
      'o..o444444',
      '...o4a4a44',
      '.ooo444444',
      'o..o4a4a44',
      '...o444444',
      '.ooo4a4a44',
      'o..o444444',
      '....o4444o',
      '.....oooo.',
    ],
    [
      '......oo..',
      '.....occo.',
      'o....o44o.',
      '.oooo4444o',
      '...o444444',
      '..oo4a4a44',
      'o..o444444',
      '.ooo4a4a44',
      '...o444444',
      'o..o4a4a44',
      '.ooo444444',
      '....o4444o',
      '.....oooo.',
    ],
  );
