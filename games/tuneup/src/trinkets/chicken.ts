// Sir Reginald III, the rubber chicken, as the game draws him: pale yellow rubber lying on his belly, his scrawny legs trailing
// out behind, a long floppy neck holding the head up, a red comb and wattle and an orange beak open mid-squawk. Lying down,
// so he prints on his belly with nothing under him; the neck and head rise steeply, so no supports.
import { ellipsoid3, figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { sphere3, union3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const RUBBER: Rgb = [250, 232, 112];
const ORANGE: Rgb = [250, 140, 30];
const RED: Rgb = [226, 36, 48];
const INK: Rgb = [30, 24, 30];

const both = (f: (s: number) => D3): D3 => union3(f(1), f(-1));

const CHICKEN = figure(
  [
    { d: ellipsoid3(0, 0, 0, 10.5, 13.5, 9.5), color: RUBBER },
    { d: ellipsoid3(0, -14, 0, 3.8, 4.5, 3.4), color: RUBBER },
    { d: both((s) => ellipsoid3(10.2 * s, -1, 0, 3, 8.5, 5.4)), color: RUBBER },
    { d: roundCone3(0, 10, 3, 4.6, 0, 17, 2.6, 3.6), color: RUBBER },
    { d: roundCone3(0, 17, 2.6, 3.6, 0, 21, 9, 3.3), color: RUBBER },
    { d: roundCone3(0, 21, 9, 3.3, 0, 22, 14, 3.1), color: RUBBER },
    { d: roundCone3(0, 22, 14, 3.1, 0, 23.5, 18.5, 4.3), color: RUBBER },
    { d: both((s) => roundCone3(4.4 * s, -10, 1.3, 1.9, 5 * s, -26, 0.9, 1.3)), color: ORANGE },
    { d: both((s) => ellipsoid3(5.5 * s, -29, 0.8, 3.4, 3.8, 1.5)), color: ORANGE },
    { d: roundCone3(0, 25.5, 19, 1.9, 0, 30.5, 14.4, 0.8), color: ORANGE },
    { d: roundCone3(0, 25, 15.6, 1.5, 0, 28, 10.2, 0.7), color: ORANGE },
    { d: sphere3(0, 22.5, 22.5, 2.3), color: RED },
    { d: sphere3(0, 24.6, 22.8, 2.3), color: RED },
    { d: sphere3(0, 26.4, 21.6, 1.9), color: RED },
    { d: ellipsoid3(0, 26.4, 14.2, 1.3, 1.5, 3.4), color: RED },
    { d: both((s) => sphere3(3.7 * s, 25, 20, 1.2)), color: INK },
  ],
  0.9,
);

export const rubberChicken = (): FieldTrinketInput => ({
  mm: CHICKEN.mm,
  colorAt: CHICKEN.colorAt,
  box: { min: [-15, -35, -0.5], max: [15, 34, 27] },
  bodyCell: 0.6,
  palette: [RUBBER, ORANGE, RED, INK],
});
