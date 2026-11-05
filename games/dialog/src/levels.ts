// EVERYBODY TALKS's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its talkers.
//
//   1. Two Voices: three boards, then Pip stands in the way. Walk into Pip and one picture with
//      two speech bubbles appears, Kit's and Pip's, with the words over it; you are back past Pip.
//   2. A Crowd: Pip, Moss and Dot stand together. One touch opens a talk of four voices that
//      runs to a second card, because a card holds 16 rows of words.
// Every room is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BUBBLE, addTalkers, talkerBlocks, type TalkerName } from './talkers';
import type { TalkId } from './text';

export type SignName = 'two' | 'names' | 'words' | 'walkin' | 'more' | 'rows' | 'second' | 'group' | 'exit';

/** The block set the levels share: the Starter blocks, then the talkers and this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addTalkers(book, pal);
  const signs = {
    two: addSign(book, pal, 'two.sign', 'A TALK CAN HAVE TWO SPEAKERS', 4, 3),
    names: addSign(book, pal, 'names.sign', 'THE PICTURE DRAWS THE BUBBLES AND NAMES', 4, 3),
    words: addSign(book, pal, 'words.sign', 'THE TXT HOLDS ONLY THE WORDS', 4, 3),
    walkin: addSign(book, pal, 'walkin.sign', 'WALK INTO PIP TO TALK', 4, 2),
    more: addSign(book, pal, 'more.sign', 'MORE SPEAKERS, SMALLER PICTURES', 4, 3),
    rows: addSign(book, pal, 'rows.sign', 'A CARD HOLDS 16 ROWS OF WORDS', 4, 3),
    second: addSign(book, pal, 'second.sign', 'A LONGER TALK USES A SECOND CARD', 4, 3),
    group: addSign(book, pal, 'group.sign', 'WALK INTO THE GROUP', 4, 2),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  return { book, signs };
}

/** A talker in a level: which friend, which block to touch, and where Kit is put when the talk is over. */
export interface Talk {
  who: TalkerName;
  /** Which talk opens (text.ts TALKS). */
  id: TalkId;
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

/** Stands `who` on the ground at column x, with a bubble over their head when they are the one to walk into. */
function stand(m: StarterMap, who: TalkerName, x: number, bubble: boolean): void {
  const [top, bottom] = talkerBlocks(who);
  m.set(x, STAND - 1, top).set(x, STAND, bottom);
  if (bubble) m.set(x, STAND - 2, BUBBLE);
}

/** Notes the talk a touch on the friend in column x opens; Kit comes back 3 blocks past the last of the group. */
function talk(talks: Talk[], who: TalkerName, id: TalkId, x: number, backX: number): void {
  talks.push({ who, id, at: [x + ORIGIN, STAND + ORIGIN], back: [backX + ORIGIN, STAND + ORIGIN] });
}

/** Where Pip stands in level 1. */
export const PIP_X = 27;

/** Level 1: Kit and Pip, a talk of two. 46 blocks wide; the ground is row 10. */
function twoVoices(book: Book, signs: Record<SignName, Sign>): Level {
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
    [12, 19, 29, 40],
    [13, 18, 24, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.two), signs.two);
  m.sign(11, onGround(GROUND, signs.names), signs.names);
  m.sign(17, onGround(GROUND, signs.words), signs.words);
  m.sign(22, onGround(GROUND, signs.walkin), signs.walkin);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  const talks: Talk[] = [];
  stand(m, 'pip', PIP_X, true);
  talk(talks, 'pip', 'hello', PIP_X, PIP_X + 3);
  return { file: 'two', title: 'Two Voices', hint: 'Kit and Pip, one picture.', map: m, talks };
}

/** Where the group stands in level 2: the one with the bubble is the one to walk into. */
export const PIP2_X = 27;
export const MOSS_X = 29;
export const DOT_X = 31;

/** Level 2: Pip, Moss and Dot stand together; one touch opens a talk of four, in two cards. 46 blocks wide. */
function crowd(book: Book, signs: Record<SignName, Sign>): Level {
  const g = base(46, 44);
  g.row(9, 9, 10, 'c').row(9, 15, 16, 'c').row(9, 35, 39, 'c');
  scenery(
    g,
    [
      [7, 1],
      [20, 2],
      [33, 1],
      [39, 3],
    ],
    [12, 19, 23, 34],
    [13, 18, 33, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.more), signs.more);
  m.sign(11, onGround(GROUND, signs.rows), signs.rows);
  m.sign(17, onGround(GROUND, signs.second), signs.second);
  m.sign(22, onGround(GROUND, signs.group), signs.group);
  m.sign(40, onGround(GROUND, signs.exit), signs.exit);
  const talks: Talk[] = [];
  stand(m, 'pip', PIP2_X, true);
  stand(m, 'moss', MOSS_X, false);
  stand(m, 'dot', DOT_X, false);
  talk(talks, 'pip', 'crowd', PIP2_X, DOT_X + 3);
  return { file: 'many', title: 'A Crowd', hint: 'Four voices, two cards.', map: m, talks };
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  return { book, pal, levels: [twoVoices(book, signs), crowd(book, signs)] };
}
