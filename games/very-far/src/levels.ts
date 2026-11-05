// WALKING VERY FAR's levels, each a scene on a map 10 blocks high and 24 to 40 wide. The view starts with Kit in the
// middle of the screen and follows him sideways as he walks (scrolling is on across, off up and down), so a long
// walk is a long map. The hills repeat every 8 blocks, which is why a map costs so few blocks. Kit walks left to
// right along the ground row and ends at a gate or door that is a link.
//
//   Level 1, Up Close: near Kit (two blocks tall) on a road, with the hills far behind him. The ridge on those hills
//     is where he is going.
//   Level 2, Far Away: the same kind of walk on that ridge, with Kit 8 pixels tall and everything paler. It is two
//     scenes on two maps. In the first he takes the same steps as up close and zips along like a bug (the mistake).
//     In the second his steps are small and slow, and he looks far away.
//   Level 3, Big Things in Front: the ridge again, with a big fence and big flowers along the bottom. They are drawn
//     as big as the near level's things, so the tiny Kit behind them looks very far.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { buildPalette } from './haze';
import { addScenery, type Scenery } from './art';

const SIGNS = {
  closeUp: ['closeUp', 'KIT IS 40 PIXELS TALL. FAR UP THAT ROAD HE IS SMALL', 4, 3],
  quick: ['quick', 'TOO FAST. THE SAME STEPS AS UP CLOSE', 4, 2],
  slow: ['slow', 'SLOW STEPS. HE IS ONLY 8 PIXELS TALL', 4, 3],
  front: ['front', 'BIG THINGS IN FRONT MAKE HIM FAR AWAY', 4, 3],
  contrast: ['contrast', 'DARK AND ORANGE ON PALE: HE STAYS CLEAR', 4, 3],
} as const;
export type SignName = keyof typeof SIGNS;

/** A block of the map, in world blocks. */
export type Spot = [number, number];

/** One scene: a window of a map. */
export interface Room {
  /** The scene's key. */
  id: string;
  /** The map file it loads (without .map). */
  file: string;
  /** The scene's name (19 characters at most). */
  title: string;
  /** How far away Kit is drawn: `near` is the two-block Kit and the near palette; the others are the tiny Kit with the far palette. */
  look: 'near' | 'quick' | 'slow';
  /** Blocks that take Kit away when touched, by name. */
  exits: Record<string, Spot>;
  /** The cell Kit lands on (his feet). */
  landing: Spot;
}

/** A map file. */
export interface MapFile {
  file: string;
  map: StarterMap;
}

/** What a level card says. `n` of 3, shown before the `before` room starts. */
export interface Card {
  file: string;
  n: number;
  title: string;
  hint: string;
  before: string;
}

/** A map is 10 blocks high; the ground is row 6, so Kit's feet stand on row 5. */
export const FLOOR = 6;
export const FEET = FLOOR - 1;
/** The column Kit lands on: the screen starts with him in the middle, so the first 8 blocks are what is behind him. */
export const LAND_X = 8;
/** How wide each kind of map is, and the column of its gate or door. */
export const NEAR_W = 24;
export const NEAR_GATE = 20;
export const FAR_W = 40;
export const FAR_GATE = 36;
const at = (x: number, y: number): Spot => [x + ORIGIN, y + ORIGIN];

/** The block set every scene shares: the Starter blocks, the scenery, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign>; art: Scenery } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const art = addScenery(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const [key, [name, words, w, h]] of Object.entries(SIGNS)) signs[key as SignName] = addSign(book, pal, name, words, w, h);
  return { book, signs, art };
}

/** A sign standing on the path; over the hills (`posts`) its posts are drawn on them, not on sky. */
const sign = (m: StarterMap, x: number, s: Sign, posts?: Scenery['posts']) => {
  m.sign(x, FLOOR - 1 - s.board.length, s);
  if (posts) m.set(x, FEET, posts[0]).set(x + s.board[0].length - 1, FEET, posts[1]);
};

/** A map that, when finished, paints its scenery on past both ends: StarterMap.done() leaves only sky there, and the view reaches 8 blocks past Kit, who can stand at an end. */
class Scenic extends StarterMap {
  constructor(
    book: Book,
    rows: string[],
    private readonly beyond: (m: StarterMap) => void,
  ) {
    super(book, rows);
  }

  override done(): ReturnType<StarterMap['done']> {
    const map = super.done();
    this.beyond(this);
    return map;
  }
}

/** A map `w` wide: ground under the path, the hills behind it, and a wall at each end (`edges` says how it looks). */
function windowMap(book: Book, art: Scenery, w: number, edges: 'hedge' | 'grove', under: 'dirt' | 'slope' | 'front'): StarterMap {
  const g = new Grid(w, 10);
  g.row(FLOOR, 0, w - 1, 'G').fill(0, FLOOR + 1, w, 3, 'D');
  g.put(LAND_X, FEET, 'S');
  if (edges === 'hedge') for (const x of [0, w - 1]) g.col(x, 0, FLOOR - 1, 'X');
  const walls = g.rows();
  /** One column of scenery: the hills (the same eight columns over and over), then the ground. */
  const paint = (m: StarterMap, x: number, inside: boolean) => {
    const col = ((x % 8) + 8) % 8;
    for (let y = 0; y < FLOOR; y++) if (!(inside && walls[y][x] === 'X')) m.set(x, y, art.hills[y][col]);
    if (under === 'dirt') {
      if (inside) return;
      m.set(x, FLOOR, 'grass');
      for (let y = FLOOR + 1; y < 10; y++) m.set(x, y, 'dirt');
      return;
    }
    m.set(x, FLOOR, art.ridge);
    for (let y = FLOOR + 1; y < 10; y++) m.set(x, y, under === 'front' ? art.front[y - FLOOR - 1][col] : art.slope[y - FLOOR - 1]);
  };
  const m = new Scenic(book, walls, (me) => {
    for (let x = -12; x < w + 12; x++) if (x < 0 || x >= w) paint(me, x, false);
  });
  m.start = at(LAND_X, FEET);
  for (let x = 0; x < w; x++) paint(m, x, true);
  if (edges === 'grove') for (const x of [0, w - 1]) m.set(x, FEET - 1, art.groveTop).set(x, FEET, art.grove);
  return m;
}

const room = (id: string, file: string, title: string, look: Room['look'], exits: Room['exits']): Room => ({
  id,
  file,
  title,
  look,
  exits,
  landing: at(LAND_X, FEET),
});
const gate = (m: StarterMap, art: Scenery) => m.set(FAR_GATE, FEET, art.gate);

/** The maps and rooms of all three levels. */
function mapsAndRooms(book: Book, s: Record<SignName, Sign>, a: Scenery): { files: MapFile[]; rooms: Room[] } {
  // 1. near
  const near = windowMap(book, a, NEAR_W, 'hedge', 'dirt');
  near.set(NEAR_GATE, FLOOR - 2, 'doorTop').set(NEAR_GATE, FEET, 'doorBottom');
  sign(near, 11, s.closeUp, a.posts);
  // 2a. quick
  const quick = windowMap(book, a, FAR_W, 'grove', 'slope');
  gate(quick, a);
  sign(quick, 12, s.quick, a.posts);
  // 2b. slow
  const slow = windowMap(book, a, FAR_W, 'grove', 'slope');
  gate(slow, a);
  sign(slow, 12, s.slow, a.posts);
  // 3. front
  const front = windowMap(book, a, FAR_W, 'grove', 'front');
  gate(front, a);
  sign(front, 12, s.front, a.posts);
  sign(front, 22, s.contrast, a.posts);
  const farExit: Room['exits'] = { gate: at(FAR_GATE, FEET) };
  return {
    files: [
      { file: 'close', map: near },
      { file: 'quick', map: quick },
      { file: 'slow', map: slow },
      { file: 'front', map: front },
    ],
    rooms: [
      room('close', 'close', 'Up Close', 'near', { gate: at(NEAR_GATE, FEET) }),
      room('quick', 'quick', 'Far: Too Quick', 'quick', farExit),
      room('slow', 'slow', 'Far: Slow Steps', 'slow', farExit),
      room('front', 'front', 'Big Things in Front', 'slow', farExit),
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
  { from: 'close', exit: 'gate', to: 'quick' },
  { from: 'quick', exit: 'gate', to: 'slow' },
  { from: 'slow', exit: 'gate', to: 'front' },
  { from: 'front', exit: 'gate', to: 'end' },
];

/** The level cards: one before each level's first scene. */
export const CARDS: Card[] = [
  { file: 'card1', n: 1, title: 'Up Close', hint: 'Kit is big here.', before: 'close' },
  { file: 'card2', n: 2, title: 'Far Away', hint: 'The same walk, far off.', before: 'quick' },
  { file: 'card3', n: 3, title: 'Big Things in Front', hint: 'Neighbors set the size.', before: 'front' },
];

/** The maps, the scenes in scene order (scene 2 on), and the pal and blocks they share. */
export function buildLevels(): { book: Book; pal: Pal; levels: MapFile[]; rooms: Room[] } {
  const pal = buildPalette();
  const { book, signs, art } = buildBlocks(pal);
  const { files, rooms } = mapsAndRooms(book, signs, art);
  return { book, pal, levels: files, rooms };
}
