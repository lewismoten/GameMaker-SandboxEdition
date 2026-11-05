// ROOMS ON ONE MAP's levels. A map is 100 x 100 blocks, and a scene shows only a window of it: 16 x 10
// blocks around the cell the hero lands on, when its scroll is switched off. So one map holds many rooms,
// each a 16 x 10 cell with colored brick walls, and each room is its own scene: the same .MAP file, a
// different landing cell. A door is a scene link whose "To" lands in another cell of the same map.
//
//   Level 1, Four Rooms: a 2 x 2 map of the red, blue, green and gold rooms. Red's door lands in blue; blue's door
//     lands in green, which is across the map, not next door; green has a door back to blue and one on to gold.
//   Level 2, One Landing Cell: a strip of three rooms on a second map. Every door into the hub lands on the same
//     cell of it, so it always looks the same, and its coins are back each time you return.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addRoomBricks, wallOf, type RoomColor } from './roomBrick';

const SIGNS = {
  four: ['four', 'FOUR ROOMS ONE MAP', 4],
  lands: ['lands', 'THIS DOOR LANDS IN ANOTHER CELL', 4],
  skips: ['skips', 'THIS DOOR SKIPS TO THE OTHER SIDE', 4],
  back: ['back', 'THIS DOOR GOES BACK TO BLUE', 4],
  on: ['on', 'THIS ONE GOES ON', 4],
  exit: ['exit', 'EXIT →', 3],
  here: ['here', '← ALL DOORS IN LAND HERE', 4],
  view: ['view', 'THE VIEW STARTS WHERE YOU LAND', 4],
  fresh: ['fresh', 'BACK IN THE HUB THE COINS ARE BACK', 4],
  once: ['once', 'KEEP PRIZES WHERE YOU GO ONCE', 4],
} as const;
export type SignName = keyof typeof SIGNS;

/** A block of the map, in world blocks (the level's own corner is ORIGIN). */
export type Spot = [number, number];

/** One room: a scene, with the window of the map it shows. */
export interface Room {
  /** The scene's key. */
  id: string;
  /** The map file it loads (without .map). */
  file: string;
  /** The scene's name (19 characters at most). */
  title: string;
  /** Blocks that take the hero away when touched, by name. */
  exits: Record<string, Spot>;
  /** The cell the hero lands on (his feet), which is also the middle of the screen. */
  landing: Spot;
}

/** A map and the rooms on it. */
export interface MapFile {
  file: string;
  map: StarterMap;
}

/** What a level card says. `n` of 2, shown before the `before` room starts or after the `after` room ends. */
export interface Card {
  file: string;
  n: number;
  title: string;
  hint: string;
  before?: string;
  after?: string;
}

/** A room is 16 blocks wide and 10 high; its ground is row 6, so the hero's feet stand on row 5 and the window opens on its top row. */
export const ROOM_W = 16;
export const ROOM_H = 10;
export const FLOOR = 6;
/** The column of a room where the hero lands (the middle of the window). */
export const LAND_X = 8;
const at = (x: number, y: number): Spot => [x + ORIGIN, y + ORIGIN];
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The block set every room shares: the Starter blocks, the four room bricks, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addRoomBricks(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const [key, [name, words, w]] of Object.entries(SIGNS)) signs[key as SignName] = addSign(book, pal, name, words, w, key === 'exit' ? 1 : 2);
  return { book, signs };
}

/** A room's local cell (lx, ly) in map coordinates, for a room whose top-left block is (rl, rt). */
interface Spot0 {
  rl: number;
  rt: number;
}
const door = (g: Grid, r: Spot0, lx: number) => g.put(r.rl + lx, r.rt + FLOOR - 2, 'e').put(r.rl + lx, r.rt + FLOOR - 1, 'E');
const doorway = (g: Grid, r: Spot0) => g.put(r.rl + LAND_X, r.rt + FLOOR - 2, 's').put(r.rl + LAND_X, r.rt + FLOOR - 1, 'S');

/** The ground, ceiling and side walls of a room, and some scenery. The walls are painted in their color later (tint). */
function paintRoom(g: Grid, r: Spot0, clouds: number[], bushes: number[], flowers: number[]): void {
  const { rl, rt } = r;
  g.row(rt + FLOOR, rl, rl + ROOM_W - 1, 'G').fill(rl, rt + FLOOR + 1, ROOM_W, ROOM_H - FLOOR - 1, 'D');
  g.row(rt, rl, rl + ROOM_W - 1, 'B').col(rl, rt, rt + FLOOR - 1, 'B').col(rl + ROOM_W - 1, rt, rt + FLOOR - 1, 'B');
  clouds.forEach((lx, i) => g.put(rl + lx, rt + 1 + (i % 2), '(').put(rl + lx + 1, rt + 1 + (i % 2), ')'));
  for (const lx of bushes) g.put(rl + lx, rt + FLOOR - 1, 'b');
  for (const lx of flowers) g.put(rl + lx, rt + FLOOR - 1, 'f');
}

/** Paints a room's ceiling and walls in its color. */
function tint(m: StarterMap, r: Spot0, color: RoomColor): void {
  const name = wallOf(color);
  for (let x = 0; x < ROOM_W; x++) m.set(r.rl + x, r.rt, name);
  for (let y = 0; y < FLOOR; y++) m.set(r.rl, r.rt + y, name).set(r.rl + ROOM_W - 1, r.rt + y, name);
}

/** The map of a set of rooms; the entrance (S) the map wants is the first room's landing. */
function built(book: Book, g: Grid, start: Spot): StarterMap {
  const m = new StarterMap(book, g.rows());
  m.start = at(start[0], start[1]);
  return m;
}

const sign = (m: StarterMap, r: Spot0, lx: number, s: Sign) => m.sign(r.rl + lx, r.rt + onGround(FLOOR, s), s);
const coinRow = (g: Grid, r: Spot0, from: number, to: number) => g.row(r.rt + FLOOR - 1, r.rl + from, r.rl + to, 'c');

type Rooms = Record<string, Spot0>;
const landingOf = (r: Spot0): Spot => at(r.rl + LAND_X, r.rt + FLOOR - 1);
const exitOf = (r: Spot0, lx: number): Spot => at(r.rl + lx, r.rt + FLOOR - 1);

/** Level 1: four rooms in a 2 x 2 block: red (top left), blue (top right), green (bottom left), gold (bottom right). */
function mapOne(book: Book, s: Record<SignName, Sign>): { file: MapFile; rooms: Room[] } {
  const R: Rooms = { red: { rl: 0, rt: 0 }, blue: { rl: 16, rt: 0 }, green: { rl: 0, rt: 10 }, gold: { rl: 16, rt: 10 } };
  const g = new Grid(32, 20);
  paintRoom(g, R.red, [3, 11], [10], [6]);
  paintRoom(g, R.blue, [4, 12], [6], [11]);
  paintRoom(g, R.green, [9, 12], [3], [14]);
  paintRoom(g, R.gold, [3, 10], [13], [8]);
  for (const r of Object.values(R)) doorway(g, r);
  door(g, R.red, 13);
  door(g, R.blue, 13);
  door(g, R.green, 2);
  door(g, R.green, 13);
  door(g, R.gold, 13);
  coinRow(g, R.red, 6, 7);
  coinRow(g, R.blue, 3, 4);
  coinRow(g, R.gold, 3, 6);
  const m = built(book, g, [R.red.rl + LAND_X, R.red.rt + FLOOR - 1]);
  (['red', 'blue', 'green', 'gold'] as const).forEach((c) => tint(m, R[c], c));
  sign(m, R.red, 2, s.four);
  sign(m, R.red, 9, s.lands);
  sign(m, R.blue, 9, s.skips);
  sign(m, R.green, 4, s.back);
  sign(m, R.green, 9, s.on);
  sign(m, R.gold, 9, s.exit);
  const room = (id: string, title: string, r: Spot0, exits: Room['exits']): Room => ({ id, file: 'one', title, exits, landing: landingOf(r) });
  return {
    file: { file: 'one', map: m },
    rooms: [
      room('red', 'Red Room', R.red, { door: exitOf(R.red, 13) }),
      room('blue', 'Blue Room', R.blue, { door: exitOf(R.blue, 13) }),
      room('green', 'Green Room', R.green, { back: exitOf(R.green, 2), on: exitOf(R.green, 13) }),
      room('gold', 'Gold Room', R.gold, { out: exitOf(R.gold, 13) }),
    ],
  };
}

/** Level 2: a strip of three rooms: west (green), the hub (red) and east (blue). */
function mapTwo(book: Book, s: Record<SignName, Sign>): { file: MapFile; rooms: Room[] } {
  const R: Rooms = { west: { rl: 0, rt: 0 }, hub: { rl: 16, rt: 0 }, east: { rl: 32, rt: 0 } };
  const g = new Grid(48, 10);
  paintRoom(g, R.west, [3, 11], [10], [6]);
  paintRoom(g, R.hub, [4, 11], [10], [11]);
  paintRoom(g, R.east, [8, 12], [4], [10]);
  for (const r of Object.values(R)) doorway(g, r);
  door(g, R.west, 13);
  door(g, R.hub, 2);
  door(g, R.hub, 13);
  door(g, R.east, 13);
  coinRow(g, R.hub, 4, 6);
  const m = built(book, g, [R.hub.rl + LAND_X, R.hub.rt + FLOOR - 1]);
  tint(m, R.west, 'green');
  tint(m, R.hub, 'red');
  tint(m, R.east, 'blue');
  sign(m, R.hub, 9, s.here);
  sign(m, R.west, 2, s.view);
  sign(m, R.west, 9, s.fresh);
  sign(m, R.east, 2, s.once);
  sign(m, R.east, 9, s.exit);
  const room = (id: string, title: string, r: Spot0, exits: Room['exits']): Room => ({ id, file: 'two', title, exits, landing: landingOf(r) });
  return {
    file: { file: 'two', map: m },
    rooms: [
      room('hub', 'The Hub', R.hub, { west: exitOf(R.hub, 2), east: exitOf(R.hub, 13) }),
      room('west', 'West Room', R.west, { back: exitOf(R.west, 13) }),
      room('east', 'East Room', R.east, { out: exitOf(R.east, 13) }),
    ],
  };
}

/** One scene link: leave `from`'s exit, land on `to`'s landing cell. `to` is a room's id, or 'end' for the ending. */
export interface Link {
  from: string;
  exit: string;
  to: string;
}

export const LINKS: Link[] = [
  { from: 'red', exit: 'door', to: 'blue' },
  { from: 'blue', exit: 'door', to: 'green' },
  { from: 'green', exit: 'back', to: 'blue' },
  { from: 'green', exit: 'on', to: 'gold' },
  { from: 'gold', exit: 'out', to: 'hub' },
  { from: 'hub', exit: 'west', to: 'west' },
  { from: 'west', exit: 'back', to: 'hub' },
  { from: 'hub', exit: 'east', to: 'east' },
  { from: 'east', exit: 'out', to: 'end' },
];

/** The level cards: one before the red room, one when the gold room is left (the hub is entered more than once). */
export const CARDS: Card[] = [
  { file: 'card1', n: 1, title: 'Four Rooms', hint: 'Four rooms, one map.', before: 'red' },
  { file: 'card2', n: 2, title: 'One Landing Cell', hint: 'Every door lands in one cell.', after: 'gold' },
];

/** The coins' columns in the hub (level coordinates) and the row they lie on. */
export const HUB_COINS = { from: 20, to: 22, row: FLOOR - 1 };

/** The maps, the rooms in scene order (scene 2 on), and the pal and blocks they share. */
export function buildLevels(): { book: Book; pal: Pal; levels: MapFile[]; rooms: Room[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const one = mapOne(book, signs);
  const two = mapTwo(book, signs);
  return { book, pal, levels: [one.file, two.file], rooms: [...one.rooms, ...two.rooms] };
}
