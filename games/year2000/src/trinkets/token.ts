// The Teleport-A-Phone quarter: a silver token with TELEPORT A PHONE ringed round it and a magenta 25 in the middle.
// Only 25 cents a call (it is a plastic one: it will not work in a booth).
import { circle2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { ringText2, strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 20;
const THICK = 3;
const RIM = { width: 1.4, height: 0.8 };
const SILVER: Rgb = [214, 222, 240];
const MAGENTA: Rgb = [208, 32, 138];
const INK: Rgb = [40, 20, 90];

const legend = ringText2('TELEPORT A PHONE ', 13.6, 4.2, 1.0, 360 / 17);
const price = strokeText2(['25'], 11, 2.3, 0, 0);
const coin = plate({ outline: circle2(R), thick: THICK, rim: RIM, relief: { shape: union2(legend, price), height: 0.8 } });

export const quarterToken = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(coin(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (Math.hypot(x, y) > R - RIM.width - 0.3) return MAGENTA;
    if (z > THICK - 0.2) {
      if (price(x, y) < 0.15) return MAGENTA;
      if (legend(x, y) < 0.15) return INK;
    }
    return SILVER;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  bodyCell: 0.25,
  palette: [SILVER, MAGENTA, INK],
});
