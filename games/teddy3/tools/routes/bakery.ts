// The bot's way through bakery.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { leap } from './helpers';
import { CTR } from '../../src/ids';
import { BAKERY } from '../../src/levels/bakery';
import { LOFT } from '../../src/levels/bakeryTiles';

/** A pest on Teddy's row within `d` blocks ahead of him, going left. */
const nearLeft = (name: string, d: number) => (s: Sim) => s.monsters(name).some((m) => m.y === s.pos.by && s.pos.bx - m.x <= d && m.x <= s.pos.bx);

export const route: Order[] = [
  { walk: BAKERY.teach + 1 },
  { walk: BAKERY.pit1 - 1 },
  ...leap(BAKERY.belt2),
  { walk: BAKERY.pit2 - 1 },
  ...leap(BAKERY.belt3),
  { walk: BAKERY.pit3 - 1 },
  ...leap(BAKERY.belt4, 10),
  { trick: 'space', after: 12 },
  { walk: BAKERY.grate },
  { walk: BAKERY.fast, grab: false },
  { until: 'at the end of the fast belt', maxTicks: 80, check: (s) => s.pos.x >= (BAKERY.gap - 2) * 20 + 10 },
  ...leap(BAKERY.far + 1, 12),
  { walk: BAKERY.candles },
  { trick: 'f', after: 8 },
  { until: 'has the candles', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  // up the racks to the loft
  { walk: 77, grab: false },
  { hop: 10, after: 14 },
  { hop: 10, after: 14 },
  { hop: 10, after: 14 },
  { hop: 10, after: 14 },
  { until: 'up in the loft', maxTicks: 20, check: (s) => s.pos.by === LOFT },
  { walk: 70 },
  { until: 'the mouse comes near', maxTicks: 80, check: nearLeft('mouse', 3) },
  { trick: 'space', after: 12 },
  { walk: BAKERY.window - 1 },
  { until: 'the pigeon comes near', maxTicks: 80, check: nearLeft('pigeon', 3) },
  { trick: 'space', after: 12 },
  { walk: BAKERY.escape - 2 },
  { until: 'down on the street', maxTicks: 30, check: (s) => s.pos.by === 39 },
  { walk: BAKERY.car + 1 },
];
