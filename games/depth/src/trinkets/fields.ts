// A ray tracer shape seen as a signed distance field (negative inside) with a color at any point,
// so the game's own models can be meshed for 3D printing (mesh.ts). Handles every shape the models
// are built from: distance-field models, spheres, boxes, cylinders, convex solids and moved copies.
import { Box, Convex, Cylinder, Moved, Sdf, Sphere, resolveColor, type Material, type Shape, type V } from '../render/tracer';

export interface Field {
  /** Signed distance (or an estimate of it; only its zero matters to the mesher). */
  d: (x: number, y: number, z: number) => number;
  /** The material at a point on or near the surface. */
  mat: (x: number, y: number, z: number) => Material;
}

const white: Material = { color: [1, 0, 1] };

export function fieldOf(shape: Shape): Field {
  if (shape instanceof Sdf)
    return {
      d: shape.sdf,
      mat: (x, y, z) => shape.mats[shape.part(x, y, z)] ?? shape.mats[0],
    };
  if (shape instanceof Sphere) {
    const { c, r, mat } = shape;
    return { d: (x, y, z) => Math.hypot(x - c[0], y - c[1], z - c[2]) - r, mat: () => mat };
  }
  if (shape instanceof Box) {
    const { lo, hi, mat } = shape;
    return {
      d: (x, y, z) => {
        const qx = Math.abs(x - (lo[0] + hi[0]) / 2) - (hi[0] - lo[0]) / 2;
        const qy = Math.abs(y - (lo[1] + hi[1]) / 2) - (hi[1] - lo[1]) / 2;
        const qz = Math.abs(z - (lo[2] + hi[2]) / 2) - (hi[2] - lo[2]) / 2;
        return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
      },
      mat: () => mat,
    };
  }
  if (shape instanceof Cylinder) {
    const { cx, cy, r, z0, z1, mat, capMat } = shape;
    return {
      d: (x, y, z) => {
        const dr = Math.hypot(x - cx, y - cy) - r;
        const dz = Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2;
        return Math.hypot(Math.max(dr, 0), Math.max(dz, 0)) + Math.min(Math.max(dr, dz), 0);
      },
      mat: (_x, _y, z) => (Math.abs(z - (z0 + z1) / 2) > (z1 - z0) / 2 - 1e-3 ? capMat : mat),
    };
  }
  if (shape instanceof Convex) {
    const { planes, mat } = shape;
    const face = (x: number, y: number, z: number) => {
      let best = 0;
      let bd = -Infinity;
      planes.forEach((p, i) => {
        const v = p.n[0] * x + p.n[1] * y + p.n[2] * z - p.d;
        if (v > bd) {
          bd = v;
          best = i;
        }
      });
      return best;
    };
    return {
      d: (x, y, z) => {
        let m = -Infinity;
        for (const p of planes) m = Math.max(m, p.n[0] * x + p.n[1] * y + p.n[2] * z - p.d);
        return m;
      },
      mat: (x, y, z) => (typeof mat === 'function' ? mat(face(x, y, z)) : mat),
    };
  }
  if (shape instanceof Moved) {
    const inner = fieldOf(shape.inner);
    const { rot: r, at, scale: s } = shape;
    // the inverse of Moved.toWorld
    const to = (x: number, y: number, z: number): V => {
      const vx = (x - at[0]) / s;
      const vy = (y - at[1]) / s;
      const vz = (z - at[2]) / s;
      return [r[0] * vx + r[3] * vy + r[6] * vz, r[1] * vx + r[4] * vy + r[7] * vz, r[2] * vx + r[5] * vy + r[8] * vz];
    };
    return {
      d: (x, y, z) => inner.d(...to(x, y, z)) * s,
      mat: (x, y, z) => inner.mat(...to(x, y, z)),
    };
  }
  return { d: () => 1, mat: () => white };
}

/**
 * The union of fields: the nearest one wins, for the color and for the distance. `fillet` rounds the
 * creases where two shapes meet (polynomial smooth minimum, in the field's units), which also keeps a
 * sliver of air between two surfaces from pinching the mesh.
 */
export function union(fields: Field[], fillet = 0): Field {
  return {
    d: (x, y, z) => {
      let m = Infinity;
      for (const f of fields) {
        const v = f.d(x, y, z);
        if (fillet > 0 && m < Infinity) {
          const h = Math.max(fillet - Math.abs(m - v), 0) / fillet;
          m = Math.min(m, v) - h * h * fillet * 0.25;
        } else m = Math.min(m, v);
      }
      return m;
    },
    mat: (x, y, z) => {
      let best = fields[0];
      let bd = Infinity;
      for (const f of fields) {
        const v = f.d(x, y, z);
        if (v < bd) {
          bd = v;
          best = f;
        }
      }
      return best.mat(x, y, z);
    },
  };
}

/** The albedo of a material at a point of a surface facing `n`. */
export const colorOf = (m: Material, p: V, n: V = [0, 0, 1]): V => resolveColor(m, p, n);
