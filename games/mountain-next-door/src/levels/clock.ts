// Level 15, THE BELL LOFT (after midnight): the town clock strikes three at three, and the mountain, tiptoeing
// across the square, would be heard in the next county. So Tess climbs the town hall tower to pack the bell with
// snow. It is seven floors up and there are no stairs, only chimneys: each floor has a flue at one end that puffs
// warm smoke on a clock, through a hole in the floor above. Watch a puff, step in at the start of the next, and
// rise; then walk the floor the other way, taking the drifts of Wisp's snow, to the next flue.
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';

export const G_CLOCK = 44;
/** The floors' rows, bottom (the street) to top; Tess walks on the row above each. */
export const FLOORS = [44, 38, 32, 26, 20, 14, 8] as const;

export const CLOCK_AT = {
  /** The flue on floor k (k < 6): its column; the hole is in the floor above at the same column. */
  flues: [36, 3, 36, 3, 36, 3],
  /** Drifts of snow per floor. */
  flakes: [
    [11, 22],
    [28, 18, 9],
    [10, 20, 29],
    [29, 19, 11],
    [12, 21, 30],
    [31, 20, 13],
    [10, 21],
  ],
  moon: [30, 1],
  exit: 34,
  signs: [
    [0, 6],
    [3, 24],
    [6, 14],
  ],
} as const;

const SIGNS = [
  ['TOWN HALL CLOCK. STRIKES THREE AT THREE.', 4, 3],
  ['CLOCK: 11 MINUTES FAST. TOWN: JUST RIGHT.', 4, 3],
  ['BELL PACKED. THREE NOW GOES FFFF.', 4, 3],
] as const;

/** Where the puff is in its clock when the level starts, per flue: they are out of step so no two are ready together. */
const PHASE = ['puff0', 'puffOff', 'puff3', 'puff1', 'puffOff', 'puff4'] as const;

export function levelClock(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['loft', 'roofs', 'stars']);
  const names = SIGNS.map((_, i) => `sign${i}`);
  const defs = Object.fromEntries(SIGNS.map((d, i) => [names[i], d])) as Record<string, readonly [string, number, number]>;
  const s = addSigns(book, pal, defs);
  const W = 40;
  const C = CLOCK_AT;
  const g = new Grid(W, G_CLOCK + 4);
  g.row(G_CLOCK, 0, W - 1, 'G').fill(0, G_CLOCK + 1, W, 3, 'D');
  g.col(0, 0, G_CLOCK - 1, 'X').col(W - 1, 0, G_CLOCK - 1, 'X');
  g.put(3, G_CLOCK - 2, 's').put(3, G_CLOCK - 1, 'S');
  const m = new MountainMap(book, g.rows());
  for (let y = 0; y < 6; y++) for (let x = 1; x < W - 1; x++) if ((x * 11 + y * 7) % 17 === 0) m.set(x, y, ['starA', 'starB', 'starC'][(x + y) % 3]);
  m.set(C.moon[0], C.moon[1], 'moonTL')
    .set(C.moon[0] + 1, C.moon[1], 'moonTR')
    .set(C.moon[0], C.moon[1] + 1, 'moonBL')
    .set(C.moon[0] + 1, C.moon[1] + 1, 'moonBR');
  // the tower: walls from the top floor down to the street, a slate floor at each storey (with a hole where a flue comes up)
  for (let y = FLOORS[6]; y < G_CLOCK; y++)
    for (let x = 1; x < W - 1; x++) {
      const window = x % 4 === 2 && (y - FLOORS[6]) % 6 === 3;
      m.set(x, y, window ? ((x + y) % 3 ? 'archLit' : 'archDark') : (x + y) % 2 ? 'loftA' : 'loftB');
    }
  // carved beams up the walls between the windows
  for (const bx of [8, 16, 24, 32]) for (let y = FLOORS[6]; y < G_CLOCK; y++) if ((y - FLOORS[6]) % 6 !== 0) m.set(bx, y, bx % 16 ? 'beamA' : 'beamB');
  // the works: a big clock face on every other storey, a gear on the ones between, a pendulum and a lamp by each face
  for (let k = 0; k < 6; k++) {
    const top = FLOORS[k + 1] + 1; // the storey's first wall row (it has five)
    if (k % 2 === 0) {
      for (let i = 0; i < 9; i++) m.set(19 + (i % 3), top + 1 + Math.floor(i / 3), `face${i}`);
      m.set(23, top + 2, 'pendT0').set(23, top + 3, 'pendB0');
      m.set(26, top + 2, 'wallLamp');
    } else {
      for (let i = 0; i < 4; i++) m.set(19 + (i % 2), top + 1 + Math.floor(i / 2), `gear${i}`);
      m.set(13, top + 2, 'wallLamp');
    }
  }
  FLOORS.slice(1).forEach((row, i) => {
    for (let x = 1; x < W - 1; x++) m.set(x, row, (x + i) % 3 ? 'roof' : 'roof2');
  });
  C.flues.forEach((x, k) => {
    const below = FLOORS[k];
    const above = FLOORS[k + 1];
    m.set(x, above, 'loftA'); // the hole the smoke goes up through
    m.set(x, below, 'pot');
    for (let y = above - 2; y < below; y++) m.set(x, y, PHASE[k]);
  });
  C.flakes.forEach((xs, k) => {
    for (const x of xs) m.set(x, FLOORS[k] - 1, 'flake');
  });
  m.set(C.exit, FLOORS[6] - 2, 'doorTop').set(C.exit, FLOORS[6] - 1, 'doorBottom');
  m.exits.push({ from: [C.exit + ORIGIN, FLOORS[6] - 1 + ORIGIN] });
  C.signs.forEach(([k, x], i) => m.sign(x, onGround(FLOORS[k], s[names[i]]), s[names[i]]));
  return {
    file: 'clock',
    title: 'The Bell Loft',
    hint: 'Pack the bell with snow. Ride the smoke.',
    look: 'town',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'dusk',
  };
}
