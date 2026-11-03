// The Clown Club pin: a cream badge with CLOWN CLUB in ink, the O of CLOWN a red rubber nose, and a rim in parade red.
// A pocket in the back takes a pin.
import { circle2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { pinBack, plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 20;
const THICK = 3;
const RIM = { width: 1.6, height: 0.8 };
const CREAM: Rgb = [255, 246, 224];
const INK: Rgb = [26, 16, 48];
const RED: Rgb = [214, 40, 42];

const CAP = 6.2;
const PEN = 1.4;
const Y = 4;
// CLOWN with the O left out, a nose in its place
const letters = union2(
  strokeText2(['C'], CAP, PEN, -11.2, Y),
  strokeText2(['L'], CAP, PEN, -5.6, Y),
  strokeText2(['W'], CAP, PEN, 5.6, Y),
  strokeText2(['N'], CAP, PEN, 11.2, Y),
  strokeText2(['CLUB'], CAP, PEN, 0, -6.5),
);
const nose = circle2(3.1, 0, Y);
const badge = plate({
  outline: circle2(R),
  thick: THICK,
  rim: RIM,
  relief: { shape: union2(letters, nose), height: 0.8 },
  pocket: pinBack(0, 0, 22, 5),
});

export const clubPin = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(badge(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (Math.hypot(x, y) > R - RIM.width - 0.3) return RED;
    if (z > THICK - 0.2) {
      if (nose(x, y) < 0.15) return RED;
      if (letters(x, y) < 0.15) return INK;
    }
    return CREAM;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  bodyCell: 0.25,
  palette: [CREAM, INK, RED],
});
