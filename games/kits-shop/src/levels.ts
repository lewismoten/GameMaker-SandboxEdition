// KIT'S SHOP's one level, painted on a Grid (a block a character, see games/kit/starter/map.ts).
//
//   The street: six coins on the path and two more up a ladder, eight in all, and a sign for the shop.
//   The shop: a roof and a doorway, three stalls in a row (a gold key for 3, a silver key for 3, a heart for 2),
//   then two locked gates in a wall, silver and gold, then the exit. Both keys cost 6; all three cost 8, every coin.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks } from '../../kit/starter/locks';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addAwning, addCash, addSold, addStall, stallName } from '../../kit/starter/shop';
import { addSign, type Sign } from '../../kit/starter/sign';

export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  addCash(book);
  addSold(book, pal);
  addAwning(book, pal, 3);
  addAwning(book, pal, 2);
  addStall(book, pal, 'key', 3);
  addStall(book, pal, 'silver', 3);
  addStall(book, pal, 'heart', 2);
  const signs = {
    street: addSign(book, pal, 'street', "KIT'S SHOP. TAKE COINS FIRST", 4, 3),
    prices: addSign(book, pal, 'prices', 'EACH THING HAS A PRICE. PAY, THEN TAKE IT', 4, 4),
    both: addSign(book, pal, 'both', 'THE EXIT NEEDS BOTH KEYS', 4, 3),
    heart: addSign(book, pal, 'heart', 'A HEART IS AN EXTRA LIFE', 4, 3),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
  };
  return { book, signs };
}

export type SignName = 'street' | 'prices' | 'both' | 'heart' | 'exit';

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

/** The one level: 56 blocks wide, the ground is row 10. */
function shop(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const { g, GROUND } = frame(56, 54);
  // the street: six coins on the path, two more up a ladder
  g.row(9, 9, 11, 'c').row(9, 14, 16, 'c');
  g.col(18, 5, 9, 'H').row(6, 19, 22, 'G').row(7, 19, 22, 'D').row(5, 20, 21, 'c');
  // the shop: a brick roof and a doorway, and a wall with two gates at the far end (silver, then gold)
  g.fill(24, 0, 27, 4, 'B').fill(24, 4, 1, 4, 'B');
  wall(g, 48, GROUND, 'm', 'M', 4);
  wall(g, 50, GROUND, 'l', 'L', 4);
  clouds(g, [
    [6, 2],
    [14, 0],
    [52, 1],
  ]);
  for (const x of [1, 12, 23, 52]) g.put(x, GROUND - 1, 'b');
  for (const x of [8, 17, 46]) g.put(x, GROUND - 1, 'f');
  const rows = g.rows();
  const m = cash(new StarterMap(book, rows), rows);
  for (const [x, item, price] of [
    [30, 'key', 3],
    [34, 'silver', 3],
    [38, 'heart', 2],
  ] as const) {
    m.set(x, GROUND - 1, stallName(item, price)).set(x, GROUND - 2, `awning${price}`);
  }
  m.sign(5, onGround(GROUND, signs.street), signs.street);
  m.sign(26, onGround(GROUND, signs.both), signs.both);
  m.sign(40, onGround(GROUND, signs.heart), signs.heart);
  m.sign(44, onGround(GROUND, signs.prices), signs.prices);
  m.sign(51, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [{ file: 'one', title: "Kit's Shop", hint: 'Pay for what you want.', map: shop(book, signs) }];
  return { book, pal, levels };
}
