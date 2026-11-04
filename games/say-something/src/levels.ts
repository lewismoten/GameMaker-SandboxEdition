// SAY SOMETHING's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its talkers.
//
//   1. Say Hello: three boards (a sign is a few blocks with words drawn in), then Pip stands in the
//      way. Walk into Pip and a picture and a page of words appear; they turn by themselves (any key
//      hurries them) and you are back, just past Pip.
//   2. Two Friends: Moss, whose talk runs to two pages, and Dot, who has one short line.
// Every room is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BUBBLE, addTalkers, talkerBlocks, type TalkerName } from './talkers';

export type SignName = 'what' | 'edit' | 'big' | 'walkin' | 'bubble' | 'each' | 'long' | 'exit';

/** The block set the levels share: the Starter blocks, then the talkers and this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addTalkers(book, pal);
  const signs = {
    what: addSign(book, pal, 'what.sign', 'A SIGN IS A PICTURE OF WORDS', 4, 2),
    edit: addSign(book, pal, 'edit.sign', 'EDIT ITS BLOCKS TO CHANGE THE WORDS', 4, 2),
    big: addSign(book, pal, 'big.sign', 'A TALLER BOARD HOLDS MORE WORDS', 4, 3),
    walkin: addSign(book, pal, 'walkin.sign', 'WALK INTO PIP TO TALK', 4, 2),
    bubble: addSign(book, pal, 'bubble.sign', 'A BUBBLE SAYS SOMEONE WILL TALK', 4, 2),
    each: addSign(book, pal, 'each.sign', 'EACH FRIEND HAS WORDS OF THEIR OWN', 4, 3),
    long: addSign(book, pal, 'long.sign', 'A LONG TALK RUNS TWO PAGES', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  return { book, signs };
}

/** A talker in a level: which friend, which block to touch, and where Kit is put when the talk is over. */
export interface Talk {
  who: TalkerName;
  /** The talker's bottom block, in world blocks. */
  at: [number, number];
  /** Where Kit stands afterward: a few blocks past the talker, so he is not touching again. */
  back: [number, number];
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  talks: Talk[];
}

export const GROUND = 10;
/** The row of a standing block's feet (the talkers' bottom blocks sit here). */
export const STAND = GROUND - 1;

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The ground, a hedge at each end (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
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

/** Stands `who` on the ground at column x with a bubble over his head, and notes the talk. */
function stand(m: StarterMap, talks: Talk[], who: TalkerName, x: number): void {
  const [top, bottom] = talkerBlocks(who);
  m.set(x, STAND - 1, top)
    .set(x, STAND, bottom)
    .set(x, STAND - 2, BUBBLE);
  talks.push({ who, at: [x + ORIGIN, STAND + ORIGIN], back: [x + 3 + ORIGIN, STAND + ORIGIN] });
}

/** Where Pip stands in level 1. */
export const PIP_X = 27;

/** Level 1: three boards, then Pip, with a bubble over his head, standing in the way. 46 blocks wide; the ground is row 10. */
function sayHello(book: Book, signs: Record<SignName, Sign>): Level {
  const g = base(46, 42);
  g.row(9, 9, 10, 'c').put(16, 9, 'c').row(9, 31, 32, 'c').row(9, 34, 37, 'c');
  scenery(
    g,
    [
      [6, 2],
      [16, 1],
      [30, 3],
      [38, 1],
    ],
    [12, 19, 28, 40],
    [13, 18, 24, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.what), signs.what);
  m.sign(11, onGround(GROUND, signs.edit), signs.edit);
  m.sign(17, onGround(GROUND, signs.bubble), signs.bubble);
  m.sign(22, onGround(GROUND, signs.walkin), signs.walkin);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  const talks: Talk[] = [];
  stand(m, talks, 'pip', PIP_X);
  return { file: 'hello', title: 'Say Hello', hint: 'Walk into Pip.', map: m, talks };
}

/** Where level 3's friends stand. */
export const MOSS_X = 26;
export const DOT_X = 34;

/** Level 3: Moss (a long talk) and Dot (a short one), each in the way. 46 blocks wide. */
function twoFriends(book: Book, signs: Record<SignName, Sign>): Level {
  const g = base(46, 44);
  g.row(9, 6, 7, 'c').row(9, 17, 18, 'c').row(9, 30, 32, 'c').row(9, 38, 39, 'c');
  scenery(
    g,
    [
      [7, 1],
      [20, 2],
      [33, 1],
      [39, 3],
    ],
    [14, 21, 33, 36],
    [13, 20, 28, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.big), signs.big);
  m.sign(12, onGround(GROUND, signs.each), signs.each);
  m.sign(19, onGround(GROUND, signs.long), signs.long);
  m.sign(40, onGround(GROUND, signs.exit), signs.exit);
  const talks: Talk[] = [];
  stand(m, talks, 'moss', MOSS_X);
  stand(m, talks, 'dot', DOT_X);
  return { file: 'chat', title: 'Two Friends', hint: 'Everyone has something to say.', map: m, talks };
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  return { book, pal, levels: [sayHello(book, signs), twoFriends(book, signs)] };
}
