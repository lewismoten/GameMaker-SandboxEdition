// The bot's way through park.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import { at, board, leap } from './helpers';
import { CTR } from '../../src/ids';
import { PARK } from '../../src/levels/park';

export const route: Order[] = [
  { walk: PARK.sawA - 2 },
  { trick: 'e', hold: 4, after: 8 },
  ...board('sawDown', PARK.sawA),
  { until: 'up at the hedge', maxTicks: 80, check: (s) => s.pos.by <= 34 },
  { walk: PARK.bank },
  ...board('sawUp', PARK.sawB),
  { until: 'up over the pond', maxTicks: 80, check: (s) => s.pos.by <= 34 && at(s, 'sawUp', PARK.sawB, 35) },
  ...leap(PARK.sawC),
  { until: 'up at the high bank', maxTicks: 80, check: (s) => s.pos.by <= 34 && at(s, 'sawUp', PARK.sawC, 35) },
  ...leap(PARK.highBank),
  { walk: PARK.superSaw - 2 },
  { wait: 10 },
  { trick: 'e', hold: 4, after: 8 },
  ...board('sawSuper', PARK.superSaw),
  { until: 'up in the oak', maxTicks: 120, check: (s) => s.pos.by <= 31 },
  { walk: PARK.branch },
  { until: 'the squirrel comes near', maxTicks: 80, check: (s) => s.monsters('squirrel').some((m) => m.x <= PARK.branch + 2) },
  { trick: 'space', after: 16 },
  { walk: PARK.streamers },
  { trick: 'f', after: 8 },
  { until: 'has the streamers', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
  { walk: 51 },
  // on the low branch, wait for a disc to sail by below, then go past the kid before the next throw
  { until: 'a disc sails by', maxTicks: 60, check: (s) => s.monsters('disc').some((m) => m.x <= 51 && m.x >= 49) },
  { walk: PARK.car + 1, dodge: ['disc'] },
];
