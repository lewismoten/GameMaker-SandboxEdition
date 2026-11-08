// THE LAMPLIGHTER'S STAIR (the blue hour): the town's lamplighter went for five minutes in March, and the
// mountain, who will be walking these streets later, would like to see where it is going. So Tess lights the lamps up
// the hill: four terraces of terraced houses, a ladder at alternate ends. The alleys between the houses cut each
// terrace, and each is filled by fog that builds itself into a bridge one step after another (and thins away all at
// once): wait for the last step to come up, and go. A lit lamp counts; the stars come out as she works.
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';

/** The terraces' ground rows, bottom (the street) to top. Tess walks on the row above each. */
export const LAMP_ROWS = [32, 24, 16, 8] as const;
export const lampFeet = (k: number): number => LAMP_ROWS[k] - 1;
/** How many fog steps (2 wide) fill each alley. */
export const FOG_STEPS = 3;

export const LAMPS_AT = {
  /** Per terrace: the lamps to light, the posts to blaze and the acorns, by column. */
  lamps: [
    [10, 24, 38, 52],
    [62, 44, 22, 7],
    [8, 27, 47, 64],
    [62, 45, 23, 9],
  ],
  posts: [
    [17, 31, 45, 60],
    [58, 38, 18],
    [22, 32, 50],
    [66, 38, 17],
  ],
  acorns: [
    [64, 66],
    [25, 47],
    [44],
    [25, 60],
  ],
  pie: [2, 60],
  /** Per terrace: the alleys' first columns (each FOG_STEPS * 2 wide). */
  alleys: [[], [50, 28, 10], [14, 36, 54], [52, 30]] as readonly (readonly number[])[],
  /** The ladder up from terrace k: at the right end, then the left, then the right. */
  ladders: [68, 3, 68],
  exit: 3,
  signs: [
    [0, 6],
    [1, 64],
    [2, 62],
    [3, 5],
  ],
} as const;

const SIGNS = [
  ['LAMP MAN: BACK IN FIVE MINUTES. (SINCE MARCH.)', 4, 3],
  ['LIGHT EVERY LAMP. THE MOUNTAIN NEEDS TO SEE.', 4, 3],
  ['FOG FILLS THE ALLEYS. THEN IT THINS.', 4, 3],
  ['EVERY LAMP LIT. WISP SAW THE ROOFS FROM HERE.', 4, 3],
] as const;

export function levelLamps(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['pickups', 'facade', 'mist', 'lamp', 'stars'], { mistSteps: FOG_STEPS });
  const names = SIGNS.map((_, i) => `sign${i}`);
  const s = addSigns(book, pal, Object.fromEntries(SIGNS.map((d, i) => [names[i], d])) as Record<string, readonly [string, number, number]>);
  const W = 72;
  const A = LAMPS_AT;
  const rows = LAMP_ROWS;
  const g = new Grid(W, rows[0] + 4);
  g.row(rows[0], 0, W - 1, 'G').fill(0, rows[0] + 1, W, 3, 'D');
  for (const t of rows.slice(1)) g.row(t, 1, W - 2, 'G').row(t + 1, 1, W - 2, 'D');
  g.col(0, 0, rows[0] - 1, 'X').col(W - 1, 0, rows[0] - 1, 'X');
  g.put(3, rows[0] - 2, 's').put(3, rows[0] - 1, 'S');
  g.put(A.exit, rows[3] - 2, 'e').put(A.exit, rows[3] - 1, 'E');
  A.ladders.forEach((x, k) => g.col(x, rows[k + 1] - 1, rows[k] - 1, 'H'));
  // the alleys: the terrace's two rows of ground cut away
  A.alleys.forEach((xs, k) => xs.forEach((x) => g.fill(x, rows[k], FOG_STEPS * 2, 2, ' ')));
  const m = new MountainMap(book, g.rows());
  // the hill's retaining walls: rock under each terrace down to the street below it (Tess passes in front of it)
  for (let k = 1; k < rows.length; k++)
    for (let y = rows[k] + 2; y < rows[k - 1]; y++)
      for (let x = 1; x < W - 1; x++) {
        // a sign stands in front of the wall of the terrace above: it hides the gap, and keeps the block set small
        const behindSign = A.signs.some(([sk, sx]) => sk === k - 1 && x >= sx && x < sx + 4);
        if (x !== A.ladders[k - 1] && x !== A.ladders[k - 2] && !behindSign) m.set(x, y, (x * 7 + y * 3) % 5 === 0 ? 'rock2' : 'rock');
      }
  // the fog bridges: each alley's steps start gone (mist.ts), the one nearest the way in first to come up
  A.alleys.forEach((xs, k) =>
    xs.forEach((x0) => {
      const dir = k % 2 ? -1 : 1; // an odd terrace is walked leftward
      for (let i = 0; i < FOG_STEPS; i++) {
        const left = dir > 0 ? x0 + 2 * i : x0 + FOG_STEPS * 2 - 2 * i - 2;
        m.set(left, rows[k], `mist${i}g`).set(left + 1, rows[k], `mist${i}g`);
      }
    }),
  );
  rows.forEach((t, k) => {
    for (const x of A.lamps[k]) m.set(x, t - 1, 'lantern');
    for (const x of A.posts[k]) m.set(x, t - 1, 'post');
    for (const x of A.acorns[k]) m.set(x, t - 1, 'acorn');
  });
  m.set(A.pie[1], rows[A.pie[0]] - 1, 'pie');
  // the sky over the top terrace: stars that come out on a clock, and the moon
  for (let y = 0; y < rows[3] - 5; y++) for (let x = 1; x < W - 1; x++) if ((x * 11 + y * 7) % 13 === 0) m.set(x, y, ['starA', 'starB', 'starC'][(x + y) % 3]);
  m.set(58, 1, 'moonTL').set(59, 1, 'moonTR').set(58, 2, 'moonBL').set(59, 2, 'moonBR');
  m.exits.push({ from: [A.exit + ORIGIN, rows[3] - 1 + ORIGIN] });
  A.signs.forEach(([k, x], i) => m.sign(x, onGround(rows[k], s[names[i]]), s[names[i]]));
  return {
    file: 'lamps',
    title: "The Lamplighter's Stair",
    hint: 'Light the lamps. Cross on the fog.',
    look: 'lamplit',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'dusk',
  };
}
