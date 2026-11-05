// NEAR AND FAR's levels. Each plane is its own scene: a near scene shows big, clear scenery, and a far scene
// shows the same kind of land drawn small and loads a paler palette. A trail (a link) takes Mara from one
// to the other; no scene shows both planes at once. A scene shows a 16 x 10 window of its map around the
// cell Mara lands on (scrolling is off), so a 32 wide map can hold two windows.
//
//   Level 1, Into the Distance: the near plane (a big tree, coins, a trail through a hedge) and the far plane
//     (small things, coins, a trail back, and the exit). Mara steps into the distance and out again.
//   Level 2, Past the Cliff: a cliff stands in the way in the near plane. The far plane has no cliff, so Mara
//     goes into the distance, walks past where it is, and steps out near on the other side.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addScenery, type Scenery } from './scenery';

const SIGNS = {
  nearIs: ['nearIs', 'NEAR IS BIG AND CLEAR', 4],
  trail: ['trail', 'THE TRAIL GOES INTO THE DISTANCE', 4],
  farIs: ['farIs', 'FAR IS SMALL AND PALE', 3],
  backNear: ['backNear', 'BACK TO NEAR', 3],
  cliff: ['cliff', 'A CLIFF IS IN THE WAY. TRY THE TRAIL', 4],
  noCliff: ['noCliff', 'NO CLIFF HERE', 3],
  comesOut: ['comesOut', 'IT COMES OUT PAST THE CLIFF', 4],
  past: ['past', 'PAST THE CLIFF AT LAST', 4],
} as const;
export type SignName = keyof typeof SIGNS;

/** A block of the map, in world blocks. */
export type Spot = [number, number];

/** One scene: a window of a map, near or far. */
export interface Room {
  /** The scene's key. */
  id: string;
  /** The map file it loads (without .map). */
  file: string;
  /** The scene's name (19 characters at most). */
  title: string;
  /** Which plane it shows; the far plane loads the paler palette. */
  plane: 'near' | 'far';
  /** Blocks that take Mara away when touched, by name. */
  exits: Record<string, Spot>;
  /** The cell Mara lands on (her feet), which is also the middle of the screen. */
  landing: Spot;
}

/** A map file. */
export interface MapFile {
  file: string;
  map: StarterMap;
}

/** What a level card says. `n` of 2, shown before the `before` room starts. */
export interface Card {
  file: string;
  n: number;
  title: string;
  hint: string;
  before: string;
}

/** A window is 16 blocks wide and 10 high; the ground is row 6, so Mara's feet stand on row 5. */
export const FLOOR = 6;
export const FEET = FLOOR - 1;
/** The column of a window where Mara lands (its middle). */
export const LAND_X = 8;
const at = (x: number, y: number): Spot => [x + ORIGIN, y + ORIGIN];
const onGround = (s: Sign) => FLOOR - 1 - s.board.length;

/** The block set every scene shares: the Starter blocks, the near and far scenery, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign>; art: Scenery } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const art = addScenery(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const [key, [name, words, w]] of Object.entries(SIGNS)) signs[key as SignName] = addSign(book, pal, name, words, w, 2);
  return { book, signs, art };
}

/** The ground of a `width` x 10 map, with a hedge wall at each end (left window edge `from`, right `to`). */
function ground(g: Grid, width: number): void {
  g.row(FLOOR, 0, width - 1, 'G').fill(0, FLOOR + 1, width, 10 - FLOOR - 1, 'D');
}
const hedge = (g: Grid, x: number) => g.col(x, 0, FLOOR - 1, 'X');
const doorway = (g: Grid, x: number) => g.put(x, FLOOR - 2, 's').put(x, FLOOR - 1, 'S');
const door = (g: Grid, x: number) => g.put(x, FLOOR - 2, 'e').put(x, FLOOR - 1, 'E');
const coins = (g: Grid, x0: number, x1: number) => g.row(FEET, x0, x1, 'c');
const cloud = (g: Grid, x: number, y: number) => g.put(x, y, '(').put(x + 1, y, ')');

/** Puts a picture's blocks (rows of names) with its top-left at level (x, y). */
function stamp(m: StarterMap, x: number, y: number, names: string[][]): void {
  names.forEach((row, dy) => row.forEach((n, dx) => m.set(x + dx, y + dy, n)));
}
const sign = (m: StarterMap, x: number, s: Sign) => m.sign(x, onGround(s), s);

/** A map from a grid, starting where Mara first lands; the far plane's ground and hedges are swapped for its own. */
function built(book: Book, g: Grid, start: Spot, far: boolean): StarterMap {
  const m = new StarterMap(book, g.rows());
  m.start = at(start[0], start[1]);
  if (far)
    for (let x = 0; x < g.width; x++) {
      m.set(x, FLOOR, 'farGrass');
      for (let y = 0; y < FLOOR; y++) if (g.rows()[y][x] === 'X') m.set(x, y, 'farEdge');
    }
  return m;
}
/** Clears the entrance the map builder needs (an S) where the scene should just land Mara. */
const bare = (m: StarterMap, x: number) => m.set(x, FLOOR - 2, 'sky').set(x, FLOOR - 1, 'sky');

const room = (id: string, file: string, title: string, plane: Room['plane'], landing: number, exits: Room['exits']): Room => ({
  id,
  file,
  title,
  plane,
  exits,
  landing: at(landing, FEET),
});

const exitAt = (x: number): Spot => at(x, FEET);

/** Level 1: the near plane and the far plane, each 16 blocks wide. */
function mapOne(book: Book, s: Record<SignName, Sign>, a: Scenery): { files: MapFile[]; rooms: Room[] } {
  // near
  const gn = new Grid(16, 10);
  ground(gn, 16);
  hedge(gn, 0);
  hedge(gn, 15);
  doorway(gn, LAND_X);
  coins(gn, 10, 11);
  cloud(gn, 4, 1);
  cloud(gn, 11, 2);
  const near = built(book, gn, [LAND_X, FEET], false);
  stamp(near, 1, FLOOR - 3, a.bigTree);
  sign(near, 3, s.nearIs);
  sign(near, 9, s.trail);
  near.set(13, FEET, a.bigFence);
  stamp(near, 14, FLOOR - 2, a.trailInto);
  // far
  const gf = new Grid(16, 10);
  ground(gf, 16);
  hedge(gf, 0);
  hedge(gf, 15);
  doorway(gf, LAND_X);
  coins(gf, 9, 10);
  cloud(gf, 5, 2);
  cloud(gf, 12, 1);
  const far = built(book, gf, [LAND_X, FEET], true);
  bare(far, LAND_X);
  stamp(far, 1, FLOOR - 2, a.trailBack);
  sign(far, 2, s.backNear);
  sign(far, 5, s.farIs);
  stamp(far, 11, FLOOR - 1, a.farHouse);
  stamp(far, 13, FLOOR - 2, a.farTree);
  far.set(14, FLOOR - 2, 'doorTop').set(14, FEET, 'doorBottom');
  return {
    files: [
      { file: 'near1', map: near },
      { file: 'far1', map: far },
    ],
    rooms: [
      room('near1', 'near1', 'Near: the Trail', 'near', LAND_X, { trail: exitAt(14) }),
      room('far1', 'far1', 'Far: the Trail', 'far', LAND_X, { back: exitAt(1), out: exitAt(14) }),
      room('near1b', 'near1', 'Near Again', 'near', LAND_X, { trail: exitAt(14) }),
    ],
  };
}

/** Level 2: a 32 block near map (a cliff between its two windows), and a far plane with no cliff. */
function mapTwo(book: Book, s: Record<SignName, Sign>, a: Scenery): { files: MapFile[]; rooms: Room[] } {
  // near: window A is blocks 0 to 15, window B is blocks 16 to 31
  const gn = new Grid(32, 10);
  ground(gn, 32);
  hedge(gn, 0);
  hedge(gn, 31);
  gn.fill(13, 0, 6, FLOOR, 'X');
  doorway(gn, LAND_X);
  coins(gn, 9, 10);
  coins(gn, 25, 26);
  door(gn, 29);
  cloud(gn, 5, 1);
  cloud(gn, 20, 2);
  cloud(gn, 26, 1);
  const near = built(book, gn, [LAND_X, FEET], false);
  for (let x = 13; x < 19; x++) for (let y = 0; y < FLOOR; y++) near.set(x, y, 'cliff');
  stamp(near, 11, FLOOR - 3, a.bigTree);
  sign(near, 2, s.cliff);
  stamp(near, 1, FLOOR - 2, a.trailInto);
  sign(near, 20, s.past);
  // far: no cliff, so the way past is open
  const gf = new Grid(16, 10);
  ground(gf, 16);
  hedge(gf, 0);
  hedge(gf, 15);
  doorway(gf, LAND_X);
  coins(gf, 6, 7);
  cloud(gf, 3, 1);
  cloud(gf, 10, 2);
  const far = built(book, gf, [LAND_X, FEET], true);
  bare(far, LAND_X);
  stamp(far, 1, FLOOR - 2, a.peak);
  sign(far, 3, s.noCliff);
  stamp(far, 9, FLOOR - 2, a.farTree);
  sign(far, 10, s.comesOut);
  far.set(11, FEET, a.mound);
  stamp(far, 14, FLOOR - 2, a.trailBack);
  return {
    files: [
      { file: 'near2', map: near },
      { file: 'far2', map: far },
    ],
    rooms: [
      room('near2a', 'near2', 'Cliff: Near Side', 'near', LAND_X, { trail: exitAt(1) }),
      room('far2', 'far2', 'Cliff: Far Plane', 'far', LAND_X, { out: exitAt(14) }),
      room('near2b', 'near2', 'Cliff: Other Side', 'near', 24, { out: exitAt(29) }),
    ],
  };
}

/** One scene link: leave `from`'s exit, land on `to`'s landing cell. `to` is a scene's id, or 'end' for the ending. */
export interface Link {
  from: string;
  exit: string;
  to: string;
}

export const LINKS: Link[] = [
  { from: 'near1', exit: 'trail', to: 'far1' },
  { from: 'far1', exit: 'back', to: 'near1b' },
  { from: 'near1b', exit: 'trail', to: 'far1' },
  { from: 'far1', exit: 'out', to: 'near2a' },
  { from: 'near2a', exit: 'trail', to: 'far2' },
  { from: 'far2', exit: 'out', to: 'near2b' },
  { from: 'near2b', exit: 'out', to: 'end' },
];

/** The level cards: one before each level's first scene. */
export const CARDS: Card[] = [
  { file: 'card1', n: 1, title: 'Into the Distance', hint: 'Step from near to far.', before: 'near1' },
  { file: 'card2', n: 2, title: 'Past the Cliff', hint: 'Go far to get past it.', before: 'near2a' },
];

/** The maps, the scenes in scene order (scene 2 on), and the pal and blocks they share. */
export function buildLevels(): { book: Book; pal: Pal; levels: MapFile[]; rooms: Room[] } {
  const pal = buildStarterPalette(undefined, 'near-far');
  const { book, signs, art } = buildBlocks(pal);
  const one = mapOne(book, signs, art);
  const two = mapTwo(book, signs, art);
  return { book, pal, levels: [...one.files, ...two.files], rooms: [...one.rooms, ...two.rooms] };
}
