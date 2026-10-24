// The bot's way through balloon.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import { CTR } from '../../src/ids';
import { BALLOON } from '../../src/levels/balloon';

export const route: Order[] = [
  { walk: 5 },
  { until: 'the pigeons come near', maxTicks: 80, check: (s) => s.monsters('pigeon').some((m) => m.x <= 7) },
  { trick: 'space', after: 16 },
  { walk: 7 },
  { until: 'the other pigeon comes near', maxTicks: 80, check: (s) => s.monsters('pigeon').some((m) => m.x <= 9) },
  { trick: 'space', after: 16 },
  { walk: BALLOON.lift1 },
  { trick: 'five', after: 10 },
  { until: 'up at shelf 1', maxTicks: 80, check: (s) => s.pos.by <= BALLOON.shelf1 - 1 },
  { walk: BALLOON.lift2 },
  { trick: 'five', after: 10 },
  { until: 'up at shelf 2', maxTicks: 80, check: (s) => s.pos.by <= BALLOON.shelf2 - 1 },
  { walk: BALLOON.lift3 },
  { until: 'a pin goes by', maxTicks: 120, check: (s) => s.monsters('pin').some((m) => m.x >= BALLOON.lift3) },
  { trick: 'five', after: 10 },
  { until: 'up at the loft', maxTicks: 80, check: (s) => s.pos.by <= BALLOON.loft - 1 },
  { walk: BALLOON.bag },
  { trick: 'f', after: 8 },
  { until: 'has the balloons', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  { walk: BALLOON.door },
];
