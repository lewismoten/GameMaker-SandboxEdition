// Level 7, WINDY RIDGE (dusk): Wisp's trail of tiny snowdrifts leads back over the ridge toward town, and the wind is up.
// It is a help, not a hazard: an updraft lifts Tess up the rock to the next ledge, and a gust blows her across a
// gap too wide to jump. Miss and it is only a walk back round. Blaze the posts, mind the rolling pebble.
// Then a third updraft lifts her to the crest, where the wind turns: it blows one way, drops, blows the other, and a
// flag at each gap says which. Four gaps need the wind at her back, and two stretches need it to drop (a lull) so she
// can walk into it. The flag's two lamps show how long the wind has left. The door is at the crest's far end.

import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { TRAIL } from '../monsters';
import { gustName, vaneName } from '../propsDeeper';

export const G7 = 31;
export const LEDGES = { mid: 20, top: 12, crest: 4 } as const;

export const RIDGE_AT = {
  lift1: { x: 31, from: LEDGES.mid, to: G7 - 1 },
  mid: [32, 44],
  bridge: { from: 45, to: 53, rows: [LEDGES.mid - 2, LEDGES.mid - 1] },
  mid2: [54, 62],
  lift2: { x: 63, from: LEDGES.top, to: LEDGES.mid - 1 },
  top: [64, 86],
  /** The third updraft, from the top ledge up to the crest (Tess steps off to its left). */
  lift3: { x: 85, from: LEDGES.crest, to: LEDGES.top - 1 },
  /** The crest's islands, left to right [first column, last column]; the gaps and the corridor are between and on them. */
  islands: { a: [75, 84], b: [56, 66], c: [38, 47], d: [21, 29], e: [1, 12] },
  /** Each crossing of the crest, right to left: the gust cells' first and last column and which wind ring blows there. */
  gaps: [
    { from: 67, to: 74, ring: 0 },
    { from: 48, to: 55, ring: 0 },
    { from: 30, to: 37, ring: 1 },
    { from: 13, to: 20, ring: 0 },
  ],
  /** The corridors over islands B and C: wind on the crest that blows against Tess and drops for a lull (rings 1 and 0). */
  corridors: [
    { from: 59, to: 65, ring: 1 },
    { from: 41, to: 46, ring: 0 },
  ],
  /** The flag at each crossing: its column and the ring it shows. */
  vanes: [
    [75, 0],
    [66, 1],
    [56, 0],
    [47, 0],
    [38, 1],
    [21, 0],
  ],
  hole: 16,
  posts: [
    [10, G7],
    [24, G7],
    [38, LEDGES.mid],
    [58, LEDGES.mid],
    [70, LEDGES.top],
    [80, LEDGES.top],
  ],
  crestPosts: [82, 57, 39, 24, 9],
  puddles: [
    [7, G7],
    [20, G7],
    [41, LEDGES.mid],
    [56, LEDGES.mid],
    [67, LEDGES.top],
    [76, LEDGES.top],
  ],
  pie: [60, LEDGES.mid],
  crestPie: 40,
  exit: 4,
  signs: { puddles: 3, lift: 26, gust: 34, town: 72, wind: 77 },
} as const;

const SIGNS = {
  town: ['TOWN LIGHTS. WISP IS DOWN THERE.', 4, 3],
  wind: ['THE FLAG SHOWS THE WIND.', 4, 3],
} as const;

export function levelRidge(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['mountain', 'trail', 'wind', 'rain', 'turning']);
  const s = addSigns(book, pal, SIGNS);
  const W = 90;
  const R = RIDGE_AT;
  const C = LEDGES.crest;
  const g = new Grid(W, G7 + 4);
  g.row(G7, 0, W - 1, 'G').fill(0, G7 + 1, W, 3, 'D');
  g.col(0, 0, G7 - 1, 'X').col(W - 1, 0, G7 - 1, 'X');
  g.put(3, G7 - 2, 's').put(3, G7 - 1, 'S');
  g.put(R.exit, C - 2, 'e').put(R.exit, C - 1, 'E');
  g.fill(R.hole, G7, 2, 2, ' ');
  const m = new MountainMap(book, g.rows());
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
  // the crest's islands: a ledge to stand on with a few rows of crag hanging under it, narrowing
  for (const [a, b] of Object.values(R.islands)) {
    for (let x = a; x <= b; x++) {
      m.set(x, C, 'ledge');
      m.set(x, C + 1, (x * 7) % 5 === 0 ? 'rock2' : 'rock');
      if (x > a && x < b) m.set(x, C + 2, (x * 3) % 4 === 0 ? 'rock2' : 'rock');
      if (x > a + 2 && x < b - 2) m.set(x, C + 3, 'rock');
    }
  }
  // the exit stands at the crest's far end
  m.set(R.exit, C - 2, 'doorTop').set(R.exit, C - 1, 'doorBottom');
  // clouds, then the wind (so a cloud never takes a gust's place)
  for (const [x, y] of [
    [6, 0],
    [24, 1],
    [50, 0],
    [70, 1],
  ])
    m.set(x, y, 'cloudL').set(x + 1, y, 'cloudR');
  for (let y = R.lift1.from; y <= R.lift1.to; y++) m.set(R.lift1.x, y, `gustU${y % 3}`);
  for (let y = R.lift2.from; y <= R.lift2.to; y++) m.set(R.lift2.x, y, `gustU${y % 3}`);
  for (let y = R.lift3.from; y <= R.lift3.to; y++) m.set(R.lift3.x, y, `gustU${y % 3}`);
  for (const y of R.bridge.rows) for (let x = R.bridge.from; x <= R.bridge.to; x++) m.set(x, y, `gustR${x % 3}`);
  // each crest gust's cells show the first picture of the ring's first phase (a calm: sky, or a moving gust's first half)
  const first = (ring: number) => (ring === 0 ? gustName(0, 0) : gustName(1, 0, 'a'));
  for (const gap of R.gaps) for (const y of [C - 2, C - 1]) for (let x = gap.from; x <= gap.to; x++) m.set(x, y, first(gap.ring));
  for (const co of R.corridors) for (const y of [C - 2, C - 1]) for (let x = co.from; x <= co.to; x++) m.set(x, y, first(co.ring));
  for (const [x, ring] of R.vanes) m.set(x, C - 1, ring === 0 ? vaneName(0, 0, 'a') : vaneName(1, 0));
  m.set(R.hole, G7 + 2, 'printL').set(R.hole + 1, G7 + 2, 'printR');
  m.mon(TRAIL.pebbleShort, R.hole, G7 + 1);
  for (const [x, y] of R.posts) m.set(x, y - 1, 'post');
  for (const x of R.crestPosts) m.set(x, C - 1, 'post');
  for (const [x, y] of R.puddles) m.set(x, y - 1, 'puddle');
  m.set(R.pie[0], R.pie[1] - 1, 'pie');
  m.set(R.crestPie, C - 1, 'pie');
  m.mon(TRAIL.mist, 50, 9).mon(TRAIL.mist, 24, 9);
  const at = R.signs;
  m.sign(at.town, onGround(LEDGES.top, s.town), s.town);
  m.sign(at.wind, onGround(C, s.wind), s.wind);
  return {
    file: 'ridge',
    title: 'Windy Ridge',
    hint: 'Let the wind help you. Wait for it.',
    look: 'dusk',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'dusk',
    snd: 'wind',
  };
}
