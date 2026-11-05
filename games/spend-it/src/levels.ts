// SPEND IT's two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts for
// what the letters mean), then given its stall and signs.
//
//   1. A Key For 3 Coins: four coins in the level and a stall that sells a gold key for three. With two coins
//      the stall does nothing. The last two coins are up a ladder. Pay, take the key, open the gold door.
//   2. Save Up: five coins and a stall that wants all five. Coins left over from level 1 are still in the pocket.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addAwning, addCash, addSold, addStall, stallName } from '../../kit/starter/shop';
import { addGoldBlocks } from './lockBlocks';

export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addGoldBlocks(book, pal);
  addCash(book);
  addSold(book, pal);
  addAwning(book, pal, 3);
  addStall(book, pal, 'key', 3);
  addAwning(book, pal, 5);
  addStall(book, pal, 'key', 5);
  const signs = {
    money: addSign(book, pal, 'money', 'COINS ARE MONEY. F2 SHOWS HOW MUCH', 4, 4),
    cost: addSign(book, pal, 'cost', 'THE KEY COSTS 3 COINS', 4, 3),
    paid: addSign(book, pal, 'paid', 'PAYING TAKES 3 COINS. THE REST STAY WITH YOU', 4, 4),
    door: addSign(book, pal, 'door', 'THE KEY OPENS THE DOOR', 4, 3),
    carry: addSign(book, pal, 'carry', 'COINS LEFT OVER COME TOO', 4, 3),
    five: addSign(book, pal, 'five', 'THE KEY COSTS 5 COINS. TAKE ALL 5', 4, 4),
    exact: addSign(book, pal, 'exact', 'EXACTLY ENOUGH IS ENOUGH', 4, 3),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
  };
  return { book, signs };
}

export type SignName = 'money' | 'cost' | 'paid' | 'door' | 'carry' | 'five' | 'exact' | 'exit';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** A brick wall from row `from` down to a door: a gap for the arch and the door on the last two rows (put by the caller). */
function wall(g: Grid, x: number, ground: number, top: string, gate: string, from = 0): void {
  g.col(x, from, ground - 3, 'B')
    .put(x, ground - 2, top)
    .put(x, ground - 1, gate);
}

/** The ground, the hedges at both ends, the entrance at x 3 and the exit at x `exitX`. */
function frame(width: number, exitX: number): { g: Grid; GROUND: number } {
  const g = new Grid(width, 15);
  const GROUND = 10;
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return { g, GROUND };
}

/** Every coin letter (c) on the grid becomes cash: the coin that adds to Money, with no score. */
function cash(m: StarterMap, rows: string[]): StarterMap {
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === 'c' && m.set(x, y, 'cash')));
  return m;
}

const clouds = (g: Grid, at: readonly (readonly [number, number])[]) => at.forEach(([x, y]) => g.put(x, y, '(').put(x + 1, y, ')'));

/** Level 1: a key for 3 coins. 46 blocks wide; the ground is row 10. Two coins, the stall, a ladder to two more, then the gold door. */
function keyFor3(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const { g, GROUND } = frame(46, 43);
  g.row(9, 9, 10, 'c');
  g.col(20, 5, 9, 'H').row(6, 21, 26, 'G').row(7, 21, 26, 'D').row(5, 23, 24, 'c');
  wall(g, 34, GROUND, 'l', 'L');
  clouds(g, [
    [6, 2],
    [14, 0],
    [30, 1],
    [38, 2],
  ]);
  for (const x of [1, 18, 29, 8]) g.put(x, GROUND - 1, 'b');
  for (const x of [13, 31, 44]) g.put(x, GROUND - 1, 'f');
  const m = cash(new StarterMap(book, g.rows()), g.rows());
  m.set(16, GROUND - 1, stallName('key', 3)).set(16, GROUND - 2, 'awning3');
  m.sign(5, onGround(GROUND, signs.money), signs.money);
  m.sign(11, onGround(GROUND, signs.cost), signs.cost);
  m.sign(27, onGround(GROUND, signs.paid), signs.paid);
  m.sign(35, onGround(GROUND, signs.door), signs.door);
  m.sign(40, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: save up. 46 blocks wide. Five coins on two floors, a stall that wants five, the gold door behind. */
function saveUp(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const { g, GROUND } = frame(46, 43);
  g.row(9, 8, 10, 'c');
  g.col(14, 5, 9, 'H').row(6, 15, 20, 'G').row(7, 15, 20, 'D').row(5, 17, 18, 'c');
  wall(g, 34, GROUND, 'l', 'L');
  clouds(g, [
    [8, 1],
    [24, 2],
    [34, 0],
  ]);
  for (const x of [5, 22, 31, 44]) g.put(x, GROUND - 1, 'b');
  for (const x of [12, 29, 44]) g.put(x, GROUND - 1, 'f');
  const m = cash(new StarterMap(book, g.rows()), g.rows());
  m.set(25, GROUND - 1, stallName('key', 5)).set(25, GROUND - 2, 'awning5');
  m.sign(4, onGround(GROUND, signs.carry), signs.carry);
  m.sign(21, onGround(GROUND, signs.five), signs.five);
  m.sign(27, onGround(GROUND, signs.exact), signs.exact);
  m.sign(40, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'A Key For 3 Coins', hint: 'Coins pay for what you want.', map: keyFor3(book, signs) },
    { file: 'two', title: 'Save Up', hint: 'Coins you keep come with you.', map: saveUp(book, signs) },
  ];
  return { book, pal, levels };
}
