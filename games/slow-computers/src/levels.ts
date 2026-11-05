// SLOW COMPUTERS' three levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs, pads, crowd or breeze.
//
//   1. Short and Long: two sound pads on the ground. The short one plays a quarter-second .VOC, the long
//      one a five and a half second .VOC, and the music plays all the while.
//   2. A Crowd: 36 friendly monsters on one screen.
//   3. Busy Sky: the whole sky is one animated block that changes every tick, so every cell is redrawn each time.
//
// What the signs ask is for a player that has a speed setting; the game itself never names a button (a DOS
// player has none). Every room ends in a visible hedge, so Kit is never stopped by something he can't see.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { MON } from '../../kit/starter/ids';
import { addSign, type Sign } from '../../kit/starter/sign';
import { breeze, pad } from './props';
import { BREEZE_FRAMES, CROWD } from './timing';

/** A block that turns into another after some ticks. */
interface Timed {
  name: string;
  next: string;
  ticks: number;
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  book: Book;
  timed: Timed[];
}

/** The finished block set: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: Pick<Level, 'book' | 'timed'>): Block[] {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}

const AIR = { grav: PULL.down };
export const GROUND = 10;
/** The pads' columns in level 1, and the level 2 crowd's first and last column. */
export const PAD_X = { short: [17, 19, 21, 23], long: [32, 34, 36, 38] };
export const CROWD_X = [12, 22];

type SignName = 'speed' | 'short' | 'long' | 'music' | 'crowd' | 'fewer' | 'sky' | 'cost' | 'keep';
const SIGNS: Record<SignName, string> = {
  speed: 'GOT A SPEED SETTING? TRY 286 HERE, THEN THE REST.',
  short: 'FOUR SHORT PADS: A BLIP. TRY ONE AT EACH SPEED.',
  long: 'FOUR LONG PADS: A BIG SOUND. THE GAME WAITS FOR THE DISK.',
  music: 'THE MUSIC KEEPS TIME, EVEN WHEN THE GAME FREEZES.',
  crowd: 'EVERY MONSTER ON THE SCREEN COSTS TIME TO MOVE AND DRAW.',
  fewer: 'A 286 SLOWS DOWN HERE, A 486 DOES NOT. KEEP MONSTERS FEW.',
  sky: 'THE WHOLE SKY MOVES, AND IS DRAWN AGAIN EVERY TICK.',
  cost: 'A SKY FULL OF MOVING BLOCKS SLOWS A 286 A LITTLE.',
  keep: 'KEEP MOVING BLOCKS WHERE THEY COUNT.',
};

function startBook(pal: Pal, names: SignName[]): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  for (const n of names) signs[n] = addSign(book, pal, `${n}.sign`, SIGNS[n], 4, 4);
  return { book, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/**
 * A ring of blocks that go round on one clock: each state shows its picture for its ticks, then the
 * next. `name.start` looks like the first state but lasts `first` ticks the first time. A cell on the map is `name.start`.
 */
function ring(
  book: Book,
  timed: Timed[],
  name: string,
  states: { key: string; pic: Pixels; rules?: Parameters<Book['add']>[2]; ticks: number }[],
  first: number,
): void {
  const id = (k: string) => `${name}.${k}`;
  book.add(id('start'), states[0].pic, states[0].rules ?? AIR);
  states.forEach((s) => book.add(id(s.key), s.pic, s.rules ?? AIR));
  timed.push({ name: id('start'), next: id(states[1].key), ticks: first });
  states.forEach((s, i) => timed.push({ name: id(s.key), next: id(states[(i + 1) % states.length].key), ticks: s.ticks }));
}

function scenery(g: Grid, width: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) if (x < width) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) if (x < width) g.put(x, GROUND - 1, 'f');
}

/** The ground, hedges at both ends, the entrance at x 3 and the exit door at `exitX`. */
function room(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S').put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** A pad as a block pair: `name` turns into `name.used` when touched (the touched cell itself changes), so each pad plays once. */
function addPad(book: Book, pal: Pal, kind: 'short' | 'long'): void {
  const name = `pad.${kind}`;
  // the short pad adds a point (Game-Maker plays the score sound); the long one adds a coin (counter 3, the coin sound)
  const rules = kind === 'short' ? { score: 1 } : { effect: 3, eamt: 1 };
  book.add(name, pad(pal, kind, false), { ...AIR, ...rules, touch: `${name}.used` });
  book.add(`${name}.used`, pad(pal, kind, true), AIR);
}

/** Level 1: the short pad and the long pad. */
function shortAndLong(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['speed', 'short', 'long', 'music']);
  addPad(book, pal, 'short');
  addPad(book, pal, 'long');
  const g = room(52, 50);
  scenery(
    g,
    52,
    [
      [8, 1],
      [24, 2],
      [36, 1],
      [46, 2],
    ],
    [10, 15, 30, 40, 48],
    [26, 31, 42],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.speed), signs.speed);
  m.sign(11, onGround(GROUND, signs.short), signs.short);
  m.sign(26, onGround(GROUND, signs.long), signs.long);
  m.sign(42, onGround(GROUND, signs.music), signs.music);
  for (const x of PAD_X.short) m.set(x, GROUND - 1, 'pad.short');
  for (const x of PAD_X.long) m.set(x, GROUND - 1, 'pad.long');
  return { file: 'one', title: 'Short and Long', hint: 'Step on each pad. Listen to the music.', map: m, book, timed: [] };
}

/** Level 2: 36 friendly monsters on one screen: 10 gumdrops on the ground, 8 snails on a plank and 18 bees in three rows. */
function aCrowd(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['crowd', 'fewer']);
  const g = room(34, 32);
  scenery(
    g,
    34,
    [
      [7, 1],
      [18, 1],
      [28, 2],
    ],
    [9, 24],
    [7, 30],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.crowd), signs.crowd);
  m.sign(28, onGround(GROUND, signs.fewer), signs.fewer);
  let n = 0;
  // snails creep along a plank, gumdrops waddle on the ground, bees bob in three rows above
  for (let x = CROWD_X[0]; x < CROWD_X[0] + 12; x++) m.set(x, 6, 'plank');
  for (let x = CROWD_X[0]; x < CROWD_X[0] + 10; x++, n++) m.mon(MON.gumdrop, x, GROUND - 1);
  for (let x = CROWD_X[0]; x < CROWD_X[0] + 16; x += 2, n++) m.mon(MON.shelly, x, 5);
  for (const row of [0, 1, 2]) for (let k = 0; k < 6; k++, n++) m.mon(MON.buzzer, CROWD_X[0] + k * 2 + (row === 1 ? 1 : 0), row);
  if (n !== CROWD) throw new Error(`the crowd should be ${CROWD}, not ${n}`);
  return { file: 'two', title: 'A Crowd', hint: 'Walk through. Count the monsters.', map: m, book, timed: [] };
}

/** Level 3's map: every sky block is the breeze's first block, so the whole sky is one animated kind. */
class BreezeMap extends StarterMap {
  constructor(
    private readonly b: Book,
    rows: string[],
  ) {
    super(b, rows);
  }
  override done() {
    const m = super.done();
    const sky = this.b.n('sky');
    const bz = this.b.n('bz.start');
    for (let i = 0; i < m.blocks.length; i++) if (m.blocks[i] === sky) m.blocks[i] = bz;
    return m;
  }
}

/** Level 3: a sky of wisps that move every tick. */
function busySky(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['sky', 'cost', 'keep']);
  const timed: Timed[] = [];
  ring(
    book,
    timed,
    'bz',
    Array.from({ length: BREEZE_FRAMES }, (_, i) => ({ key: `f${i}`, pic: breeze(pal, i), ticks: 1 })),
    1,
  );
  const g = room(30, 28);
  scenery(g, 30, [], [10, 20], [8, 17, 25]);
  const m = new BreezeMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.sky), signs.sky);
  m.sign(12, onGround(GROUND, signs.cost), signs.cost);
  m.sign(20, onGround(GROUND, signs.keep), signs.keep);
  return { file: 'three', title: 'Busy Sky', hint: 'The whole sky moves.', map: m, book, timed };
}

/** The palette (the Starters' ramps) and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'slow-computers');
  return { pal, levels: [shortAndLong(pal), aCrowd(pal), busySky(pal)] };
}
