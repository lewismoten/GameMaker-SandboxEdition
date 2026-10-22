// THE CHEZ: a 1976-and-a-half Sebring-Vanguard CitiCar, a tomato-red wedge with a flat hood,
// a huge nearly upright windshield, a grey roof, round headlights in pods, a black bumper bar,
// a thin pinstripe, little whitewall tires, and its J1772 charge port on the rear passenger side.
// Built in a 2x2 block area from its top-left cell (cx, cy), nose to the east.
import { MAT } from '../render/look';
import { Box, Sdf, Sphere, hull, rgb, sd, type Material, type Shape, type V } from '../render/tracer';

export function citicar(cx: number, cy: number, s = 1, at?: V): Shape[] {
  // the car's own frame: x along its length (0 rear .. 1.8 nose), y across (0 driver side,
  // 0.75 passenger side), z up; placed with its rear-left corner at o
  const o: V = at ?? [cx + 0.1, cy + 0.95, 0];
  const P = (x: number, y: number, z: number): V => [o[0] + x * s, o[1] + y * s, o[2] + z * s];
  const red = rgb(226, 52, 36);
  const W = 0.75;
  const body: Material = {
    color: (p) => {
      const x = (p[0] - o[0]) / s;
      const y = (p[1] - o[1]) / s;
      const z = (p[2] - o[2]) / s;
      // the J1772 port: rear quarter, passenger side
      if (y > W - 0.01 && Math.abs(x - 0.26) < 0.07 && Math.abs(z - 0.5) < 0.07) return Math.hypot(x - 0.26, z - 0.5) < 0.045 ? rgb(60, 255, 120) : rgb(20, 20, 24);
      if (z > 0.93) return rgb(150, 150, 155); // the grey roof
      if (z > 0.6 && x > 0.12 && x < 1.08 && (y < 0.02 || y > W - 0.02)) return rgb(40, 52, 70); // side windows
      if (Math.abs(z - 0.42) < 0.012) return rgb(250, 240, 230); // pinstripe
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
  // the cabin: upright rear, flat roof, the big windshield leaning back
  shapes.push(
    hull(
      [P(0, 0, 0.14), P(0.03, 0, 0.98), P(1.0, 0, 1.0), P(1.12, 0, 0.56), P(1.12, 0, 0.14), P(0, W, 0.14), P(0.03, W, 0.98), P(1.0, W, 1.0), P(1.12, W, 0.56), P(1.12, W, 0.14)],
      () => body,
    ),
  );
  // the windshield, set into the cabin's front face
  shapes.push(hull([P(1.0, 0.07, 0.95), P(1.1, 0.07, 0.6), P(1.0, W - 0.07, 0.95), P(1.1, W - 0.07, 0.6), P(1.13, 0.07, 0.6), P(1.03, 0.07, 0.95), P(1.13, W - 0.07, 0.6), P(1.03, W - 0.07, 0.95)], glass));
  // the wedge hood
  shapes.push(hull([P(1.08, 0, 0.14), P(1.08, 0, 0.56), P(1.76, 0, 0.36), P(1.8, 0, 0.14), P(1.08, W, 0.14), P(1.08, W, 0.56), P(1.76, W, 0.36), P(1.8, W, 0.14)], () => body));
  // bumper bars, front and rear
  shapes.push(new Box(P(1.76, -0.03, 0.12), P(1.86, W + 0.03, 0.22), { color: rgb(20, 20, 22), diffuse: 0.7, spec: 0.8, shine: 40 }));
  shapes.push(new Box(P(-0.06, -0.03, 0.12), P(0.02, W + 0.03, 0.22), { color: rgb(20, 20, 22), diffuse: 0.7, spec: 0.8, shine: 40 }));
  // headlights in raised pods, amber corner lights
  for (const y of [0.16, W - 0.16]) {
    shapes.push(new Sphere(P(1.66, y, 0.42), 0.085 * s, body));
    shapes.push(new Sphere(P(1.72, y, 0.43), 0.06 * s, { color: rgb(255, 250, 220), emit: rgb(200, 190, 150), diffuse: 0.4, spec: 1.5, shine: 100 }));
    shapes.push(new Sphere(P(1.79, y < 0.3 ? 0.04 : W - 0.04, 0.3), 0.03 * s, { color: rgb(255, 160, 30), emit: rgb(150, 80, 0) }));
  }
  // small whitewall tires
  const tire: Material = {
    color: (p) => {
      const lx = (p[0] - o[0]) / s;
      const lz = (p[2] - o[2]) / s;
      const wx = lx < 0.9 ? 0.32 : 1.48;
      const r = Math.hypot(lx - wx, lz - 0.14);
      return r > 0.06 && r < 0.095 ? rgb(240, 240, 235) : rgb(18, 18, 20);
    },
    diffuse: 0.9,
    spec: 0.4,
    shine: 20,
  };
  for (const x of [0.32, 1.48])
    for (const y of [-0.02, W + 0.02]) {
      const c = P(x, y, 0.14);
      shapes.push(new Sdf([sub3(c, 0.16 * s), add3(c, 0.16 * s)], (px, py, pz) => sd.cylinder(px - c[0], pz - c[2], py - c[1], 0.14 * s, 0.05 * s, 0.015 * s), [tire]));
    }
  void MAT;
  return shapes;
}

const sub3 = (c: V, r: number): V => [c[0] - r, c[1] - r, c[2] - r];
const add3 = (c: V, r: number): V => [c[0] + r, c[1] + r, c[2] + r];
