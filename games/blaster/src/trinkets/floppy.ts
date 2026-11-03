// The VACCINE.EXE floppy as a key tag: a blue disk with a steel shutter, a paper label that reads VACCINE.EXE,
// a clipped corner for the write-protect notch and a ring tab for the keys ("Only in an emergency").
import { polygon2, roundRect2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate, ringTab } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const H = 22;
const THICK = 3;
const BLUE: Rgb = [30, 80, 200];
const STEEL: Rgb = [206, 214, 228];
const PAPER: Rgb = [246, 244, 232];
const INK: Rgb = [20, 24, 60];

const tab = ringTab(-H + 1.5, H - 1.5, 3.2, 2.8);
// the body, a corner cut away top right as on the real disk
const cut = polygon2([
  [H - 7, H + 5],
  [H + 5, H - 7],
  [H + 5, H + 5],
]);
const body = (x: number, y: number) => Math.max(roundRect2(H, H, 2.5)(x, y), -cut(x, y));
const shutter = roundRect2(8.5, 6.5, 0.8, 1.5, H - 7.5);
const slot = roundRect2(1.8, 4, 0.5, 4.5, H - 7);
const label = roundRect2(14.5, 8.5, 0.8, 0, -10.5);
const words = strokeText2(['VACCINE', '.EXE'], 3.2, 0.8, 0, -10.8);
const relief = union2(shutter, label);
const tag = plate({
  outline: union2(body, tab.shape),
  thick: THICK,
  rim: { width: 1, height: 0.6 },
  relief: { shape: relief, height: 0.8 },
  engrave: { shape: union2(slot, words), depth: 0.6 },
  holes: [tab.hole],
});

export const floppyTag = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(tag(x, y, z), -z),
  colorAt: (x, y, z) => {
    if (words(x, y) < 0.1 || slot(x, y) < 0.1) return INK;
    if (z > THICK + 0.3) {
      if (label(x, y) < 0.15) return PAPER;
      if (shutter(x, y) < 0.15) return STEEL;
    }
    return BLUE;
  },
  box: { min: [-H - 7, -H - 1, -0.5], max: [H + 1, H + 7, THICK + 2] },
  bodyCell: 0.25,
  palette: [BLUE, STEEL, PAPER, INK],
});
