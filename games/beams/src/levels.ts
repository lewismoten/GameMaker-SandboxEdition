// BEAMS AND FOG's three rooms, each 10 blocks tall. Lian walks along row 8; row 9 is the solid floor or ground.
//   1  The Beams   a dark hall, three lamps hung from the ceiling, three beams down to the floor: a solid one (the bricks vanish), a
//                  checkerboard one (they show) and one in three densities (soft edge). The beam is blocks: twins of the wall and floor.
//   2  The Fog     valley hills in three layers. The left half is covered in solid fog (flat, paler the farther), the right half in
//                  dithered fog at 75, 50 and 25 percent, with two banks of fog (monsters) drifting across it.
//   3  The Glow    the hall again, with three floating lanterns, each a 3x3 group of monsters (a halo 60 pixels across): solid, checkerboard, in rings.
import { MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { Grid } from '../../kit/starter/grid';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { stampMicroPlaques, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addBeams } from './beam';
import { CRITTER, GROUP, HALOS, lampPiece } from './critters';
import { addHallBlocks } from './hall';
import { LAYERS, addHillBlocks, hillBlock, hillName, onHill, type Zone } from './hills';

/** The row Lian walks on (the bottom of the doors) and the first solid row. */
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
export const FOG_ROOM = { width: 54, zoneB: 26, exit: 51, far: { x: 28, row: 4, run: 10 }, near: { x: 30, row: 5, run: 10 } };
/** The glow's lanterns hang at `row` (the middle of a 3x3 group of monsters) and drift `run` blocks to the right. */
export const GLOW = { width: 48, lamps: [10, 21, 32] as const, row: 6, run: 6, exit: 46 };

// Keep the complete vocabulary together, but allocate only each room's own tiles.
const WORDS = {
  beams: {
    start: { lines: ['SEE', 'HOW'] },
    made: { lines: ["IT'S", 'MADE'] },
    solid: { lines: ['SOLID'] },
    checker: { lines: ['CHECKER'] },
    soft: { lines: ['SOFT', 'EDGE'] },
    next: { lines: ['NEXT', '→'] },
  },
  fog: {
    flat: { lines: ['SOLID'] },
    dither: { lines: ['CHECKER'] },
    thick: { lines: ['75 50 25', 'FAR→NEAR'], post: false },
    drift: { lines: ['FOG IS A', 'MONSTER'] },
    next: { lines: ['NEXT', '→'] },
  },
  glow: { solid: { lines: ['SOLID'] }, checker: { lines: ['CHECKER'] }, soft: { lines: ['RINGS', '75 50 25'], post: false }, next: { lines: ['ALL', 'DONE'] } },
};

/** Each room allocates only its own plaques. */
function bookFor(pal: Pal, room: keyof typeof WORDS, add: (book: Book) => void): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  add(book);
  const signs = addMicroPlaques<string>(book, pal, WORDS[room]);
  return { book, signs };
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
  // A two-row wooden entrance stage; the hall floor and lamps stay in the locked view.
  for (let y = FLOOR - 2; y < FLOOR; y++) for (let x = 2; x <= 3; x++) m.set(x, y, 'floor');
  m.set(3, BOTTOM - 3, 'doorwayTopW').set(3, BOTTOM - 2, 'doorwayBottomW');
  m.start[1] -= 2;
  m.set(exit, BOTTOM - 1, 'doorTopW').set(exit, BOTTOM, 'doorBottomW');
  return m;
}

/** Preserve the brick/hill backdrop behind side borders and posts; reject lamps, doors and other signs. */
function board(book: Book, pal: Pal, m: StarterMap, s: Sign | Sign[], x: number, y: number, postHeight = 1): void {
  const plaques = Array.isArray(s) ? s : [s];
  stampMicroPlaques(
    {
      set: (bx, by, name) => {
        const old = m.map.blocks[(ORIGIN + by) * MLEN + ORIGIN + bx];
        const base = [...book.index.keys()][old];
        if (base !== 'wall' && base !== 'sky' && base !== 'meadow' && !base.startsWith('hill.')) throw new Error(`Sign at ${bx},${by} would cover ${base}`);
        const pic = book.pics.get(name)!;
        const behind = book.pics.get(base)!;
        if (!name.startsWith('microPlaque.post')) {
          m.set(bx, by, name);
          return;
        }
        const composed = pic.crop(0, 0, 20, 20).map((px, py, color) => (color === skyOf(pal) ? behind.get(px, py) : color));
        const shared = [...book.pics].find(([, p]) => p.px.every((color, i) => color === composed.px[i]));
        const tile = shared?.[0] ?? `${name}.on.${base}`;
        if (!shared) book.add(tile, composed, { grav: PULL.down });
        m.set(bx, by, tile);
      },
    },
    x,
    y,
    plaques,
    plaques.at(-1)?.post ? postHeight : 0,
  );
}

/** The beams: three lamps, each with its beam of lit twins of the wall (rows 2 to 8) and the floor (row 9). */
export function beams(pal: Pal): Level {
  const { book, signs } = bookFor(pal, 'beams', (b) => addHallBlocks(b, pal, true));
  const m = hall(book, BEAMS.width, BEAMS.exit);

  const kinds = ['solid', 'checker', 'soft'] as const;
  const lit = addBeams(book, pal, BEAMS.lamps, kinds, [1, FLOOR]);
  for (const [at, name] of lit) {
    const [x, y] = at.split(',').map(Number);
    m.set(x, y, name);
  }
  // Stacked at the nearest clear column beside the entrance stage.
  board(book, pal, m, [signs.start, signs.made], 6, 6);
  board(book, pal, m, signs.solid, 17, 7);
  board(book, pal, m, signs.checker, 28, 7);
  board(book, pal, m, signs.soft, 39, 7);
  board(book, pal, m, signs.next, BEAMS.exit - 3, 7);
  return { file: 'beams', title: 'The Beams', map: m, book, exit: BEAMS.exit };
}

/** The hills: which row each layer's ridge is on (its fill is the row below). */
const RIDGE_ROW = [2, 4, 6];

/** The fog room: zone A (solid fog) up to `zoneB`, zone B (dithered fog) after it, a meadow row, a grass floor. */
export function fog(pal: Pal): Level {
  const { width, zoneB, exit } = FOG_ROOM;
  const zoneOf = (x: number): Zone => (x < zoneB ? 'solid' : 'dither');
  const { book, signs } = bookFor(pal, 'fog', (b) => {
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
  // The entrance stands on a two-row turf plinth, with its new door corners showing the hills behind it.
  for (const [name, from, y] of [
    ['raisedDoorTopH', 'doorwayTop', BOTTOM - 3],
    ['raisedDoorBottomH', 'doorwayBottom', BOTTOM - 2],
  ] as const) {
    const behind = [...book.index.keys()][m.map.blocks[(ORIGIN + y) * MLEN + ORIGIN + 3]];
    book.add(name, onHill(pal, book.pics.get(from)!, book.pics.get(behind)!), { grav: PULL.down });
    m.set(3, y, name);
  }
  for (let x = 2; x <= 3; x++) m.set(x, FLOOR - 2, 'grass').set(x, FLOOR - 1, 'dirt');
  m.start[1] -= 2;
  // Stagger the wider boards over the hillside backdrop, clear of doors and each other.
  board(book, pal, m, signs.flat, 12, 7);
  board(book, pal, m, signs.dither, zoneB + 3, 7);
  board(book, pal, m, signs.thick, zoneB + 9, 4);
  board(book, pal, m, signs.drift, zoneB + 15, 7);
  board(book, pal, m, signs.next, exit - 3, 7);
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
  const { book, signs } = bookFor(pal, 'glow', (b) => addHallBlocks(b, pal, false));
  const m = hall(book, GLOW.width, GLOW.exit);
  const kinds = ['solid', 'checker', 'soft'] as const;
  GLOW.lamps.forEach((lx, i) => {
    board(book, pal, m, signs[kinds[i]], lx - 3, i === 2 ? 3 : 7);
    for (let ty = 0; ty < GROUP; ty++) for (let tx = 0; tx < GROUP; tx++) m.mon(lampPiece(HALOS[i], tx, ty), lx + tx - 1, GLOW.row + ty - 1);
  });
  board(book, pal, m, signs.next, GLOW.exit - 3, 7);
  return { file: 'glow', title: 'The Glow', map: m, book, exit: GLOW.exit };
}

/** The whole game's rooms. */
export function buildLevels(): { pal: Pal; beams: Level; fog: Level; glow: Level } {
  const pal = buildStarterPalette(undefined, 'beams');
  return { pal, beams: beams(pal), fog: fog(pal), glow: glow(pal) };
}
