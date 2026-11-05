// ROOM TO ROOM's rooms. Each room is its own map and its own scene; a scene link joins them:
// touching a block (the link's From) in one scene puts the hero on a block (the link's To) of
// another. Each room is painted on a Grid (a block a character, see games/kit/starter/map.ts),
// given its signs, and told where its exits are and where a hero arrives.
//
//   Level 1, Out the Door: START has a door to INSIDE; INSIDE has no door, only a brick archway near its right end.
//   Level 2, There and Back: a house. The HALL has a door to the KITCHEN and one to the BEDROOM, each
//     with a door back; a gold door up on the HALL's ledge is shut until the kitchen's key comes along.
//   Level 3, Two Doors: the FORK has two doors, to the GARDEN and to the ATTIC, and each leads on to the end.
import { Book } from '../../kit/starter/book';
import { addArchBrick } from './archBrick';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks } from '../../kit/starter/locks';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

const SIGNS = {
  door: ['door', 'THIS DOOR GOES TO ANOTHER ROOM', 4],
  came: ['came', 'YOU CAME IN HERE', 4],
  out: ['out', 'THIS WAY OUT →', 4],
  kitchen: ['kitchen', 'KITCHEN', 4],
  bedroom: ['bedroom', 'BEDROOM', 4],
  locked: ['locked', 'LOCKED. THE KEY IS IN THE KITCHEN', 4],
  back: ['back', 'THIS DOOR GOES BACK', 4],
  carry: ['carry', 'THE KEY GOES WITH YOU', 4],
  restart: ['restart', 'A ROOM STARTS OVER EACH TIME', 4],
  score: ['score', 'YOUR SCORE STAYS', 4],
  left: ['left', 'LEFT: THE GARDEN', 4],
  right: ['right', 'RIGHT: THE ATTIC', 4],
  tookLeft: ['tookLeft', 'YOU TOOK THE LEFT DOOR', 4],
  tookRight: ['tookRight', 'YOU TOOK THE RIGHT DOOR', 4],
  exit: ['exit', 'EXIT →', 3],
} as const;
export type SignName = keyof typeof SIGNS;

/** A block of a room, in world blocks (the level's own corner is ORIGIN). */
export type Spot = [number, number];

export interface Room {
  file: string;
  /** The scene's name (19 characters at most). */
  title: string;
  map: StarterMap;
  /** Blocks that take the hero away when touched, by name. */
  exits: Record<string, Spot>;
  /** Blocks the hero stands on when he comes in, by name. */
  ways: Record<string, Spot>;
}

/** What a level card says. `n` of 3, shown before `scene` starts or after it ends. */
export interface Card {
  file: string;
  n: number;
  title: string;
  hint: string;
}

const GROUND = 10;
const at = (x: number, y: number): Spot => [x + ORIGIN, y + ORIGIN];
/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The block set every room shares: the Starter blocks, the lock blocks, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const [key, [name, words, w]] of Object.entries(SIGNS)) signs[key as SignName] = addSign(book, pal, name, words, w, key === 'exit' ? 1 : 2);
  addArchBrick(book, pal);
  return { book, signs };
}

/** A flat room `w` wide: ground, dirt, hedge walls at both ends, and a doorway. */
function base(w: number): Grid {
  const g = new Grid(w, 15);
  g.row(GROUND, 0, w - 1, 'G').fill(0, GROUND + 1, w, 4, 'D');
  g.col(0, 0, 9, 'X').col(w - 1, 0, 9, 'X');
  return g;
}
const door = (g: Grid, x: number, y = GROUND) => g.put(x, y - 2, 'e').put(x, y - 1, 'E');
const doorway = (g: Grid, x: number) => g.put(x, GROUND - 2, 's').put(x, GROUND - 1, 'S');
function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}
/** A wall of brick from the top down to a gold door: an arch and the gate on the last two rows above `ground`. */
function wall(g: Grid, x: number, ground: number): void {
  g.col(x, 0, ground - 3, 'B')
    .put(x, ground - 2, 'l')
    .put(x, ground - 1, 'L');
}

/** The map of a room; StarterMap wants an entrance (S), so a room with none gets a stand-in that is painted over. */
function built(book: Book, g: Grid): StarterMap {
  const bare = !g.rows().some((r) => r.includes('S'));
  if (bare) g.put(1, 0, 'S');
  const m = new StarterMap(book, g.rows());
  if (bare) m.set(1, 0, 'sky');
  return m;
}
const place = (m: StarterMap, x: number, s: Sign, ground = GROUND) => m.sign(x, onGround(ground, s), s);
const room = (file: string, title: string, map: StarterMap, exits: Room['exits'], ways: Room['ways']): Room => ({ file, title, map, exits, ways });

/** Level 1, room 1: a door to another room. */
function start(book: Book, s: Record<SignName, Sign>): Room {
  const g = base(24);
  doorway(g, 3);
  door(g, 19);
  g.row(9, 7, 11, 'c');
  scenery(
    g,
    [
      [5, 1],
      [14, 2],
    ],
    [6, 16],
    [12, 21],
  );
  const m = built(book, g);
  place(m, 13, s.door);
  return room('start', 'Out the Door', m, { door: at(19, 9) }, { start: at(3, 9) });
}

/** Level 1, room 2: you came in by a door; the way out is an open archway in the right-hand wall (a gap, no door). */
function inside(book: Book, s: Record<SignName, Sign>): Room {
  const g = base(30);
  doorway(g, 3);
  // the archway: two brick pillars stand on the ground (x 24 and 28), a two-block lintel spans them (rows 6-7),
  // and sky shows above and through it; the opening is 3 wide and 2 high, and touching its middle block is the exit.
  // Its bricks ('a') are background, so the hero walks in under it from the left
  g.fill(24, 6, 5, 2, 'a').col(24, 8, 9, 'a').col(28, 8, 9, 'a');
  g.row(9, 11, 15, 'c');
  scenery(
    g,
    [
      [8, 1],
      [20, 2],
    ],
    [10, 17],
    [8, 23],
  );
  const m = built(book, g);
  place(m, 5, s.came);
  place(m, 19, s.out);
  return room('inside', 'Inside', m, { archway: at(26, 9) }, { door: at(3, 9) });
}

/** Level 2, the hall: a kitchen door on the left, a bedroom door on the right, and a gold door on the ledge above. */
function hall(book: Book, s: Record<SignName, Sign>): Room {
  const g = base(40);
  doorway(g, 15);
  door(g, 3);
  door(g, 29);
  // the ledge: a ladder up beside it, then the wall with the gold door, and the way out beyond
  const LEDGE = 5;
  g.row(LEDGE, 21, 38, 'G').fill(21, LEDGE + 1, 18, 1, 'D');
  g.col(20, LEDGE - 1, 9, 'H');
  wall(g, 31, LEDGE);
  door(g, 35, LEDGE);
  scenery(
    g,
    [
      [6, 1],
      [12, 3],
    ],
    [9, 38],
    [12, 34],
  );
  g.put(13, GROUND - 1, 'f');
  const m = built(book, g);
  place(m, 5, s.kitchen);
  place(m, 30, s.bedroom);
  place(m, 24, s.locked, LEDGE);
  place(m, 32, s.exit, LEDGE);
  return room(
    'hall',
    'The Hall',
    m,
    { kitchen: at(3, 9), bedroom: at(29, 9), out: at(35, 4) },
    {
      in: at(15, 9),
      kitchen: at(10, 9),
      bedroom: at(25, 9),
    },
  );
}

/** Level 2, the kitchen: one door back to the hall, and a key that goes with you. */
function kitchen(book: Book, s: Record<SignName, Sign>): Room {
  const g = base(26);
  door(g, 3);
  g.put(20, 9, 'k');
  scenery(
    g,
    [
      [10, 2],
      [17, 1],
    ],
    [15],
    [8, 23],
  );
  const m = built(book, g);
  place(m, 6, s.back);
  place(m, 12, s.carry);
  return room('kitchen', 'The Kitchen', m, { back: at(3, 9) }, { hall: at(6, 9) });
}

/** Level 2, the bedroom: coins that come back when you come back. */
function bedroom(book: Book, s: Record<SignName, Sign>): Room {
  const g = base(26);
  door(g, 22);
  g.row(9, 3, 7, 'c');
  scenery(
    g,
    [
      [3, 1],
      [14, 2],
    ],
    [1, 10],
    [8, 18],
  );
  const m = built(book, g);
  place(m, 8, s.restart);
  place(m, 15, s.score);
  return room('bedroom', 'The Bedroom', m, { back: at(22, 9) }, { hall: at(20, 9) });
}

/** Level 3, the fork: two doors, a room behind each. */
function fork(book: Book, s: Record<SignName, Sign>): Room {
  const g = base(30);
  door(g, 4);
  door(g, 26);
  doorway(g, 14);
  scenery(
    g,
    [
      [8, 1],
      [18, 2],
    ],
    [12, 17],
    [11, 19],
  );
  const m = built(book, g);
  place(m, 6, s.left);
  place(m, 20, s.right);
  return room('fork', 'The Fork', m, { left: at(4, 9), right: at(26, 9) }, { in: at(14, 9) });
}

/** Level 3, behind the left door: a garden with an exit. */
function garden(book: Book, s: Record<SignName, Sign>): Room {
  const g = base(28);
  doorway(g, 3);
  door(g, 24);
  g.row(9, 9, 16, 'c');
  scenery(
    g,
    [
      [6, 1],
      [15, 2],
    ],
    [7, 12, 20],
    [6, 10, 14, 18, 22],
  );
  const m = built(book, g);
  place(m, 5, s.tookLeft);
  place(m, 19, s.exit);
  return room('garden', 'The Garden', m, { out: at(24, 9) }, { in: at(3, 9) });
}

/** Level 3, behind the right door: an attic with a plank to jump up to, and an exit. */
function attic(book: Book, s: Record<SignName, Sign>): Room {
  const g = base(28);
  doorway(g, 3);
  door(g, 24);
  g.row(7, 12, 15, '=');
  g.row(6, 12, 15, 'c');
  g.row(9, 17, 19, 'c');
  scenery(
    g,
    [
      [6, 1],
      [17, 2],
    ],
    [8],
    [10, 22],
  );
  const m = built(book, g);
  place(m, 5, s.tookRight);
  place(m, 20, s.exit);
  return room('attic', 'The Attic', m, { out: at(24, 9) }, { in: at(3, 9) });
}

/** One scene link: leave `from`'s exit, arrive at `to`'s way in. `to` is the room's file name, or 'end' for the ending. */
export interface Link {
  from: string;
  exit: string;
  to: string;
  way: string;
}

export const LINKS: Link[] = [
  { from: 'start', exit: 'door', to: 'inside', way: 'door' },
  { from: 'inside', exit: 'archway', to: 'hall', way: 'in' },
  { from: 'hall', exit: 'kitchen', to: 'kitchen', way: 'hall' },
  { from: 'kitchen', exit: 'back', to: 'hall', way: 'kitchen' },
  { from: 'hall', exit: 'bedroom', to: 'bedroom', way: 'hall' },
  { from: 'bedroom', exit: 'back', to: 'hall', way: 'bedroom' },
  { from: 'hall', exit: 'out', to: 'fork', way: 'in' },
  { from: 'fork', exit: 'left', to: 'garden', way: 'in' },
  { from: 'fork', exit: 'right', to: 'attic', way: 'in' },
  { from: 'garden', exit: 'out', to: 'end', way: '' },
  { from: 'attic', exit: 'out', to: 'end', way: '' },
];

/** The level cards: one before the first room, one after room 2 of level 1 (the hall is entered more than once), one before the fork. */
export const CARDS: (Card & { before?: string; after?: string })[] = [
  { file: 'card1', n: 1, title: 'Out the Door', hint: 'A door leads to another room.', before: 'start' },
  { file: 'card2', n: 2, title: 'There and Back', hint: 'Every door can have one back.', after: 'inside' },
  { file: 'card3', n: 3, title: 'Two Doors', hint: 'Two exits, two rooms.', before: 'fork' },
];

/** The rooms in scene order (scene 2 on), the cards and the pal and blocks they share. */
export function buildLevels(): { book: Book; pal: Pal; rooms: Room[] } {
  const pal = buildStarterPalette(undefined, 'room-to-room');
  const { book, signs } = buildBlocks(pal);
  const rooms = [start, inside, hall, kitchen, bedroom, fork, garden, attic].map((f) => f(book, signs));
  return { book, pal, rooms };
}
