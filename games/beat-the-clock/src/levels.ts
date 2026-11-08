// BEAT THE CLOCK's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, its bar and its gate.
//
//   1. Beat the Clock: a bar of five green segments goes out one by one, right to left, and when
//      the last is dark the gate in the brick wall shuts for good. Run to the exit before that;
//      too slow, and the teal restart door near the start begins the level, and the clock, again.
//   2. Round and Round: the same bar and gate on a loop. The gate shuts for a few seconds when the
//      bar is empty, then the bar fills and the gate opens, again and again. Wait, then go.
//
// The engine's only clock is a block turning into another block after some ticks (18.2 a second).
// Every block of one kind turns at the same moment, which is why a bar is five different kinds of
// block, one a segment, and why the same bar can be stamped along the whole level and still tick as
// one. The bars sit on the top row the screen shows (the camera never scrolls up or down here), close
// enough together that one whole bar is always in view (games/kit/inViewCheck.ts checks it on the
// walkthrough); the first hangs on the left-hand brick wall, its clock face set into the brick.
// Each level has its own block file, so a kind can mean one timing here and another there.
// Both rooms are closed in by brick walls you can see, so Kit is never stopped by something he can't.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { face, gate, lamp, restartDoor, segment, type Fill } from './clockArt';
import { HAND, LOOP_OPEN, LOOP_ROUND, LOOP_SEG, RACE_SEG, RACE_TOTAL, SEGMENTS, WARN } from './timing';

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
  /** The restart door's bottom block in world blocks, when the level has one. */
  restart?: [number, number];
  /** The gate's column in the level, and the ticks the bar lasts. */
  gateX: number;
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
/** The gate's three columns. */
const PARTS = ['l', 'm', 'r'] as const;
export const GROUND = 10;
/** The row the bars sit on: the top row in view while Kit walks the ground. */
export const BAR_ROW = 4;
export const WIDTH = 48;
/** Where each stamp of the bar starts in each level (it is 6 blocks wide: the clock and five segments), clear of the gate wall. At 0 the clock face is in the wall. */
export const RACE_BARS = [0, 10, 20, 29, 38] as const;
export const LOOP_BARS = [0, 10, 17, 27, 37] as const;
export const EXIT_X = 42;
/** The race's gate and the looping gate: the middle of a wall three blocks thick (brick from row 3 down to a two-block tunnel that the gate fills). */
export const RACE_GATE = 36;
export const LOOP_GATE = 24;
/** The restart door's column in level 1. */
export const RESTART_X = 1;

/** Segment `i` goes out at this tick: the right-hand one first. */
export const goesOutAt = (i: number, seg: number): number => (SEGMENTS - i) * seg;

export type SignName = 'bar' | 'redo' | 'gate' | 'loop' | 'wait' | 'exit';
const SIGNS: Record<SignName, [string, number, number]> = {
  bar: ['THE BAR IS YOUR TIME. WHEN IT IS EMPTY, THE GATE SHUTS', 4, 4],
  redo: ['TOO SLOW? WALK BACK TO THE CLOCK DOOR TO TRY AGAIN', 4, 4],
  gate: ['RUN TO THE GATE BEFORE IT SHUTS', 4, 3],
  loop: ['THIS CLOCK STARTS OVER BY ITSELF', 4, 3],
  wait: ['GATE SHUT? WAIT FOR THE BAR TO FILL AGAIN', 4, 4],
  exit: ['EXIT →', 3, 1],
};

/** One level's block set: the Starter blocks, its signs and its clock blocks. `loop` is the repeating clock. */
function buildBlocks(pal: Pal, loop: boolean, names: SignName[]): { book: Book; timed: Timed[]; signs: Partial<Record<SignName, Sign>> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const timed: Timed[] = [];
  const signs: Partial<Record<SignName, Sign>> = {};
  for (const n of names) {
    const [text, w, h] = SIGNS[n];
    signs[n] = addSign(book, pal, `${n}.sign`, text, w, h);
  }
  const seg = loop ? LOOP_SEG : RACE_SEG;
  const round = loop ? LOOP_ROUND : 0;
  // the clock face: its hand moves a quarter turn every second, round and round
  // and the same face set into the brick wall, which turns with it (the same ticks from the same start)
  const brick = book.pics.get('brick')!;
  for (let q = 0; q < 4; q++) {
    book.add(`face${q}`, face(pal, q), AIR);
    timed.push({ name: `face${q}`, next: `face${(q + 1) % 4}`, ticks: HAND });
    book.add(`wallFace${q}`, face(pal, q, brick), { solid: SOLID });
    timed.push({ name: `wallFace${q}`, next: `wallFace${(q + 1) % 4}`, ticks: HAND });
  }
  // the segments, each its own kind of block so each can go out at its own time. A segment is green,
  // then thin and orange for the last second, then out; on the loop it lights again when the round ends.
  for (let i = 0; i < SEGMENTS; i++) {
    const out = goesOutAt(i, seg);
    const last = i === SEGMENTS - 1;
    for (const f of ['on', 'warn', 'off'] as Fill[]) book.add(`seg${i}.${f}`, segment(pal, f, last), AIR);
    timed.push({ name: `seg${i}.on`, next: `seg${i}.warn`, ticks: out - WARN });
    timed.push({ name: `seg${i}.warn`, next: `seg${i}.off`, ticks: WARN });
    if (loop) timed.push({ name: `seg${i}.off`, next: `seg${i}.on`, ticks: round - out });
  }
  // the gate (two blocks high) and its lamp
  const open = loop ? LOOP_OPEN : RACE_TOTAL;
  for (const part of PARTS)
    for (const p of ['top', 'bottom'] as const) {
      book.add(`gate.open.${p}.${part}`, gate(pal, false, p === 'bottom', part), AIR);
      book.add(`gate.shut.${p}.${part}`, gate(pal, true, p === 'bottom', part), { solid: SOLID });
      timed.push({ name: `gate.open.${p}.${part}`, next: `gate.shut.${p}.${part}`, ticks: open });
      if (loop) timed.push({ name: `gate.shut.${p}.${part}`, next: `gate.open.${p}.${part}`, ticks: round - open });
    }
  book.add('lamp.open', lamp(pal, brick, false), { solid: SOLID });
  book.add('lamp.shut', lamp(pal, brick, true), { solid: SOLID });
  timed.push({ name: 'lamp.open', next: 'lamp.shut', ticks: open });
  if (loop) timed.push({ name: 'lamp.shut', next: 'lamp.open', ticks: round - open });
  if (!loop) {
    const door = restartDoor(pal);
    book.add('restartTop', door.crop(0, 0, 20, 20), AIR);
    book.add('restartBottom', door.crop(0, 20, 20, 20), AIR);
  }
  return { book, timed, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The ground, brick walls at both ends, the entrance on the left (x 3) and the exit door. */
function base(): Grid {
  const g = new Grid(WIDTH, 15);
  g.row(GROUND, 0, WIDTH - 1, 'G').fill(0, GROUND + 1, WIDTH, 4, 'D');
  g.col(0, 0, 9, 'B').col(WIDTH - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(EXIT_X, 8, 'e').put(EXIT_X, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** The gatehouse: a brick wall three blocks thick, from row 3 to the ground, with a tunnel through it (rows 8 and 9) that the gate fills. */
function wall(g: Grid, x: number): void {
  g.fill(x - 1, 3, 3, 5, 'B');
}

/** Stamps a bar (clock face, five segments) at (x, BAR_ROW), and a gate with its lamp in column x. */
function stampBar(m: StarterMap, x: number): void {
  m.set(x, BAR_ROW, x === 0 ? 'wallFace0' : 'face0');
  for (let i = 0; i < SEGMENTS; i++) m.set(x + 1 + i, BAR_ROW, `seg${i}.on`);
}
function stampGate(m: StarterMap, x: number): void {
  m.set(x, 7, 'lamp.open');
  PARTS.forEach((part, i) => m.set(x - 1 + i, 8, `gate.open.top.${part}`).set(x - 1 + i, 9, `gate.open.bottom.${part}`));
}

/** Level 1: the race. */
function race(pal: Pal): Level {
  const { book, timed, signs } = buildBlocks(pal, false, ['bar', 'redo', 'gate', 'exit']);
  const s = signs as Record<SignName, Sign>;
  const g = base();
  wall(g, RACE_GATE);
  g.row(9, 20, 23, 'c').row(9, 32, 33, 'c').row(9, 39, 40, 'c');
  scenery(
    g,
    [
      [2, 6],
      [18, 5],
      [31, 6],
      [44, 6],
    ],
    [16, 25, 30],
    [19, 26, 34],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, s.bar), s.bar);
  m.sign(13, onGround(GROUND, s.redo), s.redo);
  m.sign(26, onGround(GROUND, s.gate), s.gate);
  m.sign(39, onGround(GROUND, s.exit), s.exit);
  m.set(RESTART_X, 8, 'restartTop').set(RESTART_X, 9, 'restartBottom');
  for (const x of RACE_BARS) stampBar(m, x);
  stampGate(m, RACE_GATE);
  return {
    file: 'one',
    title: 'Beat the Clock',
    hint: 'The clock starts now.',
    map: m,
    book,
    timed,
    restart: [RESTART_X + 10, 9 + 10],
    gateX: RACE_GATE,
  };
}

/** Level 2: the clock that starts over. */
function loopLevel(pal: Pal): Level {
  const { book, timed, signs } = buildBlocks(pal, true, ['loop', 'wait', 'exit']);
  const s = signs as Record<SignName, Sign>;
  const g = base();
  wall(g, LOOP_GATE);
  g.row(9, 9, 11, 'c').row(9, 18, 19, 'c').row(9, 29, 32, 'c');
  scenery(
    g,
    [
      [10, 6],
      [28, 5],
      [33, 6],
      [44, 6],
    ],
    [8, 21, 34],
    [14, 28, 36],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, s.loop), s.loop);
  m.sign(17, onGround(GROUND, s.wait), s.wait);
  m.sign(39, onGround(GROUND, s.exit), s.exit);
  for (const x of LOOP_BARS) stampBar(m, x);
  stampGate(m, LOOP_GATE);
  return { file: 'two', title: 'Round and Round', hint: 'The clock starts itself over.', map: m, book, timed, gateX: LOOP_GATE };
}

/** The palette and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'beat-the-clock');
  return { pal, levels: [race(pal), loopLevel(pal)] };
}
