// A slice of New York cheesecake on a porcelain plate, as the game draws it on the top shelf: a graham crust, a tall layer of
// cream cheese, a berry glaze and a berry on top, with the wedge's corners rounded. The plate has a raised rim. Everything
// stands straight up from the plate or the bed, so it prints without supports.
import { circle2, extrude, polygon2, union3, type D2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { figure, ellipsoid3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const PORCELAIN: Rgb = [238, 240, 236];
const CRUST: Rgb = [150, 92, 44];
const CREAM: Rgb = [255, 238, 168];
const BERRY: Rgb = [196, 34, 78];

// the wedge: 36 mm long, 52 degrees across, its corners rounded by 2.4 mm (a polygon pulled in by that much, then pushed out)
const ROUND = 2.4;
const HALF = (26 * Math.PI) / 180;
const wedge = ((): D2 => {
  const tip = ROUND / Math.sin(HALF);
  const R = 36 - ROUND;
  // where the pulled-in side meets the arc: |tip + t (cos, sin)| = R
  const b = tip * Math.cos(HALF);
  const t = -b + Math.sqrt(b * b - tip * tip + R * R);
  const end = Math.atan2(t * Math.sin(HALF), tip + t * Math.cos(HALF));
  const pts: [number, number][] = [[tip, 0]];
  for (let i = 0; i <= 12; i++) {
    const a = -end + (2 * end * i) / 12;
    pts.push([R * Math.cos(a), R * Math.sin(a)]);
  }
  const inner = polygon2(pts);
  return (x, y) => inner(x, y) - ROUND;
})();
// laid on the plate with its point toward the middle
const slice = (x: number, y: number) => wedge(x + 21, y);
const PLATE_H = 4;
const base = extrude(circle2(29), 0, PLATE_H);
const lip = extrude((x, y) => Math.max(Math.hypot(x, y) - 29, 25.9 - Math.hypot(x, y)), 0, PLATE_H + 1.2);
const plate = union3(base, lip);
const crust = extrude(slice, PLATE_H - 3, PLATE_H + 3.4);
const filling = extrude(slice, PLATE_H + 3.2, PLATE_H + 12.6);
const glaze = extrude(slice, PLATE_H + 12.4, PLATE_H + 14.4);
// a core inside the layers, so they hold together when eroded (its own surface is never the nearest, so it takes no color)
const core = extrude((x, y) => slice(x, y) + 1.6, PLATE_H - 2, PLATE_H + 13.6);
const berry = ellipsoid3(3, 0, PLATE_H + 14.4, 3.1, 3.1, 2.6);

const CAKE = figure(
  [
    { d: plate, color: PORCELAIN },
    { d: crust, color: CRUST },
    { d: filling, color: CREAM },
    { d: glaze, color: BERRY },
    { d: core, color: CREAM },
    { d: berry, color: BERRY },
  ],
  0.3,
);

export const cheesecakeSlice = (): FieldTrinketInput => ({
  mm: CAKE.mm,
  colorAt: CAKE.colorAt,
  box: { min: [-31, -31, -0.5], max: [31, 31, 23] },
  bodyCell: 0.6,
  palette: [PORCELAIN, CRUST, CREAM, BERRY],
});
