// The VACCINE decoder coin: a dark coin with the sixteen hex digits ringed round the rim in green, a chip's pin ring
// and "486" in the middle in orange, the way the family PC's own label would read. Turn it up to read an address.
import { circle2, ring2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { ringText2, strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 20;
const THICK = 3;
const RIM = { width: 1.2, height: 0.8 };
const DARK: Rgb = [18, 30, 40];
const GREEN: Rgb = [54, 224, 122];
const ORANGE: Rgb = [255, 122, 26];

const hex = ringText2('0123456789ABCDEF', 12.6, 4.4, 1.05, 22.5);
const chip = ring2(8.6, 9.6);
const core = strokeText2(['486'], 4.6, 1.15);
const inner = union2(chip, core);
const relief = union2(hex, inner);
const coin = plate({ outline: circle2(R), thick: THICK, rim: RIM, relief: { shape: relief, height: 0.8 } });

export const decoderCoin = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(coin(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (Math.hypot(x, y) > R - RIM.width - 0.3) return GREEN;
    if (z > THICK - 0.2) {
      if (inner(x, y) < 0.15) return ORANGE;
      if (hex(x, y) < 0.15) return GREEN;
    }
    return DARK;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  bodyCell: 0.25,
  palette: [DARK, GREEN, ORANGE],
});
