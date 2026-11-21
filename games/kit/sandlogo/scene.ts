// Static sandbox, castle and pail geometry for the Sandbox logo scene.
import { add, Box, Capsule, Cone, grain, Group, Material, placed, Ring, rotY, scale, Shape, Sphere, V } from '@lewismoten/gamemaker-sandbox-tools/kit/raytrace';
import { surface, plain, sand, wood, plastic, RED, YELLOW } from './materials';

/** Damp, packed castle sand, banded where the pail molded it, with a dark doorway. */
const castleSand: Material = (h) => {
  const [x, y, z] = h.p;
  const g = grain(x, y, z, 60) * 0.12;
  const band = 0.04 * Math.sin(y * 70);
  let c = scale([0.86, 0.66, 0.4], 0.88 + g + band);
  // the doorway and two windows on the keep's front
  const lx = x - CASTLE[0];
  const ly = y - CASTLE[1];
  if (h.n[2] < -0.9 && h.shape === keep) {
    const arch = Math.abs(lx) < 0.11 && (ly < 0.2 || Math.hypot(lx, ly - 0.2) < 0.11);
    const window = Math.abs(Math.abs(lx) - 0.3) < 0.04 && Math.abs(ly - 0.34) < 0.06;
    if (arch || window) c = [0.16, 0.1, 0.06];
  }
  return surface(c);
};

export const SAND_Y = 0.3;
const boards: Shape[] = [];
const ground: Shape[] = [];
const castle: Shape[] = [];
const pail: Shape[] = [];
// the frame: four boards, their ends overlapping at the corners, and corner seats
boards.push(new Box([-2.24, 0, -1.84], [2.24, 0.44, -1.6], placed(), wood(0)));
boards.push(new Box([-2.24, 0, 1.6], [2.24, 0.44, 1.84], placed(), wood(0)));
boards.push(new Box([-2.24, 0, -1.6], [-2.0, 0.44, 1.6], placed(), wood(2)));
boards.push(new Box([2.0, 0, -1.6], [2.24, 0.44, 1.6], placed(), wood(2)));
for (const [x, z] of [
  [-2.24, -1.84],
  [2.24, -1.84],
  [-2.24, 1.84],
  [2.24, 1.84],
] as [number, number][]) {
  const sx = Math.sign(x);
  const sz = Math.sign(z);
  const xs = [x, x - sx * 0.5].sort((a, b) => a - b);
  const zs = [z, z - sz * 0.5].sort((a, b) => a - b);
  boards.push(new Box([xs[0], 0.44, zs[0]], [xs[1], 0.5, zs[1]], placed(), wood(0)));
}
ground.push(new Box([-2.0, 0, -1.6], [2.0, SAND_Y, 1.6], placed(), sand));
// the mound the shovel pats
export const MOUND: V = [-0.75, SAND_Y - 0.3, -0.75];
ground.push(new Sphere(0.42, placed(MOUND), sand));

// the sand castle: a keep, four pail-molded corner towers, a tall middle tower, battlements
const CASTLE: V = [0.55, SAND_Y, 0.45];
const at = (x: number, y: number, z: number): V => [CASTLE[0] + x, CASTLE[1] + y, CASTLE[2] + z];
const keep = new Box([-0.5, 0, -0.38], [0.5, 0.52, 0.38], placed(CASTLE), castleSand);
castle.push(keep);
const merlons = (cx: number, cy: number, cz: number, r: number, n: number, rot0: number) => {
  const ring: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot0 + (i * Math.PI * 2) / n;
    ring.push(new Box([-0.05, 0, -0.05], [0.05, 0.1, 0.05], placed(at(cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r), rotY(-a)), castleSand));
  }
  castle.push(new Group(ring));
};
for (const [x, z] of [
  [-0.5, -0.38],
  [0.5, -0.38],
  [-0.5, 0.38],
  [0.5, 0.38],
] as [number, number][]) {
  castle.push(new Cone(0.23, 0.19, 0, 0.82, placed(at(x, 0, z)), castleSand));
  merlons(x, 0.82, z, 0.14, 4, Math.PI / 4);
}
for (const x of [-0.2, 0.2]) {
  castle.push(new Box([-0.05, 0, -0.05], [0.05, 0.1, 0.05], placed(at(x, 0.52, -0.33)), castleSand));
  castle.push(new Box([-0.05, 0, -0.05], [0.05, 0.1, 0.05], placed(at(x, 0.52, 0.33)), castleSand));
}
castle.push(new Cone(0.27, 0.23, 0.52, 1.22, placed(at(0, 0, 0)), castleSand));
merlons(0, 1.22, 0, 0.16, 6, 0);
export const POLE_TOP = at(0, 1.72, 0);
castle.push(new Cone(0.016, 0.016, 1.22, 1.74, placed(at(0, 0, 0)), plain([0.95, 0.95, 0.92], { ks: 0.4, shine: 30 })));
castle.push(new Sphere(0.03, placed(add(POLE_TOP, [0, 0.03, 0])), plastic(YELLOW)));

// the red pail, full of sand, its yellow handle flopped toward us
const PAIL: V = [-1.2, SAND_Y, 0.35];
const pailAt = (x: number, y: number, z: number): V => [PAIL[0] + x, PAIL[1] + y, PAIL[2] + z];
const pailRed: Material = (h) => {
  const y = h.p[1] - PAIL[1];
  // a yellow star decal on the front
  const lx = h.p[0] - PAIL[0];
  const a = Math.atan2(lx, -(h.p[2] - PAIL[2]));
  const sy = y - 0.33;
  const sa = Math.atan2(sy, a * 0.36);
  const sr = Math.hypot(a * 0.36, sy);
  const star = 0.09 * (0.55 + 0.45 * Math.cos(5 * (sa - Math.PI / 2)));
  const color = h.n[1] < 0.5 && Math.abs(a) < 1.2 && sr < star ? YELLOW : RED;
  return surface(color, { kd: 0.85, ks: 0.75, shine: 36, mirror: 0.1 });
};
pail.push(new Cone(0.3, 0.4, 0, 0.7, placed(PAIL), pailRed, { bottom: false, top: false }));
pail.push(new Cone(0.425, 0.425, 0.62, 0.72, placed(PAIL), plastic(RED), { bottom: false, top: false }));
pail.push(new Ring(0.39, 0.425, placed(pailAt(0, 0.72, 0)), plastic(RED)));
pail.push(new Ring(0, 0.392, placed(pailAt(0, 0.64, 0)), sand));
pail.push(new Sphere(0.27, placed(pailAt(0, 0.48, 0)), sand)); // heaped a little
{
  const tilt = 1.15; // toward the camera
  const pts: V[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = (Math.PI * i) / 10;
    const rise = Math.sin(a) * 0.43;
    pts.push(pailAt(Math.cos(a) * 0.435, 0.6 + rise * Math.cos(tilt), -rise * Math.sin(tilt)));
  }
  const handle: Shape[] = [];
  for (let i = 1; i < pts.length; i++) handle.push(new Capsule(pts[i - 1], pts[i], 0.02, placed(), plastic(YELLOW)));
  for (const s of [-1, 1]) handle.push(new Sphere(0.04, placed(pailAt(s * 0.43, 0.6, 0)), plastic(YELLOW)));
  pail.push(new Group(handle));
}
export const statics: Shape[] = [new Group(boards), ...ground, new Group(castle), new Group(pail)];
