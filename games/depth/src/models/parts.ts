// Building models out of distance-field parts, the way 1995 modelers built characters out of
// blobs and primitives: each part has a material; the surface takes the nearest part's.
import { Sdf, clamp01, sd, type Material, type V } from '../render/tracer';

type Field = (x: number, y: number, z: number) => number;

interface Part {
  d: Field;
  mat: Material;
}

/** A model from parts joined with a smooth seam `k` (0 = hard). */
export function model(parts: Part[], bounds: [V, V], k = 0): Sdf {
  const fs = parts.map((p) => p.d);
  const n = fs.length;
  const field: Field = (x, y, z) => {
    let d = Infinity;
    for (let i = 0; i < n; i++) {
      const v = fs[i](x, y, z);
      d = k > 0 && d !== Infinity ? sd.smin(d, v, k) : Math.min(d, v);
    }
    return d;
  };
  const which = (x: number, y: number, z: number) => {
    let best = 0;
    let bd = Infinity;
    parts.forEach((p, i) => {
      const v = p.d(x, y, z);
      if (v < bd - 1e-4) {
        bd = v;
        best = i;
      }
    });
    return best;
  };
  return new Sdf(
    bounds,
    field,
    parts.map((p) => p.mat),
    which,
    0.0012,
  );
}

/** Bounds around a center. */
export const around = (c: V, r: number | V): [V, V] => {
  const [a, b, d] = typeof r === 'number' ? [r, r, r] : r;
  return [
    [c[0] - a, c[1] - b, c[2] - d],
    [c[0] + a, c[1] + b, c[2] + d],
  ];
};

/** Fields placed in the world. */
export const F = {
  sphere:
    (c: V, r: number): Field =>
    (x, y, z) =>
      sd.sphere(x - c[0], y - c[1], z - c[2], r),
  ell: (c: V, a: number, b: number, h: number): Field => {
    const [cx, cy, cz] = c;
    const aa = a * a;
    const bb = b * b;
    const hh = h * h;
    const lowest = -Math.min(a, b, h);
    // sd.ellipsoid with the squares of its radii worked out once (same arithmetic)
    return (x, y, z) => {
      x -= cx;
      y -= cy;
      z -= cz;
      const k0 = Math.sqrt((x / a) ** 2 + (y / b) ** 2 + (z / h) ** 2);
      const k1 = Math.sqrt((x / aa) ** 2 + (y / bb) ** 2 + (z / hh) ** 2);
      return k1 === 0 ? lowest : (k0 * (k0 - 1)) / k1;
    };
  },
  cap: (a: V, b: V, ra: number, rb = ra): Field => {
    const [ax, ay, az] = a;
    const bx = b[0] - ax;
    const by = b[1] - ay;
    const bz = b[2] - az;
    const len2 = bx * bx + by * by + bz * bz || 1;
    const dr = rb - ra;
    // sd.capsule with the segment's constants worked out once (same arithmetic)
    return (x, y, z) => {
      const px = x - ax;
      const py = y - ay;
      const pz = z - az;
      const t = clamp01((px * bx + py * by + pz * bz) / len2);
      return Math.hypot(px - bx * t, py - by * t, pz - bz * t) - (ra + dr * t);
    };
  },
  box:
    (c: V, h: V, r = 0): Field =>
    (x, y, z) =>
      sd.box(x - c[0], y - c[1], z - c[2], h[0], h[1], h[2], r),
  cyl:
    (c: V, r: number, h: number, round = 0): Field =>
    (x, y, z) =>
      sd.cylinder(x - c[0], y - c[1], z - c[2], r, h, round),
  /** A cylinder with its axis along x (wheels on a car seen from the side). */
  wheel:
    (c: V, r: number, w: number, round = 0.01): Field =>
    (x, y, z) =>
      sd.cylinder(y - c[1], z - c[2], x - c[0], r, w, round),
  wheelY:
    (c: V, r: number, w: number, round = 0.01): Field =>
    (x, y, z) =>
      sd.cylinder(x - c[0], z - c[2], y - c[1], r, w, round),
  torus:
    (c: V, R: number, r: number): Field =>
    (x, y, z) =>
      sd.torus(x - c[0], y - c[1], z - c[2], R, r),
  /** A torus standing up, facing y (a handle, a ring seen from the front). */
  torusY:
    (c: V, R: number, r: number): Field =>
    (x, y, z) =>
      sd.torus(x - c[0], z - c[2], y - c[1], R, r),
  /** A torus standing up, facing x. */
  torusX:
    (c: V, R: number, r: number): Field =>
    (x, y, z) =>
      sd.torus(y - c[1], z - c[2], x - c[0], R, r),
  union:
    (...f: Field[]): Field =>
    (x, y, z) =>
      Math.min(...f.map((g) => g(x, y, z))),
  cut:
    (a: Field, b: Field): Field =>
    (x, y, z) =>
      Math.max(a(x, y, z), -b(x, y, z)),
  and:
    (a: Field, b: Field): Field =>
    (x, y, z) =>
      Math.max(a(x, y, z), b(x, y, z)),
  /** Turned about z around a point. */
  yaw: (f: Field, c: V, a: number): Field => {
    const co = Math.cos(a);
    const si = Math.sin(a);
    return (x, y, z) => {
      const dx = x - c[0];
      const dy = y - c[1];
      return f(c[0] + co * dx + si * dy, c[1] - si * dx + co * dy, z);
    };
  },
  /** Mirrored left-right around x = c. */
  mirrorX:
    (f: Field, c: number): Field =>
    (x, y, z) =>
      f(c + Math.abs(x - c), y, z),
};
