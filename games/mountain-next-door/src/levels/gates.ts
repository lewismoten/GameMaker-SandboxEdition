// Level 2, GATE HUNT (the morning): the mountain is next door, and four garden gates are caught on its rock.
// Climb its ladders and mossy ledges, unhook one gate, and carry it down to the garden it came from: the
// neighbors plugged each gateway with a wheelbarrow to keep the hens in, and the gate puts the wheelbarrow back
// (the gateway is a lock; a gate is its key). The tall hedges cannot be hopped, so it is one gate at a time.
// The mountain watches, blinking, and looks sorry.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, mountain, onGround, placeFace, startBook, type Level } from '../level';
import { TRAIL } from '../monsters';
import type { GateColor } from '../art/land';

export const G2 = 16;

/** Where things are: each climb is [ladder column, ledge row, ledge's last column, gate column, gate color], then the gateway it opens. */
export const GATES_AT = {
  climbs: [
    { ladder: 8, row: 12, end: 15, gate: 14, color: 'white', way: 21 },
    { ladder: 26, row: 10, end: 34, gate: 33, color: 'blue', way: 40 },
    { ladder: 41, row: 11, end: 47, gate: 0, color: 'green', way: 59, upper: { ladder: 47, row: 7, end: 53, gate: 52 } },
    { ladder: 62, row: 9, end: 70, gate: 69, color: 'red', way: 76 },
  ],
  pie: 45,
  acorns: [25, 66, 84],
  hens: [
    [23, 0],
    [79, 0],
  ],
  exit: 87,
  signs: { four: 4, carry: 16, hens: 28, pie: 48, sorry: 79 },
} as const;

const SIGNS = {
  four: ['FOUR GATES UP. FOUR GARDENS DOWN.', 4, 3],
  carry: ['GATES ARE AWKWARD. ONE AT A TIME.', 4, 3],
  hens: ['THE BARROWS KEEP THE HENS IN. MOSTLY.', 4, 3],
  pie: ['MR. HALE: PIE. NOT A TRUCE.', 4, 2],
  sorry: ['IT CANNOT MEET YOUR EYE.', 4, 2],
} as const;

export function levelGates(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['mountain', 'town', 'trail']);
  const s = addSigns(book, pal, SIGNS);
  const W = 90;
  const g = new Grid(W, 20);
  g.row(G2, 0, W - 1, 'G').fill(0, G2 + 1, W, 3, 'D');
  g.col(0, 0, G2 - 1, 'X').col(W - 1, 0, G2 - 1, 'X');
  g.put(3, G2 - 2, 's').put(3, G2 - 1, 'S');
  g.put(GATES_AT.exit, G2 - 2, 'e').put(GATES_AT.exit, G2 - 1, 'E');
  // ladders up the rock
  for (const c of GATES_AT.climbs) {
    g.col(c.ladder, c.row - 1, G2 - 1, 'H');
    if ('upper' in c && c.upper) g.col(c.upper.ladder, c.upper.row - 1, c.row - 1, 'H');
  }
  const m = new StarterMap(book, g.rows());
  mountain(m, 45, 0, 3, G2, 1, W - 2);
  mountain(m, 11, 11, 1, G2, 1, W - 2);
  // put the ladders, hedges, start and exit back over the rock
  for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) if ('HXsSeE'.includes(g.rows()[y][x])) m.set(x, y, LEGEND[g.rows()[y][x]]);
  for (const c of GATES_AT.climbs) {
    for (let x = c.ladder + 1; x <= c.end; x++) m.set(x, c.row, 'ledge');
    if (c.gate) m.set(c.gate, c.row - 1, `gate.${c.color as GateColor}`);
    if ('upper' in c && c.upper) {
      for (let x = c.upper.ladder + 1; x <= c.upper.end; x++) m.set(x, c.upper.row, 'ledge');
      m.set(c.upper.gate, c.upper.row - 1, `gate.${c.color as GateColor}`);
    }
    // the gateway: an arbor too tall to hop, plugged with a wheelbarrow
    m.set(c.way, G2 - 4, 'arborTop')
      .set(c.way, G2 - 3, 'arborBeam')
      .set(c.way, G2 - 2, 'arch')
      .set(c.way, G2 - 1, `plug.${c.color as GateColor}`);
    for (const dx of [-2, -1, 1, 2]) if (!'HXsSeE'.includes(g.rows()[G2 - 1][c.way + dx])) m.set(c.way + dx, G2 - 1, 'fence');
  }
  m.set(GATES_AT.pie, G2 - 1, 'pie');
  for (const x of GATES_AT.acorns) m.set(x, G2 - 1, 'acorn');
  // the hens in their gardens, and the mountain's face watching
  for (const [x] of GATES_AT.hens) m.mon(TRAIL.hens, x, G2 - 1);
  placeFace(m, TRAIL.face, 41, 49, 4, 45, 7);
  const at = GATES_AT.signs;
  for (const k of Object.keys(at) as (keyof typeof at)[]) m.sign(at[k], onGround(G2, s[k]), s[k]);
  return {
    file: 'gates',
    title: 'Gate Hunt',
    hint: 'Take each gate home. One at a time.',
    look: '',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'theme',
  };
}

const LEGEND: Record<string, string> = { H: 'ladder', X: 'edge', s: 'doorwayTop', S: 'doorwayBottom', e: 'doorTop', E: 'doorBottom' };
