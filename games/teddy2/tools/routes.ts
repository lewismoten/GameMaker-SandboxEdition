// The bot's way through each level (also the source of the title demo).
import type { Order } from './bot';
import { CTR } from '../src/ids';

export const ROUTES: Record<string, Order[]> = {
  house: [
    { walk: 12 },
    { trick: 'space' },
    { walk: 24 },
    { walk: 32 },
    { hop: 9, dir: 'right', dirFor: 5 },
    { walk: 35 },
    { trick: 'space' },
    { walk: 50 },
    { wait: 20 },
    { trick: 's', after: 30 },
    { until: 'has the collar', check: (s) => s.w.ci.meter[CTR.clues] > 1 },
    { walk: 55 },
    { hop: 4, dir: 'right', dirFor: 3 },
    { hop: 4, dir: 'right', dirFor: 3 },
    { hop: 4, dir: 'right', dirFor: 3 },
    { hop: 4, dir: 'right', dirFor: 3 },
    { hop: 4, dir: 'right', dirFor: 3 },
    { hop: 4, dir: 'right', dirFor: 3 },
    { hop: 5, dir: 'right', dirFor: 3 },
    { walk: 77 },
  ],
};
