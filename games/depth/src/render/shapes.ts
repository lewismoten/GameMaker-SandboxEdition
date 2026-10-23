// What the ray tracer (tracer.ts) renders: materials (chrome, glass, checkers, glows) and
// the shapes that carry them - spheres, boxes, cylinders, convex solids, distance-field
// models and moved/rotated copies - each with a hit() test that fills in the nearest hit.
// sd holds the signed distance pieces the distance-field models are built from.
import { add, clamp01, cross, dot, len, mul, norm, sub, type V } from './vec';

// ---------------------------------------------------------------- materials

export interface Material {
  /** Albedo, or a texture of the hit point (world space) and normal. */
  color: V | ((p: V, n: V) => V);
  /** How much the key light and fill light it takes (default 1). */
  diffuse?: number;
  /** Highlight strength and tightness (Phong). */
  spec?: number;
  shine?: number;
  /** Mirror reflection 0..1; `fresnel` adds more toward grazing angles. */
  reflect?: number;
  fresnel?: number;
  /** Metal: reflections are tinted by the color (chrome, gold). */
  metal?: boolean;
  /** Glass: refraction with this index; `tint` colors what comes through. */
  glass?: { ior: number; tint: V; absorb?: number };
  /** Light it gives off itself. */
  emit?: V;
  /** Casts no shadow (glows, the void). */
  noShadow?: boolean;
  /** Not shaded at all: the color is what you see (backdrops). */
  flat?: boolean;
}

export const resolveColor = (m: Material, p: V, n: V): V => (typeof m.color === 'function' ? m.color(p, n) : m.color);

// ---------------------------------------------------------------- shapes

/** The nearest hit so far; shapes fill it in. */
export class HitRec {
  t = Infinity;
  n: V = [0, 0, 1];
  mat: Material = { color: [1, 0, 1] };
  shape: Shape | undefined;
  /** The shape's own value for the hit (a model's part id). */
  part = 0;
}

export interface Shape {
  /** Updates `h` (and returns true) when the ray meets the shape nearer than h.t. */
  hit(o: V, d: V, h: HitRec): boolean;
  /** Only for shadows: the first t along the ray (or Infinity). Defaults to hit(). */
  occludes?(o: V, d: V, tmax: number): boolean;
  /** World-space bounds (for picking the screen area a shape covers). */
  bounds?: [V, V];
  /** Belongs to the ghost (out of focus) layer. */
  ghost?: boolean;
}

export class Sphere implements Shape {
  bounds: [V, V];
  constructor(
    public c: V,
    public r: number,
    public mat: Material,
  ) {
    this.bounds = [sub(c, [r, r, r]), add(c, [r, r, r])];
  }
  hit(o: V, d: V, h: HitRec): boolean {
    const ox = o[0] - this.c[0];
    const oy = o[1] - this.c[1];
    const oz = o[2] - this.c[2];
    const b = ox * d[0] + oy * d[1] + oz * d[2];
    const c = ox * ox + oy * oy + oz * oz - this.r * this.r;
    const disc = b * b - c;
    if (disc < 0) return false;
    const s = Math.sqrt(disc);
    let t = -b - s;
    if (t < 1e-5) t = -b + s;
    if (t < 1e-5 || t >= h.t) return false;
    h.t = t;
    h.n = [(ox + d[0] * t) / this.r, (oy + d[1] * t) / this.r, (oz + d[2] * t) / this.r];
    h.mat = this.mat;
    h.shape = this;
    return true;
  }
}

/** An axis-aligned box. */
export class Box implements Shape {
  bounds: [V, V];
  constructor(
    public lo: V,
    public hi: V,
    public mat: Material,
  ) {
    this.bounds = [lo, hi];
  }
  hit(o: V, d: V, h: HitRec): boolean {
    let t0 = 1e-5;
    let t1 = h.t;
    let axis = -1;
    let sgn = 0;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-12) {
        if (o[a] < this.lo[a] || o[a] > this.hi[a]) return false;
        continue;
      }
      let ta = (this.lo[a] - o[a]) / d[a];
      let tb = (this.hi[a] - o[a]) / d[a];
      let s = -1;
      if (ta > tb) {
        [ta, tb] = [tb, ta];
        s = 1;
      }
      if (ta > t0) {
        t0 = ta;
        axis = a;
        sgn = s;
      }
      if (tb < t1) t1 = tb;
      if (t0 > t1) return false;
    }
    if (axis < 0) return false; // inside
    h.t = t0;
    const n: V = [0, 0, 0];
    n[axis] = sgn;
    h.n = n;
    h.mat = this.mat;
    h.shape = this;
    return true;
  }
}

/** A capped cylinder standing along z. */
export class Cylinder implements Shape {
  bounds: [V, V];
  constructor(
    public cx: number,
    public cy: number,
    public r: number,
    public z0: number,
    public z1: number,
    public mat: Material,
    public capMat: Material = mat,
  ) {
    this.bounds = [
      [cx - r, cy - r, z0],
      [cx + r, cy + r, z1],
    ];
  }
  hit(o: V, d: V, h: HitRec): boolean {
    let hitAny = false;
    const ox = o[0] - this.cx;
    const oy = o[1] - this.cy;
    const a = d[0] * d[0] + d[1] * d[1];
    if (a > 1e-12) {
      const b = ox * d[0] + oy * d[1];
      const c = ox * ox + oy * oy - this.r * this.r;
      const disc = b * b - a * c;
      if (disc >= 0) {
        const s = Math.sqrt(disc);
        for (const t of [(-b - s) / a, (-b + s) / a]) {
          if (t < 1e-5 || t >= h.t) continue;
          const z = o[2] + d[2] * t;
          if (z < this.z0 || z > this.z1) continue;
          h.t = t;
          h.n = [(ox + d[0] * t) / this.r, (oy + d[1] * t) / this.r, 0];
          h.mat = this.mat;
          h.shape = this;
          hitAny = true;
          break;
        }
      }
    }
    if (Math.abs(d[2]) > 1e-12)
      for (const [z, nz] of [
        [this.z1, 1],
        [this.z0, -1],
      ]) {
        const t = (z - o[2]) / d[2];
        if (t < 1e-5 || t >= h.t) continue;
        const x = ox + d[0] * t;
        const y = oy + d[1] * t;
        if (x * x + y * y > this.r * this.r) continue;
        h.t = t;
        h.n = [0, 0, nz];
        h.mat = this.capMat;
        h.shape = this;
        hitAny = true;
      }
    return hitAny;
  }
}

/** A convex solid: the inside of every plane (n . p <= d). Gems, wedges, polyhedra. */
export class Convex implements Shape {
  constructor(
    public planes: { n: V; d: number }[],
    public mat: Material | ((face: number) => Material),
    public bounds?: [V, V],
  ) {}
  hit(o: V, d: V, h: HitRec): boolean {
    let t0 = 1e-5;
    let t1 = h.t;
    let face = -1;
    for (let i = 0; i < this.planes.length; i++) {
      const { n, d: pd } = this.planes[i];
      const dn = dot(n, d);
      const dist = pd - dot(n, o);
      if (Math.abs(dn) < 1e-12) {
        if (dist < 0) return false;
        continue;
      }
      const t = dist / dn;
      if (dn < 0) {
        if (t > t0) {
          t0 = t;
          face = i;
        }
      } else if (t < t1) t1 = t;
      if (t0 > t1) return false;
    }
    if (face < 0) return false;
    h.t = t0;
    h.n = this.planes[face].n;
    h.mat = typeof this.mat === 'function' ? this.mat(face) : this.mat;
    h.shape = this;
    h.part = face;
    return true;
  }
}

/** A convex solid from its corner points (the hull's faces found by brute force). */
export function hull(points: V[], mat: Material | ((face: number) => Material)): Convex {
  const planes: { n: V; d: number }[] = [];
  const c = mul(
    points.reduce((s, p) => add(s, p), [0, 0, 0] as V),
    1 / points.length,
  );
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      for (let k = j + 1; k < points.length; k++) {
        let n = cross(sub(points[j], points[i]), sub(points[k], points[i]));
        if (len(n) < 1e-9) continue;
        n = norm(n);
        let d = dot(n, points[i]);
        if (dot(n, c) > d) {
          n = mul(n, -1);
          d = -d;
        }
        if (points.every((p) => dot(n, p) <= d + 1e-6) && !planes.some((q) => dot(q.n, n) > 0.9999 && Math.abs(q.d - d) < 1e-6)) planes.push({ n, d });
      }
  const lo: V = [Infinity, Infinity, Infinity];
  const hi: V = [-Infinity, -Infinity, -Infinity];
  for (const p of points)
    for (let a = 0; a < 3; a++) {
      lo[a] = Math.min(lo[a], p[a]);
      hi[a] = Math.max(hi[a], p[a]);
    }
  return new Convex(planes, mat, [lo, hi]);
}

/**
 * A distance-field model: `sdf(p)` gives the distance to its surface (negative inside) and
 * `part(p)` which material the surface there has. Found by sphere tracing inside `bounds`.
 */
export class Sdf implements Shape {
  constructor(
    public bounds: [V, V],
    public sdf: (x: number, y: number, z: number) => number,
    public mats: Material[],
    public part: (x: number, y: number, z: number) => number = () => 0,
    public eps = 0.0015,
  ) {}
  private clip(o: V, d: V, tmax: number): [number, number] | undefined {
    let t0 = 1e-5;
    let t1 = tmax;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-12) {
        if (o[a] < this.bounds[0][a] || o[a] > this.bounds[1][a]) return undefined;
        continue;
      }
      let ta = (this.bounds[0][a] - o[a]) / d[a];
      let tb = (this.bounds[1][a] - o[a]) / d[a];
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) return undefined;
    }
    return [t0, t1];
  }
  march(o: V, d: V, tmax: number): number {
    const r = this.clip(o, d, tmax);
    if (!r) return -1;
    let t = r[0];
    for (let i = 0; i < 160 && t <= r[1]; i++) {
      const dist = this.sdf(o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t);
      if (dist < this.eps) return t;
      t += Math.max(dist * 0.9, this.eps * 0.5);
    }
    return -1;
  }
  hit(o: V, d: V, h: HitRec): boolean {
    const t = this.march(o, d, h.t);
    if (t < 0 || t >= h.t) return false;
    const p: V = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
    const e = 0.0015;
    const [x, y, z] = p;
    const a = this.sdf(x + e, y - e, z - e);
    const b = this.sdf(x - e, y - e, z + e);
    const c = this.sdf(x - e, y + e, z - e);
    const dd = this.sdf(x + e, y + e, z + e);
    h.t = t;
    h.n = norm([a - b - c + dd, -a - b + c + dd, -a + b - c + dd]);
    const part = this.part(x, y, z);
    h.mat = this.mats[part] ?? this.mats[0];
    h.part = part;
    h.shape = this;
    return true;
  }
  occludes(o: V, d: V, tmax: number): boolean {
    return this.march(o, d, tmax) >= 0;
  }
}

/** Rotations and moves: a shape seen through a 3x3 rotation (rows) and an offset. */
export class Moved implements Shape {
  bounds?: [V, V];
  ghost?: boolean;
  constructor(
    public inner: Shape,
    public rot: number[],
    public at: V,
    public scale = 1,
  ) {
    if (inner.bounds) {
      const [lo, hi] = inner.bounds;
      const blo: V = [Infinity, Infinity, Infinity];
      const bhi: V = [-Infinity, -Infinity, -Infinity];
      for (const x of [lo[0], hi[0]])
        for (const y of [lo[1], hi[1]])
          for (const z of [lo[2], hi[2]]) {
            const w = this.toWorld([x, y, z]);
            for (let a = 0; a < 3; a++) {
              blo[a] = Math.min(blo[a], w[a]);
              bhi[a] = Math.max(bhi[a], w[a]);
            }
          }
      this.bounds = [blo, bhi];
    }
    this.ghost = inner.ghost;
  }
  toWorld(p: V): V {
    const r = this.rot;
    const s = this.scale;
    return [
      (r[0] * p[0] + r[1] * p[1] + r[2] * p[2]) * s + this.at[0],
      (r[3] * p[0] + r[4] * p[1] + r[5] * p[2]) * s + this.at[1],
      (r[6] * p[0] + r[7] * p[1] + r[8] * p[2]) * s + this.at[2],
    ];
  }
  private local(v: V): V {
    const r = this.rot;
    return [r[0] * v[0] + r[3] * v[1] + r[6] * v[2], r[1] * v[0] + r[4] * v[1] + r[7] * v[2], r[2] * v[0] + r[5] * v[1] + r[8] * v[2]];
  }
  private readonly tmp = new HitRec();
  hit(o: V, d: V, h: HitRec): boolean {
    const s = this.scale;
    const lo = mul(this.local(sub(o, this.at)), 1 / s);
    const ld = this.local(d);
    const tmp = this.tmp;
    tmp.t = h.t / s;
    if (!this.inner.hit(lo, ld, tmp)) return false;
    const r = this.rot;
    const n = tmp.n;
    h.t = tmp.t * s;
    h.n = [r[0] * n[0] + r[1] * n[1] + r[2] * n[2], r[3] * n[0] + r[4] * n[1] + r[5] * n[2], r[6] * n[0] + r[7] * n[1] + r[8] * n[2]];
    h.mat = tmp.mat;
    h.part = tmp.part;
    h.shape = this;
    return true;
  }
  occludes(o: V, d: V, tmax: number): boolean {
    const s = this.scale;
    const lo = mul(this.local(sub(o, this.at)), 1 / s);
    const ld = this.local(d);
    if (this.inner.occludes) return this.inner.occludes(lo, ld, tmax / s);
    const tmp = this.tmp;
    tmp.t = tmax / s;
    return this.inner.hit(lo, ld, tmp);
  }
}

/** Rotation matrix rows: about z (yaw), then x (pitch), then y (roll). */
export function rotation(yaw: number, pitch = 0, roll = 0): number[] {
  const cz = Math.cos(yaw);
  const sz = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  const cy = Math.cos(roll);
  const sy = Math.sin(roll);
  const Rz = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  const Rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  return matMul(Rz, matMul(Rx, Ry));
}

export function matMul(a: number[], b: number[]): number[] {
  const o = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
  return o;
}

// ---------------------------------------------------------------- distance field pieces

export const sd = {
  sphere: (x: number, y: number, z: number, r: number) => Math.sqrt(x * x + y * y + z * z) - r,
  ellipsoid: (x: number, y: number, z: number, a: number, b: number, c: number) => {
    const k0 = Math.sqrt((x / a) ** 2 + (y / b) ** 2 + (z / c) ** 2);
    const k1 = Math.sqrt((x / (a * a)) ** 2 + (y / (b * b)) ** 2 + (z / (c * c)) ** 2);
    return k1 === 0 ? -Math.min(a, b, c) : (k0 * (k0 - 1)) / k1;
  },
  box: (x: number, y: number, z: number, bx: number, by: number, bz: number, r = 0) => {
    const qx = Math.abs(x) - bx + r;
    const qy = Math.abs(y) - by + r;
    const qz = Math.abs(z) - bz + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  },
  /** A capsule from a to b with radius r (tapering from ra to rb). */
  capsule: (x: number, y: number, z: number, a: V, b: V, ra: number, rb = ra) => {
    const px = x - a[0];
    const py = y - a[1];
    const pz = z - a[2];
    const bx = b[0] - a[0];
    const by = b[1] - a[1];
    const bz = b[2] - a[2];
    const t = clamp01((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz || 1));
    return Math.hypot(px - bx * t, py - by * t, pz - bz * t) - (ra + (rb - ra) * t);
  },
  /** A torus lying flat (around z). */
  torus: (x: number, y: number, z: number, R: number, r: number) => Math.hypot(Math.hypot(x, y) - R, z) - r,
  cylinder: (x: number, y: number, z: number, r: number, h: number, round = 0) => {
    const dx = Math.hypot(x, y) - r + round;
    const dz = Math.abs(z) - h + round;
    return Math.min(Math.max(dx, dz), 0) + Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) - round;
  },
  /** Smooth union (polynomial smooth min). */
  smin: (a: number, b: number, k: number) => {
    const h = clamp01(0.5 + (0.5 * (b - a)) / k);
    return b + (a - b) * h - k * h * (1 - h);
  },
};
