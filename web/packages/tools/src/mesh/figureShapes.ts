// Solids for 3D-print figures (a robot dog, a rat, a rubber chicken), as distance fields in millimeters: ellipsoids,
// capsules and cones between points, a smooth union that melts parts together, and a cut that flattens the foot onto the bed.
import type { Rgb } from './colorBodies';
import type { D3 } from './sdfShapes';

/** An ellipsoid centered at (cx, cy, cz) with radii rx, ry, rz (a close estimate of the distance, good for meshing). */
export const ellipsoid3 =
  (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): D3 =>
  (x, y, z) => {
    const px = (x - cx) / rx;
    const py = (y - cy) / ry;
    const pz = (z - cz) / rz;
    const k0 = Math.hypot(px, py, pz);
    const k1 = Math.hypot(px / rx, py / ry, pz / rz);
    return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
  };

/** A rounded cone (a capsule that is r0 wide at a and r1 wide at b). */
export const roundCone3 = (ax: number, ay: number, az: number, r0: number, bx: number, by: number, bz: number, r1: number): D3 => {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const l2 = dx * dx + dy * dy + dz * dz || 1;
  return (x, y, z) => {
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / l2));
    return Math.hypot(x - ax - t * dx, y - ay - t * dy, z - az - t * dz) - (r0 + (r1 - r0) * t);
  };
};

/** The smooth union of fields: parts melt together over about `k` mm. */
export const smoothUnion3 =
  (k: number, ...fs: D3[]): D3 =>
  (x, y, z) => {
    let d = fs[0](x, y, z);
    for (let i = 1; i < fs.length; i++) {
      const e = fs[i](x, y, z);
      const h = Math.max(k - Math.abs(d - e), 0) / k;
      d = Math.min(d, e) - h * h * k * 0.25;
    }
    return d;
  };

/** A field turned about the z axis by `a` radians and moved by (dx, dy, dz). */
export const place3 =
  (f: D3, a: number, dx = 0, dy = 0, dz = 0): D3 =>
  (x, y, z) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return f((x - dx) * c + (y - dy) * s, -(x - dx) * s + (y - dy) * c, z - dz);
  };

/** A field made bigger (or smaller) by `k`, about the origin. */
export const scale3 =
  (f: D3, k: number): D3 =>
  (x, y, z) =>
    f(x / k, y / k, z / k) * k;

export interface FigurePart {
  d: D3;
  color: Rgb;
}

/**
 * A figure of colored parts: the parts melt together over `blend` mm, the floor is flattened onto z = 0, and a surface point
 * takes the color of the part whose own surface it is nearest to (so a comb or an eye keeps its color where it meets the head).
 */
export function figure(parts: FigurePart[], blend = 1.2): { mm: D3; colorAt: (x: number, y: number, z: number) => Rgb } {
  const body = smoothUnion3(blend, ...parts.map((p) => p.d));
  return {
    mm: (x, y, z) => Math.max(body(x, y, z), -z),
    colorAt: (x, y, z) => {
      let best = parts[0];
      let bd = Infinity;
      for (const p of parts) {
        const d = Math.abs(p.d(x, y, z));
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      return best.color;
    },
  };
}
