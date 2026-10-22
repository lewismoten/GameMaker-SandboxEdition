// Ray: the chrome sphere from every ray-tracing demo, with two neon bands round him that roll
// as he rolls: amber while the near plane is in focus, cyan in the far one.
import { MAT } from '../render/look';
import { Sdf, Sphere, rgb, sd, type Material, type Shape, type V } from '../render/tracer';

export const RAY_R = 0.41;
export const RAY_AT: V = [0.5, 0.6, RAY_R + 0.02];

/** Rotates (x, y, z) about the x or y axis by `a`. */
function spin(axis: 'x' | 'y', a: number, x: number, y: number, z: number): V {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return axis === 'y' ? [c * x + s * z, y, -s * x + c * z] : [x, c * y - s * z, s * y + c * z];
}

/** Ray rolling about `axis` (x: up/down the screen, y: left/right), turned `angle` radians. */
export function rayModel(axis: 'x' | 'y', angle: number, band: V, at: V = RAY_AT, r = RAY_R): Shape[] {
  const neon: Material = { color: band, diffuse: 0.5, spec: 1, shine: 60, emit: [band[0] * 0.55, band[1] * 0.55, band[2] * 0.55] };
  const chrome: Material = { ...MAT.chrome, color: rgb(225, 230, 240) };
  // the bands: two great circles through the rolling axis, at right angles
  const bandsAt = (x: number, y: number, z: number) => {
    const [lx, ly, lz] = spin(axis, angle, x - at[0], y - at[1], z - at[2]);
    // both circles contain the rolling axis: for axis y, the planes x = 0 and z = 0
    const [u, v] = axis === 'y' ? [lx, lz] : [ly, lz];
    const w = axis === 'y' ? ly : lx;
    const ring1 = Math.hypot(Math.hypot(w, v) - r, u) - 0.036;
    const ring2 = Math.hypot(Math.hypot(w, u) - r, v) - 0.036;
    return Math.min(ring1, ring2);
  };
  return [
    new Sdf(
      [
        [at[0] - r - 0.06, at[1] - r - 0.06, at[2] - r - 0.06],
        [at[0] + r + 0.06, at[1] + r + 0.06, at[2] + r + 0.06],
      ],
      (x, y, z) => Math.min(sd.sphere(x - at[0], y - at[1], z - at[2], r), bandsAt(x, y, z)),
      [chrome, neon],
      (x, y, z) => (bandsAt(x, y, z) < sd.sphere(x - at[0], y - at[1], z - at[2], r) + 0.002 ? 1 : 0),
    ),
  ];
}

/** Dying: the render falls apart, last pass first. */
export function rayDeath(stage: number): Shape[] {
  const at = RAY_AT;
  const r = RAY_R;
  if (stage === 0) return [new Sphere(at, r, { color: rgb(170, 170, 180), diffuse: 1, spec: 0.3, shine: 20 })]; // no reflections
  if (stage === 1) return [new Sphere(at, r, { color: rgb(150, 150, 160), diffuse: 0, flat: true })]; // flat shaded
  const wire: Material = { color: rgb(80, 255, 120), emit: rgb(60, 220, 90), diffuse: 0.2 };
  if (stage === 2 || stage === 3) {
    // a wireframe: rings of latitude and longitude
    const shrink = stage === 3 ? 0.7 : 1;
    const rr = r * shrink;
    return [
      new Sdf(
        [
          [at[0] - rr - 0.05, at[1] - rr - 0.05, at[2] - rr - 0.05],
          [at[0] + rr + 0.05, at[1] + rr + 0.05, at[2] + rr + 0.05],
        ],
        (x, y, z) => {
          const px = x - at[0];
          const py = y - at[1];
          const pz = z - at[2];
          let d = Infinity;
          for (const lat of [-0.6, 0, 0.6]) d = Math.min(d, Math.hypot(Math.hypot(px, py) - rr * Math.cos(Math.asin(lat)), pz - rr * lat) - 0.025);
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 4;
            const u = px * Math.cos(a) + py * Math.sin(a);
            const v = -px * Math.sin(a) + py * Math.cos(a);
            d = Math.min(d, Math.hypot(Math.hypot(u, pz) - rr, v) - 0.025);
          }
          return d;
        },
        [wire],
      ),
    ];
  }
  // vertices only, scattering
  const out: Shape[] = [];
  const spread = stage === 4 ? 1 : 1.5;
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996;
    const zz = 1 - (2 * (i + 0.5)) / 14;
    const rad = Math.sqrt(1 - zz * zz);
    out.push(new Sphere([at[0] + Math.cos(a) * rad * r * spread, at[1] + Math.sin(a) * rad * r * spread, at[2] + zz * r * spread * 0.9], 0.04, wire));
  }
  return out;
}
