// Level 6, THE EMPTY SPOT (a scene you watch, at sunset, then a hollow you search by starlight): the footprints end
// at a hollow as big as the town square, where Old Mossback always stood. Tess walks down into it and reads what she
// finds while the sun sinks behind the far ridge, step by step, and the first stars come out. Nutmeg sits on the rim
// and watches too. Then, when the last stars are out, the things the mountain left behind show in their light: a tuft
// of cloud caught on a twig, a moss rug, a chipped stone, a very small snowdrift at the bottom of a pit (a ladder
// takes her down and back), and a trail of drifts and an arrow of pebbles that lead out the far side over two fallen
// logs: the mountain's cloud, Wisp, is missing too. That is why it left. Nothing hurts.

import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { tree } from './prints';
import { HOLLOW } from '../monsters';
import { hidName } from '../propsDeeper';

export const RIM = 12;
export const FLOOR = 15;

/** When each group of stars comes out (ticks after the scene starts). The clues glint when the last group does. */
export const STARS: [number, number, number] = [560, 760, 940];

export const HOLLOW_AT = {
  down: [13, 15],
  up: [56, 58],
  sun: [55, 5],
  nut: 9,
  /** The pit in the hollow's floor: its columns, the row of its floor, and the ladder (the pit's left column). */
  pit: { from: 40, to: 42, floor: 18 },
  /** Each clue's column, and the row's ground it stands on is `ground(x)`; `drift` is in the pit. */
  clues: { fluff: 6, rug: 22, chip: 33, drift: 41, arrow: 66 },
  /** Wisp's trail of snow on the far rim, and the two logs (first column of each; they are two wide). */
  trail: [71, 75, 79, 83],
  logs: [68, 77],
  puddles: [30, 38, 45, 51, 55, 62, 74],
  trees: [81, 85],
  exit: 87,
  signs: { hole: 5, here: 18, puddles: 27, wisp: 34, gone: 46, pit: 24, night: 59 },
} as const;

const SIGNS = {
  wisp: ['ITS CLOUD, WISP, ALWAYS SAT ON TOP.', 4, 3],
  gone: ['WISP LEFT. THE MOUNTAIN WENT AFTER IT.', 4, 3],
  pit: ['SOMETHING DUG DOWN HERE.', 4, 3],
  night: ['THE LAST STARS SHOW WHAT IT LEFT.', 4, 3],
} as const;

export function levelHollow(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'rain', 'stars', 'clues'], { stars: STARS });
  const s = addSigns(book, pal, SIGNS);
  const W = 90;
  const P = HOLLOW_AT.pit;
  const g = new Grid(W, 23);
  // the rim, steps down into the hollow, its floor with a pit in it, steps up the far side
  const ground = (x: number) =>
    x <= HOLLOW_AT.down[0] - 1
      ? RIM
      : x <= HOLLOW_AT.down[1]
        ? RIM + (x - HOLLOW_AT.down[0] + 1)
        : x >= P.from && x <= P.to
          ? P.floor
          : x < HOLLOW_AT.up[0]
            ? FLOOR
            : x <= HOLLOW_AT.up[1]
              ? FLOOR - (x - HOLLOW_AT.up[0] + 1)
              : RIM;
  for (let x = 0; x < W; x++) g.col(x, ground(x), 22, 'D').put(x, ground(x), 'G');
  g.col(0, 0, RIM - 1, 'X').col(W - 1, 0, RIM - 1, 'X');
  g.put(3, RIM - 2, 's').put(3, RIM - 1, 'S');
  g.put(HOLLOW_AT.exit, RIM - 2, 'e').put(HOLLOW_AT.exit, RIM - 1, 'E');
  const m = new MountainMap(book, g.rows());
  // the ladder out of the pit, up to the floor's level
  for (let y = FLOOR - 1; y < P.floor; y++) m.set(P.from, y, 'ladder');
  // two trees on the far rim, near the door
  for (const x of HOLLOW_AT.trees) tree(m, x, RIM);
  // stars in the sky, three groups that come out one after another
  for (let y = 0; y < 7; y++) for (let x = 1; x < W - 1; x++) if ((x * 7 + y * 11) % 9 === 0) m.set(x, y, ['starA', 'starB', 'starC'][(x + y) % 3]);
  for (const x of HOLLOW_AT.puddles) m.set(x, ground(x) - 1, 'puddle');
  // the clues are hidden (sky) until the last stars come out
  const c = HOLLOW_AT.clues;
  const hide = (x: number, name: string) => m.set(x, ground(x) - 1, name);
  hide(c.fluff, hidName(2));
  hide(c.rug, hidName(0));
  hide(c.chip, hidName(1));
  hide(c.drift, hidName(3));
  hide(c.arrow, hidName(4));
  for (const x of HOLLOW_AT.trail) hide(x, hidName(3));
  for (const x of HOLLOW_AT.logs) m.set(x, RIM - 1, 'logL').set(x + 1, RIM - 1, 'logR');
  m.mon(HOLLOW.sun, HOLLOW_AT.sun[0], HOLLOW_AT.sun[1]);
  m.mon(HOLLOW.nutSit, HOLLOW_AT.nut, RIM - 1);
  const at = HOLLOW_AT.signs;
  for (const k of Object.keys(s) as (keyof typeof s)[]) m.sign(at[k], onGround(ground(at[k]), s[k]), s[k]);
  return {
    file: 'hollow',
    title: 'The Empty Spot',
    hint: 'Watch the sun go down. Then look around.',
    look: 'sunset',
    map: m,
    book,
    timed,
    mon: 'hollow',
    song: 'dusk',
    watch: true,
  };
}
