// The Moten Snow-to-Software coin: a snow-white disc with a blue rim, "SNOW TO SOFTWARE" ringed round it and a pink $1,
// the price of a scoop, in the middle.
import { circle2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { ringText2, strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 20;
const THICK = 3;
const RIM = { width: 1.4, height: 0.8 };
const SNOW: Rgb = [232, 240, 252];
const BLUE: Rgb = [29, 79, 145];
const PINK: Rgb = [255, 120, 180];

const legend = ringText2('SNOW TO SOFTWARE ', 13.6, 4.2, 1.0, 360 / 17);
const price = strokeText2(['$1'], 11, 2, 0, 0);
const coin = plate({ outline: circle2(R), thick: THICK, rim: RIM, relief: { shape: union2(legend, price), height: 0.8 } });

export const scoopCoin = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(coin(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (Math.hypot(x, y) > R - RIM.width - 0.3) return BLUE;
    if (z > THICK - 0.2) {
      if (price(x, y) < 0.15) return PINK;
      if (legend(x, y) < 0.15) return BLUE;
    }
    return SNOW;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  bodyCell: 0.25,
  palette: [SNOW, BLUE, PINK],
});
