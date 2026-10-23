// A small software ray tracer, the kind a 1995 shareware artist ran overnight (POV-Ray,
// Imagine, 3D Studio's renderer): spheres, boxes, cylinders, convex solids and distance-field
// models; chrome, glass, checkered and glowing materials; a key light with soft shadows,
// sky fill with ambient occlusion and reflections of a studio environment. It renders
// linear RGB (0..1) that quantize.ts turns into a 256-color VGA picture.
//
// Coordinates: z is up. Cameras (camera.ts) turn a pixel into a ray; this file lights and traces
// the scene. The vector math is in vec.ts and the materials and shapes in shapes.ts; both are
// re-exported here, so a model only needs to import the tracer.
import { add, clamp01, cross, dot, len, mix, mul, norm, sub, type V } from './vec';
import { HitRec, resolveColor, type Shape } from './shapes';

export * from './vec';
export * from './shapes';

// ---------------------------------------------------------------- the scene

export interface Light {
  /** Direction toward the light (unit). */
  dir: V;
  color: V;
  /** Angular softness of shadows (radians of jitter). */
  soft: number;
}

export interface PointLight {
  at: V;
  color: V;
  /** Radius of the bulb for soft shadows. */
  radius: number;
  /** Distance where it has fallen to a quarter. */
  reach: number;
}

export interface World {
  shapes: Shape[];
  key?: Light;
  points?: PointLight[];
  /** Fill light from above and below (hemisphere), times ambient occlusion. */
  sky: V;
  ground: V;
  /** Ambient occlusion: how far to look and how strong (0 = off). */
  ao?: { reach: number; strength: number };
  /** What reflections and misses see. */
  env: (d: V) => V;
  /** What a camera ray that hits nothing shows (defaults to env). */
  backdrop?: (d: V, o: V) => V;
  /** Fog: color and distance scale (exp(-t/scale)). */
  fog?: { color: V; scale: number; from?: number };
  maxDepth?: number;
}

/** A sample sequence: two numbers 0..1 per call, decorrelated per pixel and sample. */
export class Sampler {
  private s = 0;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    // xorshift32
    let x = this.s;
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    this.s = x;
    return x / 4294967296;
  }
}

const tmpHit = new HitRec();

export function intersect(world: World, o: V, d: V, h: HitRec, ghost = false): boolean {
  h.t = Infinity;
  h.shape = undefined;
  let any = false;
  for (const s of world.shapes) if (!!s.ghost === ghost && s.hit(o, d, h)) any = true;
  return any;
}

function occluded(world: World, o: V, d: V, tmax: number): boolean {
  for (const s of world.shapes) {
    if (s.ghost) continue;
    if (s.occludes) {
      if (s.occludes(o, d, tmax)) {
        return true;
      }
      continue;
    }
    tmpHit.t = tmax;
    tmpHit.shape = undefined;
    if (s.hit(o, d, tmpHit) && !tmpHit.mat.noShadow) return true;
  }
  return false;
}

/** A direction jittered inside a cone around `d` (for soft shadows). */
function jitter(d: V, amount: number, u: number, v: number): V {
  if (amount <= 0) return d;
  const a = u * Math.PI * 2;
  const r = Math.sqrt(v) * amount;
  const t = Math.abs(d[2]) < 0.9 ? norm(cross(d, [0, 0, 1])) : norm(cross(d, [1, 0, 0]));
  const b = cross(d, t);
  return norm([d[0] + (t[0] * Math.cos(a) + b[0] * Math.sin(a)) * r, d[1] + (t[1] * Math.cos(a) + b[1] * Math.sin(a)) * r, d[2] + (t[2] * Math.cos(a) + b[2] * Math.sin(a)) * r]);
}

/** A cosine-weighted direction around n. */
function hemi(n: V, u: number, v: number): V {
  const a = u * Math.PI * 2;
  const r = Math.sqrt(v);
  const t = Math.abs(n[2]) < 0.9 ? norm(cross(n, [0, 0, 1])) : norm(cross(n, [1, 0, 0]));
  const b = cross(n, t);
  const z = Math.sqrt(1 - v);
  return norm([t[0] * Math.cos(a) * r + b[0] * Math.sin(a) * r + n[0] * z, t[1] * Math.cos(a) * r + b[1] * Math.sin(a) * r + n[1] * z, t[2] * Math.cos(a) * r + b[2] * Math.sin(a) * r + n[2] * z]);
}

/** The color seen along a ray. `rs` supplies jitter for soft shadows and occlusion. */
export function trace(world: World, o: V, d: V, rs: Sampler, depth = 0, ghost = false): V {
  const h = new HitRec();
  if (!intersect(world, o, d, h, ghost)) return depth === 0 && world.backdrop ? world.backdrop(d, o) : world.env(d);
  return shadeHit(world, o, d, h, rs, depth);
}

export function shadeHit(world: World, o: V, d: V, h: HitRec, rs: Sampler, depth: number): V {
  const m = h.mat;
  const p: V = [o[0] + d[0] * h.t, o[1] + d[1] * h.t, o[2] + d[2] * h.t];
  let n = h.n;
  const inside = dot(n, d) > 0;
  if (inside && !m.glass) n = mul(n, -1);
  const base = resolveColor(m, p, n);
  if (m.flat) return base;
  const eps = 1e-3;
  const po: V = [p[0] + n[0] * eps, p[1] + n[1] * eps, p[2] + n[2] * eps];
  const out: V = [0, 0, 0];
  const kd = m.diffuse ?? 1;
  const r: V = sub(d, mul(n, 2 * dot(d, n)));

  // fill: sky above, bounce below, with occlusion
  if (kd > 0) {
    let occ = 1;
    if (world.ao && world.ao.strength > 0) {
      const ad = hemi(n, rs.next(), rs.next());
      if (occluded(world, po, ad, world.ao.reach)) occ = 1 - world.ao.strength;
    }
    const up = n[2] * 0.5 + 0.5;
    const fill = mix(world.ground, world.sky, up);
    for (let c = 0; c < 3; c++) out[c] += base[c] * fill[c] * occ * kd;
  }
  const lights: { dir: V; color: V; soft: number; dist: number }[] = [];
  if (world.key) lights.push({ ...world.key, dist: Infinity });
  for (const pl of world.points ?? []) {
    const to = sub(pl.at, p);
    const dist = len(to);
    const fall = 1 / (1 + (dist / pl.reach) ** 2 * 3);
    lights.push({ dir: mul(to, 1 / dist), color: mul(pl.color, fall), soft: pl.radius / Math.max(dist, 1e-3), dist });
  }
  for (const L of lights) {
    const ndl = dot(n, L.dir);
    if (ndl <= 0 && !m.spec) continue;
    const sd = jitter(L.dir, L.soft, rs.next(), rs.next());
    if (occluded(world, po, sd, L.dist)) continue;
    if (ndl > 0) for (let c = 0; c < 3; c++) out[c] += base[c] * L.color[c] * ndl * kd;
    if (m.spec) {
      const s = Math.max(0, dot(r, L.dir)) ** (m.shine ?? 30) * m.spec;
      const tint = m.metal ? base : ([1, 1, 1] as V);
      for (let c = 0; c < 3; c++) out[c] += s * L.color[c] * tint[c];
    }
  }
  if (m.emit) for (let c = 0; c < 3; c++) out[c] += m.emit[c];

  const maxDepth = world.maxDepth ?? 3;
  if (m.glass && depth < maxDepth) {
    const { ior, tint, absorb } = m.glass;
    const cosi = -dot(d, h.n);
    const entering = cosi > 0;
    const nn = entering ? h.n : mul(h.n, -1);
    const eta = entering ? 1 / ior : ior;
    const ci = Math.abs(cosi);
    const k = 1 - eta * eta * (1 - ci * ci);
    const f0 = ((1 - ior) / (1 + ior)) ** 2;
    let fr = f0 + (1 - f0) * (1 - ci) ** 5;
    let through: V = [0, 0, 0];
    if (k < 0) fr = 1;
    else {
      const td = norm(add(mul(d, eta), mul(nn, eta * ci - Math.sqrt(k))));
      const pin: V = [p[0] - nn[0] * eps * 2, p[1] - nn[1] * eps * 2, p[2] - nn[2] * eps * 2];
      through = trace(world, pin, td, rs, depth + 1);
      const a = absorb ?? 0;
      for (let c = 0; c < 3; c++) through[c] *= tint[c] * (entering ? 1 - a : 1);
    }
    const pr: V = [p[0] + nn[0] * eps, p[1] + nn[1] * eps, p[2] + nn[2] * eps];
    const rr: V = sub(d, mul(nn, 2 * dot(d, nn)));
    const refl = trace(world, pr, rr, rs, depth + 1);
    for (let c = 0; c < 3; c++) out[c] += through[c] * (1 - fr) + refl[c] * fr;
  } else if ((m.reflect || m.fresnel) && depth < maxDepth) {
    const ci = Math.abs(dot(d, n));
    const amount = clamp01((m.reflect ?? 0) + (m.fresnel ?? 0) * (1 - ci) ** 4);
    if (amount > 0.001) {
      const refl = trace(world, po, r, rs, depth + 1);
      const tint = m.metal ? base : ([1, 1, 1] as V);
      for (let c = 0; c < 3; c++) out[c] = out[c] * (1 - amount * (m.metal ? 1 : 0.5)) + refl[c] * tint[c] * amount;
    }
  }
  if (world.fog && depth === 0) {
    const f = clamp01(1 - Math.exp(-Math.max(0, h.t - (world.fog.from ?? 0)) / world.fog.scale));
    for (let c = 0; c < 3; c++) out[c] = out[c] * (1 - f) + world.fog.color[c] * f;
  }
  return out;
}
