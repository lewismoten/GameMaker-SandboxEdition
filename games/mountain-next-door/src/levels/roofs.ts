// Level 11, ROOFTOPS (night): Wisp's trail of snow runs over the town's roofs, not along its streets. The roofs
// step up and down; the way up is a chimney's warm smoke, which lifts you, but each chimney puffs on a clock: watch
// one puff, then step in at the start of the next. Hop the brick stacks, take every drift of snow (Wisp's trail),
// and read what the chimneys did not say. The trail ends where the snow goes down to the mill road.
import { ORIGIN, StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, type Level } from '../level';

export const G_ROOFS = 38;

export const ROOFS_AT = {
  /** Each house: first column, last column, roof row. */
  houses: [
    [1, 12, 30],
    [13, 26, 30],
    [28, 36, 24],
    [37, 48, 28],
    [50, 58, 22],
    [60, 70, 16],
    [71, 80, 22],
    [81, 86, 28],
  ],
  /** Chimneys that puff: [column, the roof row below, the row of the roof it lifts you to]. */
  puffs: [
    [26, 30, 24],
    [48, 28, 22],
    [58, 22, 16],
  ],
  /** Brick stacks to hop: [column, roof row]. */
  stacks: [
    [18, 30],
    [65, 16],
  ],
  flakes: [10, 16, 23, 31, 34, 41, 45, 53, 62, 68, 74, 78, 83],
  moon: [40, 3],
  exit: 85,
  signs: { over: 4, smoke: 19, clock: 39, friends: 60, mill: 81 },
} as const;

const SIGNS = {
  over: ['WISP WENT OVER THE ROOFS. SO DO YOU.', 4, 3],
  smoke: ['WARM SMOKE RISES. SO WILL YOU.', 4, 3],
  clock: ['IT PUFFS ON A CLOCK. WATCH ONE FIRST.', 4, 3],
  friends: ['WISP TALKED TO EVERY CHIMNEY. NONE OF THEM TALKED BACK.', 4, 4],
  mill: ['THE SNOW GOES DOWN TO THE MILL ROAD.', 4, 3],
} as const;

/** The roof row under column `x`. */
export const roofAt = (x: number): number => (ROOFS_AT.houses.find(([a, b]) => x >= a && x <= b) as readonly number[])[2];

export function levelRoofs(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['town', 'roofs', 'stars'], { stars: [200, 500, 900] });
  const s = addSigns(book, pal, SIGNS);
  const W = 88;
  const R = ROOFS_AT;
  const g = new Grid(W, G_ROOFS + 4);
  g.row(G_ROOFS, 0, W - 1, 'G').fill(0, G_ROOFS + 1, W, 3, 'D');
  g.col(0, 0, G_ROOFS - 1, 'X').col(W - 1, 0, G_ROOFS - 1, 'X');
  g.put(3, 28, 's').put(3, 29, 'S');
  const m = new StarterMap(book, g.rows());
  // stars over the town, and the moon
  for (let y = 0; y < 14; y++) for (let x = 1; x < W - 1; x++) if ((x * 11 + y * 7) % 17 === 0) m.set(x, y, ['starA', 'starB', 'starC'][(x + y) % 3]);
  const [mx, my] = R.moon;
  m.set(mx, my, 'moonTL')
    .set(mx + 1, my, 'moonTR')
    .set(mx, my + 1, 'moonBL')
    .set(mx + 1, my + 1, 'moonBR');
  // the houses: slates on top, walls down to the street with windows lit here and there
  R.houses.forEach(([a, b, roof], k) => {
    for (let x = a; x <= b; x++) {
      m.set(x, roof, (x + k) % 3 ? 'roof' : 'roof2');
      for (let y = roof + 1; y < G_ROOFS; y++) {
        const window = (x - a) % 3 === 1 && (y - roof) % 3 === 2;
        const lit = (x * 7 + y * 3 + k) % 5 < 2;
        m.set(x, y, window ? (k % 2 ? 'windowB' : lit ? 'windowLit' : 'window') : k % 2 ? 'wallB' : 'wall');
      }
    }
  });
  // each chimney's column of smoke puffs as one, each chimney at its own point in the clock
  R.puffs.forEach(([x, roof, to], k) => {
    m.set(x, roof, 'pot');
    for (let y = to - 2; y < roof; y++) m.set(x, y, ['puff0', 'puffOff', 'puff3'][k]);
  });
  for (const [x, roof] of R.stacks) m.set(x, roof - 1, 'stack');
  for (const x of R.flakes) m.set(x, roofAt(x) - 1, 'flake');
  m.set(R.exit, roofAt(R.exit) - 2, 'doorTop').set(R.exit, roofAt(R.exit) - 1, 'doorBottom');
  m.exits.push({ from: [R.exit + ORIGIN, roofAt(R.exit) - 1 + ORIGIN] });
  for (const k of Object.keys(R.signs) as (keyof typeof R.signs)[]) m.sign(R.signs[k], onGround(roofAt(R.signs[k]), s[k]), s[k]);
  return {
    file: 'roofs',
    title: 'Rooftops',
    hint: 'Follow the snow. Ride the warm smoke.',
    look: 'town',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'dusk',
  };
}
