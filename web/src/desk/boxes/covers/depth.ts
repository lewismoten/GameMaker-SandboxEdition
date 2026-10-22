// Depth Perception's cover: rendered, not painted, the way 1996's 3D boxes were. A tiny ray
// tracer (here, at half size, then scaled up soft) draws Ray, the chrome sphere, rolling down
// a checkerboard toward the vanishing point under a sunset studio sky; Count Polygon hovers
// overhead as a purple icosahedron with red eyes; amber and cyan blocks stand on either side,
// the far ones out of focus; a red teapot and a glass cube sit back near the horizon.
import { type Ctx, finish, glow } from './paint';

type V = [number, number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V, s: number): V => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V): V => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const mix = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

interface Hit {
  t: number;
  n: V;
  m: Mat;
  p: V;
}
interface Mat {
  color: (p: V, n: V) => V;
  reflect: number;
  diffuse: number;
  spec: number;
  emit?: V;
  /** Out of focus: drawn softer (lighter) as the depth-of-field stand-in. */
  haze?: number;
}

type Shape = (o: V, d: V) => Hit | undefined;

const plain = (c: V, o: Partial<Mat> = {}): Mat => ({ color: () => c, reflect: 0, diffuse: 1, spec: 0.4, ...o });

function sphere(c: V, r: number, m: Mat): Shape {
  return (o, d) => {
    const oc = sub(o, c);
    const b = dot(oc, d);
    const disc = b * b - (dot(oc, oc) - r * r);
    if (disc < 0) return undefined;
    let t = -b - Math.sqrt(disc);
    if (t < 1e-4) t = -b + Math.sqrt(disc);
    if (t < 1e-4) return undefined;
    const p = add(o, mul(d, t));
    return { t, p, n: mul(sub(p, c), 1 / r), m };
  };
}

function box(lo: V, hi: V, m: Mat): Shape {
  return (o, d) => {
    let t0 = 1e-4;
    let t1 = Infinity;
    let axis = -1;
    let s = 0;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-9) {
        if (o[a] < lo[a] || o[a] > hi[a]) return undefined;
        continue;
      }
      let ta = (lo[a] - o[a]) / d[a];
      let tb = (hi[a] - o[a]) / d[a];
      let sg = -1;
      if (ta > tb) [ta, tb, sg] = [tb, ta, 1];
      if (ta > t0) [t0, axis, s] = [ta, a, sg];
      t1 = Math.min(t1, tb);
      if (t0 > t1) return undefined;
    }
    if (axis < 0) return undefined;
    const n: V = [0, 0, 0];
    n[axis] = s;
    return { t: t0, p: add(o, mul(d, t0)), n, m };
  };
}

/** A convex solid from planes (the Count's twenty faces). */
function convex(planes: { n: V; d: number }[], m: Mat): Shape {
  return (o, d) => {
    let t0 = 1e-4;
    let t1 = Infinity;
    let face = -1;
    for (let i = 0; i < planes.length; i++) {
      const { n, d: pd } = planes[i];
      const dn = dot(n, d);
      const dist = pd - dot(n, o);
      if (Math.abs(dn) < 1e-9) {
        if (dist < 0) return undefined;
        continue;
      }
      const t = dist / dn;
      if (dn < 0) {
        if (t > t0) [t0, face] = [t, i];
      } else t1 = Math.min(t1, t);
      if (t0 > t1) return undefined;
    }
    if (face < 0) return undefined;
    return { t: t0, p: add(o, mul(d, t0)), n: planes[face].n, m: { ...m, color: () => mix(m.color([0, 0, 0], [0, 0, 1]), [1, 1, 1], ((face * 37) % 7) / 18) } };
  };
}

function icosahedron(c: V, r: number, m: Mat): Shape {
  const phi = (1 + Math.sqrt(5)) / 2;
  const pts: V[] = [];
  for (const a of [-1, 1]) for (const b of [-phi, phi]) pts.push([0, a, b], [a, b, 0], [b, 0, a]);
  // the faces' planes: the dodecahedron's corners are the icosahedron's face normals
  const normals: V[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) normals.push(norm([x, y, z]));
  for (const a of [-1, 1]) for (const b of [-1, 1]) normals.push(norm([0, a / phi, b * phi]), norm([a / phi, b * phi, 0]), norm([b * phi, 0, a / phi]));
  const rad = Math.hypot(1, phi);
  const inr = Math.max(...normals.map((n) => dot(n, pts[0]) / rad));
  return convex(
    normals.map((n) => ({ n, d: dot(n, c) + Math.max(...pts.map((p) => dot(n, p))) * (r / rad) * (inr > 0 ? 1 : 1) })),
    m,
  );
}

const SKY_TOP: V = [0.22, 0.27, 0.6];
const HORIZON: V = [1.0, 0.78, 0.6];
function sky(d: V): V {
  const z = Math.max(0, d[2]);
  const c = mix(HORIZON, SKY_TOP, Math.pow(Math.min(1, z * 2.2), 0.7));
  const line = Math.exp(-((d[2] / 0.02) ** 2)) * 0.6;
  // a soft box high to the left
  const box = Math.max(0, 1 - Math.hypot(d[0] + 0.45, d[1] + 0.2, d[2] - 0.85) / 0.4) * 2.2;
  return [c[0] + line + box, c[1] + line * 0.9 + box, c[2] + line * 0.8 + box];
}

const LIGHT = norm([-0.5, -0.45, 0.9]);

export function paint(c: Ctx, w: number, h: number): void {
  // a half-size render, scaled up soft: the painterly 1996 "rendered" look
  const rw = Math.round(w / 2);
  const rh = Math.round(h / 2);
  const amber: V = [1.0, 0.6, 0.16];
  const cyan: V = [0.16, 0.78, 1.0];
  const checker: Mat = {
    color: (p) => ((Math.floor(p[0]) + Math.floor(p[1])) & 1 ? [0.92, 0.9, 0.96] : [0.13, 0.12, 0.3]),
    reflect: 0.18,
    diffuse: 0.9,
    spec: 0.3,
  };
  const chrome: Mat = { color: () => [0.92, 0.94, 0.98], reflect: 0.85, diffuse: 0.08, spec: 1.3 };
  // Ray: chrome with two neon bands
  const rayC: V = [0.4, 0.6, 1.35];
  const rayMat: Mat = {
    ...chrome,
    color: (p) => {
      const l = sub(p, rayC);
      const a = 0.5;
      const u = l[0] * Math.cos(a) - l[2] * Math.sin(a);
      const v = l[0] * Math.sin(a) + l[2] * Math.cos(a);
      return Math.abs(u) < 0.09 || Math.abs(v) < 0.09 ? [2.4, 1.5, 0.45] : [0.92, 0.94, 0.98];
    },
  };
  const floor: Shape = (o, d) => {
    if (d[2] >= -1e-6) return undefined;
    const t = -o[2] / d[2];
    if (t < 1e-4) return undefined;
    return { t, p: add(o, mul(d, t)), n: [0, 0, 1], m: checker };
  };
  const shapes: Shape[] = [
    floor,
    sphere(rayC, 1.35, rayMat),
    icosahedron([3.1, 9, 4.9], 1.4, { color: () => [0.48, 0.22, 0.82], reflect: 0.15, diffuse: 0.9, spec: 1 }),
    sphere([2.65, 7.8, 4.95], 0.17, plain([1, 0.2, 0.2], { emit: [1.2, 0.2, 0.2] })),
    sphere([3.5, 7.8, 4.95], 0.17, plain([1, 0.2, 0.2], { emit: [1.2, 0.2, 0.2] })),
    box([-5.4, 3, 0], [-3.6, 4.8, 1.8], plain(amber, { reflect: 0.15, spec: 0.9 })),
    box([-5.4, 4.8, 0], [-3.6, 6.6, 1.8], plain(amber, { reflect: 0.15, spec: 0.9 })),
    box([3.8, 14, 0], [5.6, 15.8, 1.8], plain(cyan, { reflect: 0.15, spec: 0.9, haze: 0.45 })),
    box([5.6, 14, 0], [7.4, 15.8, 1.8], plain(cyan, { reflect: 0.15, spec: 0.9, haze: 0.45 })),
    box([-2.5, 22, 0], [-0.7, 23.8, 1.8], { color: () => [0.8, 0.95, 1], reflect: 0.55, diffuse: 0.3, spec: 1.4, haze: 0.5 }),
    sphere([3.2, 26, 0.9], 0.9, plain([0.85, 0.16, 0.2], { spec: 1, haze: 0.55 })),
    sphere([-4.2, 18, 0.7], 0.7, { ...chrome, haze: 0.5 }),
  ];
  const eye: V = [0, -9.5, 3.2];
  const look: V = [0, 6, 2.2];
  const fw = norm(sub(look, eye));
  const right = norm([fw[1], -fw[0], 0]);
  const up: V = [right[1] * fw[2] - right[2] * fw[1], right[2] * fw[0] - right[0] * fw[2], right[0] * fw[1] - right[1] * fw[0]];
  const f = rh / 2 / Math.tan(0.42);
  const nearest = (o: V, d: V): Hit | undefined => {
    let best: Hit | undefined;
    for (const s of shapes) {
      const hit = s(o, d);
      if (hit && (!best || hit.t < best.t)) best = hit;
    }
    return best;
  };
  const trace = (o: V, d: V, depth: number): V => {
    const hit = nearest(o, d);
    if (!hit) return sky(d);
    const { p, m } = hit;
    let n = hit.n;
    if (dot(n, d) > 0) n = mul(n, -1);
    const base = m.color(p, n);
    const po = add(p, mul(n, 1e-3));
    const lit = nearest(po, LIGHT) ? 0 : Math.max(0, dot(n, LIGHT));
    const fill = 0.28 + 0.12 * n[2];
    let out: V = mul(base, (fill + lit * 0.9) * m.diffuse);
    const r = sub(d, mul(n, 2 * dot(d, n)));
    const s = Math.pow(Math.max(0, dot(r, LIGHT)), 60) * m.spec * (lit > 0 ? 1 : 0);
    out = add(out, [s, s, s]);
    if (m.emit) out = add(out, m.emit);
    if (m.reflect > 0 && depth < 3) {
      const refl = trace(po, r, depth + 1);
      const fres = m.reflect + (1 - m.reflect) * Math.pow(1 - Math.abs(dot(d, n)), 5) * 0.4;
      out = mix(out, mul(refl, m === checker ? 1 : 1), fres * (m.diffuse < 0.2 ? 1 : 0.6));
      if (m.diffuse < 0.2) out = [out[0] * base[0] * 1.05, out[1] * base[1] * 1.05, out[2] * base[2] * 1.05];
    }
    // haze for the far things (the cover's depth of field) and fog toward the horizon
    if (depth === 0) {
      if (m.haze) out = mix(out, mix(sky([d[0], d[1], 0.05]), [1, 1, 1], 0.2), m.haze);
      out = mix(out, HORIZON, Math.min(0.85, Math.max(0, (hit.t - 20) / 60)));
    }
    return out;
  };
  const img = c.createImageData(rw, rh);
  for (let y = 0; y < rh; y++)
    for (let x = 0; x < rw; x++) {
      let acc: V = [0, 0, 0];
      for (let sy = 0; sy < 2; sy++)
        for (let sx = 0; sx < 2; sx++) {
          const u = (x + (sx + 0.5) / 2 - rw / 2) / f;
          const v = -(y + (sy + 0.5) / 2 - rh / 2) / f;
          const d = norm(add(fw, add(mul(right, u), mul(up, v))));
          acc = add(acc, trace(eye, d, 0));
        }
      const i = (y * rw + x) * 4;
      for (let k = 0; k < 3; k++) img.data[i + k] = Math.round(Math.min(1, Math.pow(Math.max(0, acc[k] / 4), 0.9)) * 255);
      img.data[i + 3] = 255;
    }
  const small = document.createElement('canvas');
  small.width = rw;
  small.height = rh;
  small.getContext('2d')!.putImageData(img, 0, 0);
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(small, 0, 0, w, h);
  // a lens flare where the soft box catches Ray's chrome
  const fx = w * 0.47;
  const fy = h * 0.555;
  glow(c, fx, fy, w * 0.09, 'rgba(255,240,210,0.9)', 0.55);
  glow(c, fx, fy, w * 0.025, '#ffffff', 0.9);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = 'rgba(255,230,200,0.35)';
  c.fillRect(fx - w * 0.36, fy - 1, w * 0.72, 2);
  for (const [k, r, col] of [
    [0.7, 0.05, 'rgba(120,255,160,0.1)'],
    [0.95, 0.03, 'rgba(180,120,255,0.1)'],
    [1.25, 0.07, 'rgba(120,180,255,0.08)'],
  ] as [number, number, string][]) {
    c.beginPath();
    c.arc(fx + (w * 0.5 - fx) * k * 2, fy + (h * 0.5 - fy) * k * 2, w * r, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
  }
  c.restore();
  finish(c, w, h, 'depth', 0.45);
}

export default paint;
