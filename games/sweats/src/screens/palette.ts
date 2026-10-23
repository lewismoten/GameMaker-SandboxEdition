// The palette of the 320x200 screens: the common ramps, The Hive's, and inks for the pages
// PLAYGAME writes on (Display_File writes in the color nearest (50,10,50)*4, and "MORE..." in
// the one nearest (63,10,10)*4).
import { buildPalette, type Pal } from '../art/pal';
import { HIVE_RAMPS } from '../hive/blocks';

export function buildScreenPalette(): Pal {
  const pal = buildPalette(HIVE_RAMPS);
  const b = pal.b;
  b.ramp('dark', 6, [6, 4, 12], [70, 60, 100], [26, 20, 44]);
  b.ramp('parch', 5, [150, 130, 110], [250, 244, 232]);
  b.ramp('brown', 3, [44, 24, 12], [118, 70, 34]);
  b.ramp('plum', 2, [120, 20, 110], [200, 40, 200]);
  b.ramp('menublue', 2, [20, 20, 140], [40, 40, 252]);
  b.ramp('hot', 1, [252, 40, 40], [252, 40, 40]);
  return pal;
}
