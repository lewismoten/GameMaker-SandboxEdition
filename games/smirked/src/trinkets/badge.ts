// The Bravery Badge: a scalloped pink rosette (Lily's unicorn-hoodie pink) with a gold star and BRAVERY BADGE ringed round it,
// and a bar-shaped pocket in the back to glue a pin into (its roof steeper than 45 degrees). A flat plate with vertical walls: no supports.
import { circle2, polygon2, union2, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { ringText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const PINK: Rgb = [236, 96, 164];
const GOLD: Rgb = [244, 200, 24];
const WHITE: Rgb = [252, 248, 240];

const THICK = 4.4;
const RIM = { width: 1.2, height: 0.8 };
const scallops = Array.from({ length: 14 }, (_, i) => circle2(3.2, 17.4 * Math.cos((i * 2 * Math.PI) / 14), 17.4 * Math.sin((i * 2 * Math.PI) / 14)));
const outline = union2(circle2(17.4), ...scallops);
const star = polygon2(
  Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 3.6 : 8.2;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    return [r * Math.cos(a), r * Math.sin(a)] as [number, number];
  }),
);
const words = ringText2('BRAVERY BADGE ', 11.2, 3.8, 1, 360 / 14);
// the pin's pocket, a bar 5 mm wide whose roof is a gable steeper than 45 degrees (more than pinBack's), so no support
const pocket: D3 = (x, y, z) => Math.max((Math.abs(y) * 1.35 + z - 2.5 * 1.35) / 1.68, Math.abs(x) - 11, -z - 1);
const badge = plate({ outline, thick: THICK, rim: RIM, relief: { shape: union2(star, words), height: 0.9 }, pocket });

export const braveryBadge = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(badge(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (z > THICK - 0.2) {
      if (star(x, y) < 0.15) return GOLD;
      if (words(x, y) < 0.15) return WHITE;
    }
    return Math.hypot(x, y) > 17.4 - RIM.width - 0.3 && z > THICK - 0.1 ? GOLD : PINK;
  },
  box: { min: [-21, -21, -0.5], max: [21, 21, THICK + RIM.height + 1] },
  bodyCell: 0.3,
  palette: [PINK, GOLD, WHITE],
});
