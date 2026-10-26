// The bot's way through maple.ts (the level's own comment says what happens there).
import type { Order } from '../bot';
import { charge } from './helpers';
import { MAPLE } from '../../src/levels/maple';

export const route: Order[] = [
  { until: 'charged', maxTicks: 60, check: (s) => charge(s) >= 1 },
  { walk: MAPLE.geese - 3, grab: false },
  { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= MAPLE.geese) },
  { trick: 'space', after: 16 },
  { walk: MAPLE.hump - 1 },
  { trick: 'e', hold: 4, after: 12 },
  { walk: MAPLE.pothole + 3 },
  { walk: MAPLE.hill1 + 2 },
  { walk: MAPLE.geese2 - 3 },
  { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= MAPLE.geese2) },
  { trick: 'space', after: 16 },
  // down onto the low road to its charger, and BUMP back up at its far end
  { walk: MAPLE.charger3 },
  { until: 'two charges', maxTicks: 80, check: (s) => charge(s) >= 2 },
  { walk: MAPLE.laneEnd + 2 },
  { walk: MAPLE.geese3 - 3 },
  { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.y === 37 && m.x <= MAPLE.geese3) },
  { trick: 'space', after: 16 },
  { walk: MAPLE.exit },
];
