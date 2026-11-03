// The Certified Rat Tickler medal: a certificate-gold disc with CERTIFIED RAT TICKLER ringed round the rim and a tickling feather
// across the middle, ready to be framed beside the certificate.
import { capsule2, circle2, union2, type D2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { ringText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 20;
const THICK = 3;
const RIM = { width: 1.4, height: 0.8 };
const GOLD: Rgb = [246, 200, 70];
const DARK: Rgb = [140, 90, 0];
const INK: Rgb = [40, 26, 10];
const FEATHER: Rgb = [255, 252, 244];

const legend = ringText2('CERTIFIED RAT TICKLER ', 13.8, 4.2, 1.0, 360 / 22);
const tilt = (40 * Math.PI) / 180;
const local = (x: number, y: number): [number, number] => [x * Math.cos(tilt) + y * Math.sin(tilt), -x * Math.sin(tilt) + y * Math.cos(tilt)];
const LONG = 9.5;
const WIDE = 3.6;
const BIG = (LONG * LONG + WIDE * WIDE) / (2 * WIDE);
const vane: D2 = (x, y) => {
  const [u, v] = local(x, y);
  return Math.max(Math.hypot(u, v - (BIG - WIDE)) - BIG, Math.hypot(u, v + (BIG - WIDE)) - BIG);
};
const quill: D2 = (x, y) => {
  const [u, v] = local(x, y);
  return capsule2(-LONG - 3.5, 0, LONG - 1, 0, 0.6)(u, v);
};
const feather = union2(vane, quill);
const coin = plate({ outline: circle2(R), thick: THICK, rim: RIM, relief: { shape: union2(legend, feather), height: 0.8 } });

export const tickleMedal = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(coin(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (Math.hypot(x, y) > R - RIM.width - 0.3) return DARK;
    if (z > THICK - 0.2) {
      if (feather(x, y) < 0.15) return FEATHER;
      if (legend(x, y) < 0.15) return INK;
    }
    return GOLD;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  bodyCell: 0.25,
  palette: [GOLD, DARK, INK, FEATHER],
});
