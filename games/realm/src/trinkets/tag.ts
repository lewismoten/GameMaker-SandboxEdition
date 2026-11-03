// Pip's key tag: a green plate with a hole for the ring and "DO IT TODAY" raised in cream, the way Pip does things.
import { circle2, pixelText2, ring2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate, tagOutline } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const HX = 15;
const HY = 26;
const THICK = 3;
const RIM = { width: 1.4, height: 0.8 };
const HOLE = { x: 0, y: 19, r: 3.2 };
const GREEN: Rgb = [44, 118, 82];
const CREAM: Rgb = [244, 232, 196];

const lettering = pixelText2(['DO IT', 'TODAY'], 1.2, 0, -4);
// a cream collar round the hole
const collar = ring2(HOLE.r, HOLE.r + 2);
const eyelet = (x: number, y: number) => collar(x - HOLE.x, y - HOLE.y);
const tag = plate({
  outline: tagOutline(HX, HY, 6),
  thick: THICK,
  rim: RIM,
  relief: { shape: union2(lettering, eyelet), height: 0.8 },
  holes: [circle2(HOLE.r, HOLE.x, HOLE.y)],
});

export const keyTag = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(tag(x, y, z), -z),
  colorAt: (x, y, z) => {
    const raised = z > THICK - 0.2 && (lettering(x, y) < 0.15 || eyelet(x, y) < 0.15);
    const edge = Math.max(Math.abs(x) - (HX - RIM.width - 0.3), Math.abs(y) - (HY - RIM.width - 0.3)) > 0;
    return raised || (edge && z > THICK - 0.2) ? CREAM : GREEN;
  },
  box: { min: [-HX - 1, -HY - 1, -0.5], max: [HX + 1, HY + 1, THICK + 2] },
  bodyCell: 0.3,
  palette: [GREEN, CREAM],
});
