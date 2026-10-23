// A small software ray tracer for 1995-style pre-rendered scenes (the 3D Studio and
// POV-Ray look): analytic boxes, cylinders and cones, discs, spheres, capsules and
// triangles, each placed by a rotation and an offset, plus the beveled 3D lettering of
// sdftext.ts. Shapes carry a world-space bounding box, so a ray skips what it can't hit
// and a moving shape can say which part of the screen it (and its shadow) can touch.
import type { ExtrudedText } from './sdftext';

export type V = [number, number, number];

export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const mix = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export function norm(v: V): V {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** A 3x3 rotation as rows (object to world). */
export type M3 = number[];
export const IDENTITY: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export function rotX(a: number): M3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}
export function rotY(a: number): M3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}
export function rotZ(a: number): M3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
/** a then b: the rotation that applies `b` first, then `a`. */
export function mulM(a: M3, b: M3): M3 {
  const o: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
  return o;
}
/** The rotation whose columns are these axes (object x, y, z in world space). */
export const fromAxes = (x: V, y: V, z: V): M3 => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
export const apply = (m: M3, v: V): V => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
export const applyT = (m: M3, v: V): V => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];

/** Where a shape sits: object point p is at rot * (p * size) + pos in the world. */
export interface Place {
  rot: M3;
  pos: V;
  size: number;
}
export const placed = (pos: V = [0, 0, 0], rot: M3 = IDENTITY, size = 1): Place => ({ rot, pos, size });

/** What a ray found, in object space (`p`, `n`) and the world (`n` is world). */
export interface LocalHit {
  t: number;
  /** Object-space normal. */
  n: V;
}

export interface Hit {
  t: number;
  p: V;
  /** The point in the shape's own coordinates (for textures). */
  local: V;
  /** World-space unit normal, facing the ray. */
  n: V;
  shape: Shape;
}

/** Surface look: the shader gets the hit and returns a base color and how shiny it is. */
export interface Surface {
  color: V;
  /** Diffuse share of the light. */
  kd: number;
  /** Specular highlight strength and sharpness (Phong). */
  ks: number;
  shine: number;
  /** How much of the sky the surface mirrors (0 = none). */
  mirror: number;
  /** Extra light the surface gives off (a highlight sweep). */
  glow?: V;
}
export type Material = (h: Hit) => Surface;

const EPS = 1e-4;

export abstract class Shape {
  /** World-space bounding box, [min, max]. */
  box: [V, V] = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  /** Whether the shape throws a shadow. */
  shadows = true;
  constructor(
    public at: Place,
    public material: Material,
  ) {}

  /** The nearest hit of an object-space ray after EPS, or undefined. */
  protected abstract local(o: V, d: V, tmax: number): LocalHit | undefined;
  /** The shape's own bounding box in object space. */
  protected abstract bounds(): [V, V];

  /** Recomputes the world box after `at` changes. */
  update(): this {
    const [lo, hi] = this.bounds();
    const mn: V = [1e9, 1e9, 1e9];
    const mx: V = [-1e9, -1e9, -1e9];
    for (const x of [lo[0], hi[0]])
      for (const y of [lo[1], hi[1]])
        for (const z of [lo[2], hi[2]]) {
          const w = this.toWorld([x, y, z]);
          for (let i = 0; i < 3; i++) {
            mn[i] = Math.min(mn[i], w[i]);
            mx[i] = Math.max(mx[i], w[i]);
          }
        }
    this.box = [mn, mx];
    return this;
  }

  toWorld(p: V): V {
    return add(apply(this.at.rot, scale(p, this.at.size)), this.at.pos);
  }

  /** The world box's eight corners. */
  corners(): V[] {
    const [a, b] = this.box;
    const out: V[] = [];
    for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) out.push([x, y, z]);
    return out;
  }

  hit(o: V, d: V, tmax: number): Hit | undefined {
    if (!boxHit(this.box, o, d, tmax)) return undefined;
    const s = this.at.size;
    const lo = scale(applyT(this.at.rot, sub(o, this.at.pos)), 1 / s);
    const ld = applyT(this.at.rot, d);
    const h = this.local(lo, ld, tmax / s);
    if (!h || h.t * s >= tmax) return undefined;
    let n = norm(apply(this.at.rot, h.n));
    if (dot(n, d) > 0) n = scale(n, -1);
    const t = h.t * s;
    return { t, p: add(o, scale(d, t)), local: add(lo, scale(ld, h.t)), n, shape: this };
  }
}

/** Does a ray meet a box before tmax? */
export function boxHit(box: [V, V], o: V, d: V, tmax: number): boolean {
  const mn = box[0];
  const mx = box[1];
  let t0 = 0;
  let t1 = tmax;
  for (let i = 0; i < 3; i++) {
    const di = d[i];
    const oi = o[i];
    if (di > -1e-12 && di < 1e-12) {
      if (oi < mn[i] || oi > mx[i]) return false;
      continue;
    }
    const inv = 1 / di;
    let a = (mn[i] - oi) * inv;
    let b = (mx[i] - oi) * inv;
    if (a > b) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    if (a > t0) t0 = a;
    if (b < t1) t1 = b;
    if (t0 > t1) return false;
  }
  return true;
}

export class Box extends Shape {
  constructor(
    readonly mn: V,
    readonly mx: V,
    at: Place,
    material: Material,
  ) {
    super(at, material);
    this.update();
  }
  protected bounds(): [V, V] {
    return [this.mn, this.mx];
  }
  protected local(o: V, d: V, tmax: number): LocalHit | undefined {
    let t0 = -1e9;
    let t1 = 1e9;
    let a0 = 0;
    let a1 = 0;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-12) {
        if (o[i] < this.mn[i] || o[i] > this.mx[i]) return undefined;
        continue;
      }
      let a = (this.mn[i] - o[i]) / d[i];
      let b = (this.mx[i] - o[i]) / d[i];
      if (a > b) [a, b] = [b, a];
      if (a > t0) {
        t0 = a;
        a0 = i;
      }
      if (b < t1) {
        t1 = b;
        a1 = i;
      }
    }
    if (t0 > t1) return undefined;
    const [t, ax] = t0 > EPS ? [t0, a0] : [t1, a1];
    if (t <= EPS || t >= tmax) return undefined;
    const n: V = [0, 0, 0];
    n[ax] = -Math.sign(d[ax]) || 1;
    return { t, n };
  }
}

/** A cone frustum (or cylinder when r0 = r1) around the object y axis, y0 to y1, its ends capped or open. */
export class Cone extends Shape {
  constructor(
    readonly r0: number,
    readonly r1: number,
    readonly y0: number,
    readonly y1: number,
    at: Place,
    material: Material,
    readonly caps: { bottom?: boolean; top?: boolean } = { bottom: true, top: true },
  ) {
    super(at, material);
    this.update();
  }
  protected bounds(): [V, V] {
    const r = Math.max(this.r0, this.r1);
    return [
      [-r, this.y0, -r],
      [r, this.y1, r],
    ];
  }
  protected local(o: V, d: V, tmax: number): LocalHit | undefined {
    const k = (this.r1 - this.r0) / (this.y1 - this.y0);
    const a = this.r0 - k * this.y0;
    const ro = a + k * o[1];
    const A = d[0] * d[0] + d[2] * d[2] - k * k * d[1] * d[1];
    const B = 2 * (o[0] * d[0] + o[2] * d[2] - k * d[1] * ro);
    const C = o[0] * o[0] + o[2] * o[2] - ro * ro;
    let best: LocalHit | undefined;
    const consider = (t: number, n: () => V) => {
      if (t > EPS && t < tmax && (!best || t < best.t)) best = { t, n: n() };
    };
    if (Math.abs(A) > 1e-12) {
      const disc = B * B - 4 * A * C;
      if (disc >= 0) {
        const q = Math.sqrt(disc);
        for (const t of [(-B - q) / (2 * A), (-B + q) / (2 * A)]) {
          const y = o[1] + d[1] * t;
          if (y < this.y0 || y > this.y1) continue;
          consider(t, () => {
            const x = o[0] + d[0] * t;
            const z = o[2] + d[2] * t;
            return [x, -(a + k * y) * k, z];
          });
        }
      }
    }
    if (Math.abs(d[1]) > 1e-12)
      for (const [y, r, on, up] of [
        [this.y0, this.r0, this.caps.bottom, -1],
        [this.y1, this.r1, this.caps.top, 1],
      ] as [number, number, boolean | undefined, number][]) {
        if (!on) continue;
        const t = (y - o[1]) / d[1];
        const x = o[0] + d[0] * t;
        const z = o[2] + d[2] * t;
        if (x * x + z * z <= r * r) consider(t, () => [0, up, 0]);
      }
    return best;
  }
}

/** A flat ring (or disc when inner = 0) in the object's y = 0 plane. */
export class Ring extends Shape {
  constructor(
    readonly inner: number,
    readonly outer: number,
    at: Place,
    material: Material,
  ) {
    super(at, material);
    this.update();
  }
  protected bounds(): [V, V] {
    return [
      [-this.outer, -0.001, -this.outer],
      [this.outer, 0.001, this.outer],
    ];
  }
  protected local(o: V, d: V, tmax: number): LocalHit | undefined {
    if (Math.abs(d[1]) < 1e-12) return undefined;
    const t = -o[1] / d[1];
    if (t <= EPS || t >= tmax) return undefined;
    const x = o[0] + d[0] * t;
    const z = o[2] + d[2] * t;
    const r2 = x * x + z * z;
    if (r2 > this.outer * this.outer || r2 < this.inner * this.inner) return undefined;
    return { t, n: [0, 1, 0] };
  }
}

export class Sphere extends Shape {
  constructor(
    readonly r: number,
    at: Place,
    material: Material,
  ) {
    super(at, material);
    this.update();
  }
  protected bounds(): [V, V] {
    const r = this.r;
    return [
      [-r, -r, -r],
      [r, r, r],
    ];
  }
  protected local(o: V, d: V, tmax: number): LocalHit | undefined {
    const b = dot(o, d);
    const c = dot(o, o) - this.r * this.r;
    const disc = b * b - c;
    if (disc < 0) return undefined;
    const q = Math.sqrt(disc);
    const t = -b - q > EPS ? -b - q : -b + q;
    if (t <= EPS || t >= tmax) return undefined;
    return { t, n: add(o, scale(d, t)) };
  }
}

/** A rod with round ends from a to b. */
export class Capsule extends Shape {
  constructor(
    readonly a: V,
    readonly b: V,
    readonly r: number,
    at: Place,
    material: Material,
  ) {
    super(at, material);
    this.update();
  }
  protected bounds(): [V, V] {
    const r = this.r;
    return [
      [Math.min(this.a[0], this.b[0]) - r, Math.min(this.a[1], this.b[1]) - r, Math.min(this.a[2], this.b[2]) - r],
      [Math.max(this.a[0], this.b[0]) + r, Math.max(this.a[1], this.b[1]) + r, Math.max(this.a[2], this.b[2]) + r],
    ];
  }
  protected local(o: V, d: V, tmax: number): LocalHit | undefined {
    // Inigo Quilez's capsule intersection
    const ba = sub(this.b, this.a);
    const oa = sub(o, this.a);
    const baba = dot(ba, ba);
    const bard = dot(ba, d);
    const baoa = dot(ba, oa);
    const rdoa = dot(d, oa);
    const oaoa = dot(oa, oa);
    const r = this.r;
    const A = baba - bard * bard;
    let B = baba * rdoa - baoa * bard;
    let C = baba * oaoa - baoa * baoa - r * r * baba;
    let h = B * B - A * C;
    let t = -1;
    if (h >= 0) {
      t = (-B - Math.sqrt(h)) / A;
      const y = baoa + t * bard;
      if (!(y > 0 && y < baba)) {
        const oc = y <= 0 ? oa : sub(o, this.b);
        B = dot(d, oc);
        C = dot(oc, oc) - r * r;
        h = B * B - C;
        t = h > 0 ? -B - Math.sqrt(h) : -1;
      }
    }
    if (t <= EPS || t >= tmax) return undefined;
    const p = add(o, scale(d, t));
    const pa = sub(p, this.a);
    const k = clamp01(dot(pa, ba) / baba);
    return { t, n: sub(pa, scale(ba, k)) };
  }
}

/** A flat triangle, seen from both sides. */
export class Tri extends Shape {
  constructor(
    readonly a: V,
    readonly b: V,
    readonly c: V,
    at: Place,
    material: Material,
  ) {
    super(at, material);
    this.update();
  }
  protected bounds(): [V, V] {
    const xs = [this.a, this.b, this.c];
    return [
      [0, 1, 2].map((i) => Math.min(...xs.map((p) => p[i])) - 0.001) as V,
      [0, 1, 2].map((i) => Math.max(...xs.map((p) => p[i])) + 0.001) as V,
    ];
  }
  protected local(o: V, d: V, tmax: number): LocalHit | undefined {
    const e1 = sub(this.b, this.a);
    const e2 = sub(this.c, this.a);
    const p = cross(d, e2);
    const det = dot(e1, p);
    if (Math.abs(det) < 1e-12) return undefined;
    const tv = sub(o, this.a);
    const u = dot(tv, p) / det;
    if (u < 0 || u > 1) return undefined;
    const q = cross(tv, e1);
    const v = dot(d, q) / det;
    if (v < 0 || u + v > 1) return undefined;
    const t = dot(e2, q) / det;
    if (t <= EPS || t >= tmax) return undefined;
    return { t, n: cross(e1, e2) };
  }
}

/** Beveled 3D lettering (sdftext.ts), found by sphere tracing. */
export class Lettering extends Shape {
  constructor(
    readonly text: ExtrudedText,
    at: Place,
    material: Material,
  ) {
    super(at, material);
    this.update();
  }
  protected bounds(): [V, V] {
    const g = this.text.grid;
    return [
      [g.x0, g.y0, -this.text.half - 0.01],
      [g.x1, g.y1, this.text.half + 0.01],
    ];
  }
  protected local(o: V, d: V, tmax: number): LocalHit | undefined {
    const t = this.text.trace(o[0], o[1], o[2], d[0], d[1], d[2]);
    if (t <= EPS || t >= tmax) return undefined;
    return { t, n: this.text.normal(o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t) };
  }
}

/** Shapes kept together behind one bounding box, so a ray that misses the box skips them all. */
export class Group extends Shape {
  constructor(readonly parts: Shape[]) {
    super(placed(), () => ({ color: [0, 0, 0], kd: 0, ks: 0, shine: 1, mirror: 0 }));
    this.update();
  }
  protected bounds(): [V, V] {
    return [
      [0, 0, 0],
      [0, 0, 0],
    ];
  }
  protected local(): LocalHit | undefined {
    return undefined;
  }
  override update(): this {
    const mn: V = [1e9, 1e9, 1e9];
    const mx: V = [-1e9, -1e9, -1e9];
    for (const p of this.parts ?? [])
      for (let i = 0; i < 3; i++) {
        mn[i] = Math.min(mn[i], p.box[0][i]);
        mx[i] = Math.max(mx[i], p.box[1][i]);
      }
    this.box = [mn, mx];
    return this;
  }
  override hit(o: V, d: V, tmax: number): Hit | undefined {
    if (!boxHit(this.box, o, d, tmax)) return undefined;
    return nearest(this.parts, o, d, tmax);
  }
}

/** The nearest hit among shapes, or undefined. */
export function nearest(shapes: Shape[], o: V, d: V, tmax = 1e9): Hit | undefined {
  let best: Hit | undefined;
  for (const s of shapes) {
    const h = s.hit(o, d, best ? best.t : tmax);
    if (h) best = h;
  }
  return best;
}

/** Is anything between a point and the light along direction l? */
export function blocked(shapes: Shape[], o: V, l: V, tmax = 1e9): boolean {
  for (const s of shapes) {
    if (!s.shadows || !boxHit(s.box, o, l, tmax)) continue;
    if (s instanceof Group ? blocked(s.parts, o, l, tmax) : s.hit(o, l, tmax)) return true;
  }
  return false;
}

/** A pinhole camera for a 320x200 screen shown 4:3 (tall pixels). */
export class Camera {
  readonly fw: V;
  readonly right: V;
  readonly up: V;
  constructor(
    readonly eye: V,
    target: V,
    readonly focal: number,
    readonly w = 320,
    readonly h = 200,
    readonly aspect = 1.2,
  ) {
    this.fw = norm(sub(target, eye));
    this.right = norm(cross([0, 1, 0], this.fw));
    this.up = cross(this.fw, this.right);
  }
  ray(sx: number, sy: number): V {
    const u = (sx - this.w / 2) / this.focal;
    const v = (-(sy - this.h / 2) * this.aspect) / this.focal;
    return norm(add(this.fw, add(scale(this.right, u), scale(this.up, v))));
  }
  project(p: V): [number, number] | undefined {
    const d = sub(p, this.eye);
    const z = dot(d, this.fw);
    if (z < 0.05) return undefined;
    return [this.w / 2 + (dot(d, this.right) * this.focal) / z, this.h / 2 - (dot(d, this.up) * this.focal) / z / this.aspect];
  }
}

/** Seeded value noise in 3D (smooth, -1..1), and a few octaves of it. */
function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const u = s(x - xi);
  const v = s(y - yi);
  const w = s(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return (
    l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w) * 2 - 1
  );
}
export function fbm(x: number, y: number, z: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x, y, z) * amp;
    x *= 2.03;
    y *= 2.03;
    z *= 2.03;
    amp *= 0.5;
  }
  return sum;
}
/** A grainy hash in 0..1 for a point (sand). */
export const grain = (x: number, y: number, z: number, k: number) => hash3(Math.floor(x * k), Math.floor(y * k), Math.floor(z * k));
