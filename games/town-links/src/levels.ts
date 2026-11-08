// MAPS IN MAPS: three scenes, each with its own map file and its own scale, joined by links that land Yana on a chosen cell.
//
//   world.map  a country: 22 x 14 blocks of sea, land, hills and forest. A block is a great stretch of country, so the
//              town is one block (a ring of tiny roofs) and Yana is tiny (her own character file). Touch the town block
//              and a scene link lands her at the town's south gate.
//   town.map   the town: 36 x 26 blocks, scrolling, Yana full size, streets and houses 3 blocks wide. The south gate is
//              a link back to the world (landing beside the town block, not at the world's start); the door of one
//              house is a link into the house, behind a yard gate that needs the keys lying on the world map.
//   house.map  inside that house: 18 x 12 blocks. Its door is a link that lands Yana in the yard, outside the door she
//              came in by (not at the town gate); its far door is the way out of the game.
import { Book } from '../../kit/starter/book';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { Sign } from '../../kit/starter/sign';
import { addOverBlocks, type Ground } from '../../overhead/src/blocks';
import { OverMap } from '../../overhead/src/overMap';
import { SEA, addGroundSign, addWorldBlocks, landName } from './worldBlocks';

/** A block of a map, in world blocks (a map's own corner is ORIGIN). */
export type Spot = [number, number];
const at = (x: number, y: number): Spot => [x + ORIGIN, y + ORIGIN];

/** The words on every sign: [name, text, board width, board height, on 'land', 'grass' or 'floor']. */
const SIGNS = {
  scale: ['scale', 'A TOWN IS ONE BLOCK. STEP ON IT', 4, 3, 'land'],
  key: ['key', 'KEYS ARE DOWN THERE. TAKE THEM', 4, 2, 'land'],
  arrive: ['arrive', 'YOU LAND AT THE GATE, NOT THE START', 4, 2, 'grass'],
  big: ['big', 'HERE A HOUSE IS THREE BLOCKS WIDE', 4, 3, 'grass'],
  locked: ['locked', 'LOCKED. KEYS ARE ON THE WORLD MAP', 4, 2, 'grass'],
  gate: ['gate', 'THIS GATE LEADS TO THE WORLD', 4, 2, 'grass'],
  inside: ['inside', 'WALK OUT AND SEE WHERE YOU LAND', 4, 2, 'floor'],
  exit: ['exit', 'EXIT →', 3, 1, 'floor'],
} as const;
export type SignName = keyof typeof SIGNS;

export interface Level {
  file: string;
  title: string;
  map: OverMap;
}

// the world
export const WORLD_START: Spot = at(5, 7);
export const TOWN_BLOCK: Spot = at(9, 4);
/** Where Yana lands when she comes back from the town: the trail just below the town block. */
export const WORLD_BESIDE: Spot = at(9, 5);
export const KEY_BLOCK: Spot = at(18, 8);

// the town
export const TOWN_W = 36;
export const TOWN_H = 26;
/** The south gate's two road cells (the bottom row of the map). */
export const TOWN_GATE: Spot[] = [at(17, 25), at(18, 25)];
/** Where Yana lands when she comes in from the world: two blocks inside the gate. */
export const TOWN_LANDING: Spot = at(17, 23);
export const HOUSE_DOOR: Spot = at(21, 6);
/** Where Yana lands when she comes out of the house: the yard, just below the door. */
export const TOWN_YARD: Spot = at(21, 7);
export const YARD_GATE: Spot = at(21, 10);

// the house
export const HOUSE_W = 18;
export const HOUSE_H = 12;
export const HOUSE_LANDING: Spot = at(9, 9);
export const HOUSE_OUT: Spot = at(9, 11);
export const HOUSE_EXIT: Spot = at(17, 5);
export const HOUSE_COINS: Spot[] = [at(3, 6), at(14, 2), at(14, 9)];

export interface Links {
  title: Spot;
}

/** The block set, then every sign in it. */
export function buildBlocks(pal: Pal): {
  book: Book;
  signs: Record<SignName, Sign>;
  ground: Ground & { land: import('@lewismoten/gamemaker-sandbox-tools/kit/pixels').Pixels };
} {
  const book = new Book('bbl');
  const over = addOverBlocks(book, pal);
  const { land } = addWorldBlocks(book, pal, over.grass);
  const ground = { ...over, land };
  const signs = {} as Record<SignName, Sign>;
  for (const [key, [name, words, w, h, on]] of Object.entries(SIGNS)) signs[key as SignName] = addGroundSign(book, pal, on, ground[on], name, words, w, h);
  return { book, signs, ground };
}

const WORLD_ROWS = [
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~HH..........~~~~',
  '~~~~..HH.FF.....H.~~~~',
  '~~~...........FF..H~~~',
  '~~~......T.....F...~~~',
  '~~~......t.........~~~',
  '~~~......t.........~~~',
  '~~~..ttttt..FF.....~~~',
  '~~~~........FF....k.~~',
  '~~~~~.....H........~~~',
  '~~~~~~~...HH....~~~~~~',
  '~~~~~~~~~.......~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~',
];

/** The world map: sea round a small country; shores are worked out from where land meets sea. */
function worldLevel(book: Book, s: Record<SignName, Sign>): OverMap {
  const h = WORLD_ROWS.length;
  const w = WORLD_ROWS[0].length;
  const isSea = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || WORLD_ROWS[y][x] === '~';
  const legend: Record<string, string> = { '~': 'sea', H: 'hill', F: 'forest', T: 'town', k: 'wkey' };
  const joins = (x: number, y: number) => 'tT'.includes(WORLD_ROWS[y]?.[x] ?? '~');
  const rows = WORLD_ROWS.map((row, y) =>
    [...row]
      .map((ch, x) => {
        if (ch === 't') {
          // a trail leads to each trail or the town block next to it
          const mask = (joins(x, y - 1) ? SEA.N : 0) | (joins(x + 1, y) ? SEA.E : 0) | (joins(x, y + 1) ? SEA.S : 0) | (joins(x - 1, y) ? SEA.W : 0);
          const ch2 = String.fromCharCode(0x100 + mask);
          legend[ch2] = `trail.${mask}`;
          return ch2;
        }
        if (ch !== '.') return ch;
        const mask = (isSea(x, y - 1) ? SEA.N : 0) | (isSea(x + 1, y) ? SEA.E : 0) | (isSea(x, y + 1) ? SEA.S : 0) | (isSea(x - 1, y) ? SEA.W : 0);
        const ch2 = String.fromCharCode(97 + mask);
        legend[ch2] = landName(mask);
        return ch2;
      })
      .join(''),
  );
  const m = new OverMap(book, rows, legend, 'sea');
  m.sign(4, 3, s.scale).sign(14, 6, s.key);
  return m;
}

const TOWN_LEGEND: Record<string, string> = {
  '.': 'grass',
  T: 'tree',
  r: 'road',
  f: 'flower',
  F: 'fence',
  '~': 'water',
  g: 'gate',
  x: 'house.00',
  y: 'house.10',
  z: 'house.20',
  l: 'house.01',
  m: 'house.11',
  n: 'house.21',
  h: 'hdoor',
};

/** A house 3 blocks wide and 2 high with its top left at (x, y): a plain wall, or a door in the middle. */
function house(g: Grid, x: number, y: number, door: boolean): void {
  g.put(x, y, 'x')
    .put(x + 1, y, 'y')
    .put(x + 2, y, 'z');
  g.put(x, y + 1, 'l')
    .put(x + 1, y + 1, door ? 'h' : 'm')
    .put(x + 2, y + 1, 'n');
}

/** The town: a ring of trees, a main street from the south gate, a cross street, four plain houses and one with a gated yard. */
function townLevel(book: Book, s: Record<SignName, Sign>): OverMap {
  const g = new Grid(TOWN_W, TOWN_H);
  g.fill(0, 0, TOWN_W, TOWN_H, '.');
  g.row(0, 0, TOWN_W - 1, 'T')
    .row(TOWN_H - 1, 0, TOWN_W - 1, 'T')
    .col(0, 0, TOWN_H - 1, 'T')
    .col(TOWN_W - 1, 0, TOWN_H - 1, 'T');
  g.fill(17, 2, 2, TOWN_H - 2, 'r');
  g.fill(17, TOWN_H - 1, 2, 1, 'r');
  g.fill(3, 14, 30, 2, 'r');
  // the house with the yard: fence all round, the gate in the bottom row, a path down to the cross street
  house(g, 20, 5, true);
  g.row(3, 19, 25, 'F').row(10, 19, 25, 'F').col(19, 3, 10, 'F').col(25, 3, 10, 'F');
  g.put(21, 10, 'g');
  g.fill(21, 11, 1, 3, 'r');
  // four plain houses along the cross street, each with a wall where a door would be
  house(g, 6, 10, false);
  house(g, 11, 7, false);
  house(g, 27, 18, false);
  house(g, 6, 19, false);
  g.fill(6, 12, 3, 1, 'r').fill(7, 13, 1, 1, 'r');
  // a pond with flowers, a few trees and flowers about
  g.fill(28, 6, 3, 2, '~');
  for (const [x, y] of [
    [27, 5],
    [31, 8],
    [26, 8],
    [4, 6],
    [14, 18],
    [24, 20],
    [10, 22],
    [30, 22],
    [3, 24],
  ] as const)
    g.put(x, y, 'f');
  for (const [x, y] of [
    [3, 3],
    [4, 3],
    [3, 4],
    [30, 3],
    [31, 3],
    [31, 4],
    [4, 21],
    [3, 22],
    [32, 24],
    [31, 24],
  ] as const)
    g.put(x, y, 'T');
  const m = new OverMap(book, g.rows(), TOWN_LEGEND, 'tree');
  m.sign(12, 21, s.arrive).sign(20, 18, s.big).sign(22, 11, s.locked).sign(12, 17, s.gate);
  return m;
}

const HOUSE_LEGEND: Record<string, string> = {
  ' ': 'floor',
  '#': 'wall',
  '=': 'rug',
  B: 'bed.00',
  b: 'bed.01',
  T: 'table.00',
  t: 'table.10',
  u: 'table.01',
  v: 'table.11',
  H: 'shelf',
  P: 'plant',
  D: 'door',
  c: 'coin',
};

/** The house: one big room with a bed, a table on a rug, shelves and plants, three coins, a door out and an exit door. */
function houseLevel(book: Book, s: Record<SignName, Sign>): OverMap {
  const g = new Grid(HOUSE_W, HOUSE_H);
  g.row(0, 0, HOUSE_W - 1, '#')
    .row(HOUSE_H - 1, 0, HOUSE_W - 1, '#')
    .col(0, 0, HOUSE_H - 1, '#')
    .col(HOUSE_W - 1, 0, HOUSE_H - 1, '#');
  g.put(2, 2, 'B').put(2, 3, 'b');
  g.row(1, 6, 10, 'H');
  g.put(15, 1, 'P').put(1, 10, 'P').put(15, 10, 'P');
  g.fill(7, 4, 6, 4, '=');
  g.put(9, 5, 'T').put(10, 5, 't').put(9, 6, 'u').put(10, 6, 'v');
  for (const [x, y] of HOUSE_COINS) g.put(x - ORIGIN, y - ORIGIN, 'c');
  g.put(HOUSE_OUT[0] - ORIGIN, HOUSE_OUT[1] - ORIGIN, 'D');
  g.put(HOUSE_EXIT[0] - ORIGIN, HOUSE_EXIT[1] - ORIGIN, 'D');
  const m = new OverMap(book, g.rows(), HOUSE_LEGEND, 'wall');
  m.sign(3, 7, s.inside).sign(14, 6, s.exit);
  return m;
}

/** The block set, the palette and the three maps. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'town-links');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'world', title: 'The World Map', map: worldLevel(book, signs) },
    { file: 'town', title: 'The Town', map: townLevel(book, signs) },
    { file: 'house', title: 'The House', map: houseLevel(book, signs) },
  ];
  return { book, pal, levels };
}
