// PASS THE PIE's levels, two heroes taking turns (src/levels/ has one file a level; common.ts says what the letters
// of a map mean):
//
//   1. Pumpkin Yard  RORY   the storybook, played straight: the pie over two oaks, a porch roof and a hedge
//   2. Payback       PLUME  Dale's lawn: the combo on lawn turkeys, kick bags, drones, the shed key, the garage roof
//   3. Gravy Relay   RORY   two dishes to two doors and the dining room before the bar runs out (the oven restarts)
//   4. Windy Park    PLUME  a tailwind over the pond, warm air up to the bandstand roof, swooping drones, the crew tent
// Rory's streets are printed in storybook inks and Mr. Plume's in fight-poster inks (palette.ts).
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import type { Level } from './levels/common';
import { gravy } from './levels/gravy';
import { lawn } from './levels/lawn';
import { park } from './levels/park';
import { yard } from './levels/yard';

export type { Hero, Level } from './levels/common';
export { finishBook } from './levels/common';

/** The levels in order. */
export function buildLevels(pal: Pal): Level[] {
  return [yard(pal), lawn(pal), gravy(pal), park(pal)];
}
