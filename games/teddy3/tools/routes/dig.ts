// The bot's way through dig.ts (the level's own comment says what happens there): down the
// left way (soft dirt and roots). Its landing in the first tunnel is clear of the mole.
import type { Order } from '../bot';
import type { Sim } from '../../../kit/sceneSim';
import { at } from './helpers';
import { CTR } from '../../src/ids';
import { DIG, ROW } from '../../src/levels/dig';

/** Is the well bucket in its dip below the step (level with it or a little lower)? */
const below = (s: Sim) =>
  s.w.mm.some((m, i) => s.scene.names?.[m.monnum] === 'bucket' && s.w.mi[i].cury[0] === ROW.low && s.w.mi[i].cury[1] >= 4 && s.w.mi[i].cury[1] <= 12);

/** Big-digs until she is standing on row `by` (each dig drops her a block). */
const digTo = (by: number): Order[] => [
  { trick: 'down', after: 14 },
  { until: `down to row ${by}`, maxTicks: 30, check: (s) => s.pos.by >= by && s.pos.y % 20 === 0 },
];

export const route: Order[] = [
  { walk: DIG.shaft },
  { trick: 'down', after: 14 },
  ...digTo(ROW.tunnel),
  { walk: DIG.gapA },
  { trick: 'down', after: 14 },
  ...digTo(ROW.layer),
  { walk: DIG.rootsA - 1 },
  { trick: 'five', after: 14 },
  { walk: DIG.rootsA },
  { trick: 'five', after: 14 },
  { until: 'the roots are chewed', maxTicks: 1, check: (s) => !s.monsters('roots').some((m) => m.y === ROW.layer) },
  { walk: DIG.downA },
  ...digTo(ROW.cavern),
  { walk: DIG.downA + 2 },
  { until: 'the mole comes near', maxTicks: 80, check: (s) => s.monsters('mole').some((m) => m.y === ROW.cavern && m.x <= DIG.downA + 5) },
  { face: 'right' },
  { trick: 'space', after: 14 },
  { until: 'the cavern mole is gone', maxTicks: 1, check: (s) => !s.monsters('mole').some((m) => m.y === ROW.cavern) },
  { walk: DIG.down },
  { trick: 'down', after: 14 },
  { trick: 'down', after: 14 },
  ...digTo(ROW.deep),
  { walk: DIG.roots - 1 },
  { trick: 'five', after: 14 },
  { walk: DIG.down2 },
  { trick: 'down', after: 14 },
  { trick: 'down', after: 14 },
  ...digTo(ROW.pocket),
  { walk: DIG.bone },
  { trick: 'f', after: 8 },
  { until: 'has the best bone', maxTicks: 10, check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  { walk: DIG.step },
  { until: 'the bucket is down by the step', maxTicks: 200, check: (s) => below(s) },
  { walk: DIG.well, maxTicks: 20 },
  { until: 'up at the top', maxTicks: 120, check: (s) => at(s, 'bucket', DIG.well, ROW.top) && s.pos.by === ROW.top - 1 },
  { walk: DIG.ledgeA },
  { until: 'in the hollow', maxTicks: 20, check: (s) => s.pos.by === ROW.top - 1 && s.pos.y % 20 === 0 },
  { until: 'the view has caught up', maxTicks: 60, check: (s) => s.pos.by - s.w.my >= 4 },
  { hop: 10 },
  { until: 'on the first root', maxTicks: 30, check: (s) => s.pos.by === ROW.ledgeA - 1 && s.pos.y % 20 === 0 },
  { trick: 'e', hold: 8, after: 0 },
  { walk: DIG.ledgeB + 1, maxTicks: 20, grab: false },
  { until: 'on the second root', maxTicks: 30, check: (s) => s.pos.by === ROW.ledgeB - 1 && s.pos.y % 20 === 0 },
  { trick: 'five', after: 14 },
  { walk: DIG.exit },
  { hop: 8 },
];
