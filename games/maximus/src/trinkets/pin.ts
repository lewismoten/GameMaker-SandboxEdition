// The courier pin: a teal hexagon with a trim-orange rim, a star over MAX in white. A pocket in the back takes a pin.
import { polygon2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { pinBack, plate, regular2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 21;
const THICK = 3;
const RIM = { width: 1.6, height: 0.8 };
const SUIT: Rgb = [30, 140, 170];
const TRIM: Rgb = [240, 120, 20];
const WHITE: Rgb = [244, 250, 252];

const star = polygon2(
  Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 3.4 : 8;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    return [r * Math.cos(a), 8.4 + r * Math.sin(a)] as [number, number];
  }),
);
const name = strokeText2(['MAX'], 8, 1.9, 0, -8.4);
const art = union2(star, name);
const badge = plate({ outline: regular2(6, R, 0), thick: THICK, rim: RIM, relief: { shape: art, height: 0.8 }, pocket: pinBack(0, 0, 22, 5) });

export const courierPin = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(badge(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (z > THICK - 0.2) {
      if (art(x, y) < 0.15) return WHITE;
      if (regular2(6, R - RIM.width - 0.3, 0)(x, y) > 0) return TRIM;
    }
    return SUIT;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  bodyCell: 0.25,
  palette: [SUIT, TRIM, WHITE],
});
