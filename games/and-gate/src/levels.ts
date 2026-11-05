// BOTH TOGETHER's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its wire, its dials and its signs.
//
//   1. Both Together: a wire along the sky from a spark box in the left wall, two dials on it, and a
//      dark lamp high on a post at its end. A spark runs the wire every few seconds. Lami jumps to
//      bump each dial on; only a spark that passes both lights the lamp, and the light slides down
//      to Lami, who carries it to the gate (the gate is the way out).
//   2. All Three: the same with three dials, and the wire climbs over a ledge, so one dial is
//      up where Lami must climb to it.
// Both rooms are closed in by brick walls you can see, so Lami is never stopped by something she can't.
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addGateBlocks } from './gateBlocks';
import { DIAL_OFF, FALL, LAMP, type Route } from './monsters';

export type SignName = 'wire' | 'dial' | 'both' | 'light' | 'gate' | 'three' | 'climb' | 'stay' | 'light2';

/** The block set both levels share: the Starter blocks, the wire, box and gate, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addGateBlocks(book, pal);
  const signs = {
    wire: addSign(book, pal, 'wire.sign', 'A SPARK RUNS THE WIRE', 4, 2),
    dial: addSign(book, pal, 'dial.sign', 'JUMP TO BUMP A DIAL ON', 4, 2),
    both: addSign(book, pal, 'both.sign', 'ONE DIAL OFF STOPS THE SPARK', 4, 2),
    light: addSign(book, pal, 'light.sign', 'THE LIGHT DROPS. TOUCH IT', 4, 2),
    gate: addSign(book, pal, 'gate.sign', 'THE LIGHT OPENS THIS GATE', 4, 2),
    three: addSign(book, pal, 'three.sign', 'ALL THREE MUST BE ON', 4, 2),
    climb: addSign(book, pal, 'climb.sign', 'THE WIRE CLIMBS. SO DOES LAMI', 4, 2),
    stay: addSign(book, pal, 'stay.sign', 'A DIAL STAYS ON', 4, 2),
    light2: addSign(book, pal, 'light2.sign', 'ALL ON? LAMP LIGHTS', 4, 2),
  };
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** The path a spark runs in this level, in blocks from the spark box. */
  route: Route;
  /** Where each dial hangs on the wire (level block), left to right. */
  dials: [number, number][];
  /** The lamp's block, and the foot of its post where the light settles. */
  lamp: [number, number];
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** The wire's row in level 1, and the spark box's block (in the left wall). */
export const WIRE = 6;
export const BOX: [number, number] = [0, WIRE];

/** The ground, brick walls at both ends, the entrance on the left (x 3), and a brick wall over the gate at `gateX` (the gate is the way out). */
function base(width: number, gateX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.col(gateX, 0, GROUND - 3, 'B');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Lays a wire through `pts` (level blocks, corner to corner), with the right piece in every cell from the first to the last. */
function lay(m: StarterMap, pts: [number, number][]): void {
  const cells: [number, number][] = [];
  pts.forEach(([x, y], i) => {
    if (i === 0) return cells.push([x, y]);
    const [px, py] = pts[i - 1];
    const sx = Math.sign(x - px);
    const sy = Math.sign(y - py);
    for (let cx = px + sx, cy = py + sy; ; cx += sx, cy += sy) {
      cells.push([cx, cy]);
      if (cx === x && cy === y) break;
    }
  });
  // a cell's arms point at its neighbors along the wire
  cells.forEach(([x, y], i) => {
    if (i === 0) return; // the spark box
    const arm = (o?: [number, number]): string[] => (o ? [o[0] < x ? 'W' : o[0] > x ? 'E' : '', o[1] < y ? 'N' : o[1] > y ? 'S' : ''].filter(Boolean) : []);
    const dirs = [...arm(cells[i - 1]), ...arm(cells[i + 1])].sort().join('');
    const name = { EW: 'wireWE', NS: 'wireNS', NW: 'wireWN', ES: 'wireSE', SW: 'wireWS', EN: 'wireNE' }[dirs] ?? (i === cells.length - 1 ? 'wireNS' : '');
    if (!name) throw new Error(`No wire piece for ${dirs} at ${x},${y}`);
    m.set(x, y, name);
  });
}

/** The route a spark runs, as corner offsets from the box, from the wire's corners. */
function routeOf(pts: [number, number][]): Route {
  return pts.map(([x, y]) => [x - pts[0][0], y - pts[0][1]]);
}

/** The gate in the doorway under a brick wall, as the level's one way out. */
function gate(m: StarterMap, x: number): void {
  m.set(x, GROUND - 2, 'gateArch').set(x, GROUND - 1, 'gateOne');
  m.exits.push({ from: [x + ORIGIN, GROUND - 1 + ORIGIN] });
}

/** Level 1: two dials, one wire. 38 wide; the ground is row 10. */
function bothTogether(book: Book, signs: Record<SignName, Sign>): Omit<Level, 'file' | 'title' | 'hint'> {
  const g = base(38, 35);
  g.row(9, 19, 21, 'c').row(9, 31, 32, 'c');
  scenery(
    g,
    [
      [4, 2],
      [12, 1],
      [28, 3],
    ],
    [11, 26, 34],
    [8, 22, 30],
  );
  const m = new StarterMap(book, g.rows());
  const pts: [number, number][] = [BOX, [23, WIRE], [23, 2]];
  m.set(BOX[0], BOX[1], 'box');
  lay(m, pts);
  const dials: [number, number][] = [
    [12, WIRE],
    [17, WIRE],
  ];
  for (const [x, y] of dials) m.mon(DIAL_OFF, x, y);
  const lamp: [number, number] = [23, 1];
  m.mon(LAMP, lamp[0], lamp[1]);
  m.sign(5, onGround(GROUND, signs.wire), signs.wire);
  m.sign(10, onGround(GROUND, signs.dial), signs.dial);
  m.sign(15, onGround(GROUND, signs.both), signs.both);
  m.sign(25, onGround(GROUND, signs.light), signs.light);
  m.sign(30, onGround(GROUND, signs.gate), signs.gate);
  gate(m, 35);
  return { map: m, route: routeOf([...pts, [23, 1]]), dials, lamp };
}

/** Level 2: three dials; the wire climbs over a ledge. 41 wide. */
function allThree(book: Book, signs: Record<SignName, Sign>): Omit<Level, 'file' | 'title' | 'hint'> {
  const g = base(41, 38);
  // the ledge the wire runs over, with a ladder up to it
  g.row(3, 10, 15, 'G').fill(10, 4, 6, 1, 'D');
  g.col(9, 2, 9, 'H');
  g.row(2, 11, 12, 'c').row(2, 14, 15, 'c').row(9, 30, 31, 'c').row(9, 36, 37, 'c');
  scenery(
    g,
    [
      [3, 2],
      [18, 2],
      [32, 3],
    ],
    [16, 28, 34],
    [6, 22, 33],
  );
  const m = new StarterMap(book, g.rows());
  const pts: [number, number][] = [BOX, [8, WIRE], [8, 1], [16, 1], [16, WIRE], [24, WIRE], [24, 2]];
  m.set(BOX[0], BOX[1], 'box');
  lay(m, pts);
  const dials: [number, number][] = [
    [5, WIRE],
    [13, 1],
    [20, WIRE],
  ];
  for (const [x, y] of dials) m.mon(DIAL_OFF, x, y);
  const lamp: [number, number] = [24, 1];
  m.mon(LAMP, lamp[0], lamp[1]);
  m.sign(4, onGround(GROUND, signs.three), signs.three);
  m.sign(10, onGround(GROUND, signs.climb), signs.climb);
  m.sign(17, onGround(GROUND, signs.stay), signs.stay);
  m.sign(26, onGround(GROUND, signs.light2), signs.light2);
  m.sign(32, onGround(GROUND, signs.gate), signs.gate);
  gate(m, 38);
  return { map: m, route: routeOf([...pts, [24, 1]]), dials, lamp };
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'and-gate');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Both Together', hint: 'Both dials must be on.', ...bothTogether(book, signs) },
    { file: 'two', title: 'All Three', hint: 'One dial off stops the spark.', ...allThree(book, signs) },
  ];
  return { book, pal, levels };
}

export { FALL };
