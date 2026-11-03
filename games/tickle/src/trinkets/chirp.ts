// The 50 kHz key tag: a storm-purple tag with a ring tab and 50 KHZ raised in spark yellow, the pitch every happy rat chirps at.
import { roundRect2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate, ringTab } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const HX = 15;
const HY = 24;
const THICK = 3;
const RIM = { width: 1.3, height: 0.8 };
const PURPLE: Rgb = [92, 36, 120];
const SPARK: Rgb = [255, 232, 110];

const tab = ringTab(0, HY + 1.4, 3.2, 2.8);
const words = union2(strokeText2(['50'], 13, 2.6, 0, 6), strokeText2(['KHZ'], 7, 1.7, 0, -12));
const tag = plate({
  outline: union2(roundRect2(HX, HY, 5), tab.shape),
  thick: THICK,
  rim: RIM,
  relief: { shape: words, height: 0.8 },
  holes: [tab.hole],
});

export const chirpTag = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(tag(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (z > THICK - 0.2 && words(x, y) < 0.15) return SPARK;
    const rimBand = Math.max(Math.abs(x) - (HX - RIM.width - 0.3), Math.abs(y) - (HY - RIM.width - 0.3)) > 0;
    return rimBand || y > HY - 1 ? SPARK : PURPLE;
  },
  box: { min: [-HX - 1, -HY - 1, -0.5], max: [HX + 1, HY + 8, THICK + 2] },
  bodyCell: 0.25,
  palette: [PURPLE, SPARK],
});
