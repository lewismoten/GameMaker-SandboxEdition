// Small route helpers the levels' routes share: the car's charge, where a monster is, boarding
// a see-saw end from its step, and a long hop.
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { CTR } from '../../src/ids';

/** The car's charge (counters read one more than they hold). */
export const charge = (s: Sim) => s.w.ci.meter[CTR.charge] - 1;

/** Is monster `name` at block (x, y), right on the block? */
export const at = (s: Sim, name: string, x: number, y: number) =>
  s.w.mm.some((m, i) => s.scene.names?.[m.monnum] === name && s.w.mi[i].curx[0] === x && s.w.mi[i].cury[0] === y && s.w.mi[i].cury[1] === 0);
/** From the step beside it, walks onto see-saw end `name` at column x when it comes level. */
export const board = (name: string, x: number): Order[] => [
  { until: `${name} at ${x} is level`, maxTicks: 160, check: (s) => at(s, name, x, 38) },
  { walk: x, maxTicks: 20 },
];

/** A long hop to column x: E (up and right), then Right while coming down. */
export const leap = (x: number, hold = 6): Order[] => [
  { trick: 'e', hold, after: 0 },
  { walk: x, maxTicks: 16, grab: false },
];
