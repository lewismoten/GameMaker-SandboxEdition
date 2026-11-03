// The wrong-number die: a teal six-sided die of the shared kind, for choosing which phone booth to dial. Everything in the
// phone exchange is a wrong number until it is not.
import { die } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const SIZE = 20;
const TEAL: Rgb = [63, 224, 208];
const LOWER = 1.05;
const cube = die(SIZE, 2.2);

export const wrongNumberDie = (): FieldTrinketInput => ({
  // sunk a little, so the rounded bottom edge is cut flat where it leans 45 degrees
  mm: (x, y, z) => Math.max(cube(x, y, z + LOWER), -z),
  colorAt: () => TEAL,
  box: { min: [-SIZE / 2 - 1, -SIZE / 2 - 1, -0.5], max: [SIZE / 2 + 1, SIZE / 2 + 1, SIZE + 1] },
  palette: [TEAL],
});
