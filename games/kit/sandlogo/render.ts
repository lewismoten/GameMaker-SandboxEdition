// Lighting, ray tracing and cached scene composition for each logo frame.
import {
  add,
  apply,
  blocked,
  clamp01,
  dot,
  fbm,
  grain,
  Group,
  mix,
  nearest,
  norm,
  scale,
  Shape,
  sub,
  V,
} from '@lewismoten/gamemaker-sandbox-tools/kit/raytrace';
import { W, H, SPARKLES, cam, WHITE } from './settings';
import { statics } from './scene';
import { Mover, movers } from './motion';
import { logo, LOGO_C, LOGO_ROT, LOGO_SIZE } from './lettering';

const SUN = norm([-0.5, 0.85, -0.42]);
const SUN_COLOR: V = [1.05, 1.0, 0.9];
const AMBIENT: V = [0.36, 0.4, 0.5];

/** The 1995 sky: deep blue overhead to pale at the horizon, with puffy fractal clouds. */
function sky(d: V): V {
  const y = Math.max(d[1], 0);
  const base = mix([0.68, 0.84, 1.0], [0.12, 0.32, 0.86], clamp01(Math.pow(y, 0.6) * 1.6));
  if (y < 0.01) return base;
  const u = d[0] / (y + 0.08);
  const v = d[2] / (y + 0.08);
  const c = clamp01((fbm(u * 0.9, v * 0.9, 0.3, 5) + 0.05) * 2.6);
  const shade = clamp01(0.75 + fbm(u * 0.9 + 0.4, v * 0.9 + 0.4, 0.3, 3) * 0.8);
  return mix(base, scale([1, 1, 1], shade), c * clamp01(y * 6));
}

/** What chrome and plastic mirror: the sky above, a dark lawn and a bright horizon line. */
function env(r: V): V {
  if (r[1] >= 0) return add(sky(r), scale(WHITE, Math.exp(-((r[1] / 0.04) ** 2)) * 0.5));
  return mix([0.35, 0.45, 0.25], [0.08, 0.14, 0.06], clamp01(-r[1] * 3));
}

/** The lawn: two greens in a POV-Ray checkerboard, hazy toward the horizon. */
function lawn(x: number, z: number): V {
  const c: V = (Math.floor(x * 0.9) + Math.floor(z * 0.9)) & 1 ? [0.22, 0.56, 0.16] : [0.36, 0.74, 0.24];
  return scale(c, 0.94 + grain(x, 0, z, 9) * 0.12);
}

function trace(shapes: Shape[], d: V): V {
  const o = cam.eye;
  const h = nearest(shapes, o, d);
  if (!h) {
    if (d[1] >= 0) return sky(d);
    const t = -o[1] / d[1];
    const p = add(o, scale(d, t));
    const lit = blocked(shapes, add(p, [0, 1e-3, 0]), SUN) ? 0 : 1;
    const c = lawn(p[0], p[2]);
    const diff = SUN[1] * lit;
    const col: V = [0, 1, 2].map((i) => c[i] * (AMBIENT[i] + 0.9 * diff * SUN_COLOR[i])) as V;
    return mix(col, sky([d[0], 0, d[2]]), clamp01(1 - Math.exp(-t / 40)));
  }
  const s = h.shape.material(h);
  const n = h.n;
  const lit = blocked(shapes, add(h.p, scale(n, 2e-3)), SUN) ? 0 : 1;
  const diff = Math.max(0, dot(n, SUN)) * lit;
  const vn = dot(d, n);
  const r: V = [d[0] - 2 * vn * n[0], d[1] - 2 * vn * n[1], d[2] - 2 * vn * n[2]];
  const spec = s.ks ? Math.max(0, dot(r, SUN)) ** s.shine * s.ks * lit : 0;
  const e = s.mirror ? env(r) : undefined;
  const out: V = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    out[i] = s.color[i] * (AMBIENT[i] + s.kd * diff * SUN_COLOR[i]) + spec;
    if (e) out[i] = out[i] * (1 - s.mirror * 0.5) + e[i] * s.mirror * s.color[i];
    if (s.glow) out[i] += s.glow[i];
  }
  return out;
}

const SAMPLES: [number, number][] = [
  [0.375, 0.125],
  [0.875, 0.375],
  [0.125, 0.625],
  [0.625, 0.875],
];

function pixel(shapes: Shape[], x: number, y: number): V {
  const acc: V = [0, 0, 0];
  for (const [sx, sy] of SAMPLES) {
    const c = trace(shapes, cam.ray(x + sx, y + sy));
    acc[0] += c[0] / 4;
    acc[1] += c[1] / 4;
    acc[2] += c[2] / 4;
  }
  return acc;
}

/** The screen box a moving shape and its shadow on the ground can touch. */
function dirtyBox(s: Shape, shadows = true): [number, number, number, number] {
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  const pts: V[] = [];
  for (const c of s.corners()) pts.push(c, shadows ? sub(c, scale(SUN, c[1] / SUN[1])) : c);
  for (const c of pts) {
    const p = cam.project(c);
    if (!p) return [0, 0, W - 1, H - 1];
    x0 = Math.min(x0, p[0]);
    y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]);
    y1 = Math.max(y1, p[1]);
  }
  return [Math.max(0, Math.floor(x0) - 2), Math.max(0, Math.floor(y0) - 2), Math.min(W - 1, Math.ceil(x1) + 2), Math.min(H - 1, Math.ceil(y1) + 2)];
}

/** Each mover's shapes behind one bounding box. */
const grouped = (sets: Shape[][]): Shape[] => sets.filter((x) => x.length).map((x) => (x.length > 1 ? new Group(x) : x[0]));

/** Marks the screen boxes shapes (and their shadows) can touch. */
function markDirty(mask: Uint8Array, shapes: Shape[], shadows = true): void {
  for (const s of shapes) {
    const [x0, y0, x1, y1] = dirtyBox(s, shadows);
    for (let y = y0; y <= y1; y++) mask.fill(1, y * W + x0, y * W + x1 + 1);
  }
}

function retrace(out: Float32Array, mask: Uint8Array, shapes: Shape[]): void {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) out.set(pixel(shapes, x, y), (y * W + x) * 3);
}

/** Pictures of the still scene with some movers at rest in it, keyed by which ones. */
const layers = new Map<string, { keys: Set<string>; px: Float32Array }>();
const restShapes = new Map<string, Shape[]>();

/** Everything that isn't moving at the moment, traced once per set of resting movers. */
function layer(rest: Mover[]): Float32Array {
  for (const m of rest) if (!restShapes.has(m.key)) restShapes.set(m.key, m.restAs ?? m.shapes);
  const keys = rest.map((m) => m.key).sort();
  const sig = keys.join(',');
  const hit = layers.get(sig);
  if (hit) return hit.px;
  if (!layers.has('')) {
    const px = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px.set(pixel(statics, x, y), (y * W + x) * 3);
    layers.set('', { keys: new Set(), px });
    if (!sig) return px;
  }
  // start from the cached layer with the most of these movers (and no others) and add the rest
  let base = layers.get('')!;
  for (const l of layers.values()) if (l.keys.size > base.keys.size && [...l.keys].every((k) => keys.includes(k))) base = l;
  const added = keys.filter((k) => !base.keys.has(k));
  const px = base.px.slice();
  const mask = new Uint8Array(W * H);
  markDirty(
    mask,
    added.flatMap((k) => restShapes.get(k)!),
  );
  retrace(px, mask, [...statics, ...grouped([keys.flatMap((k) => restShapes.get(k)!)])]);
  layers.set(sig, { keys: new Set(keys), px });
  return px;
}

/** A four-point star glint with a soft halo, the kind 3D Studio's glow filter drew. */
function sparkle(out: Float32Array, cx: number, cy: number, k: number): void {
  const R = 26 * k;
  for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(H - 1, Math.ceil(cy + R)); y++)
    for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(W - 1, Math.ceil(cx + R)); x++) {
      const dx = Math.abs(x + 0.5 - cx);
      const dy = Math.abs(y + 0.5 - cy) * 1.2;
      const r = Math.hypot(dx, dy);
      const arms = Math.max(0, 1 - dy / 1.6) * Math.max(0, 1 - dx / R) ** 2 + Math.max(0, 1 - dx / 1.6) * Math.max(0, 1 - dy / R) ** 2;
      const diag = Math.max(0, 1 - Math.abs(dx - dy) / 1.2) * Math.max(0, 1 - r / (R * 0.45)) ** 2 * 0.5;
      const core = Math.max(0, 1 - r / (5 * k)) ** 2 * 1.2;
      const v = (arms + diag + core) * k;
      const i = (y * W + x) * 3;
      out[i] += v;
      out[i + 1] += v;
      out[i + 2] += v * 0.9;
    }
}

/** One frame in linear RGB: the still layer, with what moves traced again where it can show. */
export function renderFrame(f: number): Float32Array {
  const ms = movers(f);
  const resting = ms.filter((m) => m.rest);
  const moving = ms.filter((m) => !m.rest).map((m) => m.shapes);
  // a piece that only glows is where it rests, shadow and all
  const out = layer(ms.filter((m) => m.rest || m.glowOnly)).slice();
  const mask = new Uint8Array(W * H);
  for (const m of ms) if (!m.rest) markDirty(mask, m.shapes, !m.glowOnly);
  retrace(out, mask, [...statics, ...grouped([resting.flatMap((m) => restShapes.get(m.key)!)]), ...grouped(moving)]);
  for (const [sf, piece] of SPARKLES) {
    const t = f - sf;
    if (t < 0 || t > 3) continue;
    const k = [0.6, 1, 0.7, 0.35][t];
    const p = logo().pieces[piece];
    const g = p.text.grid;
    const corner = add(LOGO_C, apply(LOGO_ROT, [(p.x + g.x1 * 0.55) * LOGO_SIZE, 0.48 * LOGO_SIZE, -0.25 * LOGO_SIZE]));
    const s = cam.project(corner);
    if (s) sparkle(out, s[0], s[1], k);
  }
  return out;
}
