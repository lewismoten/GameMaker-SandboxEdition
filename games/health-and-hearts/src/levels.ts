// HEALTH AND HEARTS's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, spikes, hearts and faces.
//
//   1. Hit Points: F2 shows them; one spike takes ten and Kit carries on.
//   2. Hearts Heal: another spike, then two hearts give the hit points back. They go on to the next room.
//   3. Lives: four spikes spread along the ground are more than Kit has, so the third one costs a life and the
//      room starts again with a full 30. The hearts on the ledge up and left, and the second try takes them.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addHealth } from './health';

export type SignName = 'f2' | 'spike' | 'heal' | 'carry' | 'zero' | 'past' | 'face' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the hazards. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    f2: addSign(book, pal, 'f2.sign', 'F2 SHOWS YOUR HIT POINTS', 4, 3),
    spike: addSign(book, pal, 'spike.sign', 'A SPIKE TAKES 10 HIT POINTS', 4, 3),
    heal: addSign(book, pal, 'heal.sign', 'A HEART GIVES 10 HIT POINTS BACK', 4, 3),
    carry: addSign(book, pal, 'carry.sign', 'HIT POINTS GO WITH YOU TO THE NEXT ROOM', 4, 4),
    zero: addSign(book, pal, 'zero.sign', 'AT ZERO HIT POINTS YOU LOSE A LIFE', 4, 3),
    past: addSign(book, pal, 'past.sign', 'HEARTS CAN TAKE YOU PAST 30', 4, 3),
    face: addSign(book, pal, 'face.sign', 'A FACE ADDS A LIFE', 4, 2),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addHealth(book, pal);
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;

/** The ground, the side walls, the entrance on the left (x 3) and the exit door at `exitX`. */
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

/** Level 1: one spike to walk into. 40 blocks wide. */
function hitPoints(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(40, 36);
  g.row(9, 23, 26, 'c');
  scenery(
    g,
    [
      [6, 2],
      [19, 1],
      [30, 3],
    ],
    [11, 21, 34],
    [8, 28, 32],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.f2), signs.f2);
  m.sign(12, onGround(GROUND, signs.spike), signs.spike);
  m.sign(32, onGround(GROUND, signs.exit), signs.exit);
  m.set(17, GROUND - 1, 'spikeUp');
  return m;
}

/** Level 2: a spike, then two hearts that heal it. 40 blocks wide. */
function heartsHeal(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(40, 36);
  g.row(9, 27, 29, 'c');
  scenery(
    g,
    [
      [8, 1],
      [18, 3],
      [30, 2],
    ],
    [10, 31, 34],
    [8, 25, 33],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.heal), signs.heal);
  m.sign(23, onGround(GROUND, signs.carry), signs.carry);
  m.sign(32, onGround(GROUND, signs.exit), signs.exit);
  m.set(13, GROUND - 1, 'spikeUp');
  for (const x of [17, 19]) m.set(x, GROUND - 1, 'heart');
  return m;
}

/** Where level 3's hearts sit and where its four spikes stand (spaced out, so each one stings on its own). */
export const LEDGE_HEARTS = [16, 17] as const;
export const SPIKE_ROW = [21, 24, 27, 30] as const;
/** The ledge with the face, and the face. */
export const FACE_X = 39;

/** Level 3: four spikes spread along the ground are more than 30 hit points; the hearts on a ledge make up for it. 50 blocks wide. */
function lives(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(50, 46);
  g.row(8, 14, 19, '=').row(8, 37, 41, '=');
  g.put(15, 7, 'c').put(18, 7, 'c').put(40, 7, 'c').put(41, 7, 'c');
  scenery(
    g,
    [
      [6, 2],
      [19, 1],
      [28, 3],
      [40, 2],
    ],
    [8, 19, 35],
    [32, 42],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.zero), signs.zero);
  m.sign(9, onGround(GROUND, signs.past), signs.past);
  m.sign(33, onGround(GROUND, signs.face), signs.face);
  m.sign(43, onGround(GROUND, signs.exit), signs.exit);
  for (const x of LEDGE_HEARTS) m.set(x, 7, 'heart');
  for (const x of SPIKE_ROW) m.set(x, GROUND - 1, 'spikeUp');
  m.set(FACE_X, 7, 'oneUp');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Hit Points', hint: 'F2 shows how many you have.', map: hitPoints(book, signs) },
    { file: 'two', title: 'Hearts Heal', hint: 'Touch a heart to mend.', map: heartsHeal(book, signs) },
    { file: 'three', title: 'Lives', hint: 'Zero hit points costs a life.', map: lives(book, signs) },
  ];
  return { book, pal, levels };
}
