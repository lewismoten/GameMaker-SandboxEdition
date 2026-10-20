// The bot's way through each level (also the source of the title demo).
import type { Order } from './bot';
import { CTR } from './ids';

export const ROUTES: Record<string, Order[]> = {
  backyard: [
    { walk: 22 },
    { walk: 24 },
    { hop: 6, dir: 'right', dirFor: 6 },
    { walk: 31 },
    { walk: 33 },
    { trick: 'space' },
    { walk: 40 },
    { trick: 'down', after: 20 },
    { walk: 52 },
    { hop: 7, dir: 'right', dirFor: 4 },
    { walk: 55 },
    { hop: 8 },
    { hop: 8 },
    { walk: 54 },
    { trick: 'f', after: 10 },
    { until: 'has the hat', check: (s) => s.w.ci.meter[CTR.props] > 1 },
    { walk: 64 },
    { trick: 'down', after: 25 },
    { walk: 71 },
    { hop: 8, dir: 'right', dirFor: 5 },
    { walk: 77 },
  ],
};
