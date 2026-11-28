// KIT'S SHOP's one level, painted on a Grid (a block a character, see games/kit/starter/map.ts).
//
//   The street: six coins on the path and two more up a ladder, eight in all, and a sign for the shop.
//   The shop: a roof and a doorway, three stalls in a row (a gold key for 3, a silver key for 3, a heart for 2),
//   then two locked gates in a wall, silver and gold, then the exit. Both keys cost 6; all three cost 8, every coin.
import { SHOP_BOARD, addFront } from './front';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks } from '../../kit/starter/locks';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addAwning, addCash, addSold, addStall, stallName } from '../../kit/starter/shop';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';

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
  const signs = addMicroPlaques(book, pal, {
    street: { lines: ['COINS', 'FIRST'] },
    prices: { lines: ['PAY,', 'TAKE'] },
    both: { lines: ['GET', 'KEYS'] },
    heart: { lines: ['+1', 'LIFE'] },
    exit: { lines: ['EXIT', '→'], post: false },
  });
  addFront(book, pal); // last, so no other block's number moves
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
  // A three-row turf ledge keeps the shop's roof board in the fixed view.
  g.row(7, 1, 3, 'G').fill(1, 8, 3, 2, 'D');
  g.put(3, 5, 's').put(3, 6, 'S');
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
function shop(book: Book, pal: Pal, signs: Record<SignName, Sign>): StarterMap {
  const { g, GROUND } = frame(56, 54);
  // the street: six coins on the path, two more up a ladder
  g.row(9, 9, 11, 'c').row(9, 14, 16, 'c');
  g.col(18, 5, 9, 'H').row(6, 19, 22, 'G').row(7, 19, 22, 'D').row(5, 20, 21, 'c');
  // the shop: a front with a roof and an awning (put below), a doorway at x 24, and a wall with two gates at the far end (silver, then gold)
  g.fill(24, 4, 1, 4, 'B');
  wall(g, 48, GROUND, 'm', 'M', 4);
  wall(g, 50, GROUND, 'l', 'L', 4);
  clouds(g, [
    [6, 2],
    [14, 0],
    [52, 1],
  ]);
  g.put(1, 6, 'b');
  for (const x of [12, 23, 52]) g.put(x, GROUND - 1, 'b');
  for (const x of [8, 17, 46]) g.put(x, GROUND - 1, 'f');
  const rows = g.rows();
  const m = cash(new StarterMap(book, rows), rows);
  // the building: a dim brick wall behind the stalls, an awning across the front, the roof's edge, two windows and the SHOP board over the doorway
  for (let x = 25; x <= 49; x++) for (let y = 4; y < GROUND; y++) if (x !== 48) m.set(x, y, 'backWall');
  for (let x = 24; x <= 50; x++) m.set(x, 3, 'stripe').set(x, 2, 'roofCap');
  for (const x of [32, 36]) m.set(x, 5, 'window');
  SHOP_BOARD.forEach((name, i) => m.set(24 + i, 1, name));
  for (const [x, item, price] of [
    [30, 'key', 3],
    [34, 'silver', 3],
    [38, 'heart', 2],
  ] as const) {
    m.set(x, GROUND - 1, stallName(item, price)).set(x, GROUND - 2, `awning${price}`);
  }
  // The shop's plain back wall is scenery, not a gameplay cell. Composite each
  // post from its pristine kit picture, keeping the brick behind it intact.
  const place = (x: number, y: number, sign: Sign) =>
    stampTiledSign(
      {
        set: (cx, cy, name) => {
          const existing = m.map.blocks[(cy + ORIGIN) * 100 + cx + ORIGIN];
          if (existing === book.n('sky')) return m.setOnSky(cx, cy, name);
          if (existing !== book.n('backWall')) throw new Error(`Plaque covers shop art at ${cx},${cy}`);
          const id = `${name}.wall`;
          if (!book.has(id)) {
            const src = book.pics.get(name)!;
            const wall = book.pics.get('backWall')!;
            book.add(
              id,
              new Pixels(20, 20).blit(src, 0, 0).map((px, py, c) => (c === skyOf(pal) ? wall.px[py * 20 + px] : c)),
              { grav: PULL.down },
            );
          }
          return m.set(cx, cy, id);
        },
      },
      x,
      y,
      sign,
      1,
      { maxPostHeight: 1 },
    );
  place(5, onGround(GROUND, signs.street), signs.street);
  place(26, onGround(GROUND, signs.both), signs.both);
  // Price instructions precede the first stall; the life hint precedes its heart.
  place(28, onGround(GROUND, signs.prices), signs.prices);
  place(36, onGround(GROUND, signs.heart), signs.heart);
  place(53, 7, signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'kits-shop');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [{ file: 'one', title: "Kit's Shop", hint: 'Pay for what you want.', map: shop(book, pal, signs) }];
  return { book, pal, levels };
}
