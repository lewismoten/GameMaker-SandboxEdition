// BEAMS AND FOG's three rooms, each 10 blocks tall. Kit walks along row 8; row 9 is the solid floor or ground.
//   1  The Beams   a dark hall, three lamps hung from the ceiling, three beams down to the floor: a solid one (the bricks vanish), a
//                  checkerboard one (they show) and one in three densities (soft edge). The beam is blocks: twins of the wall and floor.
//   2  The Fog     valley hills in three layers. The left half is covered in solid fog (flat, paler the farther), the right half in
//                  dithered fog at 75, 50 and 25 percent, with two banks of fog (monsters) drifting across it.
//   3  The Glow    the hall again, with three floating lanterns (monsters): a solid halo, a checkerboard halo and halos in rings.
import { MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { CRITTER } from './critters';
import { addHallBlocks, wallPicture } from './hall';
import { LAYERS, addHillBlocks, hillBlock, hillName, meadow, onHill, type Zone } from './hills';
import { SIGNS } from './text';

/** The row Kit walks on (the bottom of the doors) and the first solid row. */
export const BOTTOM = 8;
const FLOOR = 9;
const H = 10;

export interface Level {
  file: string;
  title: string;
  map: StarterMap;
  book: Book;
  /** The x of the exit's door (level blocks). */
  exit: number;
}

/** The beams' landmarks (level blocks). */
export const BEAMS = { width: 46, lamps: [12, 23, 34] as const, exit: 44 };
export const FOG_ROOM = { width: 54, zoneB: 26, exit: 51, far: { x: 28, row: 3, run: 10 }, near: { x: 30, row: 5, run: 10 } };
export const GLOW = { width: 44, lamps: [8, 19, 30] as const, row: 6, run: 6, exit: 42 };

type Words = Record<string, [string, number, number]>;

/** A block set with the Starters' blocks, the room's own (`add`) and the signs, with `sky` replaced by `behind` in the signs' pictures. */
function bookFor(pal: Pal, signs: Words, behind: number, add: (book: Book) => void): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  add(book);
  const on = { ...pal, c: (n: string, k: number) => (n === 'sky' && k === 3 ? behind : pal.c(n, k)) };
  const out: Record<string, Sign> = {};
  for (const [k, [text, w, h]] of Object.entries(signs)) out[k] = addSign(book, on, `${k}.sign`, text, w, h);
  return { book, signs: out };
}

/** A StarterMap whose edges carry on past the room: solid dark wood all round the hall, so the screen never shows the end of the map. */
class Hall extends StarterMap {
  constructor(
    private readonly wood: Book,
    rows: string[],
  ) {
    super(wood, rows);
  }
  override done(): GameMap {
    const map = super.done();
    const ceiling = this.wood.n('ceiling');
    for (let y = 0; y < ORIGIN + H; y++)
      for (let x = 0; x < MLEN; x++) if (y < ORIGIN || x < ORIGIN || x >= ORIGIN + this.width) map.blocks[y * MLEN + x] = ceiling;
    return map;
  }
}

/** The hall: a ceiling, a wall behind, a floor, a doorway at the left (x 3) and a door at `exit`. */
function hall(book: Book, width: number, exit: number): StarterMap {
  const g = new Grid(width, H);
  g.put(3, BOTTOM - 1, 's')
    .put(3, BOTTOM, 'S')
    .put(exit, BOTTOM - 1, 'e')
    .put(exit, BOTTOM, 'E');
  const m = new Hall(book, g.rows());
  for (let x = 0; x < width; x++) {
    const edge = x === 0 || x === width - 1;
    m.set(x, 0, 'ceiling');
    for (let y = 1; y < FLOOR; y++) m.set(x, y, edge ? 'ceiling' : 'wall');
    m.set(x, FLOOR, x === 0 || edge ? 'ceiling' : 'floor');
  }
  m.set(3, BOTTOM - 1, 'doorwayTopW').set(3, BOTTOM, 'doorwayBottomW');
  m.set(exit, BOTTOM - 1, 'doorTopW').set(exit, BOTTOM, 'doorBottomW');
  return m;
}

const board = (m: StarterMap, s: Sign, x: number, y: number) => s.board.forEach((row, dy) => row.forEach((name, dx) => m.set(x + dx, y + dy, name)));

/** How wide a beam is (blocks either side of its middle) on each row from the row below the lamp: 1, 1, 2, 2, 3, 3, 3 and the floor. */
const BEAM_HALF = [1, 1, 2, 2, 3, 3, 3, 3];
export const BEAM_TOP = 2;
/** Which density of light the block `dx` blocks from a beam's middle gets, for the beam's kind. */
export function tier(kind: 'solid' | 'checker' | 'soft', half: number, dx: number): 25 | 50 | 75 | 100 {
  if (kind === 'solid') return 100;
  if (kind === 'checker') return 50;
  const edge = half - Math.abs(dx);
  return edge === 0 ? 25 : edge === 1 ? 50 : 75;
}

/** The beams: three lamps, each with its beam of lit twins of the wall (rows 2 to 8) and the floor (row 9). */
export function beams(pal: Pal): Level {
  const { book, signs } = bookFor(pal, SIGNS.beams, wallPicture(pal).get(0, 1), (b) => addHallBlocks(b, pal, true));
  const m = hall(book, BEAMS.width, BEAMS.exit);
  board(m, signs.start, 4, 4);
  const kinds = ['solid', 'checker', 'soft'] as const;
  BEAMS.lamps.forEach((lx, i) => {
    m.set(lx, 1, 'lamp');
    for (let k = 0; k < BEAM_HALF.length; k++) {
      const y = BEAM_TOP + k;
      for (let dx = -BEAM_HALF[k]; dx <= BEAM_HALF[k]; dx++) m.set(lx + dx, y, `${y === FLOOR ? 'floor' : 'wall'}Lit${tier(kinds[i], BEAM_HALF[k], dx)}`);
    }
    board(m, signs[kinds[i]], lx - 5, 2);
  });
  board(m, signs.next, BEAMS.exit - 5, 4);
  return { file: 'beams', title: 'The Beams', map: m, book, exit: BEAMS.exit };
}

/** The hills: which row each layer's ridge is on (its fill is the row below). */
const RIDGE_ROW = [2, 4, 6];

/** The fog room: zone A (solid fog) up to `zoneB`, zone B (dithered fog) after it, a meadow row, a grass floor. */
export function fog(pal: Pal): Level {
  const { width, zoneB, exit } = FOG_ROOM;
  const zoneOf = (x: number): Zone => (x < zoneB ? 'solid' : 'dither');
  const { book, signs } = bookFor(pal, SIGNS.fog, meadow(pal), (b) => {
    addHillBlocks(b, pal);
    // the doors stand on the meadow (their feet) and in front of the near hills (their tops)
    for (const [name, x, from] of [
      ['doorwayTopH', 3, 'doorwayTop'],
      ['doorTopH', exit, 'doorTop'],
    ] as const)
      b.add(name, onHill(pal, b.pics.get(from)!, hillBlock(pal, zoneOf(x), 2, 'fill', x % 3)), { grav: 4 });
    for (const [name, from] of [
      ['doorwayBottomH', 'doorwayBottom'],
      ['doorBottomH', 'doorBottom'],
    ] as const)
      b.add(name, onHill(pal, b.pics.get(from)!, b.pics.get('meadow')!), { grav: 4 });
  });
  const g = new Grid(width, H);
  g.col(0, 0, FLOOR - 1, 'X').col(width - 1, 0, FLOOR - 1, 'X');
  for (let x = 0; x < width; x++) g.put(x, FLOOR, 'G');
  g.put(3, BOTTOM - 1, 's')
    .put(3, BOTTOM, 'S')
    .put(exit, BOTTOM - 1, 'e')
    .put(exit, BOTTOM, 'E');
  const m = new StarterMap(book, g.rows());
  for (let x = 1; x < width - 1; x++) {
    const zone = zoneOf(x);
    for (const layer of LAYERS) {
      m.set(x, RIDGE_ROW[layer], hillName(zone, layer, 'ridge', x % 3));
      m.set(x, RIDGE_ROW[layer] + 1, hillName(zone, layer, 'fill', x % 3));
    }
    m.set(x, BOTTOM, 'meadow');
  }
  m.set(3, BOTTOM - 1, 'doorwayTopH').set(3, BOTTOM, 'doorwayBottomH');
  m.set(exit, BOTTOM - 1, 'doorTopH').set(exit, BOTTOM, 'doorBottomH');
  const sign = (s: Sign, x: number) => m.sign(x, 6, s);
  sign(signs.start, 5);
  sign(signs.flat, 11);
  sign(signs.dither, zoneB + 3);
  sign(signs.thick, zoneB + 9);
  sign(signs.drift, zoneB + 15);
  sign(signs.next, exit - 5);
  // two banks of fog, three puffs each, side by side (the same monster so they stay together)
  for (const [bank, mon] of [
    [FOG_ROOM.far, CRITTER.puffFar],
    [FOG_ROOM.near, CRITTER.puffNear],
  ] as const)
    for (let i = 0; i < 3; i++) m.mon(mon, bank.x + i, bank.row);
  return { file: 'fog', title: 'The Fog', map: m, book, exit };
}

/** The glow: the hall with three lanterns drifting along row 6, each in its own stretch. */
export function glow(pal: Pal): Level {
  const { book, signs } = bookFor(pal, SIGNS.glow, wallPicture(pal).get(0, 1), (b) => addHallBlocks(b, pal, false));
  const m = hall(book, GLOW.width, GLOW.exit);
  board(m, signs.start, 4, 4);
  const kinds = ['solid', 'checker', 'soft'] as const;
  GLOW.lamps.forEach((lx, i) => {
    board(m, signs[kinds[i]], lx + 1, 1);
    m.mon([CRITTER.lampSolid, CRITTER.lampDither, CRITTER.lampSoft][i], lx, GLOW.row);
  });
  board(m, signs.next, GLOW.exit - 5, 4);
  return { file: 'glow', title: 'The Glow', map: m, book, exit: GLOW.exit };
}

/** The whole game's rooms. */
export function buildLevels(): { pal: Pal; beams: Level; fog: Level; glow: Level } {
  const pal = buildStarterPalette();
  return { pal, beams: beams(pal), fog: fog(pal), glow: glow(pal) };
}
