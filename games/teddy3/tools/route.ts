// The bot's way through each level (also the source of the title demo).
import type { Order } from './bot';
import { CTR } from '../src/ids';
import { GARAGE } from '../src/levels/garage';

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
};
