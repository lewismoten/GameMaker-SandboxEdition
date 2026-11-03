// The biggest cake in the Tri-County area, as the party screen draws it: three cream tiers with pink frosting that
// flares out at 45 degrees (so it needs no support) and drips down the sides, red cherries on each tier and seven candles on the
// top, each with a yellow flame. Each tier is wider than the one above, so it stands on its bottom and prints as it is.
import { figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { sphere3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const CREAM: Rgb = [250, 236, 196];
const PINK: Rgb = [240, 120, 160];
const RED: Rgb = [214, 36, 40];
const YELLOW: Rgb = [255, 214, 60];

// [radius, bottom, top] of each tier
const TIERS: [number, number, number][] = [
  [19, 0, 8],
  [13.5, 8, 15],
  [8.6, 15, 21],
];
const TOP = 21;

/** A tier: a cylinder whose top 3 mm is frosting, flared out by 0.9 mm along a 45 degree slope. */
const tier = ([r, z0, z1]: [number, number, number]): D3 => {
  const rad = (z: number) => r + Math.max(0, Math.min(0.9, z - (z1 - 3)));
  return (x, y, z) => Math.max(Math.hypot(x, y) - rad(z), z - z1, z0 - z);
};
const tiers = TIERS.map(tier);
const frosting: D3 = (x, y, z) => {
  let d = Infinity;
  for (const [r, , z1] of TIERS) d = Math.min(d, Math.max(Math.hypot(x, y) - r - 1, z - z1, z1 - 3.1 - z));
  return d;
};
const drips: D3[] = TIERS.flatMap(([r, , z1], t) =>
  Array.from({ length: 10 - t * 2 }, (_, i) => {
    const a = ((i + (t % 2) * 0.5) * 2 * Math.PI) / (10 - t * 2);
    const len = 3.4 + ((i * 7 + t * 3) % 4) * 0.9;
    return roundCone3((r + 0.1) * Math.cos(a), (r + 0.1) * Math.sin(a), z1 - 2.6, 1.7, (r + 0.1) * Math.cos(a), (r + 0.1) * Math.sin(a), z1 - 2.6 - len, 1.7);
  }),
);
const cherry = (r: number, a: number, z: number): D3 => sphere3(r * Math.cos(a), r * Math.sin(a), z + 1.5, 2.2);
const cherries: D3[] = [
  ...[0, 1, 2, 3, 4, 5].map((i) => cherry(14.9, 0.3 + (i * Math.PI) / 3, 8)),
  ...[0, 1, 2, 3].map((i) => cherry(10, 0.8 + (i * Math.PI) / 2, 15)),
];
const candles = Array.from({ length: 7 }, (_, i) => {
  // six round a ring and one in the middle
  const [x, y] = i === 0 ? [0, 0] : [5.5 * Math.cos(((i - 1) * Math.PI) / 3), 5.5 * Math.sin(((i - 1) * Math.PI) / 3)];
  return { x, y, color: i % 2 ? RED : PINK };
});

const CAKE = figure(
  [
    ...tiers.map((d) => ({ d, color: CREAM })),
    { d: frosting, color: PINK },
    ...drips.map((d) => ({ d, color: PINK })),
    ...cherries.map((d) => ({ d, color: RED })),
    ...candles.map(({ x, y, color }) => ({ d: roundCone3(x, y, TOP - 1, 1.5, x, y, TOP + 8, 1.5), color })),
    ...candles.map(({ x, y }) => ({ d: roundCone3(x, y, TOP + 8.5, 1.6, x, y, TOP + 12.2, 0.7), color: YELLOW })),
  ],
  0.4,
);

export const birthdayCake = (): FieldTrinketInput => ({
  mm: CAKE.mm,
  colorAt: CAKE.colorAt,
  box: { min: [-22, -22, -0.5], max: [22, 22, TOP + 14] },
  bodyCell: 0.4,
  palette: [CREAM, PINK, RED, YELLOW],
});
