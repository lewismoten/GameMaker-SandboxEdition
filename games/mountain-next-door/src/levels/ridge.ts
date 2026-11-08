// Level 7, WINDY RIDGE (dusk): Wisp's trail of tiny snowdrifts leads back over the ridge toward town, and the wind is up.
// It is a help, not a hazard: an updraft lifts Tess up the rock to the next ledge, and a gust blows her across a
// gap too wide to jump. Miss and it is only a walk back round. Blaze the posts, mind the rolling pebble.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, type Level } from '../level';
import { TRAIL } from '../monsters';

export const G7 = 23;
export const LEDGES = { mid: 12, top: 4 } as const;

export const RIDGE_AT = {
  lift1: { x: 31, from: LEDGES.mid, to: G7 - 1 },
  mid: [32, 44],
  bridge: { from: 45, to: 53, rows: [10, 11] },
  mid2: [54, 62],
  lift2: { x: 63, from: LEDGES.top, to: LEDGES.mid - 1 },
  top: [64, 86],
  hole: 16,
  posts: [
    [10, G7],
    [24, G7],
    [38, LEDGES.mid],
    [58, LEDGES.mid],
    [70, LEDGES.top],
    [80, LEDGES.top],
  ],
  puddles: [
    [7, G7],
    [20, G7],
    [41, LEDGES.mid],
    [56, LEDGES.mid],
    [67, LEDGES.top],
    [76, LEDGES.top],
  ],
  pie: [60, LEDGES.mid],
  exit: 85,
  signs: { puddles: 3, lift: 26, gust: 34, town: 72 },
} as const;

const SIGNS = {
  puddles: ['TINY DRIFTS OF SNOW. WISP CAME THIS WAY.', 4, 3],
  lift: ['STEP IN. LET THE UPDRAFT DO THE WORK.', 4, 3],
  gust: ['THE GUST WILL CARRY YOU. COMMIT.', 4, 3],
  town: ['TOWN LIGHTS. WISP IS DOWN THERE.', 4, 3],
} as const;

export function levelRidge(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['mountain', 'trail', 'wind', 'rain']);
  const s = addSigns(book, pal, SIGNS);
  const W = 88;
  const R = RIDGE_AT;
  const g = new Grid(W, 27);
  g.row(G7, 0, W - 1, 'G').fill(0, G7 + 1, W, 3, 'D');
  g.col(0, 0, G7 - 1, 'X').col(W - 1, 0, G7 - 1, 'X');
  g.put(3, G7 - 2, 's').put(3, G7 - 1, 'S');
  g.put(R.exit, LEDGES.top - 2, 'e').put(R.exit, LEDGES.top - 1, 'E');
  g.fill(R.hole, G7, 2, 2, ' ');
  const m = new StarterMap(book, g.rows());
  // the ridge's cliffs: rock under each ledge, down to the ground (Tess passes in front of it)
  for (const [a, b, y] of [
    [R.mid[0], R.mid[1], LEDGES.mid],
    [R.mid2[0], R.mid2[1], LEDGES.mid],
    [R.top[0], R.top[1], LEDGES.top],
  ] as const)
    for (let x = a; x <= b; x++) {
      m.set(x, y, 'ledge');
      for (let k = y + 1; k < G7; k++) m.set(x, k, (x * 7 + k * 3) % 5 === 0 ? 'rock2' : 'rock');
    }
  // the exit stands on the top ledge
  m.set(R.exit, LEDGES.top - 2, 'doorTop').set(R.exit, LEDGES.top - 1, 'doorBottom');
  for (let y = R.lift1.from; y <= R.lift1.to; y++) m.set(R.lift1.x, y, `gustU${y % 3}`);
  for (let y = R.lift2.from; y <= R.lift2.to; y++) m.set(R.lift2.x, y, `gustU${y % 3}`);
  for (const y of R.bridge.rows) for (let x = R.bridge.from; x <= R.bridge.to; x++) m.set(x, y, `gustR${x % 3}`);
  for (const [x, y] of [
    [8, 3],
    [24, 6],
    [50, 2],
  ])
    m.set(x, y, 'cloudL').set(x + 1, y, 'cloudR');
  m.set(R.hole, G7 + 2, 'printL').set(R.hole + 1, G7 + 2, 'printR');
  m.mon(TRAIL.pebbleShort, R.hole, G7 + 1);
  for (const [x, y] of R.posts) m.set(x, y - 1, 'post');
  for (const [x, y] of R.puddles) m.set(x, y - 1, 'puddle');
  m.set(R.pie[0], R.pie[1] - 1, 'pie');
  m.mon(TRAIL.mist, 46, 6).mon(TRAIL.mist, 20, 8);
  const at = R.signs;
  m.sign(at.puddles + 1, onGround(G7, s.puddles), s.puddles);
  m.sign(at.lift, onGround(G7, s.lift), s.lift);
  m.sign(at.gust, onGround(LEDGES.mid, s.gust), s.gust);
  m.sign(at.town, onGround(LEDGES.top, s.town), s.town);
  return { file: 'ridge', title: 'Windy Ridge', hint: 'Let the wind help you.', look: 'dusk', map: m, book, timed, mon: 'trail', song: 'dusk' };
}
