// The wall mold: a tapered rectangular pail, open at the top, whose floor holds four merlon pockets across its length. Pack it
// with damp sand, turn it over and lift: a section of castle wall with four battlements. The cavity flares going up, so the
// sand slides out, and the pail stands on its flat bottom with its open side up: no supports.
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';
import type { D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';

const BLUE: Rgb = [44, 120, 200];
const YELLOW: Rgb = [244, 200, 24];
const SAND: Rgb = [222, 182, 112];
const DAMP: Rgb = [150, 104, 52];

const H = 26;
const FLOOR = 6.5;
const POCKET = 4;
const lerp = (a: number, b: number, z: number, z0: number) => a + ((b - a) * (z - z0)) / (H - z0);
const rrect = (x: number, y: number, hx: number, hy: number, r: number) => {
  const qx = Math.abs(x) - hx + r;
  const qy = Math.abs(y) - hy + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};

const outer: D3 = (x, y, z) => Math.max(rrect(x, y, lerp(21, 23, z, 0), lerp(10.4, 12.4, z, 0), 3), z - H, -z);
// the cavity: 26 x 9 mm at the floor, 33 x 13.4 at the rim
const cavity: D3 = (x, y, z) => Math.max(rrect(x, y, lerp(13, 16.5, Math.max(z, FLOOR), FLOOR), lerp(4.6, 6.7, Math.max(z, FLOOR), FLOOR), 1.2), FLOOR - z);
// four merlons 4.5 mm long with 2.7 mm gaps (crenels), the whole width of the wall
const pockets: D3 = (x, y, z) => {
  const k = Math.max(0, Math.min(3, Math.round((x + 10.75) / 7.1667)));
  const across = Math.abs(x - (-10.75 + 7.1667 * k)) - 2.25;
  return Math.max(across, Math.abs(y) - 4.6, FLOOR - POCKET - z, z - FLOOR - 0.3);
};
const mold: D3 = (x, y, z) => Math.max(outer(x, y, z), -Math.min(cavity(x, y, z), pockets(x, y, z)));

export const wallPail = (): FieldTrinketInput => ({
  mm: mold,
  colorAt: (x, y, z) => {
    // the merlon pockets (the battlements-to-be) show in damp sand, the rest of the cavity in dry
    if (pockets(x, y, z) < 0.45 && z > 1 && z < FLOOR + 0.1) return DAMP;
    if (cavity(x, y, z) < 0.45 && z > 1) return SAND;
    return z > H - 4.5 ? YELLOW : BLUE;
  },
  box: { min: [-25, -14, -0.5], max: [25, 14, H + 1] },
  bodyCell: 0.6,
  palette: [BLUE, YELLOW, SAND, DAMP],
});
