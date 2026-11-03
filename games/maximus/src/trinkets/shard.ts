// A star-shard replica: the Sapphire shard of Maximus Core cut as an eight-sided gem, standing on its table with the
// crown flaring out at under 45 degrees, so it prints without supports. Its facets take turns in three blues, as the game's
// shard sprites do (the shared `nova` ramp).
import { gem } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const DEEP: Rgb = [40, 72, 206];
const MID: Rgb = [90, 140, 255];
const LIGHT: Rgb = [170, 206, 255];
const WHITE: Rgb = [236, 246, 255];

const SHARD = gem({ sides: 8, table: 9, girdle: 15, crown: 7.5, pavilion: 15 });

export const sapphireShard = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(SHARD.field(x, y, z), -z),
  colorAt: (x, y, z) => {
    const f = SHARD.facet(x, y, z);
    if (f === 0) return WHITE;
    if (f <= 8) return f % 2 ? LIGHT : MID;
    return f % 2 ? DEEP : MID;
  },
  box: { min: [-17, -17, -0.5], max: [17, 17, 25] },
  bodyCell: 0.9,
  palette: [DEEP, MID, LIGHT, WHITE],
});
