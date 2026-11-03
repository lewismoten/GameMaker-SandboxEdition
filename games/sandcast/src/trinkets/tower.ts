// The tower mold: a tapered round pail, open at the top, whose floor holds six merlon pockets. Pack it with damp sand,
// turn it over and lift: a round tower with a ring of battlements. The walls flare outward going up (the cavity more than the
// outside), so the sand slides out, and the pail stands on its flat bottom with its open side up: no supports.
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';
import type { D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';

const RED: Rgb = [214, 40, 32];
const YELLOW: Rgb = [244, 200, 24];
const SAND: Rgb = [222, 182, 112];
const DAMP: Rgb = [150, 104, 52];

const H = 28;
const FLOOR = 6.5;
const POCKET = 4;
const outerR = (z: number) => 16 + (3.2 * z) / H;
const innerR = (z: number) => 11.6 + (3.7 * (z - FLOOR)) / (H - FLOOR);
const SECTOR = Math.PI / 6;

const outer: D3 = (x, y, z) => Math.max(Math.hypot(x, y) - outerR(z), z - H, -z);
const cavity: D3 = (x, y, z) => Math.max(Math.hypot(x, y) - innerR(Math.max(z, FLOOR)), FLOOR - z);
// six merlon pockets sunk in the floor, each a 30 degree wedge (a merlon) with a gap of 30 degrees between (a crenel)
const pockets: D3 = (x, y, z) => {
  const r = Math.hypot(x, y);
  const a = (Math.atan2(y, x) + 2 * Math.PI) % (2 * SECTOR);
  const arc = (Math.abs(a - SECTOR / 2) - SECTOR / 2) * r;
  return Math.max(arc, 7.4 - r, r - 11.6, FLOOR - POCKET - z, z - FLOOR - 0.3);
};
const mold: D3 = (x, y, z) => Math.max(outer(x, y, z), -Math.min(cavity(x, y, z), pockets(x, y, z)));

export const towerPail = (): FieldTrinketInput => ({
  mm: mold,
  colorAt: (x, y, z) => {
    // the merlon pockets (the battlements-to-be) show in damp sand, the rest of the cavity in dry
    if (pockets(x, y, z) < 0.45 && z > 1 && z < FLOOR + 0.1) return DAMP;
    if (cavity(x, y, z) < 0.45 && z > 1) return SAND;
    return z > H - 4.5 ? YELLOW : RED;
  },
  box: { min: [-21, -21, -0.5], max: [21, 21, H + 1] },
  bodyCell: 0.6,
  palette: [RED, YELLOW, SAND, DAMP],
});
