// The Hundred Worlds coin: a courier's fare token in midnight blue, THE HUNDRED WORLDS ringed round the rim in gold,
// a jade planet with its pearl ring across the middle.
import { circle2, ring2, union2, type D2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { ringText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 20;
const THICK = 3;
const RIM = { width: 1.3, height: 0.8 };
const NAVY: Rgb = [14, 22, 70];
const GOLD: Rgb = [250, 200, 40];
const JADE: Rgb = [20, 180, 120];
const PEARL: Rgb = [236, 232, 246];

const legend = ringText2('THE HUNDRED WORLDS ', 13.8, 4.2, 1.0, 360 / 19);
const planet = circle2(5.6, 0, 0);
// the ring: an ellipse of 11 x 3.6, tilted, drawn as a band
const tilt = (-22 * Math.PI) / 180;
const band: D2 = (x, y) => {
  const u = x * Math.cos(tilt) - y * Math.sin(tilt);
  const v = x * Math.sin(tilt) + y * Math.cos(tilt);
  const r = ring2(0.85, 1.0)(u / 11, v / 3.6);
  return r * 3.6;
};
const coin = plate({ outline: circle2(R), thick: THICK, rim: RIM, relief: { shape: union2(legend, planet, band), height: 0.8 } });

export const worldsCoin = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(coin(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (Math.hypot(x, y) > R - RIM.width - 0.3) return GOLD;
    if (z > THICK - 0.2) {
      if (band(x, y) < 0.15) return PEARL;
      if (planet(x, y) < 0.15) return JADE;
      if (legend(x, y) < 0.15) return GOLD;
    }
    return NAVY;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  bodyCell: 0.25,
  palette: [NAVY, GOLD, JADE, PEARL],
});
