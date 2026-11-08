// THE RECORDS CELLAR (the small hours): the survey crew will want paper, and the town hall keeps its paper in the
// cellar under the bell. There are no windows down there, so light is paint again (as in the Low Tunnel): every bit of
// dark air Tess walks through stays lit behind her, so she can see where she has been, and each lantern she touches
// lights. Three floors, a ladder between each, and a wall that splits the middle floor: one ladder down from the top
// floor goes to a dead end (a pocket with three lanterns and a sign), the other to the way on. At the bottom, the deed.
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { TRAIL } from '../monsters';

/** The three floors: the ceiling row and the floor row of each (Tess walks on the row above the floor). */
export const VAULT_FLOORS = [
  { ceil: 3, floor: 10 },
  { ceil: 11, floor: 18 },
  { ceil: 19, floor: 26 },
] as const;
export const vaultFeet = (k: number): number => VAULT_FLOORS[k].floor - 1;

export const VAULT_AT = {
  /** The ladder to the dead end, the one to the way on, and the one down to the bottom floor. */
  deadLadder: 66,
  ladder: 30,
  down: 8,
  /** The wall that splits the middle floor (two columns). */
  wall: 40,
  /** The floors' low stretches (the ceiling comes down to leave two blocks): [first, last column, floor]. */
  low: [
    [18, 26, 0],
    [50, 58, 2],
  ],
  /** Lanterns to light: the top floor, the middle floor's way on, the dead end, the bottom floor. */
  top: [14, 44, 58],
  mid: [34, 22, 12],
  pocket: [72, 62, 52],
  bottom: [14, 30, 46, 62],
  lamps: [
    [6, 0],
    [20, 1],
    [76, 2],
  ],
  worms: [
    [12, 0, 0],
    [36, 1, 0],
    [60, 2, 0],
    [16, 0, 1],
    [28, 1, 1],
    [52, 2, 1],
    [70, 0, 1],
    [22, 1, 2],
    [40, 2, 2],
    [66, 0, 2],
  ],
  exit: 76,
  signs: [
    [0, 8],
    [1, 14],
    [1, 55],
    [2, 68],
  ],
} as const;

const SIGNS = [
  ['TOWN HALL RECORDS. MIND THE STEP.', 4, 3],
  ['SURVEY FILES, 1886. ALL MISFILED.', 4, 3],
  ["A DEAD END. FILED UNDER 'D'.", 4, 3],
  ['RESERVED FOR THE HILL, WHEN IT VISITS.', 4, 3],
] as const;

export function levelVault(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'tunnel']);
  const names = SIGNS.map((_, i) => `sign${i}`);
  const s = addSigns(book, pal, Object.fromEntries(SIGNS.map((d, i) => [names[i], d])) as Record<string, readonly [string, number, number]>);
  const W = 80;
  const H = 30;
  const A = VAULT_AT;
  const F = VAULT_FLOORS;
  const x0 = 3;
  // every block is set below; the grid only marks the way in (top left) and out (bottom right)
  const rows = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) =>
      x === x0 && y === F[0].floor - 2
        ? 's'
        : x === x0 && y === F[0].floor - 1
          ? 'S'
          : x === A.exit && y === F[2].floor - 2
            ? 'e'
            : x === A.exit && y === F[2].floor - 1
              ? 'E'
              : ' ',
    ).join(''),
  );
  const m = new MountainMap(book, rows);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = F.find((k) => y > k.ceil && y < k.floor);
      m.set(x, y, t && x > 0 && x < W - 1 ? 'tAir' : F.some((k) => y === k.floor) ? 'tFloor' : y > F[2].floor ? 'dirt' : 'tStone');
    }
  // the wall splitting the middle floor, and the low stretches
  for (let y = F[1].ceil + 1; y < F[1].floor; y++) for (const x of [A.wall, A.wall + 1]) m.set(x, y, 'tStone');
  for (const [a, b, k] of A.low) for (let x = a; x <= b; x++) for (let y = F[k].ceil + 1; y < F[k].floor - 2; y++) m.set(x, y, 'tStone');
  // the ladders: top to the dead end, top to the way on (both land on the middle floor), middle to the bottom
  for (const x of [A.deadLadder, A.ladder]) for (let y = F[0].floor - 1; y < F[1].floor; y++) m.set(x, y, 'ladder');
  for (let y = F[1].floor - 1; y < F[2].floor; y++) m.set(A.down, y, 'ladder');
  // old lamps on the wall, lit from the start, in rings of warm air that fade with distance
  for (const [x, k] of A.lamps) {
    const { ceil, floor } = F[k];
    m.set(x, ceil + 2, 'lanternLit');
    for (let dx = -2; dx <= 2; dx++) m.set(x + dx, ceil, Math.abs(dx) <= 1 ? 'tStone2' : 'tStone1');
    for (let dx = -3; dx <= 3; dx++)
      for (let y = ceil + 1; y < floor; y++) {
        const d = Math.hypot(dx, y - (ceil + 2));
        if (d > 0 && d <= 1.5) m.set(x + dx, y, 'glow2');
        else if (d > 1.5 && d <= 2.6) m.set(x + dx, y, 'tAirLit');
        else if (d > 2.6 && d <= 3.7) m.set(x + dx, y, 'tAirFaint');
      }
  }
  for (const [list, k] of [
    [A.top, 0],
    [A.mid, 1],
    [A.pocket, 1],
    [A.bottom, 2],
  ] as const)
    for (const x of list) m.set(x, F[k].floor - 2, 'lantern');
  m.set(x0, F[0].floor - 2, 'doorwayTop').set(x0, F[0].floor - 1, 'doorwayBottom');
  m.set(A.exit, F[2].floor - 2, 'doorTop').set(A.exit, F[2].floor - 1, 'doorBottom');
  for (const [x, n, k] of A.worms) m.mon([TRAIL.glowA, TRAIL.glowB, TRAIL.glowC][n], x, F[k].ceil + 1);
  m.exits.push({ from: [A.exit + ORIGIN, F[2].floor - 1 + ORIGIN] });
  A.signs.forEach(([k, x], i) => m.sign(x, onGround(F[k].floor, s[names[i]]), s[names[i]]));
  return {
    file: 'vault',
    title: 'The Records Cellar',
    hint: 'Light the way. A dead end is only a place to turn.',
    look: 'cellar',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'tiptoe',
  };
}
