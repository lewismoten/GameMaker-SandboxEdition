// FLICKER AND FLOW's three levels, painted on a Grid (see games/kit/starter/map.ts for the letters), each with its own
// block set (hall.bbl, falls.bbl, camp.bbl) and palette, then given the things that move.
//
//   1. The Torch Hall: a castle hall. Torches whose flame is a pulse (even times), then flickering torches (uneven
//      times, frames that lean), two flicker loops so neighbors differ; then flags on poles, a wave on an even loop.
//   2. The Falls: a cliff with a waterfall four blocks wide: a lip, a body and a splash, each a loop, over a pool.
//   3. The Fire on the Hill: a dusk fire on a hill, a loop of big frames, and three loops of rising sparks.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { FIRE, FIRE_TICKS, SPARKS, fireFrame, logs, sparkFrame } from './camp';
import { BODY_TICKS, COLS, LIP_TICKS, SPLASH_TICKS, bodyFrame, lipFrame, poolBlock, rockBlock, splashFrame } from './falls';
import { FLAG_TICKS, flagFrames, poleBlocks } from './flag';
import { FLICKER_A, FLICKER_A_TICKS, FLICKER_B, FLICKER_B_TICKS, PULSE, PULSE_TICKS, sconce, torchFrame } from './flames';
import { addHill, HILL_H, HILL_W } from './hill';
import { addRing, type Timed } from './loops';
import { dayPalette, hallPalette, nightPalette } from './palettes';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  pal: Pal;
  /** The palette's file on the disk. */
  palFile: string;
  book: Book;
  /** The blocks that turn into others by themselves. */
  timed: Timed[];
  map: StarterMap;
  /** Cells of each moving thing that the checks and the bot look at: block name of the ring's frame 0 and where it is laid. */
  things: Thing[];
}

/** A moving thing laid on the map: the ring's base name (its frames are `${ring}.0` ...), its cell, and what kind it is. */
export interface Thing {
  ring: string;
  x: number;
  y: number;
  kind: 'pulse' | 'flicker' | 'flag' | 'fall' | 'lip' | 'splash' | 'fire' | 'spark';
}

const WORDS = {
  pulse: { rows: [['EVEN TIMES MAKE A PULSE']] },
  flicker: { rows: [['UNEVEN TIMES MAKE IT FLICKER']] },
  two: { rows: [['TWO LOOPS KEEP'], ['TORCHES APART']] },
  flag: { rows: [['A WAVE MOVES'], ['ALONG TWO BLOCKS']] },
  fall: { rows: [['STREAKS SLIDE DOWN'], ['5 PIXELS A FRAME']] },
  ends: { rows: [['THE TOP AND FOOT ARE LOOPS TOO']] },
  wide: { rows: [['FOUR BLOCKS MAKE A WIDE FALL']] },
  fire: { rows: [['A BIG FIRE: BIGGER FRAMES, UNEVEN TIMES']] },
  sparks: { rows: [['SPARKS ARE 3 LOOPS, NEVER SIDE BY SIDE']] },
} as const;
export type SignName = keyof typeof WORDS;

/** The ground's top row in every level: signs stand on it. */
export const GROUND = 11;
const onGround = (s: Sign) => GROUND - 1 - s.board.length;

interface Built {
  book: Book;
  timed: Timed[];
  signs: Record<string, Sign>;
}

/** A level's block set: the Starter blocks and its signs; the rest is added by the level. */
function start(pal: Pal, names: SignName[]): Built {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  // Pack every level's sign text together; keep only the tiles used in this palette.
  const { blocks: tiles, signs } = buildTiledSigns(WORDS, {
    colors: {
      background: skyOf(pal),
      paper: pal.c('parch', 3),
      ink: pal.c('ink', 0),
      wood: pal.c('wood', 2),
      highlight: pal.c('wood', 4),
      shadow: pal.c('wood', 0),
    },
    lettersPerBlock: 3,
    maxBlocks: 100,
  });
  const needed = new Set(names.flatMap((k) => [...signs[k].board.flat(), signs[k].post!.block]));
  for (const [name, pic] of tiles) if (needed.has(name)) book.add(name, pic, { grav: PULL.down });
  return { book, timed: [], signs };
}

/** Level 1: the castle hall, 58 blocks wide. */
function torchHall(): Level {
  const pal = hallPalette();
  const { book, timed, signs } = start(pal, ['pulse', 'flicker', 'two', 'flag']);
  const bg = pal.c('sky', 3);
  const things: Thing[] = [];
  const { c } = pal;
  book.add('sconce', sconce(pal, bg), { grav: PULL.down });
  const win = new Pixels(20, 40, bg);
  // an arched slit: a stone frame round a lit opening with a round top, no bars across it
  win.rect(4, 8, 12, 32, c('stone', 2)).disc(10, 12, 6, c('stone', 2));
  win.rect(7, 10, 6, 30, c('sky', 5)).disc(10, 12, 3, c('sky', 5));
  win.rect(2, 38, 16, 2, c('stone', 3));
  book.add('window.top', win.crop(0, 0, 20, 20), { grav: PULL.down });
  book.add('window.bot', win.crop(0, 20, 20, 20), { grav: PULL.down });
  addRing(
    book,
    timed,
    'pulse',
    PULSE.map((s) => torchFrame(pal, bg, s)),
    PULSE_TICKS,
  );
  addRing(
    book,
    timed,
    'flameA',
    FLICKER_A.map((s) => torchFrame(pal, bg, s)),
    FLICKER_A_TICKS,
  );
  addRing(
    book,
    timed,
    'flameB',
    FLICKER_B.map((s) => torchFrame(pal, bg, s)),
    FLICKER_B_TICKS,
  );
  const poles = poleBlocks(pal, bg);
  book.add('pole.top', poles.top, { grav: PULL.down });
  book.add('pole.mid', poles.mid, { grav: PULL.down });
  const fl = flagFrames(pal, bg);
  addRing(book, timed, 'flagA', fl.a, FLAG_TICKS);
  addRing(book, timed, 'flagB', fl.b, FLAG_TICKS);

  const W = 58;
  const g = new Grid(W, 15);
  g.row(0, 0, W - 1, 'B')
    .row(GROUND, 0, W - 1, 'B')
    .fill(0, GROUND + 1, W, 3, 'D');
  g.col(0, 0, GROUND - 1, 'B').col(W - 1, 0, GROUND - 1, 'B');
  g.put(3, GROUND - 2, 's').put(3, GROUND - 1, 'S');
  g.put(54, GROUND - 2, 'e').put(54, GROUND - 1, 'E');
  const m = new StarterMap(book, g.rows());
  const torch = (x: number, ring: string, kind: Thing['kind']) => {
    m.set(x, 7, `${ring}.0`).set(x, 8, 'sconce');
    things.push({ ring, x, y: 7, kind });
  };
  for (const x of [13, 16]) torch(x, 'pulse', 'pulse');
  [24, 27, 30, 33].forEach((x, i) => torch(x, i % 2 ? 'flameB' : 'flameA', 'flicker'));
  for (const x of [8, 20, 37, 47]) m.set(x, 5, 'window.top').set(x, 6, 'window.bot');
  stampTiledSign({ set: m.setOnSky.bind(m) }, 5, onGround(signs.pulse), signs.pulse);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 18, onGround(signs.flicker), signs.flicker);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 34, onGround(signs.two), signs.two);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 41, onGround(signs.flag), signs.flag);
  // two flags: each a pole (top, flag, then the pole down to the floor)
  for (const x of [48, 51]) {
    m.set(x, 7, 'pole.top')
      .set(x, 8, 'flagA.0')
      .set(x + 1, 8, 'flagB.0')
      .set(x, 9, 'pole.mid')
      .set(x, 10, 'pole.mid');
    things.push({ ring: 'flagA', x, y: 8, kind: 'flag' }, { ring: 'flagB', x: x + 1, y: 8, kind: 'flag' });
  }
  return { file: 'hall', title: 'The Torch Hall', hint: 'Torches that flicker, and flags.', pal, palFile: 'hall.pal', book, timed, map: m, things };
}

/** Level 2: the cliff and the waterfall, 60 blocks wide. */
function falls(): Level {
  const pal = dayPalette();
  const { book, timed, signs } = start(pal, ['fall', 'ends', 'wide']);
  const bg = pal.c('sky', 3);
  const things: Thing[] = [];
  const rocks: Pixels[] = [];
  for (const [name, opts] of [
    ['rock.0', { seed: 1 }],
    ['rock.1', { seed: 2 }],
    ['rock.2', { seed: 3 }],
    ['rockL', { seed: 4, side: 'L' as const }],
    ['rockR', { seed: 5, side: 'R' as const }],
    ['rockTop.0', { seed: 6, cap: true }],
    ['rockTop.1', { seed: 7, cap: true }],
    ['rockTopL', { seed: 8, cap: true, side: 'L' as const }],
    ['rockTopR', { seed: 9, cap: true, side: 'R' as const }],
  ] as const) {
    const pic = rockBlock(pal, opts);
    rocks.push(pic);
    book.add(name, pic, { grav: PULL.down });
  }
  book.add('pool.0', poolBlock(pal, rocks[0], 11), { grav: PULL.down });
  book.add('pool.1', poolBlock(pal, rocks[1], 23), { grav: PULL.down });
  for (const col of COLS) {
    addRing(
      book,
      timed,
      `fall${col}`,
      [0, 1, 2, 3].map((k) => bodyFrame(pal, col, k)),
      BODY_TICKS,
    );
    addRing(
      book,
      timed,
      `lip${col}`,
      [0, 1, 2, 3].map((k) => lipFrame(pal, col, k, bg)),
      LIP_TICKS,
    );
    addRing(
      book,
      timed,
      `splash${col}`,
      [0, 1, 2, 3].map((k) => splashFrame(pal, col, k)),
      SPLASH_TICKS,
    );
  }

  const W = 60;
  const g = new Grid(W, 15);
  g.row(GROUND, 0, W - 1, 'G').fill(0, GROUND + 1, W, 3, 'D');
  g.col(0, 0, GROUND - 1, 'X').col(W - 1, 0, GROUND - 1, 'X');
  g.put(3, GROUND - 2, 's').put(3, GROUND - 1, 'S');
  g.put(56, GROUND - 2, 'e').put(56, GROUND - 1, 'E');
  g.put(12, GROUND - 1, 'b')
    .put(35, GROUND - 1, 'f')
    .put(53, GROUND - 1, 'b')
    .put(44, 5, '(')
    .put(45, 5, ')');
  const m = new StarterMap(book, g.rows());
  const L = 15;
  const R = 31;
  const F = 21;
  // the view keeps the hero about 5 rows down, so rows above 5 are never on screen (ground row 11, view clamped to the map bottom): the cliff and lip start at row 5
  for (let y = 5; y <= 10; y++)
    for (let x = L; x <= R; x++) {
      const side = x === L ? 'L' : x === R ? 'R' : '';
      m.set(x, y, y === 5 ? (side ? `rockTop${side}` : `rockTop.${x % 2}`) : side ? `rock${side}` : `rock.${(x + y) % 3}`);
    }
  COLS.forEach((col, i) => {
    m.set(F + i, 5, `lip${col}.0`);
    for (let y = 6; y <= 9; y++) m.set(F + i, y, `fall${col}.0`);
    m.set(F + i, 10, `splash${col}.0`);
    things.push(
      { ring: `lip${col}`, x: F + i, y: 5, kind: 'lip' },
      { ring: `fall${col}`, x: F + i, y: 7, kind: 'fall' },
      { ring: `splash${col}`, x: F + i, y: 10, kind: 'splash' },
    );
  });
  [18, 19, 20].forEach((x, i) => m.set(x, 10, `pool.${i % 2}`));
  [25, 26, 27].forEach((x, i) => m.set(x, 10, `pool.${(i + 1) % 2}`));
  stampTiledSign({ set: m.setOnSky.bind(m) }, 6, onGround(signs.fall), signs.fall);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 36, onGround(signs.ends) - 2, signs.ends, 3);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 45, onGround(signs.wide), signs.wide);
  return { file: 'falls', title: 'The Falls', hint: 'A cliff, a waterfall and its pool.', pal, palFile: 'day.pal', book, timed, map: m, things };
}

/** Level 3: the fire on the hill, 46 blocks wide. */
function fireOnTheHill(): Level {
  const pal = nightPalette();
  const { book, timed, signs } = start(pal, ['fire', 'sparks']);
  const bg = pal.c('sky', 3);
  const things: Thing[] = [];
  const hill = addHill(book, pal, bg);
  const pile = logs(pal, bg);
  book.add('logs.0', pile.crop(0, 0, 20, 20), { grav: PULL.down });
  book.add('logs.1', pile.crop(20, 0, 20, 20), { grav: PULL.down });
  const fires = FIRE.map((s) => fireFrame(pal, bg, s));
  const quarter = ['tl', 'tr', 'bl', 'br'] as const;
  quarter.forEach((q, i) =>
    addRing(
      book,
      timed,
      `fire.${q}`,
      fires.map((f) => f.crop((i % 2) * 20, Math.floor(i / 2) * 20, 20, 20)),
      FIRE_TICKS,
    ),
  );
  SPARKS.forEach((s, i) =>
    addRing(
      book,
      timed,
      `spark${i}`,
      s.path.map((at) => sparkFrame(pal, bg, at)),
      s.ticks,
    ),
  );

  const W = 46;
  const g = new Grid(W, 15);
  g.row(GROUND, 0, W - 1, 'G').fill(0, GROUND + 1, W, 3, 'D');
  g.col(0, 0, GROUND - 1, 'X').col(W - 1, 0, GROUND - 1, 'X');
  g.put(3, GROUND - 2, 's').put(3, GROUND - 1, 'S');
  g.put(42, GROUND - 2, 'e').put(42, GROUND - 1, 'E');
  const m = new StarterMap(book, g.rows());
  const H0 = 18;
  const top = GROUND - HILL_H;
  hill.forEach((row, dy) => row.forEach((name, dx) => m.set(H0 + dx, top + dy, name)));
  const cx = H0 + HILL_W / 2 - 1; // the fire is two blocks wide: cx and cx + 1
  m.set(cx, top - 1, 'logs.0').set(cx + 1, top - 1, 'logs.1');
  quarter.forEach((q, i) => {
    const x = cx + (i % 2);
    const y = top - 3 + Math.floor(i / 2);
    m.set(x, y, `fire.${q}.0`);
    things.push({ ring: `fire.${q}`, x, y, kind: 'fire' });
  });
  // Sparks fly up and out from the flame; none sits above row 5, the screen's top row from the ground.
  const sparks: [number, number, number][] = [
    [cx, top - 4, 0],
    [cx + 1, top - 4, 1],
    [cx - 1, top - 3, 2],
    [cx - 2, top - 4, 0],
    [cx + 2, top - 3, 2],
  ];
  for (const [x, y, i] of sparks) {
    m.set(x, y, `spark${i}.0`);
    things.push({ ring: `spark${i}`, x, y, kind: 'spark' });
  }
  stampTiledSign({ set: m.setOnSky.bind(m) }, 6, onGround(signs.fire) - 1, signs.fire, 2);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 30, onGround(signs.sparks) - 1, signs.sparks, 2);
  return { file: 'camp', title: 'The Fire on the Hill', hint: 'A big fire and its sparks.', pal, palFile: 'night.pal', book, timed, map: m, things };
}

/** The levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const levels = [torchHall(), falls(), fireOnTheHill()];
  return { pal: levels[0].pal, levels };
}
