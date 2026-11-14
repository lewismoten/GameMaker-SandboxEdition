// BLOCK BRAINS' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its rings.
//
//   1. Take Your Turn: three gates in a row, each with its own ring of three blocks (open, shut,
//      shut), and three lamps with the same rings. The map starts the rings in different places,
//      so gate 1 is open for the first turn, gate 2 for the second and gate 3 for the third, and
//      the lit lamp says whose turn it is. Walk through each gate in its turn.
//   2. Out of Step: two rings of two blocks, the sun's (open, shut) and the moon's (shut, open),
//      and four gates in a row, sun, moon, sun, moon. Every sun gate opens on the same tick and
//      every moon gate opens when the sun's shut, so Mara crosses one, waits in the room and
//      crosses the next.
//
// Every ring starts when the scene loads and nothing Mara does can change one (the manual says
// so). A block changes with its own timer and cannot see where Mara is. Both rooms end in a
// visible hedge, so Mara is never stopped by something she can't see.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { HUES, cap, gate, lamp, type Hue } from './props';
import { SPELL, TURN } from './timing';

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
export const WIDTH = 50;
/** The rows of a gate: the tally plate on top, then three open-or-shut cells (the hero is two blocks tall). */
export const GATE_TOP = GROUND - 3;
const CAP_ROW = GATE_TOP - 1;

/** Level 1: the gates' columns (in the order they open), the lamps' columns, and the coins' columns. */
export const GATES_ONE = [22, 28, 34];
export const LAMPS_ONE = [11, 12, 13];
/** Level 2: the gates' columns left to right (sun, moon, sun, moon), and the lamps'. */
export const GATES_TWO = [16, 22, 28, 34];
export const LAMPS_TWO = [10, 11];

/** The name of the block a ring's cell starts as, so the cell is open on turn `openTurn` (0 is the first) of a ring `turns` long. */
export const startOf = (ring: string, turns: number, openTurn: number) => `${ring}.${(turns - openTurn) % turns}`;
/** The ring's block that is open. */
export const openOf = (ring: string) => `${ring}.0`;

/**
 * Adds a ring of `turns` blocks, `ring`.0 to `ring`.(turns-1): the first is open, the rest shut, and
 * each turns into the next after `ticks`, the last into the first.
 */
function addRing(book: Book, timed: Timed[], ring: string, turns: number, ticks: number, pic: (open: boolean) => Pixels, shutRules: object): void {
  for (let i = 0; i < turns; i++) book.add(`${ring}.${i}`, pic(i === 0), i === 0 ? AIR : shutRules);
  for (let i = 0; i < turns; i++) timed.push({ name: `${ring}.${i}`, next: `${ring}.${(i + 1) % turns}`, ticks });
}

type SignName = 'lamps' | 'gates' | 'sun' | 'moon' | 'step';
const SIGNS = {
  lamps: { rows: [['THREE LAMPS'], ['TAKE TURNS']] },
  gates: { rows: [['THE LIT LAMP'], ['OPENS ITS GATE.'], ['GO IN ORDER']] },
  sun: { rows: [['SUN GATES'], ['ALL OPEN'], ['TOGETHER']] },
  moon: { rows: [['MOON'], ['GATES'], ['OPEN AS'], ['SUN SHUTS']] },
  step: { rows: [['CROSS'], ['ONE,'], ['WAIT,'], ['CROSS THE'], ['NEXT']] },
};

function startBook(pal: Pal, names: SignName[]): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const { blocks, signs } = buildTiledSigns(SIGNS, {
    include: names,
    lettersPerBlock: 3,
    maxBlocks: 100 - book.index.size,
    colors: {
      background: skyOf(pal),
      paper: pal.c('parch', 3),
      ink: pal.c('ink', 0),
      wood: pal.c('wood', 2),
      highlight: pal.c('wood', 4),
      shadow: pal.c('wood', 0),
    },
  });
  for (const [name, pic] of blocks) book.add(name, pic, AIR);
  return { book, signs };
}

/** Stamp only over sky; the one centered post ends immediately above the ground. */
function sign(m: StarterMap, x: number, s: Sign): void {
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, x, onGround(GROUND, s), s);
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** A room's frame: ground, dirt, hedges at both ends, the entrance and the exit. A wall of brick stands over every gate, so the way over is closed. */
function room(width: number, gateCols: number[]): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's')
    .put(3, 9, 'S')
    .put(width - 5, 8, 'e')
    .put(width - 5, 9, 'E');
  for (const x of gateCols) g.col(x, 0, CAP_ROW - 1, 'B');
  return g;
}

/** Stamps a gate: the tally plate, then three cells of the ring's start block. */
function stampGate(m: StarterMap, x: number, capName: string, cell: string): void {
  m.set(x, CAP_ROW, capName);
  for (let y = GATE_TOP; y < GROUND; y++) m.set(x, y, cell);
}

/** Level 1: three gates and three lamps, each a ring of three that starts one turn after the last. */
function takeYourTurn(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['lamps', 'gates']);
  const timed: Timed[] = [];
  HUES.forEach((hue: Hue, k) => {
    book.add(`cap${k}`, cap(pal, hue, k + 1), { solid: SOLID });
    addRing(book, timed, `gate${k}`, 3, TURN, (open) => gate(pal, hue, !open), { solid: SOLID });
    addRing(book, timed, `lamp${k}`, 3, TURN, (open) => lamp(pal, hue, open), AIR);
  });
  const g = room(WIDTH, GATES_ONE);
  for (const x of [25, 31, 38, 39, 40]) g.put(x, GROUND - 1, 'c');
  scenery(
    g,
    [
      [7, 2],
      [18, 1],
      [30, 2],
      [41, 3],
    ],
    [9, 20, 36],
    [16, 26, 33],
  );
  const m = new StarterMap(book, g.rows());
  HUES.forEach((_, k) => {
    m.set(LAMPS_ONE[k], GROUND - 1, startOf(`lamp${k}`, 3, k));
    stampGate(m, GATES_ONE[k], `cap${k}`, startOf(`gate${k}`, 3, k));
  });
  sign(m, 5, signs.lamps);
  sign(m, 14, signs.gates);
  return { file: 'one', title: 'Take Your Turn', hint: 'The lit lamp opens its gate.', map: m, book, timed };
}

/** Level 2: the sun's ring and the moon's ring, two blocks each, one step apart. */
function outOfStep(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['sun', 'moon', 'step']);
  const timed: Timed[] = [];
  const rings: [string, Hue, number][] = [
    ['sun', 'gold', 1],
    ['moon', 'blue', 2],
  ];
  for (const [name, hue, studs] of rings) {
    book.add(`cap.${name}`, cap(pal, hue, studs), { solid: SOLID });
    addRing(book, timed, `${name}.gate`, 2, SPELL, (open) => gate(pal, hue, !open), { solid: SOLID });
    addRing(book, timed, `${name}.lamp`, 2, SPELL, (open) => lamp(pal, hue, open), AIR);
  }
  const g = room(WIDTH, GATES_TWO);
  for (const x of [24, 30, 38, 39, 40]) g.put(x, GROUND - 1, 'c');
  scenery(
    g,
    [
      [8, 2],
      [20, 1],
      [30, 3],
      [42, 1],
    ],
    [7, 14, 37],
    [19, 26, 32],
  );
  const m = new StarterMap(book, g.rows());
  // the sun is open on the first turn, the moon on the second: the same ring, started one block along
  m.set(LAMPS_TWO[0], GROUND - 1, startOf('sun.lamp', 2, 0)).set(LAMPS_TWO[1], GROUND - 1, startOf('moon.lamp', 2, 1));
  GATES_TWO.forEach((x, i) => {
    const sun = i % 2 === 0;
    stampGate(m, x, sun ? 'cap.sun' : 'cap.moon', sun ? startOf('sun.gate', 2, 0) : startOf('moon.gate', 2, 1));
  });
  sign(m, 4, signs.sun);
  sign(m, 10, signs.moon);
  sign(m, 23, signs.step);
  return { file: 'two', title: 'Out of Step', hint: 'Two rings, one step apart.', map: m, book, timed };
}

/** The palette and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'block-brains');
  return { pal, levels: [takeYourTurn(pal), outOfStep(pal)] };
}
