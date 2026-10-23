// What lives in the dungeons: Barrow Ghosts, Tide Crabs, Bog Eels, Rust Golems, Gloom Goblins
// and Clockwork Ticks in ASCII art; the snores, sparks and embers the bosses let out; and the
// four bosses themselves, painted big (two blocks square, cut into four monster blocks).
import { art, baseKey, type Key } from '../art/sprite';
import { C } from '../art/pal';
import { Canvas, mix, clamp01, type RGB } from '../art/rgb';
import { flash } from './foes';

const WIGHT = [
  '....................',
  '.......KKKKKK.......',
  '.....KKgGGGGgKK.....',
  '....KgGGGGGGGGgK....',
  '...KgGGGGGGGGGGgK...',
  '...KgGKKGGGGKKGgK...',
  '...KgGKkGGGGKkGgK...',
  '...KgGGGGGGGGGGgK...',
  '...KgGGGGKKGGGGgK...',
  '...KgGGGKggKGGGgK...',
  '...KgGGGGGGGGGGgK...',
  '...KgGGGGGGGGGGgK...',
  '..KgGGGGGGGGGGGGgK..',
  '..KgGGGGGGGGGGGGgK..',
  '..KgGgGGgGGgGGgGgK..',
  '..KKgKgKKgKKgKgKKK..',
  '...K.K..K..K..K.....',
];
const CRAB = [
  '....................',
  '....................',
  '..KK............KK..',
  '.KrrK..K....K..KrrK.',
  '.KrRK.KwK..KwK.KRrK.',
  '..KrK.KkK..KkK.KrK..',
  '...KrKKKKKKKKKKrK...',
  '....KrRRRRRRRRrK....',
  '...KrRRRrRRrRRRRrK..',
  '..KrRRRRRRRRRRRRRrK.',
  '..KrRRRRRRRRRRRRRrK.',
  '...KrrRRRRRRRRRrrK..',
  '..K.KKrrrrrrrrKK.K..',
  '.KrK.K.K.KK.K.K.KrK.',
  '.K..KrK.KrrK.KrK..K.',
  '....K...K..K...K....',
];
const EEL = [
  '....................',
  '....................',
  '....................',
  '....................',
  '.............KKK....',
  '..KKK.......KeeeK...',
  '.KeeeK.....KeEEkEK..',
  'KeEEEeK...KeEEEEEEK.',
  'KeEEEEeKKKeEEEEwwK..',
  '.KeEEEEEeEEEEeKKK...',
  '..KKeEEEEEEEeK......',
  '....KKKeeeeKK.......',
  '.......KKKK.........',
];
const GOLEM = [
  '....................',
  '......KKKKKKKK......',
  '.....KoOOOOOOoK.....',
  '.....KOyKOOKyOK.....',
  '.....KOOOOOOOOK.....',
  '...KKKoOOKKOOoKKK...',
  '..KoOOKoOOOOoKOOoK..',
  '..KOOOKOOOOOOKOOOK..',
  '..KOOKKOOOOOOKKOOK..',
  '..KoOK.KoOOoK.KOoK..',
  '..KOOK.KOOOOK.KOOK..',
  '...KK..KoOOoK..KK...',
  '......KOOKKOOK......',
  '......KOOKKOOK......',
  '.....KoOOKKOOoK.....',
  '.....KKKK..KKKK.....',
];
const GOBLIN = [
  '....................',
  '...m................',
  '...m....KKKKK.......',
  '...m...KpPPPpK......',
  '...m..KgGGGGGgK.....',
  '..KmK.KGyGGGyGK.....',
  '..KsK.KGkGGGkGK.....',
  '..KsKKKgGwwwGgKKK...',
  '...KsppKgGGGgKPpK...',
  '....KpPPPPPPPPPpK...',
  '....KpPPyPPyPPPK....',
  '.....KpPPPPPPPK.....',
  '.....KgKKKKKKgK.....',
  '.....KgK....KgK.....',
  '....KKKK....KKKK....',
];
const TICK = [
  '....................',
  '....................',
  '....................',
  '.....K........K.....',
  '......K..KK..K......',
  '.......KKyyKK.......',
  '.....KKyyyyyyKK.....',
  '....KyyKwwwwKyyK....',
  '...KyyKwwkwwwKyyK...',
  '..KKyKwwwkwwwwKyKK..',
  '..K.yKwwwkkkwwKy.K..',
  '..KKyKwwwwwwwwKyKK..',
  '...KyyKwwwwwwKyyK...',
  '....KyyKKKKKKyyK....',
  '...K.KKyyyyyyKK.K...',
  '..K....KKKKKK....K..',
];

const KEYS: Record<string, Key> = {
  wight: baseKey({ g: C('ghost', 0), G: C('ghost', 1) }),
  crab: baseKey({ r: C('red', 1), R: C('orange', 1) }),
  eel: baseKey({ e: C('teal', 0), E: C('teal', 1) }),
  golem: baseKey({ o: C('orange', 2), O: C('orange', 1), y: C('gold', 3) }),
  goblin: baseKey({ g: C('slime', 0), G: C('slime', 1), p: C('purple', 0), P: C('purple', 1), y: C('gold', 2), m: C('steel', 2) }),
  tick: baseKey({ y: C('gold', 1), w: C('white', 0) }),
};

function bob(cv: Canvas, dy: number): Canvas {
  const out = new Canvas(20, 20);
  out.draw(cv, 0, dy);
  return out;
}

/** Each foe's two frames and its hurt flash: `${name}0`, `${name}1`, `${name}Hit`. */
export function dungeonFoePics(): Map<string, Canvas> {
  const m = new Map<string, Canvas>();
  const add = (name: string, rows: string[], dy = 2, second: (c: Canvas) => Canvas = (c) => bob(c, 1)) => {
    const a = art(rows, KEYS[name], 20, 20, 0, dy);
    m.set(`${name}0`, a);
    m.set(`${name}1`, second(a));
    m.set(`${name}Hit`, flash(a, [255, 230, 230]));
  };
  add('wight', WIGHT, 1, (c) => bob(c, -1));
  add('crab', CRAB, 3, (c) => c.flipX());
  add('eel', EEL, 3, (c) => bob(c, 2));
  add('golem', GOLEM, 3);
  add('goblin', GOBLIN, 4, (c) => c.flipX());
  add('tick', TICK, 3, (c) => c.flipX());
  // what the bosses let out: a snore, a spark, an ember, a stopped minute
  m.set('zzz', letterZ());
  m.set('spark', spark([140, 200, 255]));
  m.set('ember', spark([255, 150, 40]));
  m.set('minute', clockHand());
  return m;
}

function letterZ(): Canvas {
  const cv = new Canvas(20, 20);
  const c = C('ghost', 2);
  cv.poly(
    [
      [5, 5],
      [15, 5],
      [15, 7.5],
      [8.5, 13],
      [15, 13],
      [15, 15.5],
      [5, 15.5],
      [5, 13],
      [11.5, 7.5],
      [5, 7.5],
    ],
    c,
  );
  return cv.outline(C('ink'));
}

function spark(col: RGB): Canvas {
  const cv = new Canvas(20, 20);
  cv.disc(10, 10, 6, (x, y) => mix([255, 255, 255], col, clamp01(Math.hypot(x - 10, y - 10) / 6)));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    cv.line(10, 10, 10 + Math.cos(a) * 9, 10 + Math.sin(a) * 9, 1.2, col);
  }
  return cv;
}

function clockHand(): Canvas {
  const cv = new Canvas(20, 20);
  cv.disc(10, 10, 7, C('white', 0));
  cv.disc(10, 10, 5.8, C('white', 1));
  cv.line(10, 10, 10, 5, 1, C('ink'));
  cv.line(10, 10, 13.5, 11, 0.8, C('ink'));
  cv.disc(10, 10, 1, C('red', 2));
  return cv.outline(C('ink'));
}

// ---------------------------------------------------------------- bosses (40 x 40)

export type BossName = 'snoozalot' | 'kraken' | 'ticktock' | 'deadline';

function bossCanvas(name: BossName): Canvas {
  const cv = new Canvas(40, 40);
  if (name === 'snoozalot') {
    // Sir Snoozalot, the Barrow King: a vast bear in a dented helm, asleep sitting up
    const fur: RGB[] = [C('choc', 0), C('choc', 1), C('choc', 2)];
    cv.ellipse(20, 26, 17, 13, (x, y) => mix(fur[2], fur[0], clamp01((x - 6) / 40 + (y - 14) / 30)));
    cv.ellipse(20, 30, 10, 8, C('leather', 3));
    cv.disc(20, 14, 11, (x, y) => mix(fur[2], fur[0], clamp01((x - 9) / 26 + (y - 4) / 30)));
    cv.disc(10, 6, 4, fur[1]);
    cv.disc(30, 6, 4, fur[1]);
    cv.ellipse(20, 6, 11, 5, (x) => mix(C('steel', 3), C('steel', 0), clamp01((x - 9) / 22)));
    cv.rect(18.5, 1, 3, 6, C('steel', 1));
    cv.ellipse(20, 18, 5, 3.5, C('leather', 3));
    cv.disc(20, 16.5, 1.6, C('ink'));
    for (const x of [14, 26]) cv.line(x - 2.5, 13, x + 2.5, 13, 0.9, C('ink'));
    cv.ellipse(20, 20.5, 2, 1, C('pink', 0));
    for (const x of [6, 34]) cv.ellipse(x, 36, 5, 3, fur[1]);
  } else if (name === 'kraken') {
    // the Kraken of Kinda-Later: a plum head with two sleepy saucer eyes and eight arms it means to use eventually
    const p: RGB[] = [C('purple', 0), C('purple', 1), C('purple', 3)];
    for (let k = 0; k < 8; k++) {
      const x0 = 6 + k * 4;
      cv.line(x0, 24, x0 + Math.sin(k) * 4, 39, 3, mix(p[1], p[0], k / 8));
      for (let s = 0; s < 3; s++) cv.disc(x0 + Math.sin(k) * (s + 1), 28 + s * 4, 0.8, C('pink', 2));
    }
    cv.ellipse(20, 16, 16, 14, (x, y) => mix(p[2], p[0], clamp01((x - 4) / 34 + (y - 2) / 40)));
    for (const x of [13, 27]) {
      cv.disc(x, 18, 5, C('white', 1));
      cv.disc(x + 1, 19, 2.5, C('ink'));
      cv.rect(x - 5, 13, 10, 3.5, mix(p[1], p[0], 0.3));
    }
    for (const [x, y] of [
      [10, 8],
      [24, 6],
      [30, 10],
    ])
      cv.disc(x, y, 1.6, C('pink', 1));
  } else if (name === 'ticktock') {
    // Tick-Tock the Unpunctual: a brass clockwork golem, a clock for a chest, always late
    const b: RGB[] = [C('gold', 0), C('gold', 1), C('gold', 3)];
    cv.rect(3, 14, 6, 18, b[0]).rect(31, 14, 6, 18, b[0]);
    cv.rrect(8, 8, 24, 28, 4, (x, y) => mix(b[2], b[0], clamp01((x - 8) / 30 + (y - 8) / 50)));
    cv.disc(20, 22, 9, C('white', 0));
    cv.disc(20, 22, 7.6, C('white', 1));
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      cv.disc(20 + Math.cos(a) * 6.3, 22 + Math.sin(a) * 6.3, 0.6, C('ink'));
    }
    cv.line(20, 22, 20, 16, 1, C('ink'));
    cv.line(20, 22, 24, 25, 0.8, C('ink'));
    cv.rrect(12, 1, 16, 9, 2, b[1]);
    for (const x of [16, 24]) cv.disc(x, 5, 2, C('red', 3));
    cv.rect(10, 36, 7, 4, b[0]).rect(23, 36, 7, 4, b[0]);
  } else {
    // Lord Deadline: black plate, an hourglass on the helm, a red cape, a sword like a clock hand
    cv.poly(
      [
        [4, 10],
        [36, 10],
        [39, 40],
        [1, 40],
      ],
      (x) => mix(C('red', 2), C('red', 0), clamp01(Math.abs(x - 20) / 20)),
    );
    cv.rrect(10, 14, 20, 22, 3, (x, y) => mix(C('night', 1), C('ink'), clamp01((x - 10) / 24 + (y - 14) / 40)));
    cv.rect(12, 34, 6, 6, C('ink')).rect(22, 34, 6, 6, C('ink'));
    cv.rrect(12, 1, 16, 15, 4, (x) => mix(C('steel', 1), C('night', 0), clamp01((x - 12) / 16)));
    cv.rect(13, 8, 14, 2.5, C('ink'));
    cv.disc(16.5, 9.2, 1, C('red', 3));
    cv.disc(23.5, 9.2, 1, C('red', 3));
    cv.poly(
      [
        [16, 1],
        [24, 1],
        [20, 5],
      ],
      C('gold', 2),
    );
    cv.poly(
      [
        [20, 5],
        [16, 9],
        [24, 9],
      ],
      C('gold', 2),
    );
    cv.line(32, 36, 38, 4, 1.6, C('steel', 3));
    cv.line(29, 30, 35, 30, 1.4, C('gold', 2));
    cv.disc(20, 24, 3, C('gold', 2));
  }
  return cv.outline(C('ink'));
}

/** A boss's four blocks (`${name}TL`, TR, BL, BR) and their flashing copies (`${name}TLHit`...). */
export function bossPics(name: BossName): Map<string, Canvas> {
  const m = new Map<string, Canvas>();
  const big = bossCanvas(name);
  const hit = flash(big, [255, 255, 255], 0.55);
  for (const [q, x, y] of [
    ['TL', 0, 0],
    ['TR', 20, 0],
    ['BL', 0, 20],
    ['BR', 20, 20],
  ] as [string, number, number][]) {
    m.set(`${name}${q}`, big.crop(x, y, 20, 20));
    m.set(`${name}${q}Hit`, hit.crop(x, y, 20, 20));
  }
  return m;
}

/** The whole boss, for the screens and the manual. */
export const bossPicture = bossCanvas;
