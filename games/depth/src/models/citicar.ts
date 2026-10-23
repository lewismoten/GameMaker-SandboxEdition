// THE CHEZ: a 1976-and-a-half Sebring-Vanguard CitiCar, built from the shared side view of it
// (games/kit/chez.ts, measured off Lewis's photos): a short tomato-red wedge, one straight line
// from the low nose over the hood and the windshield to a short flat BLACK roof, a flat back
// leaning back a little, the front and rear quarters stopping flat over the tires and only the
// door coming down between them. One window in each door, a rear window in the back, the racing
// stripes (a dark pair edged in white pinstripe) low along each side and stepping up over the
// rear quarter, round headlights in pods on the hood, amber markers up front and red ones at
// the back, plain square black bumpers, white wheels with chrome caps on black tires, THE CHEZ
// on its yellow plate, and its J1772 charge port on the rear passenger side.
// Built in a 2x2 block area from its top-left cell (cx, cy), nose to the east.
import { Box, Sdf, Sphere, hull, rgb, sd, type Material, type Shape, type V } from '../render/tracer';
import { CHEZ_BODY, CHEZ_WHEELS, CHEZ_AXLE } from '../../../kit/chez';

/** Side-view units (kit/chez.ts: x along the car, y down, the ground at 20) to the car's frame. */
const K = 1.8 / 30.8;
const RX = 5.2; // the rear, at x = 0
const U = (u: number) => (u - RX) * K;
const Z = (v: number) => (20 - v) * K;

/** The side window, the stripes and the seams, in the car's frame (x along, z up). */
const WIN: [number, number][] = [
  [U(12.5), Z(2.8)],
  [U(18.5), Z(2.8)],
  [U(24.5), Z(8.3)],
  [U(13.0), Z(8.3)],
];
const ROOF = Z(2.05);
const BAND = Z(12.5);
const RISE = 2.6 * K;
const KINK: [number, number] = [U(10.0), U(13.0)];
const BAND_END = U(6.9);
const STRIPE = 0.25 * K;
const GAP = 0.5 * K;
const PIN = 0.12 * K;

function inPoly(poly: [number, number][], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Where the stripes' band runs at x: along the front, then up over the rear quarter. */
function band(x: number): number {
  const [a, b] = KINK;
  if (x >= b) return BAND;
  if (x <= a) return BAND + RISE;
  const t = (b - x) / (b - a);
  return BAND + RISE * t * t * (3 - 2 * t);
}

export function citicar(cx: number, cy: number, s = 1, at?: V): Shape[] {
  // the car's own frame: x along its length (0 rear .. 1.8 nose), y across (0 driver side,
  // W passenger side), z up; placed with its rear-left corner at o
  const W = 0.8;
  const o: V = at ?? [cx + 0.1, cy + 0.95, 0];
  const P = (x: number, y: number, z: number): V => [o[0] + x * s, o[1] + y * s, o[2] + z * s];
  const red = rgb(226, 52, 36);
  const dark = rgb(40, 52, 70);
  const body: Material = {
    color: (p, n) => {
      const x = (p[0] - o[0]) / s;
      const y = (p[1] - o[1]) / s;
      const z = (p[2] - o[2]) / s;
      if (z > ROOF && n[2] > -0.5) return rgb(16, 16, 18); // the black roof panel
      const side = Math.abs(n[1]) > 0.9;
      if (side) {
        // the J1772 port: rear quarter, passenger side
        if (y > W / 2 && Math.abs(x - U(7.2)) < 0.05 && Math.abs(z - Z(5.6)) < 0.05) return Math.hypot(x - U(7.2), z - Z(5.6)) < 0.03 ? rgb(60, 255, 120) : rgb(20, 20, 24);
        // the door's window (no quarter window behind it), its seams and its chrome handle
        if (inPoly(WIN, x, z)) return dark;
        const rearSeam = U(12.1) + ((U(13.7) - U(12.1)) * (Z(2.2) - z)) / (Z(2.2) - Z(18.1));
        if (Math.abs(x - rearSeam) < 0.008 || (Math.abs(x - U(26.1)) < 0.008 && z < Z(8.3))) return rgb(120, 22, 14);
        if (x > U(14.5) && x < U(16) && Math.abs(z - Z(10.9)) < 0.02) return rgb(220, 224, 230);
        // the markers: amber up front, red at the back
        if (Math.abs(x - U(31)) < 0.035 && Math.abs(z - Z(11.3)) < 0.025) return rgb(255, 160, 30);
        if (Math.abs(x - U(7.7)) < 0.035 && Math.abs(z - Z(12.8)) < 0.025) return rgb(230, 20, 20);
        // the racing stripes: a dark pair, the red between, a white pinstripe round the band
        if (x > BAND_END) {
          const d = Math.abs(z - band(x));
          if (d >= GAP - STRIPE && d < GAP + STRIPE) return rgb(36, 36, 40);
          if (d >= GAP + STRIPE && d < GAP + STRIPE + PIN) return rgb(245, 240, 230);
        } else if (x > BAND_END - PIN && Math.abs(z - band(x)) < GAP + STRIPE + PIN) return rgb(245, 240, 230);
      }
      // the back: its window, the red lamps and the yellow plate
      if (n[0] < -0.9) {
        if (y > 0.1 && y < W - 0.1 && z > Z(8) && z < Z(3)) return dark;
        if ((y < 0.12 || y > W - 0.12) && Math.abs(z - Z(12)) < 0.04) return rgb(230, 20, 20);
        if (Math.abs(y - W / 2) < 0.12 && Math.abs(z - Z(12.3)) < 0.045) return rgb(250, 210, 40);
      }
      return red;
    },
    diffuse: 0.85,
    spec: 1.3,
    shine: 90,
    reflect: 0.12,
    fresnel: 0.4,
  };
  const glass: Material = { color: rgb(50, 70, 90), diffuse: 0.2, reflect: 0.55, fresnel: 0.3, spec: 1.5, shine: 140 };
  const shapes: Shape[] = [];
  // the body above the tires: the profile of the side view, the width of the car
  const top = CHEZ_BODY.filter(([, v]) => v <= 14.4).map(([u, v]) => [U(u), Z(v)] as [number, number]);
  shapes.push(hull([...top.map(([x, z]) => P(x, 0, z)), ...top.map(([x, z]) => P(x, W, z))], () => body));
  // the door's lower half, down between the wheels to the sill
  shapes.push(new Box(P(U(13.7), 0, Z(18.1)), P(U(26.1), W, Z(14.4) + 0.01), body));
  // the windshield, set in the top of the slope (it runs into the hood in one straight line)
  const [rx, rz] = [U(17.9), Z(1.3)];
  const [ex, ez] = [U(27.4), Z(7.6)];
  const nx = 0.549 * 0.012;
  const nz = 0.836 * 0.012;
  const g: V[] = [];
  for (const y of [0.06, W - 0.06])
    for (const [x, z] of [
      [rx + 0.02, rz - 0.02],
      [ex, ez],
    ])
      g.push(P(x, y, z), P(x + nx, y, z + nz));
  shapes.push(hull(g, glass));
  // plain square black bumpers, front and rear
  const bumper: Material = { color: rgb(20, 20, 22), diffuse: 0.7, spec: 0.8, shine: 40 };
  shapes.push(new Box(P(U(35.8), -0.02, Z(14.8)), P(U(37.2), W + 0.02, Z(13.0)), bumper));
  shapes.push(new Box(P(U(3.9), -0.02, Z(14.6)), P(U(5.4), W + 0.02, Z(12.8)), bumper));
  // headlights in raised pods on the hood, amber lamps on the nose's corners
  const hood = (x: number) => Z(1.3) - (x - U(17.9)) * (11.9 / 18.1);
  for (const y of [0.17, W - 0.17]) {
    const hx = U(31.4);
    shapes.push(new Sphere(P(hx, y, hood(hx) + 0.02), 0.08 * s, body));
    shapes.push(new Sphere(P(hx + 0.05, y, hood(hx) + 0.025), 0.055 * s, { color: rgb(255, 250, 220), emit: rgb(200, 190, 150), diffuse: 0.4, spec: 1.5, shine: 100 }));
    shapes.push(new Sphere(P(U(35.9), y < W / 2 ? 0.06 : W - 0.06, Z(13.6)), 0.03 * s, { color: rgb(255, 160, 30), emit: rgb(150, 80, 0) }));
  }
  // white steel wheels with chrome caps on black tires, tucked up behind the quarters
  const R = 3.25 * K;
  const [rearX, frontX] = CHEZ_WHEELS.map(U);
  const az = Z(CHEZ_AXLE);
  const tire: Material = {
    color: (p) => {
      const lx = (p[0] - o[0]) / s;
      const lz = (p[2] - o[2]) / s;
      const r = Math.hypot(lx - (lx < 0.9 ? rearX : frontX), lz - az);
      return r < 0.055 ? rgb(200, 204, 210) : r < 0.125 ? rgb(240, 238, 228) : rgb(18, 18, 20);
    },
    diffuse: 0.9,
    spec: 0.4,
    shine: 20,
  };
  for (const x of [rearX, frontX])
    for (const y of [-0.02, W + 0.02]) {
      const c = P(x, y, az);
      shapes.push(new Sdf([sub3(c, (R + 0.02) * s), add3(c, (R + 0.02) * s)], (px, py, pz) => sd.cylinder(px - c[0], pz - c[2], py - c[1], R * s, 0.05 * s, 0.015 * s), [tire]));
    }
  return shapes;
}

const sub3 = (c: V, r: number): V => [c[0] - r, c[1] - r, c[2] - r];
const add3 = (c: V, r: number): V => [c[0] + r, c[1] + r, c[2] + r];
