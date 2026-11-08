// Level 9, THE LOOKOUT (the last of the light): the old fire lookout on the hollow's rim, seven landings up, a
// ladder at alternate ends. From the top you can see the whole valley, and Wisp's trail of snow. Some boards are
// loose and drop away on a clock; on the fifth landing two loose runs are out of step, so the way over is to cross
// the first, stop on the sound board between, and wait for the second. A fall is only to the landing below. Light
// the lamp on each landing as the dark comes on; the stars come out while you climb.
import { ORIGIN, StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, type Level } from '../level';

export const G_TOWER = 60;
/** The landings' rows, bottom to top. */
export const LANDINGS = [53, 46, 39, 32, 25, 18, 11] as const;

export const TOWER_AT = {
  /** The ladder up onto landing k (0 is the one from the ground). */
  ladders: [12, 47, 12, 47, 12, 47, 12],
  /** Each landing's lamp. */
  lamps: [45, 14, 45, 14, 45, 14],
  /** Loose runs: [landing, first, last, starts gone (out of step)]. */
  loose: [
    [2, 28, 30, false],
    [4, 20, 22, false],
    [4, 26, 28, true],
  ],
  legs: [8, 51],
  exit: 44,
  signs: { base: [-1, 15], lamps: [1, 38], loose: [2, 16], log: [3, 36], two: [4, 14], view: [6, 32] },
} as const;

const SIGNS = {
  base: ['FIRE LOOKOUT. SEVEN FLIGHTS. NO ELEVATOR.', 4, 3],
  lamps: ['DARK IS COMING. LIGHT THE LAMPS.', 4, 2],
  loose: ['LOOSE BOARDS DROP ON A CLOCK.', 4, 2],
  log: ['LOGBOOK, 1961: SAW SMOKE. IT WAS A CLOUD.', 4, 3],
  two: ['TWO LOOSE RUNS, OUT OF STEP. STOP ON THE SOUND BOARD BETWEEN.', 4, 4],
  view: ['THERE: SNOW ON THE RIDGE, ALL THE WAY TO TOWN.', 4, 4],
} as const;

/** The row Tess stands on above landing k (-1 is the ground). */
export const towerFeet = (k: number): number => (k < 0 ? G_TOWER : LANDINGS[k]) - 1;

export function levelTower(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['tower', 'stars'], { stars: [700, 1500, 2300] });
  const s = addSigns(book, pal, SIGNS);
  const W = 60;
  const T = TOWER_AT;
  const g = new Grid(W, G_TOWER + 4);
  g.row(G_TOWER, 0, W - 1, 'G').fill(0, G_TOWER + 1, W, 3, 'D');
  g.col(0, 0, G_TOWER - 1, 'X').col(W - 1, 0, G_TOWER - 1, 'X');
  g.put(3, G_TOWER - 2, 's').put(3, G_TOWER - 1, 'S');
  const m = new StarterMap(book, g.rows());
  // stars in the open sky round the tower and over the cab
  for (let y = 0; y < G_TOWER - 8; y++)
    for (let x = 1; x < W - 1; x++) {
      const outside = x < T.legs[0] - 1 || x > T.legs[1] + 1 || y < LANDINGS[6] - 3;
      if (outside && (x * 13 + y * 7) % 19 === 0) m.set(x, y, ['starA', 'starB', 'starC'][(x + y) % 3]);
    }
  // the legs, a wall at each end of every storey (open at the foot, the way in)
  for (const x of T.legs) for (let y = LANDINGS[6] - 6; y < G_TOWER - 2; y++) m.set(x, y, 'leg');
  // the cab's shingled roof
  for (let x = T.legs[0] - 1; x <= T.legs[1] + 1; x++) m.set(x, LANDINGS[6] - 7, x < T.legs[0] ? 'roofL' : x > T.legs[1] ? 'roofR' : 'roofM');
  LANDINGS.forEach((row, k) => {
    for (let x = T.legs[0]; x <= T.legs[1]; x++) m.set(x, row, x % 4 ? 'deck' : 'deck2');
    // cross-bracing under the landing above, at both ends
    if (k < LANDINGS.length)
      for (const x0 of [T.legs[0] + 1, T.legs[1] - 2]) for (let i = 0; i < 4; i++) m.set(x0 + (i % 2), row - 6 + Math.floor(i / 2), `brace${i}`);
    m.set(T.legs[0] + 1, row - 1, 'rail').set(T.legs[1] - 1, row - 1, 'rail');
  });
  T.ladders.forEach((x, k) => {
    for (let y = LANDINGS[k] - 1; y <= towerFeet(k - 1); y++) m.set(x, y, 'ladder');
  });
  T.lamps.forEach((x, k) => m.set(x, towerFeet(k), 'lamp'));
  for (const [k, a, b, gone] of T.loose) for (let x = a; x <= b; x++) m.set(x, LANDINGS[k], gone ? 'boardGone' : 'boardUp');
  m.set(T.exit, LANDINGS[6] - 2, 'doorTop').set(T.exit, LANDINGS[6] - 1, 'doorBottom');
  m.exits.push({ from: [T.exit + ORIGIN, LANDINGS[6] - 1 + ORIGIN] });
  for (const k of Object.keys(T.signs) as (keyof typeof T.signs)[]) {
    const [landing, x] = T.signs[k];
    m.sign(x, onGround(towerFeet(landing) + 1, s[k]), s[k]);
  }
  return {
    file: 'tower',
    title: 'The Lookout',
    hint: 'Climb before dark. Mind the loose boards.',
    look: 'gloaming',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'dusk',
  };
}
