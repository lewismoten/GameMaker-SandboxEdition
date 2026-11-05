// RIDE ALONG's three levels. Each is a StarterMap (games/kit/starter/map.ts), painted block by block, with its
// own block set (its signs would not all fit one).
//
//   1. Climb In: on foot. Walk to the parked rocket and into it. That is the exit: a link to the next scene,
//      and that scene names SHIP.CHR in its character slot, so the same helper is now a rocket.
//   2. Lift Off: the rocket rises by itself (rideChars.ts: the idle sequence has a y). A shaft of night sky 16
//      blocks wide and 72 high with rock gates to steer through and stars to catch; a docking bay at the top.
//   3. Down the River: the same trick in a canoe on a river that flows up the screen: slower, with a paddle
//      stroke on Space. Logs to steer round, lilies to catch, a dock at the top.
// Nothing in the shafts hurts: a rock or a log is solid, so the vehicle stops against it (its push goes on) and
// steering to the side gets it moving again. The exits are many links (one for each open block of the last
// row), so touching any of them takes the vehicle on.
import { type GameMap, MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { heroName } from './heroName';
import { addPlaque, addRideBlocks, addSpaceRamp } from './rideBlocks';
import { addSign, type Sign } from '../../kit/starter/sign';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** The level's own block set (its file is `${file}.bbl`). */
  book: Book;
  map: RideMap;
  /** The blocks that take the vehicle on to the next scene (world coordinates): one link each. */
  exits: [number, number][];
}

/** A StarterMap whose edges are walls: everything outside the level is the given block, never sky. */
class RideMap extends StarterMap {
  constructor(
    private readonly bk: Book,
    rows: string[],
    private readonly outside: string,
  ) {
    super(bk, rows);
  }

  override done(): GameMap {
    const m = super.done();
    const wall = this.bk.n(this.outside);
    for (let y = 0; y < MLEN; y++)
      for (let x = 0; x < MLEN; x++) {
        const inside = x >= ORIGIN && x < ORIGIN + this.width && y >= ORIGIN && y < ORIGIN + this.height;
        if (!inside) m.blocks[y * MLEN + x] = wall;
      }
    return m;
  }
}

const NAME = heroName().toUpperCase();

// ---------------------------------------------------------------------------------------------- signs
const WORDS = {
  // level 1
  walk: [`ON FOOT, ${NAME} WALKS AND JUMPS`, 2],
  ledge: ['SPACE JUMPS UP TO THE LEDGE', 2],
  rocket: ['A ROCKET WAITS AT THE END', 2],
  into: ['WALK INTO THE ROCKET TO CLIMB IN', 3],
  // level 2
  newfile: ['THE ROCKET IS A NEW CHARACTER FILE', 3],
  rises: ['IT RISES BY ITSELF', 2],
  steer: ['LEFT AND RIGHT STEER', 2],
  speed: ['UP IS FASTER, DOWN IS SLOWER', 3],
  rocks: ['A ROCK STOPS YOU. STEER AROUND IT', 3],
  stars: ['STARS ARE 10 POINTS', 2],
  bay: ['THE BAY IS A LINK, LIKE A DOOR', 3],
  // level 3
  boat: ['A CANOE IS ANOTHER CHARACTER FILE', 3],
  river: ['THE RIVER CARRIES YOU', 2],
  paddle: ['SPACE IS A PADDLE STROKE', 3],
  logs: ['A LOG STOPS YOU. STEER AROUND IT', 3],
  lilies: ['LILIES ARE 10 POINTS', 2],
  dock: ['THE DOCK IS A LINK TOO', 2],
} as const;
export type SignName = keyof typeof WORDS;

/** Which level each sign stands in, in order. */
const SIGNS: SignName[][] = [
  ['walk', 'ledge', 'rocket', 'into'],
  ['newfile', 'rises', 'steer', 'speed', 'rocks', 'stars', 'bay'],
  ['boat', 'river', 'paddle', 'logs', 'lilies', 'dock'],
];

const GROUND = 10;

// ---------------------------------------------------------------------------------------------- level 1
/** Level 1's blocks: the Starter set, ours, and the level's four signs (posts and all). */
function footBlocks(pal: Pal): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addRideBlocks(book, pal);
  const signs = Object.fromEntries(SIGNS[0].map((n) => [n, addSign(book, pal, n, WORDS[n][0], 4, WORDS[n][1])]));
  return { book, signs };
}

const onTop = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** Level 1: 40 blocks wide, flat, with a ledge of coins and the parked rocket at the right end. */
function climbIn(pal: Pal): Level {
  const { book, signs } = footBlocks(pal);
  const W = 40;
  const EXIT = 35;
  const g = new Grid(W, 15);
  g.row(GROUND, 0, W - 1, 'G').fill(0, GROUND + 1, W, 4, 'D');
  g.col(0, 0, 9, 'B').col(W - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(EXIT, 8, 'e').put(EXIT, 9, 'E');
  for (const [x, y] of [
    [6, 2],
    [18, 1],
    [27, 3],
    [33, 1],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [11, 25, 31]) g.put(x, GROUND - 1, 'b');
  for (const x of [9, 22, 29]) g.put(x, GROUND - 1, 'f');
  g.row(7, 16, 21, '=');
  for (const x of [17, 18, 19, 20]) g.put(x, 6, 'c');
  const m = new RideMap(book, g.rows(), 'brick');
  m.set(EXIT, 8, 'rocketTop').set(EXIT, 9, 'rocketBottom');
  m.sign(5, onTop(GROUND, signs.walk), signs.walk);
  m.sign(13, onTop(GROUND, signs.ledge), signs.ledge);
  m.sign(23, onTop(GROUND, signs.rocket), signs.rocket);
  m.sign(30, onTop(GROUND, signs.into), signs.into);
  return { file: 'one', title: 'Climb In', hint: 'Walk into the rocket.', book, map: m, exits: [[EXIT + ORIGIN, 9 + ORIGIN]] };
}

// ---------------------------------------------------------------------------------------------- the flying levels
/** The shafts' size (blocks): both 16 wide, with side walls on columns 0 and 15. */
const SHAFT_W = 16;
const SHIP_H = 72;
const BOAT_H = 64;

/** A flying level's start: the vehicle's bottom block is here (level coordinates) and its floor is the row below. */
const SHIP_START: [number, number] = [7, 69];
const BOAT_START: [number, number] = [7, 61];

/** Where a gate of rocks or logs stands (its row) and the gaps in it, as [first, last] open columns. */
export interface Gate {
  y: number;
  gaps: [number, number][];
}
/** Level 2's rock gates, bottom to top. */
export const ROCK_GATES: Gate[] = [
  { y: 40, gaps: [[2, 5]] },
  { y: 32, gaps: [[9, 12]] },
  {
    y: 24,
    gaps: [
      [3, 4],
      [10, 11],
    ],
  },
  { y: 17, gaps: [[7, 9]] },
  { y: 12, gaps: [[10, 14]] },
];
/** Level 3's log jams, bottom to top. */
export const LOG_GATES: Gate[] = [
  { y: 46, gaps: [[7, 10]] },
  { y: 38, gaps: [[3, 6]] },
  { y: 30, gaps: [[8, 11]] },
  {
    y: 22,
    gaps: [
      [4, 5],
      [10, 11],
    ],
  },
  { y: 14, gaps: [[6, 9]] },
];

/**
 * Where the vehicle is meant to be (its left block) at each row on the way up, for the stars and for the bot:
 * [row, column] corners, joined by straight lines. Steering moves it 2 blocks across for every block it rises,
 * so a move of n blocks across needs n/2 rows, and each gate is lined up for with rows to spare.
 */
export const SHIP_PATH: [number, number][] = [
  [69, 7],
  [52, 7],
  [47, 6],
  [44, 3.5],
  [37, 3.5],
  [33, 10.5],
  [21.5, 10.5],
  [18.5, 8],
  [14.5, 8],
  [12.5, 10.5],
  [9.5, 10.5],
  [7, 7.5],
  [3, 7.5],
];
export const BOAT_PATH: [number, number][] = [
  [61, 7],
  [55, 8.5],
  [43.5, 8.5],
  [41.5, 4],
  [35.5, 4],
  [31.5, 9.5],
  [27.5, 9.5],
  [25, 10.5],
  [19.5, 10.5],
  [16.5, 7],
  [11.5, 7],
  [8, 7.5],
  [3, 7.5],
];

/** The path's column at row `y`. */
export function pathAt(path: [number, number][], y: number): number {
  for (let i = 0; i + 1 < path.length; i++) {
    const [y0, x0] = path[i];
    const [y1, x1] = path[i + 1];
    if (y <= y0 && y >= y1) return y0 === y1 ? x1 : x0 + ((x1 - x0) * (y0 - y)) / (y0 - y1);
  }
  return path[path.length - 1][1];
}

/** The rows a pickup goes on (a few rows apart, on the path), for stars or lilies. */
const PICKS = (rows: number[], path: [number, number][]): [number, number][] => rows.map((y) => [Math.round(pathAt(path, y)), y]);
export const STARS = PICKS([62, 60, 56, 52, 48, 45, 42, 38, 34, 31, 27, 22, 19, 16, 12], SHIP_PATH);
export const LILIES = PICKS([57, 53, 49, 44, 41, 37, 34, 28, 26, 21, 17, 12, 8], BOAT_PATH);

/** A flying level's blocks: the Starter set, ours and its plaques standing on `ground`. */
function flyBlocks(pal: Pal, which: 1 | 2, ground: string): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addRideBlocks(book, pal);
  const bg = book.pics.get(ground)!;
  const signs = Object.fromEntries(SIGNS[which].map((n) => [n, addPlaque(book, pal, bg, n, WORDS[n][0], 4, WORDS[n][1])]));
  return { book, signs };
}

/** The empty rows of a shaft `h` tall, with the start (S) and a marker at the top. */
function shaftRows(h: number, start: [number, number]): string[] {
  const g = new Grid(SHAFT_W, h);
  g.put(start[0], start[1], 'S');
  g.put(7, 3, 'E');
  return g.rows();
}

/** Plaque `name` at level (x, y), its board's top-left. */
function plaque(m: StarterMap, signs: Record<string, Sign>, name: string, x: number, y: number): void {
  signs[name].board.forEach((row, dy) => row.forEach((n, dx) => m.set(x + dx, y + dy, n)));
}

/** A level 2 (night) or level 3 (river) filled in: `fill(x, y)` is the open block there. */
function fillShaft(m: StarterMap, h: number, fill: (x: number, y: number) => string, wall: string, funnel: [number, number][]): void {
  for (let y = 0; y < h; y++) for (let x = 0; x < SHAFT_W; x++) m.set(x, y, x === 0 || x === SHAFT_W - 1 ? wall : fill(x, y));
  // the funnel: from row 9 up, the walls close in a block at a time until the gap at the top is `funnel` wide
  for (const [y, open] of funnel) for (let x = 1; x < SHAFT_W - 1; x++) if (x < 8 - open / 2 || x >= 8 + open / 2) m.set(x, y, wall);
}

/** The runs of blocked columns across a gate's row: everything open except its gaps, as [first, last]. */
function runs(gate: Gate): [number, number][] {
  const out: [number, number][] = [];
  for (let x = 1; x < SHAFT_W - 1; x++) {
    if (gate.gaps.some(([a, b]) => x >= a && x <= b)) continue;
    const last = out[out.length - 1];
    if (last && last[1] === x - 1) last[1] = x;
    else out.push([x, x]);
  }
  return out;
}

const FUNNEL: [number, number][] = [
  [9, 12],
  [8, 10],
  [7, 8],
  [6, 6],
  [5, 4],
  [4, 4],
  [3, 4],
  [2, 4],
];
const TOP_GAP = [6, 7, 8, 9];

/** Level 2: Lift Off. */
function liftOff(pal: Pal): Level {
  const { book, signs } = flyBlocks(pal, 1, 'space0');
  const m = new RideMap(book, shaftRows(SHIP_H, SHIP_START), 'wall');
  const night = (x: number, y: number) => `space${(x * 7 + y * 3) % 3}`;
  fillShaft(m, SHIP_H, night, 'wall', FUNNEL);
  for (let y = SHIP_START[1] + 1; y < SHIP_H; y++) for (let x = 0; x < SHAFT_W; x++) m.set(x, y, 'wall');
  for (let x = 0; x < SHAFT_W; x++) m.set(x, 0, 'wall').set(x, 1, 'wall');
  for (const gate of ROCK_GATES) for (const [a, b] of runs(gate)) for (let x = a; x <= b; x++) m.set(x, gate.y, (x + gate.y) % 2 ? 'rockA' : 'rockB');
  for (const [x, y] of STARS) m.set(x, y, 'star');
  for (const x of TOP_GAP) m.set(x, 2, 'bayTop').set(x, 3, 'bayBottom');
  plaque(m, signs, 'newfile', 1, 63);
  plaque(m, signs, 'rises', 11, 58);
  plaque(m, signs, 'steer', 1, 53);
  plaque(m, signs, 'speed', 11, 48);
  plaque(m, signs, 'rocks', 11, 43);
  plaque(m, signs, 'stars', 1, 20);
  plaque(m, signs, 'bay', 1, 13);
  return { file: 'two', title: 'Lift Off', hint: 'The rocket never stops rising.', book, map: m, exits: TOP_GAP.map((x) => [x + ORIGIN, 3 + ORIGIN]) };
}

/** Level 3: Down the River (the river runs up the screen). */
function downTheRiver(pal: Pal): Level {
  const { book, signs } = flyBlocks(pal, 2, 'water0');
  const m = new RideMap(book, shaftRows(BOAT_H, BOAT_START), 'bank');
  const water = (x: number, y: number) => `water${(x + y) % 3}`;
  fillShaft(m, BOAT_H, water, 'bank', FUNNEL);
  for (let y = BOAT_START[1] + 1; y < BOAT_H; y++) for (let x = 0; x < SHAFT_W; x++) m.set(x, y, 'bank');
  for (let x = 0; x < SHAFT_W; x++) m.set(x, 0, 'bank').set(x, 1, 'bank');
  for (const gate of LOG_GATES)
    for (const [a, b] of runs(gate)) {
      // logs are two blocks wide, paired off from the left of a run; a block left over is a reed island
      let x = a;
      for (; x + 1 <= b; x += 2) m.set(x, gate.y, 'logL').set(x + 1, gate.y, 'logR');
      if (x === b) m.set(x, gate.y, 'reeds');
    }
  for (const [x, y] of LILIES) m.set(x, y, 'lily');
  for (const x of TOP_GAP) m.set(x, 2, 'dockTop').set(x, 3, 'dockBottom');
  plaque(m, signs, 'boat', 1, 56);
  plaque(m, signs, 'river', 11, 52);
  plaque(m, signs, 'paddle', 1, 47);
  plaque(m, signs, 'logs', 11, 42);
  plaque(m, signs, 'lilies', 11, 33);
  plaque(m, signs, 'dock', 11, 17);
  return { file: 'three', title: 'Down the River', hint: 'The river carries the canoe.', book, map: m, exits: TOP_GAP.map((x) => [x + ORIGIN, 3 + ORIGIN]) };
}

/** The levels in order, with the palette they share. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(addSpaceRamp, 'ride-along');
  const levels = [climbIn(pal), liftOff(pal), downTheRiver(pal)];
  return { book: levels[0].book, pal, levels };
}
