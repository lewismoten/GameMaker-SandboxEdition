// THE CHEZ's license plate as a key tag: a white plate with a charcoal rim, THE CHEZ in tomato red and a ring tab at one end.
import { roundRect2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate, ringTab } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const HX = 27;
const HY = 11;
const THICK = 2.8;
const RIM = { width: 1.2, height: 0.7 };
const WHITE: Rgb = [246, 244, 234];
const CHARCOAL: Rgb = [48, 48, 56];
const RED: Rgb = [226, 60, 40];

const tab = ringTab(-HX - 1.2, 0, 2.8, 2.6);
const name = strokeText2(['THE CHEZ'], 7, 1.5, 0, 0);
const lettering = name;
const tag = plate({
  outline: union2(roundRect2(HX, HY, 3.5), tab.shape),
  thick: THICK,
  rim: RIM,
  relief: { shape: lettering, height: 0.8 },
  holes: [tab.hole],
});

export const chezPlate = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(tag(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (z > THICK - 0.2 && lettering(x, y) < 0.15) return RED;
    const inner = x > -HX + RIM.width + 0.3 && Math.max(Math.abs(x) - (HX - RIM.width - 0.3), Math.abs(y) - (HY - RIM.width - 0.3)) < 0;
    return inner ? WHITE : CHARCOAL;
  },
  box: { min: [-HX - 8, -HY - 1, -0.5], max: [HX + 1, HY + 1, THICK + 2] },
  bodyCell: 0.25,
  palette: [WHITE, CHARCOAL, RED],
});
