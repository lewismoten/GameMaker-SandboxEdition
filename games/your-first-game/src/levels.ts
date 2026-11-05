// YOUR FIRST GAME's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, spikes and doors.
//
//   1. Walk and Jump: a brick wall to jump, a hill to climb with coins on top, a friendly gumdrop.
//   2. Key and Door: a spike to walk into and spikes to jump over, a ladder up to a key, and the locked door it opens.
//   3. All Together: the spikes, a gumdrop, a wall, a key and a door in one room.
//
// Every room is closed in by hedges you can see, so Neka is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks } from '../../kit/starter/locks';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addHazards } from './hazards';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

export const GROUND = 10;
export type SignName = 'walk' | 'jump' | 'coins' | 'pop' | 'spikes' | 'ladder' | 'locked' | 'all' | 'key' | 'exit';
const SIGNS: Record<SignName, [string, number, number]> = {
  walk: ['ARROWS WALK. SPACE JUMPS.', 4, 3],
  jump: ['HOLD AN ARROW AND TAP SPACE TO JUMP THE WALL', 4, 4],
  coins: ['COINS ARE POINTS. F2 SHOWS YOUR SCORE.', 4, 3],
  pop: ['A GUMDROP IS FRIENDLY. TOUCH IT TO POP IT.', 4, 4],
  spikes: ['SPIKES HURT. JUMP OVER THEM.', 4, 3],
  ladder: ['CLIMB UP FOR THE KEY', 4, 2],
  locked: ['LOCKED. A KEY OPENS THE DOOR.', 4, 3],
  all: ['ONE MORE LEVEL. USE IT ALL.', 4, 3],
  key: ['KEY FIRST, THEN THE DOOR', 4, 3],
  exit: ['EXIT →', 3, 1],
};

/** The block set the levels share: the Starter blocks, the lock and spike blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  addHazards(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const n of Object.keys(SIGNS) as SignName[]) {
    const [text, w, h] = SIGNS[n];
    signs[n] = addSign(book, pal, `${n}.sign`, text, w, h);
  }
  return { book, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The room: ground, hedges at both ends, the entrance at x 3 and the exit door at `exitX`. */
function room(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** A wall of brick from row 0 to a locked door: its arch on row 8 and the gold gate on row 9. */
function lockedWall(g: Grid, x: number): void {
  g.col(x, 0, GROUND - 3, 'B')
    .put(x, GROUND - 2, 'l')
    .put(x, GROUND - 1, 'L');
}

/** Where things are, for the bot and the shots. */
export const AT = {
  one: { wall: 21, hill: 29, hillEnd: 36, gumdrop: 44, exit: 53 },
  two: { lone: 9, spikes: 12, ladder: 19, key: 26, door: 28, exit: 42 },
  three: { spikes: 11, gumdrop: 21, wall: 28, key: 31, door: 38, exit: 47 },
} as const;

/** Level 1: walk, jump, coins, a gumdrop. 56 blocks wide. */
function walkAndJump(book: Book, s: Record<SignName, Sign>): StarterMap {
  const g = room(56, AT.one.exit);
  g.row(9, 11, 13, 'c');
  g.fill(21, 8, 2, 2, 'B');
  g.fill(29, 8, 8, 1, 'G').fill(29, 9, 8, 1, 'D');
  g.row(7, 30, 34, 'c');
  g.put(AT.one.gumdrop, 9, 'g');
  scenery(
    g,
    [
      [7, 3],
      [17, 5],
      [31, 3],
      [45, 4],
    ],
    [9, 24, 39],
    [14, 27, 48],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, s.walk), s.walk);
  m.sign(15, onGround(GROUND, s.jump), s.jump);
  m.sign(24, onGround(GROUND, s.coins), s.coins);
  m.sign(38, onGround(GROUND, s.pop), s.pop);
  m.sign(49, onGround(GROUND, s.exit), s.exit);
  return m;
}

/** Level 2: spikes, a ladder to a key, a locked door. 46 blocks wide. */
function keyAndDoor(book: Book, s: Record<SignName, Sign>): StarterMap {
  const g = room(46, AT.two.exit);
  lockedWall(g, AT.two.door);
  g.row(3, 20, 27, 'G').fill(20, 4, 8, 1, 'D');
  g.put(AT.two.key, 2, 'k');
  g.col(AT.two.ladder, 2, 9, 'H');
  g.row(2, 22, 24, 'c').row(9, 31, 35, 'c');
  scenery(
    g,
    [
      [7, 2],
      [13, 0],
      [33, 1],
      [38, 3],
    ],
    [16, 30, 44],
    [9, 17, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, s.spikes), s.spikes);
  m.sign(14, onGround(GROUND, s.ladder), s.ladder);
  m.sign(21, onGround(GROUND, s.locked), s.locked);
  m.sign(37, onGround(GROUND, s.exit), s.exit);
  for (const x of [AT.two.lone, AT.two.spikes, AT.two.spikes + 1]) m.set(x, GROUND - 1, 'spikeUp');
  return m;
}

/** Level 3: spikes, a gumdrop, a wall, a key, a door. 50 blocks wide. */
function allTogether(book: Book, s: Record<SignName, Sign>): StarterMap {
  const g = room(50, AT.three.exit);
  lockedWall(g, AT.three.door);
  g.fill(AT.three.wall, 8, 2, 2, 'B');
  g.put(AT.three.key, 9, 'k');
  g.put(AT.three.gumdrop, 9, 'g');
  g.row(9, 16, 18, 'c').row(9, 41, 43, 'c');
  scenery(
    g,
    [
      [8, 3],
      [19, 1],
      [32, 3],
      [42, 1],
    ],
    [14, 26, 40],
    [7, 24, 45],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, s.all), s.all);
  m.sign(32, onGround(GROUND, s.key), s.key);
  m.sign(44, onGround(GROUND, s.exit), s.exit);
  for (const x of [AT.three.spikes, AT.three.spikes + 1]) m.set(x, GROUND - 1, 'spikeUp');
  return m;
}

/** The palette, the shared blocks and the levels in order. */
export function buildLevels(): { pal: Pal; book: Book; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'your-first-game');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Walk and Jump', hint: 'Jump the wall. Pop a gumdrop.', map: walkAndJump(book, signs) },
    { file: 'two', title: 'Key and Door', hint: 'Mind the spikes. Find the key.', map: keyAndDoor(book, signs) },
    { file: 'three', title: 'All Together', hint: 'Everything you have learned.', map: allTogether(book, signs) },
  ];
  return { pal, book, levels };
}
