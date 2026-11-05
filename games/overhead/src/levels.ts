// OVERHEAD's two levels, both drawn from above with gravity off (every block has Gravity "none").
//
//   1. The Room: one map (one.map), a room 26 x 14 blocks with scrolling on. Lami faces the way she walks, the walls
//      and furniture you can see are solid, and a door in the right-hand wall takes her on.
//   2. The Four Roads: one map (world.map) of five 16 x 10 areas, each its own scene with scrolling off, like the
//      windows of ROOMS ON ONE MAP. Meadow, Woods, Village and Pond are joined in a ring by their map edges: the
//      road runs off the edge of one area and a scene link (a link on the edge blocks) lands Lami in the middle of the
//      next. The village has a house whose door is a link into a Shop (a fifth area), which has a way back and the
//      way out of the level.
import { Book } from '../../kit/starter/book';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { Sign } from '../../kit/starter/sign';
import { addOverBlocks, addOverSign, type Ground } from './blocks';
import { OverMap } from './overMap';

/** A block of the map, in world blocks (a level's own corner is ORIGIN). */
export type Spot = [number, number];
const at = (x: number, y: number): Spot => [x + ORIGIN, y + ORIGIN];

/** The words on every sign: [name, text, board width, board height, on 'floor' or 'grass']. */
const SIGNS = {
  // the room
  arrows: ['arrows', 'THE ARROWS WALK UP, DOWN, LEFT AND RIGHT', 4, 3, 'floor'],
  facing: ['facing', 'LAMI TURNS TO FACE THE WAY SHE WALKS', 4, 3, 'floor'],
  solid: ['solid', 'FURNITURE IS SOLID. WALK ROUND IT', 4, 3, 'floor'],
  wallsign: ['wallsign', 'SEE A WALL? IT IS A WALL. DOOR →', 4, 3, 'floor'],
  // the roads
  middle: ['middle', 'LAMI STARTS IN THE MIDDLE OF A SCREEN', 4, 3, 'grass'],
  edge: ['edge', 'OFF THE EDGE IS A LINK', 4, 2, 'grass'],
  both: ['both', 'EDGE LINKS GO BOTH WAYS', 4, 2, 'grass'],
  door: ['door', 'A DOOR IS A LINK TOO. WALK IN', 4, 2, 'grass'],
  water: ['water', 'WATER IS SOLID. WALK ROUND', 4, 2, 'grass'],
  back: ['back', 'THIS DOOR GOES BACK TO THE VILLAGE', 4, 2, 'floor'],
  out: ['out', 'EXIT →', 3, 1, 'floor'],
} as const;
export type SignName = keyof typeof SIGNS;

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: OverMap;
}

/** One area of the roads: a scene, the window of the map it shows, and the cell the hero lands on (its middle). */
export interface Area {
  id: string;
  title: string;
  /** The window's top-left block, in level blocks. */
  rl: number;
  rt: number;
  /** The cell the hero lands on, in world blocks. */
  landing: Spot;
}

/** An area is 16 blocks wide and 10 high; the hero lands in its middle (8, 5). */
export const AREA_W = 16;
export const AREA_H = 10;
export const LAND: Spot = [8, 5];

// level 1
export const ROOM_W = 26;
export const ROOM_H = 14;
export const START_ONE: Spot = [3, 7];
export const DOOR_ONE: Spot = [25, 7];
export const TABLE = { x: 12, y: 6 };
export const COINS_ONE: Spot[] = [
  [10, 5],
  [15, 5],
  [10, 8],
  [15, 8],
];

// level 2: the areas in the world, by grid position
export const AREAS: Area[] = [
  { id: 'meadow', title: 'Meadow', gx: 0, gy: 1 },
  { id: 'woods', title: 'Woods', gx: 0, gy: 0 },
  { id: 'village', title: 'Village', gx: 1, gy: 0 },
  { id: 'pond', title: 'Pond', gx: 1, gy: 1 },
  { id: 'shop', title: 'Shop', gx: 2, gy: 0 },
].map(({ id, title, gx, gy }) => ({
  id,
  title,
  rl: gx * AREA_W,
  rt: gy * AREA_H,
  landing: at(gx * AREA_W + LAND[0], gy * AREA_H + LAND[1]),
}));
export const area = (id: string): Area => AREAS.find((a) => a.id === id)!;

/**
 * The cells a road is left by: two blocks wide, in the middle of its side. A screen that does not scroll never lets the hero onto
 * its top row or left column (chkscrnbounds, PLAYGAME.C), so the north and west links sit one block in; the east and south are the edge.
 */
export type Side = 'N' | 'E' | 'S' | 'W';
export function edgeCells(a: Area, side: Side): Spot[] {
  const [x, y] = { N: [7, 1], E: [15, 4], S: [7, 9], W: [1, 4] }[side];
  return side === 'N' || side === 'S' ? [at(a.rl + x, a.rt + y), at(a.rl + x + 1, a.rt + y)] : [at(a.rl + x, a.rt + y), at(a.rl + x, a.rt + y + 1)];
}
/** The village door and the shop's two doors, in world blocks. */
export const VILLAGE_DOOR = (): Spot => at(area('village').rl + 8, area('village').rt + 2);
export const SHOP_BACK = (): Spot => at(area('shop').rl + 8, area('shop').rt + 9);
export const SHOP_OUT = (): Spot => at(area('shop').rl + 15, area('shop').rt + 5);

/** Where the roads' coins lie (local cells of their area). */
export const COINS_TWO: Record<string, Spot[]> = {
  woods: [
    [2, 7],
    [4, 7],
    [6, 7],
  ],
  pond: [
    [9, 8],
    [11, 8],
    [13, 8],
  ],
  shop: [
    [3, 6],
    [13, 7],
    [13, 2],
  ],
};

/** Every link of the roads: leave `from` by `side` (or its door) and land on `to`'s middle. */
export interface Link {
  from: string;
  via: Side | 'door' | 'back' | 'out';
  to: string;
}
export const LINKS: Link[] = [
  { from: 'meadow', via: 'N', to: 'woods' },
  { from: 'meadow', via: 'E', to: 'pond' },
  { from: 'woods', via: 'S', to: 'meadow' },
  { from: 'woods', via: 'E', to: 'village' },
  { from: 'village', via: 'W', to: 'woods' },
  { from: 'village', via: 'S', to: 'pond' },
  { from: 'village', via: 'door', to: 'shop' },
  { from: 'pond', via: 'W', to: 'meadow' },
  { from: 'pond', via: 'N', to: 'village' },
  { from: 'shop', via: 'back', to: 'village' },
  { from: 'shop', via: 'out', to: 'end' },
];

/** The cells whose touch fires a link. */
export function fromCells(l: Link): Spot[] {
  const a = area(l.from);
  if (l.via === 'door') return [VILLAGE_DOOR()];
  if (l.via === 'back') return [SHOP_BACK()];
  if (l.via === 'out') return [SHOP_OUT()];
  return edgeCells(a, l.via);
}

/** The block set, then every sign in it. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign>; ground: Ground } {
  const book = new Book('bbl');
  const ground = addOverBlocks(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const [key, [name, words, w, h, on]] of Object.entries(SIGNS)) signs[key as SignName] = addOverSign(book, pal, ground[on], name, words, w, h);
  return { book, signs, ground };
}

const LEGEND_ONE: Record<string, string> = {
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

/** Level 1: a room with a bed, a table on a rug, shelves, plants and a door, seen from above. */
function roomLevel(book: Book, s: Record<SignName, Sign>): OverMap {
  const g = new Grid(ROOM_W, ROOM_H);
  g.row(0, 0, ROOM_W - 1, '#')
    .row(ROOM_H - 1, 0, ROOM_W - 1, '#')
    .col(0, 0, ROOM_H - 1, '#')
    .col(ROOM_W - 1, 0, ROOM_H - 1, '#');
  g.put(2, 2, 'B').put(2, 3, 'b');
  g.row(1, 6, 10, 'H');
  g.put(23, 1, 'P').put(1, 12, 'P').put(23, 12, 'P');
  g.fill(10, 5, 6, 4, '=');
  g.put(TABLE.x, TABLE.y, 'T')
    .put(TABLE.x + 1, TABLE.y, 't')
    .put(TABLE.x, TABLE.y + 1, 'u')
    .put(TABLE.x + 1, TABLE.y + 1, 'v');
  for (const [x, y] of COINS_ONE) g.put(x, y, 'c');
  g.put(DOOR_ONE[0], DOOR_ONE[1], 'D');
  const m = new OverMap(book, g.rows(), LEGEND_ONE, 'wall');
  m.sign(3, 9, s.arrows).sign(9, 9, s.facing);
  m.sign(13, 1, s.solid).sign(19, 8, s.wallsign);
  return m;
}

const LEGEND_TWO: Record<string, string> = {
  T: 'tree',
  '.': 'grass',
  r: 'road',
  f: 'flower',
  F: 'fence',
  '~': 'water',
  c: 'gcoin',
  w: 'wall',
  ',': 'floor',
  q: 'rug',
  H: 'shelf',
  K: 'counter',
  P: 'plant',
  D: 'door',
  C: 'coin',
  x: 'house.00',
  y: 'house.10',
  z: 'house.20',
  l: 'house.01',
  h: 'hdoor',
  n: 'house.21',
};

/** An outdoor area: grass inside a ring of trees, a plaza in the middle and a road to each side it opens on. */
function outdoors(g: Grid, a: Area, sides: Side[]): void {
  const { rl, rt } = a;
  g.fill(rl, rt, AREA_W, AREA_H, '.');
  g.row(rt, rl, rl + 15, 'T')
    .row(rt + 9, rl, rl + 15, 'T')
    .col(rl, rt, rt + 9, 'T')
    .col(rl + 15, rt, rt + 9, 'T');
  g.fill(rl + 7, rt + 4, 2, 2, 'r');
  for (const s of sides) {
    if (s === 'E') g.fill(rl + 8, rt + 4, 8, 2, 'r');
    if (s === 'W') g.fill(rl, rt + 4, 8, 2, 'r');
    if (s === 'N') g.fill(rl + 7, rt, 2, 6, 'r');
    if (s === 'S') g.fill(rl + 7, rt + 4, 2, 6, 'r');
  }
}

/** Level 2: five areas on one map. */
function worldLevel(book: Book, s: Record<SignName, Sign>): OverMap {
  const g = new Grid(3 * AREA_W, 2 * AREA_H);
  g.fill(0, 0, 3 * AREA_W, 2 * AREA_H, 'T');
  const L = (id: string, lx: number, ly: number, ch: string) => g.put(area(id).rl + lx, area(id).rt + ly, ch);
  const meadow = area('meadow');
  const woods = area('woods');
  const village = area('village');
  const pond = area('pond');
  const shop = area('shop');
  outdoors(g, meadow, ['N', 'E']);
  outdoors(g, woods, ['S', 'E']);
  outdoors(g, village, ['S', 'W']);
  outdoors(g, pond, ['W', 'N']);
  // meadow: flowers and a little copse
  for (const [x, y] of [
    [3, 2],
    [12, 2],
    [4, 8],
    [11, 8],
    [13, 7],
  ])
    L('meadow', x, y, 'f');
  for (const [x, y] of [
    [10, 1],
    [11, 1],
    [11, 2],
    [2, 1],
    [3, 1],
  ])
    L('meadow', x, y, 'T');
  // woods: the trees crowd in, a clearing with coins
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 6; x++) if ((x * 3 + y * 5) % 4) L('woods', x, y, 'T');
  for (let y = 1; y <= 3; y++) for (let x = 10; x <= 14; x++) if ((x + y * 2) % 3) L('woods', x, y, 'T');
  for (const [x, y] of COINS_TWO.woods) L('woods', x, y, 'c');
  // village: a house, fences, flowers
  g.put(village.rl + 7, village.rt + 1, 'x')
    .put(village.rl + 8, village.rt + 1, 'y')
    .put(village.rl + 9, village.rt + 1, 'z');
  g.put(village.rl + 7, village.rt + 2, 'l')
    .put(village.rl + 8, village.rt + 2, 'h')
    .put(village.rl + 9, village.rt + 2, 'n');
  g.put(village.rl + 8, village.rt + 3, 'r');
  g.row(village.rt + 7, village.rl + 1, village.rl + 5, 'F').row(village.rt + 2, village.rl + 1, village.rl + 5, 'F');
  for (const [x, y] of [
    [3, 3],
    [4, 6],
    [11, 7],
    [13, 2],
  ])
    L('village', x, y, 'f');
  // pond: a pond with coins along its shore
  g.fill(pond.rl + 10, pond.rt + 2, 5, 6, '~');
  for (const [x, y] of COINS_TWO.pond) L('pond', x, y, 'c');
  for (const [x, y] of [
    [3, 2],
    [4, 2],
    [2, 3],
  ])
    L('pond', x, y, 'T');
  for (const [x, y] of [
    [5, 7],
    [3, 8],
  ])
    L('pond', x, y, 'f');
  // shop: walls, a counter in front of the shelves, a rug, plants, coins, two doors
  g.fill(shop.rl, shop.rt, AREA_W, AREA_H, 'w');
  g.fill(shop.rl + 1, shop.rt + 1, 14, 8, ',');
  g.row(shop.rt + 1, shop.rl + 3, shop.rl + 12, 'H').row(shop.rt + 3, shop.rl + 4, shop.rl + 11, 'K');
  g.fill(shop.rl + 5, shop.rt + 5, 4, 2, 'q');
  L('shop', 1, 1, 'P');
  L('shop', 14, 1, 'P');
  L('shop', 1, 8, 'P');
  L('shop', 8, 9, 'D');
  L('shop', 15, 5, 'D');
  for (const [x, y] of COINS_TWO.shop) L('shop', x, y, 'C');
  const m = new OverMap(book, g.rows(), LEGEND_TWO, 'tree');
  const sign = (id: string, lx: number, ly: number, name: SignName) => m.sign(area(id).rl + lx, area(id).rt + ly, s[name]);
  sign('meadow', 1, 5, 'middle');
  sign('meadow', 9, 6, 'edge');
  sign('woods', 9, 6, 'both');
  sign('village', 10, 4, 'door');
  sign('pond', 1, 6, 'water');
  sign('shop', 9, 6, 'back');
  sign('shop', 12, 3, 'out');
  return m;
}

/** The block set, the palette and the two levels. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'overhead');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'The Room', hint: 'Walls you can see.', map: roomLevel(book, signs) },
    { file: 'world', title: 'The Four Roads', hint: 'Off the edge is a link.', map: worldLevel(book, signs) },
  ];
  return { book, pal, levels };
}
