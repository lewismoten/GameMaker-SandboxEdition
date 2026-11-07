// Level 9, THE ZIGZAG HOME (moonlight): the way back up to the hollow, five paths stacked up the hillside, each
// turning back on the one below. Wisp follows Tess now, a little behind, and wherever Wisp goes the mountain will
// follow, so every turn gets a fresh yellow blaze to show the way. Pebbles roll in the ruts; stars twinkle; the moon
// is up. Big, careful footsteps somewhere below.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, type Level } from '../level';
import { TRAIL } from '../monsters';

/** The five paths' floors, bottom to top (each two blocks thick; Tess walks on the row above). */
export const ZFLOORS = [36, 29, 22, 15, 8] as const;

export const ZIGZAG_AT = {
  /** The ladder up from each path to the next: at the right end, then the left, by turns. */
  ladders: [83, 4, 83, 4],
  /** Per path: [post columns], [rut columns], [acorn columns]. */
  paths: [
    { posts: [12, 78], ruts: [40], acorns: [60] },
    { posts: [76, 10], ruts: [50], acorns: [30] },
    { posts: [14, 78], ruts: [30, 62], acorns: [45] },
    { posts: [76, 10], ruts: [44], acorns: [64, 22] },
    { posts: [14, 70], ruts: [36], acorns: [55] },
  ],
  pie: [2, 66],
  moon: [6, 1],
  exit: 85,
  signs: { follow: 5, blaze: 20, steps: 56, moon: 52, top: 74 },
} as const;

const SIGNS = {
  follow: ['WISP WILL FOLLOW YOU. LEAD THE WAY.', 4, 3],
  blaze: ['A BLAZE ON EVERY TURN, FOR THE MOUNTAIN.', 4, 3],
  steps: ['LISTEN. BIG STEPS, VERY CAREFUL ONES.', 4, 3],
  moon: ['WHAT A MOON TONIGHT.', 4, 2],
  top: ['THE HOLLOW IS OVER THE TOP.', 4, 3],
} as const;

export function levelZigzag(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'stars']);
  const s = addSigns(book, pal, SIGNS);
  const W = 88;
  const Z = ZIGZAG_AT;
  const g = new Grid(W, 40);
  const [f0] = ZFLOORS;
  g.row(f0, 0, W - 1, 'G').fill(0, f0 + 1, W, 3, 'D');
  for (const f of ZFLOORS.slice(1)) g.row(f, 1, W - 2, 'G').row(f + 1, 1, W - 2, 'D');
  g.col(0, 0, f0 - 1, 'X').col(W - 1, 0, f0 - 1, 'X');
  g.put(3, f0 - 2, 's').put(3, f0 - 1, 'S');
  g.put(Z.exit, ZFLOORS[4] - 2, 'e').put(Z.exit, ZFLOORS[4] - 1, 'E');
  Z.ladders.forEach((x, k) => g.col(x, ZFLOORS[k + 1] - 1, ZFLOORS[k] - 1, 'H'));
  // ruts in the paths, a pebble rolling in each
  Z.paths.forEach((p, k) => {
    for (const x of p.ruts) g.put(x, ZFLOORS[k], ' ').put(x + 1, ZFLOORS[k], ' ');
  });
  const m = new StarterMap(book, g.rows());
  // stars all over the night sky, twinkling at two paces, and the moon
  for (let y = 0; y < f0; y++) for (let x = 1; x < W - 1; x++) if (g.rows()[y][x] === ' ' && (x * 13 + y * 7) % 23 === 0) m.set(x, y, ['faint', 'bright', 'faint2', 'bright2'][(x + y) % 4]);
  const [mx, my] = Z.moon;
  m.set(mx, my, 'moonTL').set(mx + 1, my, 'moonTR').set(mx, my + 1, 'moonBL').set(mx + 1, my + 1, 'moonBR');
  Z.paths.forEach((p, k) => {
    const feet = ZFLOORS[k] - 1;
    for (const x of p.posts) m.set(x, feet, 'post');
    for (const x of p.acorns) m.set(x, feet, 'acorn');
    for (const x of p.ruts) {
      m.set(x, ZFLOORS[k] + 1, 'printL').set(x + 1, ZFLOORS[k] + 1, 'printR');
      m.mon(TRAIL.pebbleShort, x, ZFLOORS[k]);
    }
  });
  m.set(Z.pie[1], ZFLOORS[Z.pie[0]] - 1, 'pie');
  m.mon(TRAIL.wispFollow, 1, f0 - 3);
  const at = Z.signs;
  m.sign(at.follow, onGround(ZFLOORS[0], s.follow), s.follow);
  m.sign(at.blaze, onGround(ZFLOORS[0], s.blaze), s.blaze);
  m.sign(at.steps, onGround(ZFLOORS[1], s.steps), s.steps);
  m.sign(at.moon, onGround(ZFLOORS[3], s.moon), s.moon);
  m.sign(at.top, onGround(ZFLOORS[4], s.top), s.top);
  return { file: 'zigzag', title: 'The Zigzag Home', hint: 'Blaze every turn. Wisp will follow.', look: 'night', map: m, book, timed, mon: 'trail', song: 'home' };
}
