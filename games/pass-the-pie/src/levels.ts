// PASS THE PIE's levels, two heroes taking turns (src/levels/ has one file a level; common.ts says what the letters
// of a map mean):
//
//   1. Pumpkin Yard  RORY   the storybook, played straight: the pie over two oaks, a porch roof and a hedge
//   2. Payback       PLUME  Dale's lawn: the combo on lawn turkeys, kick bags, drones, the shed key, the garage roof
//   3. Gravy Relay   RORY   two dishes to two doors and the dining room before the bar runs out (the oven restarts)
//   4. Windy Park    PLUME  a tailwind over the pond, warm air up to the bandstand roof, swooping drones, the crew tent
//   5. The Cord      RORY   Dale's street at dusk: follow the orange cord past Biscuit and the shop roofs
//   6. Main Street   PLUME  the chase: Big Gobble loose and rolling after him, everything in the way costs time
//   7. Big Gobble    PLUME  the boss against the bar: its puffed-out balloons, three tether stakes, the blower, the hall
// Rory's streets are printed in storybook inks and Mr. Plume's in fight-poster inks (palette.ts).
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { dress } from './dress';
import type { Level } from './levels/common';
import { chase } from './levels/chase';
import { cord } from './levels/cord';
import { dojo } from './levels/dojo';
import { gobble } from './levels/gobble';
import { gravy } from './levels/gravy';
import { lawn } from './levels/lawn';
import { park } from './levels/park';
import { yard } from './levels/yard';

export type { Hero, Level } from './levels/common';
export { finishBook } from './levels/common';

/** The levels in order. */
export function buildLevels(pal: Pal): Level[] {
  const levels = [yard(pal), lawn(pal), gravy(pal), park(pal), dojo(pal), cord(pal), chase(pal), gobble(pal)];
  for (const l of levels) dress(l, pal);
  return levels;
}
