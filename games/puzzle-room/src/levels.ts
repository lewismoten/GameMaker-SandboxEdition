// WIRED ROOM's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, levers and bridge.
//
// The screen is 16 blocks wide and the view starts centered on the entrance, so each level puts its pool
// (the goal) in that first view, a few steps right of the entrance, with the signs about it beside the
// entrance. The levers are behind the player, to the left: the way back is walked after seeing the bridge.
//   1. Two Levers: two red levers on the path and a pool across it with six dotted planks over it.
//      Each lever puts 3 on counter 22 and each plank takes 1 off, so one lever builds half the
//      bridge and both build all of it. The pool is soft: a link at its bottom sends Lian back to the way in.
//   2. Wired Room: a blue lever on the path, a ladder up to a ledge with a second blue lever and
//      an odd red lever. A red hatch is in the path (counter 24), then a pool with six blue planks (23).
//      The blue pair builds the bridge. The red lever puts two on counter 24, and the hatch spends one a cell:
//      it opens and drops Lian into a hole, where a link sends him back to the way in. No hurt anywhere.
// Every room is closed in by hedges you can see, so Lian is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addWireBlocks, HATCH_CELLS, PLANKS } from './wireBlocks';

export type SignName = 'each' | 'six' | 'soft' | 'blue' | 'upstairs' | 'redOdd' | 'hatch' | 'both' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the wire blocks. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    each: addSign(book, pal, 'each.sign', '← EACH LEVER ADDS 3 PLANKS', 4, 3),
    six: addSign(book, pal, 'six.sign', 'THE BRIDGE NEEDS 6 PLANKS', 4, 3),
    soft: addSign(book, pal, 'soft.sign', 'A SOFT POOL: YOU JUST START OVER', 4, 3),
    blue: addSign(book, pal, 'blue.sign', 'BLUE LEVERS BUILD THE BRIDGE', 4, 3),
    upstairs: addSign(book, pal, 'up.sign', 'ONE BLUE LEVER IS UP THE LADDER', 4, 3),
    redOdd: addSign(book, pal, 'redodd.sign', 'RED LEVER OPENS THE HATCH', 4, 2),
    hatch: addSign(book, pal, 'hatch.sign', '← A HATCH IN THE PATH', 4, 3),
    both: addSign(book, pal, 'both.sign', '6 PLANKS NEED BOTH BLUE LEVERS', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addWireBlocks(book, pal);
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** Level blocks where a link sends Lian back to the way in (the bottom of the pool and of the hole). */
  drops: [number, number][];
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** Where each level's levers, ladder, pool and hatch are (columns), for the bot's route and the shots. */
// The entrance is where the view starts: its 16 columns run from entrance - 8 to entrance + 7. The ladders are at the
// east end of each ledge, so the levers are met walking west from the entrance and the way down is the same ladder.
export const L1 = { entrance: 22, leverA: 9, ladder: 8, ledge: [2, 7], leverB: 4, pool: 24 } as const;
export const L2 = { entrance: 44, leverA: 25, ladder: 18, ledge: [5, 17], leverB: 16, leverC: 8, hatch: 36, pool: 47 } as const;
/** The row a lever stands in on the ledge in level 2: the ledge's top. */
export const LEDGE_ROW = 5;

/** The ground, the side walls, the entrance at `entranceX` and the exit door at `exitX`. */
function base(width: number, entranceX: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(entranceX, 8, 's').put(entranceX, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Fills the digs' blocks once the map exists: a ghost plank row, the water top, the water. */
function fillPool(m: StarterMap, x0: number, color: 'Red' | 'Blue'): [number, number][] {
  const drops: [number, number][] = [];
  for (let i = 0; i < PLANKS; i++) {
    m.set(x0 + i, GROUND, `ghost${color}`)
      .set(x0 + i, GROUND + 1, 'poolTop')
      .set(x0 + i, GROUND + 2, 'pool');
    drops.push([x0 + i, GROUND + 2]);
  }
  return drops;
}

/** Level 1: the pool with six dotted planks beside the entrance, then (to the left) a lever on the path and a ladder to a second one on a ledge. 44 blocks wide. */
function twoLevers(book: Book, signs: Record<SignName, Sign>): { map: StarterMap; drops: [number, number][] } {
  const g = base(44, L1.entrance, 40);
  g.fill(L1.pool, GROUND, PLANKS, 3, ' ');
  g.row(LEDGE_ROW + 1, L1.ledge[0], L1.ledge[1], 'G').row(LEDGE_ROW + 2, L1.ledge[0], L1.ledge[1], 'D');
  g.col(L1.ladder, LEDGE_ROW, GROUND - 1, 'H');
  g.row(9, L1.pool, L1.pool + PLANKS - 1, 'c')
    .row(9, 31, 34, 'c')
    .row(LEDGE_ROW, 2, 2, 'c')
    .row(LEDGE_ROW, 6, 6, 'c');
  scenery(
    g,
    [
      [5, 2],
      [17, 1],
      [30, 3],
      [38, 1],
    ],
    [1, 23, 35],
    [3, 5, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(18, onGround(GROUND, signs.each), signs.each);
  m.sign(10, onGround(GROUND, signs.soft), signs.soft);
  m.sign(14, onGround(GROUND, signs.six), signs.six);
  m.sign(36, onGround(GROUND, signs.exit), signs.exit);
  m.set(L1.leverA, GROUND - 1, 'leverRed');
  m.set(L1.leverB, LEDGE_ROW, 'leverRed');
  return { map: m, drops: fillPool(m, L1.pool, 'Red') };
}

/** Level 2: the blue pool beside the entrance and a hatch in the path to its left, then (further left) a blue lever on the path and a ladder to a ledge (blue lever, odd red lever). 64 blocks wide. */
function wiredRoom(book: Book, signs: Record<SignName, Sign>): { map: StarterMap; drops: [number, number][] } {
  const g = base(64, L2.entrance, 60);
  g.fill(L2.pool, GROUND, PLANKS, 3, ' ');
  g.fill(L2.hatch, GROUND + 1, HATCH_CELLS, 2, ' ');
  // the ledge for the second blue lever and the odd red one, with a ladder up its east end
  g.row(LEDGE_ROW + 1, L2.ledge[0], L2.ledge[1], 'G').row(LEDGE_ROW + 2, L2.ledge[0], L2.ledge[1], 'D');
  g.col(L2.ladder, LEDGE_ROW, GROUND - 1, 'H');
  g.row(9, L2.pool, L2.pool + PLANKS - 1, 'c')
    .row(9, 54, 55, 'c')
    .row(LEDGE_ROW, 14, 15, 'c');
  scenery(
    g,
    [
      [3, 2],
      [22, 1],
      [40, 3],
      [58, 2],
    ],
    [2, 24, 42],
    [19, 45, 46],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(38, onGround(GROUND, signs.hatch), signs.hatch);
  m.sign(31, onGround(GROUND, signs.both), signs.both);
  m.sign(27, onGround(GROUND, signs.blue), signs.blue);
  m.sign(20, onGround(GROUND, signs.upstairs), signs.upstairs);
  m.sign(10, LEDGE_ROW - signs.redOdd.board.length, signs.redOdd);
  m.sign(56, onGround(GROUND, signs.exit), signs.exit);
  m.set(L2.leverA, GROUND - 1, 'leverBlue');
  m.set(L2.leverB, LEDGE_ROW, 'leverBlue');
  m.set(L2.leverC, LEDGE_ROW, 'leverHatch');
  const holes: [number, number][] = [];
  for (let i = 0; i < HATCH_CELLS; i++) {
    m.set(L2.hatch + i, GROUND, 'hatch')
      .set(L2.hatch + i, GROUND + 1, 'cave')
      .set(L2.hatch + i, GROUND + 2, 'cave');
    holes.push([L2.hatch + i, GROUND + 2]);
  }
  return { map: m, drops: [...fillPool(m, L2.pool, 'Blue'), ...holes] };
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'puzzle-room');
  const { book, signs } = buildBlocks(pal);
  const one = twoLevers(book, signs);
  const two = wiredRoom(book, signs);
  const levels: Level[] = [
    { file: 'one', title: 'Two Levers', hint: 'Two pulls fill the bridge.', ...one },
    { file: 'two', title: 'Wired Room', hint: 'Which lever goes with what?', ...two },
  ];
  return { book, pal, levels };
}
