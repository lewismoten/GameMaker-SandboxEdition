// Level 6, THE EMPTY SPOT (a scene you watch, at sunset): the footprints end at a hollow as big as the town
// square, where Old Mossback always stood. Tess walks down into it and reads what she finds while the sun sinks
// behind the far ridge, step by step, and the first stars come out. Nutmeg sits on the rim and watches too. A
// trail of tiny snowdrifts, snow from a very small cloud, leads out the other side: the mountain's cloud, Wisp, is
// missing too. That is why it left. Nothing to collect and nothing that hurts.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, type Level } from '../level';
import { tree } from './prints';
import { HOLLOW } from '../monsters';

export const RIM = 12;
export const FLOOR = 15;

/** When each group of stars comes out (ticks after the scene starts). */
export const STARS: [number, number, number] = [560, 760, 940];

export const HOLLOW_AT = {
  down: [13, 15],
  up: [56, 58],
  sun: [55, 5],
  nut: 9,
  puddles: [31, 36, 41, 46, 51, 55, 62, 66],
  exit: 67,
  signs: { hole: 5, here: 18, puddles: 27, wisp: 38, gone: 46 },
} as const;

const SIGNS = {
  hole: ['A HOLE AS BIG AS THE TOWN SQUARE.', 4, 3],
  here: ['OLD MOSSBACK STOOD HERE. ALWAYS.', 4, 3],
  puddles: ['A LITTLE SNOW? FROM A TINY CLOUD.', 4, 3],
  wisp: ['ITS CLOUD, WISP, SAT ON TOP.', 4, 3],
  gone: ['WISP IS GONE! IT WENT TO FIND WISP!', 4, 3],
} as const;

export function levelHollow(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'rain', 'stars'], { stars: STARS });
  const s = addSigns(book, pal, SIGNS);
  const W = 70;
  const g = new Grid(W, 18);
  // the rim, steps down into the hollow, its floor, steps up the far side
  const ground = (x: number) =>
    x <= HOLLOW_AT.down[0] - 1
      ? RIM
      : x <= HOLLOW_AT.down[1]
        ? RIM + (x - HOLLOW_AT.down[0] + 1)
        : x < HOLLOW_AT.up[0]
          ? FLOOR
          : x <= HOLLOW_AT.up[1]
            ? FLOOR - (x - HOLLOW_AT.up[0] + 1)
            : RIM;
  for (let x = 0; x < W; x++) g.col(x, ground(x), 17, 'D').put(x, ground(x), 'G');
  g.col(0, 0, RIM - 1, 'X').col(W - 1, 0, RIM - 1, 'X');
  g.put(3, RIM - 2, 's').put(3, RIM - 1, 'S');
  g.put(HOLLOW_AT.exit, RIM - 2, 'e').put(HOLLOW_AT.exit, RIM - 1, 'E');
  const m = new StarterMap(book, g.rows());
  // two trees on the far rim
  for (const x of [60, 64]) tree(m, x, RIM);
  // stars in the sky, three groups that come out one after another
  for (let y = 0; y < 7; y++) for (let x = 1; x < W - 1; x++) if ((x * 7 + y * 11) % 9 === 0) m.set(x, y, ['starA', 'starB', 'starC'][(x + y) % 3]);
  for (const x of HOLLOW_AT.puddles) m.set(x, ground(x) - 1, 'puddle');
  m.mon(HOLLOW.sun, HOLLOW_AT.sun[0], HOLLOW_AT.sun[1]);
  m.mon(HOLLOW.nutSit, HOLLOW_AT.nut, RIM - 1);
  const at = HOLLOW_AT.signs;
  for (const k of Object.keys(at) as (keyof typeof at)[]) m.sign(at[k], onGround(ground(at[k]), s[k]), s[k]);
  return {
    file: 'hollow',
    title: 'The Empty Spot',
    hint: 'Watch the sun go down. Look around.',
    look: 'sunset',
    map: m,
    book,
    timed,
    mon: 'hollow',
    song: 'dusk',
    watch: true,
  };
}
