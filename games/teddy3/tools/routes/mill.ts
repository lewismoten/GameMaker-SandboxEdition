// The bot's way through mill.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { CORNERS } from '../../src/levels/millBeasts';
import { CTR } from '../../src/ids';
import { MILL_AT } from '../../src/levels/mill';

/** Up on a paddle until level with the floor at `row` (standing on the row above it). */
export const level = (row: number): Order => ({ until: `level with the floor at row ${row}`, maxTicks: 120, check: (s: Sim) => s.pos.y <= (row - 1) * 20 });
/** A wheel's paddle just starting up its near side at column x, bottom row `bottom`. */
export const rising = (s: Sim, x: number, bottom: number) =>
  s.w.mm.some((m, i) => {
    const name = s.scene.names?.[m.monnum] ?? '';
    const mi = s.w.mi[i];
    const y = mi.cury[0] * 20 + mi.cury[1];
    return CORNERS.some((c) => name === `wheel${c}`) && mi.curx[0] === x && mi.curx[1] === 0 && y <= bottom * 20 && y >= bottom * 20 - 2;
  });
/** Waits on the floor beside a wheel for a paddle to come up level with it, and steps on. */
export const board = (x: number, bottom: number): Order[] => [
  { until: `a paddle level at ${x}`, maxTicks: 200, check: (s) => rising(s, x, bottom) },
  { walk: x, maxTicks: 20, grab: false },
];

const { wheels, floors, big } = MILL_AT;

/** Up each wheel in the mill in turn: board it, ride up, step off and bark at the pigeon. */
const climb: Order[] = wheels.flatMap((w, k) => [
  { walk: w.x - 1 },
  ...board(w.x, w.bottom),
  level(floors[k]),
  { walk: w.x + 1, grab: false },
  { trick: 'space', after: 12 } as Order,
]);

export const route: Order[] = [
  ...climb,
  { walk: MILL_AT.banner },
  { trick: 'f', after: 8 },
  { until: 'has the banner', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  { walk: MILL_AT.flume, grab: false },
  { until: 'carried to the big wheel', maxTicks: 200, check: (s) => s.pos.bx === big.x },
  level(floors[0]),
  { walk: MILL_AT.car + 1 },
];
