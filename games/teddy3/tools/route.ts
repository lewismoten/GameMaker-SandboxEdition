// The bot's way through each level (also the source of the title demo).
import type { Order } from './bot';
import type { Sim } from '../../kit/sceneSim';
import { CTR } from '../src/ids';
import { GARAGE } from '../src/levels/garage';
import { MAPLE } from '../src/levels/maple';

/** The car's charge (counters read one more than they hold). */
const charge = (s: Sim) => s.w.ci.meter[CTR.charge] - 1;

export const ROUTES: Record<string, Order[]> = {
  garage: [
    { walk: 3 },
    { trick: 's', after: 30 },
    { until: 'the wobble ball lands', maxTicks: 40, check: (s) => s.monsters('wobble').length > 0 },
    { walk: 5 },
    { until: 'the mouse comes near', maxTicks: 80, check: (s) => s.monsters('mouse').some((m) => m.x <= 7) },
    { trick: 'space', after: 20 },
    { walk: GARAGE.btnDoor - 1 },
    { face: 'right' },
    { trick: 'five', after: 20 },
    { walk: 16 },
    { trick: 'space', after: 20 },
    { walk: GARAGE.bench - 1 },
    { hop: 8, dir: 'right', dirFor: 6 },
    { walk: GARAGE.btnCab - 1 },
    { face: 'right' },
    { trick: 'five', after: 24 },
    { walk: GARAGE.cab },
    { trick: 'f', after: 8 },
    { until: 'has the keys', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
    { hop: 7, dir: 'right', dirFor: 9 },
    { walk: 32 },
    { trick: 'e', hold: 6, after: 10 },
    { trick: 'e', hold: 6, after: 10 },
    { walk: 41 },
    { walk: GARAGE.btnGarage - 1, grab: false },
    { face: 'right' },
    { trick: 'five', after: 2 },
    { walk: GARAGE.door + 2 },
    { walk: GARAGE.car + 1 },
  ],
  maple: [
    { until: 'charged', maxTicks: 60, check: (s) => charge(s) >= 1 },
    { walk: MAPLE.geese - 3, grab: false },
    { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= MAPLE.geese) },
    { trick: 'space', after: 16 },
    { walk: MAPLE.hump - 1 },
    { trick: 'e', hold: 4, after: 12 },
    { walk: MAPLE.pothole + 3 },
    { walk: MAPLE.hill1 + 2 },
    { walk: MAPLE.charger2 },
    { until: 'charged on the hill', maxTicks: 60, check: (s) => charge(s) >= 1 },
    { walk: MAPLE.geese2 - 3 },
    { until: 'the geese come near', maxTicks: 80, check: (s) => s.monsters('goose').some((m) => m.x <= MAPLE.geese2) },
    { trick: 'space', after: 16 },
    { walk: MAPLE.charger3 },
    { until: 'two charges', maxTicks: 80, check: (s) => charge(s) >= 2 },
    { walk: MAPLE.exit },
  ],
};
