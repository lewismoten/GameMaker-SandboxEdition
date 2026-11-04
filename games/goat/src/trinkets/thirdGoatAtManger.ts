// The third goat at the manger, in the game's gray and white: a side-on, friendly goat (barrel body and straight back, long face with a
// white muzzle, upright ears out to the sides, horns sweeping back, a beard, slim legs on dark hooves, a short upturned tail) standing
// beside a wooden feed trough with slatted sides and a heap of hay. She faces +x. Hooves and trough feet stand on a thin base plate so
// it prints as one piece; no part is thinner than 2.4 mm. First version by Kaylee/Codex; reshaped by Claude Sonnet 5.5.
import { ellipsoid3, figure, roundCone3, type FigurePart } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';
import { roundBox3, sphere3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';

const GOAT: Rgb = [148, 146, 148];
const CREAM: Rgb = [246, 244, 236];
const HORN: Rgb = [206, 180, 132];
const HAY: Rgb = [228, 184, 70];
const WOOD: Rgb = [140, 96, 58];
const HOOF: Rgb = [58, 50, 50];
const INK: Rgb = [28, 22, 30];

const parts: FigurePart[] = [];
const add = (d: D3, color: Rgb) => parts.push({ d, color });

// base plate
add(roundBox3(14, 0, 1, 33, 11, 1, 1), WOOD);

// body: a straight back, deep barrel chest
add(roundBox3(-3, 0, 20, 11, 5.6, 5.2, 4.5), GOAT);
add(ellipsoid3(5, 0, 18.5, 8, 6.2, 8), GOAT);
add(ellipsoid3(5.5, 0, 17, 5.5, 6.4, 6.5), CREAM);
add(ellipsoid3(-11, 0, 20, 5, 5.2, 6), GOAT);
// legs and hooves
for (const x of [-9, 9]) {
  for (const s of [-1, 1]) {
    add(roundCone3(x, 3.4 * s, 17, 3, x + (x > 0 ? 0.5 : -0.5), 3.4 * s, 4, 2.3), GOAT);
    add(roundBox3(x + 0.8, 3.4 * s, 2.6, 2.6, 2.6, 1.6, 1), HOOF);
  }
}
// neck, head, muzzle, nose, eyes
add(roundCone3(8, 0, 22, 5.2, 15, 0, 33, 3.6), GOAT);
add(ellipsoid3(16.5, 0, 36, 5, 3.9, 4.2), GOAT);
add(roundCone3(17, 0, 35.5, 3.6, 24, 0, 32.5, 2.9), CREAM);
add(sphere3(26, 0, 32.3, 1.5), INK);
for (const s of [-1, 1]) add(sphere3(18.2, 3.1 * s, 37.4, 1.1), INK);
// ears: out to the sides, level
for (const s of [-1, 1]) add(ellipsoid3(14, 7 * s, 37, 2.6, 4.8, 1.3), GOAT);
// horns: sweeping back and up
for (const s of [-1, 1]) {
  add(roundCone3(15, 2.2 * s, 39, 1.9, 11.5, 2.8 * s, 44, 1.7), HORN);
  add(roundCone3(11.5, 2.8 * s, 44, 1.7, 5.5, 2.8 * s, 45.5, 1.3), HORN);
}
// beard, hanging from the chin against the throat
add(roundCone3(21, 0, 32, 2.1, 17.5, 0, 25.5, 1.4), CREAM);
// short upturned tail
add(roundCone3(-15, 0, 23, 2.6, -18.5, 0, 28.5, 1.8), GOAT);

// the manger: four splayed legs, long slats on both sides, end boards, hay
const X0 = 26;
const X1 = 46;
const XM = (X0 + X1) / 2;
for (const x of [X0, X1]) for (const s of [-1, 1]) add(roundCone3(x, 6.4 * s, 2, 1.6, x, 7.2 * s, 12, 1.5), WOOD);
for (const s of [-1, 1]) for (const z of [4.5, 8.5, 11.5]) add(roundBox3(XM, 7 * s, z, 11, 0.8, z === 11.5 ? 1 : 1.2, 0.5), WOOD);
for (const x of [X0, X1]) add(roundBox3(x, 0, 6, 1, 6.5, 4.5, 0.5), WOOD);
add(roundBox3(XM, 0, 3, 10, 6.5, 1.3, 0.5), WOOD);
add(ellipsoid3(XM, 0, 9.5, 9.4, 5.2, 4.2), HAY);
for (const [dx, dy] of [
  [-4, 1],
  [3, -1.5],
  [7, 1.5],
] as const)
  add(ellipsoid3(XM + dx, dy, 13, 2.6, 1.4, 1.5), HAY);

const GOAT_AT_MANGER = figure(parts, 0.9);

export const thirdGoatAtManger = (): FieldTrinketInput => ({
  mm: GOAT_AT_MANGER.mm,
  colorAt: GOAT_AT_MANGER.colorAt,
  box: { min: [-23, -13, -0.5], max: [49, 13, 48] },
  bodyCell: 0.5,
  palette: [GOAT, CREAM, HORN, HAY, WOOD, HOOF, INK],
});
