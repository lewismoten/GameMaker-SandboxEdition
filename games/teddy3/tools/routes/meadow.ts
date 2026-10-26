// The bot's way through meadow.ts (the level's own comment says what happens there): at each
// sleepy firefly it faces it, sniffs, and waits for the light to melt the dark ahead.
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { CTR } from '../../src/ids';
import { MEADOW } from '../../src/levels/meadow';

const M = MEADOW;
/** No dark left at column x. */
const lit = (x: number) => (s: Sim) => !s.monsters('dark').some((m) => m.x === x);
/** Walks up beside a sleepy firefly, faces it and sniffs. */
const wake = (from: number, face: 'left' | 'right'): Order[] => [{ walk: from }, { face }, { trick: 's', after: 8 }];

export const route: Order[] = [
  ...wake(M.sleepA[0] - 1, 'right'),
  { until: 'the first hedge is lit', maxTicks: 60, check: lit(M.hedgeA) },
  ...wake(M.sleepB[0] - 1, 'right'),
  { until: 'the second hedge is lit', maxTicks: 60, check: lit(M.hedgeB) },
  { walk: M.brook[0] - 1 },
  { walk: M.brook[1] + 1 },
  ...wake(M.sleepC[0] - 1, 'right'),
  { until: 'the third hedge is lit', maxTicks: 60, check: lit(M.hedgeC) },
  // up the old oak
  { walk: M.branches[0][1] },
  { hop: 8, after: 12 },
  { until: 'on the low branch', maxTicks: 10, check: (s) => s.pos.by === M.branches[0][2] - 1 },
  { trick: 'e', hold: 4, after: 12 },
  { until: 'on the middle branch', maxTicks: 10, check: (s) => s.pos.by === M.branches[1][2] - 1 },
  { hop: 8, after: 12 },
  { until: 'on the top branch', maxTicks: 10, check: (s) => s.pos.by === M.branches[2][2] - 1 },
  // (walking left onto the end of the branch leaves Teddy facing the firefly)
  { walk: M.sleepD[0] + 2 },
  { walk: M.sleepD[0] + 1 },
  { trick: 's', after: 8 },
  { until: 'the tunnel is lit', maxTicks: 90, check: (s) => lit(M.hill[0])(s) && lit(M.hill[0] + 1)(s) },
  { walk: M.branches[0][0] - 1, grab: false },
  { until: 'down on the grass', maxTicks: 30, check: (s) => s.pos.by === 39 },
  { walk: M.lantern },
  { trick: 'f', after: 8 },
  { until: 'has the lantern', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  { walk: M.car + 1 },
];
