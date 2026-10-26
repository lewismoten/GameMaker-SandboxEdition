// Cameras, the pixel loop and the darkroom: turning a World into a picture with antialiasing,
// then the 1995 finishing touches (glow, lens flares, an out-of-focus blur) on linear RGB.
import { HitRec, Sampler, add, clamp01, cross, intersect, mul, norm, shadeHit, sub, trace, type V, type World } from './tracer';

export interface Camera {
  /** The ray through pixel position (sx, sy) (fractions allowed). `u, v` jitter the lens. */
  ray(sx: number, sy: number, u: number, v: number): [V, V];
}

/** A pinhole (or thin-lens) camera. VGA's 320x200 is shown 4:3, so pixels are 1.2 times taller than wide. */
export function perspective(o: {
  eye: V;
  look: V;
  w: number;
  h: number;
  fov: number;
  aspect?: number;
  aperture?: number;
  focus?: number;
  roll?: number;
}): Camera {
  const fw = norm(sub(o.look, o.eye));
  let right = norm(cross(fw, [0, 0, 1]));
  let up = cross(right, fw);
  if (o.roll) {
    const c = Math.cos(o.roll);
    const s = Math.sin(o.roll);
    const r2 = add(mul(right, c), mul(up, s));
    up = add(mul(up, c), mul(right, -s));
    right = r2;
  }
  const f = o.h / 2 / Math.tan(o.fov / 2);
  const asp = o.aspect ?? 1.2;
  const focus = o.focus ?? 1;
  return {
    ray(sx, sy, u, v) {
      const x = (sx - o.w / 2) / f;
      const y = (-(sy - o.h / 2) * asp) / f;
      const d = norm(add(fw, add(mul(right, x), mul(up, y))));
      if (!o.aperture) return [o.eye, d];
      const a = u * Math.PI * 2;
      const r = Math.sqrt(v) * o.aperture;
      const lens = add(o.eye, add(mul(right, Math.cos(a) * r), mul(up, Math.sin(a) * r)));
      const target = add(o.eye, mul(d, focus / Math.max(0.05, d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2])));
      return [lens, norm(sub(target, lens))];
    },
  };
}

/**
 * The game's view: an oblique parallel projection from the south and above, so a point
 * (x, y, z) lands on screen at (x, y - k z) in cells. Floor cells keep their squares, tops
 * stay on top and every south face shows below them: the pre-rendered 3/4 look.
 */
export const OBLIQUE_K = 0.42;
export function oblique(x0: number, y0: number, pxPerUnit: number, k = OBLIQUE_K, top = 6): Camera {
  const d = norm([0, -k, -1]);
  return {
    ray(sx, sy) {
      const X = x0 + sx / pxPerUnit;
      const Y = y0 + sy / pxPerUnit;
      return [[X, Y + k * top, top], d];
    },
  };
}

interface RenderOptions {
  /** Samples a pixel where the picture is smooth, and where it changes (edges). */
  spp?: number;
  edgeSpp?: number;
  seed?: number;
  /** Only this rectangle (x0, y0, x1, y1 exclusive). */
  area?: [number, number, number, number];
  /** Trace the ghost (out-of-focus) layer only, returning coverage in `alpha`. */
  ghost?: boolean;
}

export interface Picture {
  w: number;
  h: number;
  rgb: Float32Array;
  alpha?: Float32Array;
}

const hash = (x: number, y: number, s: number) => {
  let h = Math.imul(x + 1, 0x9e3779b1) ^ Math.imul(y + 7, 0x85ebca77) ^ Math.imul(s + 13, 0xc2b2ae3d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return h >>> 0;
};

/** Renders w x h pixels; adaptive: a few samples first, more where they disagree. */
export function render(world: World, cam: Camera, w: number, h: number, opts: RenderOptions = {}): Picture {
  const spp = opts.spp ?? 4;
  const edge = opts.edgeSpp ?? 16;
  const rgb = new Float32Array(w * h * 3);
  const alpha = opts.ghost ? new Float32Array(w * h) : undefined;
  const [ax0, ay0, ax1, ay1] = opts.area ?? [0, 0, w, h];
  const hr = new HitRec();
  for (let y = ay0; y < ay1; y++)
    for (let x = ax0; x < ax1; x++) {
      const rs = new Sampler(hash(x, y, opts.seed ?? 1));
      const acc: V = [0, 0, 0];
      let cover = 0;
      let n = 0;
      let lo = Infinity;
      let hi = -Infinity;
      const shoot = (k: number, total: number) => {
        const g = Math.ceil(Math.sqrt(total));
        const sx = x + ((k % g) + rs.next()) / g;
        const sy = y + ((Math.floor(k / g) % g) + rs.next()) / g;
        const [o, d] = cam.ray(sx, sy, rs.next(), rs.next());
        let c: V;
        if (opts.ghost) {
          if (intersect(world, o, d, hr, true)) {
            c = shadeHit(world, o, d, hr, rs, 0);
            cover++;
          } else c = [0, 0, 0];
        } else c = trace(world, o, d, rs);
        acc[0] += c[0];
        acc[1] += c[1];
        acc[2] += c[2];
        const l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
        if (l < lo) lo = l;
        if (l > hi) hi = l;
        n++;
      };
      for (let k = 0; k < spp; k++) shoot(k, spp);
      if (edge > spp && (hi - lo > 0.06 || (opts.ghost && cover > 0 && cover < n))) for (let k = 0; k < edge; k++) shoot(k, edge);
      const i = y * w + x;
      rgb[i * 3] = acc[0] / n;
      rgb[i * 3 + 1] = acc[1] / n;
      rgb[i * 3 + 2] = acc[2] / n;
      if (alpha) alpha[i] = cover / n;
    }
  return { w, h, rgb, alpha };
}

/** A separable Gaussian blur of rgb (premultiplied by alpha when there is one). */
export function blur(p: Picture, sigma: number): Picture {
  const { w, h } = p;
  const r = Math.max(1, Math.ceil(sigma * 2.5));
  const k: number[] = [];
  for (let i = -r; i <= r; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const sum = k.reduce((a, b) => a + b, 0);
  const ch = p.alpha ? 4 : 3;
  const src = new Float32Array(w * h * ch);
  for (let i = 0; i < w * h; i++) {
    const a = p.alpha ? p.alpha[i] : 1;
    src[i * ch] = p.rgb[i * 3] * a;
    src[i * ch + 1] = p.rgb[i * 3 + 1] * a;
    src[i * ch + 2] = p.rgb[i * 3 + 2] * a;
    if (p.alpha) src[i * ch + 3] = a;
  }
  const pass = (from: Float32Array, horiz: boolean) => {
    const to = new Float32Array(from.length);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        for (let c = 0; c < ch; c++) {
          let s = 0;
          for (let j = -r; j <= r; j++) {
            const xx = horiz ? Math.min(w - 1, Math.max(0, x + j)) : x;
            const yy = horiz ? y : Math.min(h - 1, Math.max(0, y + j));
            s += from[(yy * w + xx) * ch + c] * k[j + r];
          }
          to[(y * w + x) * ch + c] = s / sum;
        }
    return to;
  };
  const out = pass(pass(src, true), false);
  const rgb = new Float32Array(w * h * 3);
  const alpha = p.alpha ? new Float32Array(w * h) : undefined;
  for (let i = 0; i < w * h; i++) {
    const a = p.alpha ? out[i * ch + 3] : 1;
    const inv = a > 1e-4 ? 1 / a : 0;
    rgb[i * 3] = out[i * ch] * inv;
    rgb[i * 3 + 1] = out[i * ch + 1] * inv;
    rgb[i * 3 + 2] = out[i * ch + 2] * inv;
    if (alpha) alpha[i] = a;
  }
  return { w, h, rgb, alpha };
}

/** Lays `top` (with its alpha times `opacity`) over `base`, in place. */
export function over(base: Picture, top: Picture, opacity = 1, dx = 0, dy = 0): Picture {
  for (let y = 0; y < top.h; y++)
    for (let x = 0; x < top.w; x++) {
      const bx = x + dx;
      const by = y + dy;
      if (bx < 0 || by < 0 || bx >= base.w || by >= base.h) continue;
      const i = y * top.w + x;
      const a = (top.alpha ? top.alpha[i] : 1) * opacity;
      if (a <= 0) continue;
      const j = (by * base.w + bx) * 3;
      for (let c = 0; c < 3; c++) base.rgb[j + c] = base.rgb[j + c] * (1 - a) + top.rgb[i * 3 + c] * a;
    }
  return base;
}

/** Bright parts bleed light around them (the glow every 1995 renderer's users added in post). */
export function bloom(p: Picture, threshold = 0.85, sigma = 3, strength = 0.6): Picture {
  const bright: Picture = { w: p.w, h: p.h, rgb: new Float32Array(p.rgb.length) };
  for (let i = 0; i < p.rgb.length; i++) bright.rgb[i] = Math.max(0, p.rgb[i] - threshold);
  const b = blur(bright, sigma);
  for (let i = 0; i < p.rgb.length; i++) p.rgb[i] += b.rgb[i] * strength;
  return p;
}

/** A lens flare at (fx, fy): hot core, a streak, a halo and a row of ghosts toward the center. */
export function flare(p: Picture, fx: number, fy: number, intensity: number, tint: V = [1, 0.95, 0.85], aspect = 1.2): Picture {
  const { w, h } = p;
  const ghosts: [number, number, V][] = [
    [-0.3, 7, [0.35, 0.9, 0.55]],
    [-0.62, 13, [0.65, 0.4, 1.0]],
    [0.42, 5, [1.0, 0.65, 0.3]],
    [-1.15, 20, [0.35, 0.6, 1.0]],
  ];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = x + 0.5 - fx;
      const dy = (y + 0.5 - fy) * aspect;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      const core = Math.exp(-r2 / 14) * 1.3;
      const halo = Math.max(0, 1 - r / 30) ** 2 * 0.32;
      const streak = Math.abs(dy) < 2.5 && Math.abs(dx) < w * 0.45 ? (1 - Math.abs(dy) / 2.5) ** 2 * (1 - Math.abs(dx) / (w * 0.45)) ** 2 * 0.8 : 0;
      const k = (y * w + x) * 3;
      const add3: V = [(core + halo + streak) * tint[0], (core + halo * 0.85 + streak) * tint[1], (core * 0.9 + halo * 0.6 + streak * 1.1) * tint[2]];
      for (const [pos, rad, gt] of ghosts) {
        const gx = w / 2 + (fx - w / 2) * pos;
        const gy = h / 2 + (fy - h / 2) * pos;
        const gr = Math.hypot(x + 0.5 - gx, (y + 0.5 - gy) * aspect);
        const a = clamp01((rad - gr) / 1.5) * (0.1 + 0.1 * (gr / rad) ** 3);
        for (let c = 0; c < 3; c++) add3[c] += gt[c] * a;
      }
      for (let c = 0; c < 3; c++) p.rgb[k + c] += add3[c] * intensity;
    }
  return p;
}

/** Linear 0..1 to 8-bit, with a gentle filmic shoulder so highlights roll off instead of clipping flat. */
export function toBytes(p: Picture, exposure = 1): Uint8Array {
  const out = new Uint8Array(p.w * p.h * 3);
  for (let i = 0; i < out.length; i++) {
    const v = p.rgb[i] * exposure;
    const t = v < 0.8 ? v : 0.8 + (1 - Math.exp(-(v - 0.8) * 3)) * 0.2;
    out[i] = Math.round(clamp01(t) ** (1 / 1.1) * 255);
  }
  return out;
}
