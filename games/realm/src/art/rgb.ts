// True-color drawing for the realm's art: every block, sprite and screen is painted in floating
// point RGB with antialiased edges, lighting and texture, and only then reduced to the scene's
// 256-color VGA palette (art/pal.ts). That is the "beyond 1995 paint software" part: a 1995
// artist pushed single pixels; this paints with coverage, gradients and tileable noise, then
// dithers into the same 8-bit files Game-Maker 3.0 always read.

export type RGB = [number, number, number];

/** A w x h true-color picture with an alpha channel (0 = nothing drawn, 1 = solid). */
export class Canvas {
  readonly c: Float32Array;
  readonly a: Float32Array;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.c = new Float32Array(w * h * 3);
    this.a = new Float32Array(w * h);
  }

  get(x: number, y: number): RGB {
    const i = (y * this.w + x) * 3;
    return [this.c[i], this.c[i + 1], this.c[i + 2]];
  }

  alpha(x: number, y: number): number {
    return this.a[y * this.w + x];
  }

  /** Paints color `col` over pixel (x, y) with coverage `k` (0..1). */
  blend(x: number, y: number, col: RGB, k = 1): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || k <= 0) return;
    if (k > 1) k = 1;
    const p = y * this.w + x;
    const i = p * 3;
    this.c[i] += (col[0] - this.c[i]) * k;
    this.c[i + 1] += (col[1] - this.c[i + 1]) * k;
    this.c[i + 2] += (col[2] - this.c[i + 2]) * k;
    this.a[p] = this.a[p] + (1 - this.a[p]) * k;
  }

  set(x: number, y: number, col: RGB): this {
    this.blend(x, y, col, 1);
    return this;
  }

  /** Every pixel through a shader that sees pixel-center coordinates (x + 0.5, y + 0.5). */
  shade(fn: (x: number, y: number) => RGB | undefined, ss = 1): this {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (ss === 1) {
          const col = fn(x + 0.5, y + 0.5);
          if (col) this.set(x, y, col);
          continue;
        }
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let sy = 0; sy < ss; sy++)
          for (let sx = 0; sx < ss; sx++) {
            const col = fn(x + (sx + 0.5) / ss, y + (sy + 0.5) / ss);
            if (!col) continue;
            r += col[0];
            g += col[1];
            b += col[2];
            n++;
          }
        if (n) this.blend(x, y, [r / n, g / n, b / n], n / (ss * ss));
      }
    return this;
  }

  /** Antialiased shape: `inside(x, y)` is a signed distance (negative inside), painted with `col(x, y)`. */
  fillSdf(sdf: (x: number, y: number) => number, col: RGB | ((x: number, y: number) => RGB), ss = 4): this {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const d0 = sdf(x + 0.5, y + 0.5);
        if (d0 > 1.5) continue;
        let k: number;
        if (d0 < -1.5) k = 1;
        else {
          let n = 0;
          for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) if (sdf(x + (sx + 0.5) / ss, y + (sy + 0.5) / ss) <= 0) n++;
          k = n / (ss * ss);
        }
        if (k > 0) this.blend(x, y, typeof col === 'function' ? col(x + 0.5, y + 0.5) : col, k);
      }
    return this;
  }

  disc(cx: number, cy: number, r: number, col: RGB | ((x: number, y: number) => RGB)): this {
    return this.fillSdf((x, y) => Math.hypot(x - cx, y - cy) - r, col);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, col: RGB | ((x: number, y: number) => RGB)): this {
    return this.fillSdf((x, y) => (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry), col);
  }

  rect(x0: number, y0: number, w: number, h: number, col: RGB | ((x: number, y: number) => RGB)): this {
    return this.fillSdf((x, y) => Math.max(x0 - x, x - (x0 + w), y0 - y, y - (y0 + h)), col);
  }

  /** A rounded rectangle. */
  rrect(x0: number, y0: number, w: number, h: number, r: number, col: RGB | ((x: number, y: number) => RGB)): this {
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;
    return this.fillSdf((x, y) => {
      const qx = Math.abs(x - cx) - (w / 2 - r);
      const qy = Math.abs(y - cy) - (h / 2 - r);
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    }, col);
  }

  /** A thick antialiased line segment with round caps. */
  line(x0: number, y0: number, x1: number, y1: number, width: number, col: RGB | ((x: number, y: number) => RGB)): this {
    return this.fillSdf((x, y) => segDist(x, y, x0, y0, x1, y1) - width / 2, col);
  }

  /** A filled polygon (even-odd), antialiased. */
  poly(pts: [number, number][], col: RGB | ((x: number, y: number) => RGB)): this {
    return this.fillSdf((x, y) => polySdf(x, y, pts), col);
  }

  /** Copies another canvas over this one at (dx, dy), by its alpha. */
  draw(src: Canvas, dx: number, dy: number): this {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const k = src.alpha(x, y);
        if (k > 0) this.blend(dx + x, dy + y, src.get(x, y), k);
      }
    return this;
  }

  /** A sub-rectangle as a new canvas. */
  crop(x0: number, y0: number, w: number, h: number): Canvas {
    const out = new Canvas(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const sx = x0 + x;
        const sy = y0 + y;
        if (sx < 0 || sy < 0 || sx >= this.w || sy >= this.h) continue;
        const i = (sy * this.w + sx) * 3;
        const o = (y * w + x) * 3;
        out.c[o] = this.c[i];
        out.c[o + 1] = this.c[i + 1];
        out.c[o + 2] = this.c[i + 2];
        out.a[y * w + x] = this.a[sy * this.w + sx];
      }
    return out;
  }

  /** Mirrored left to right. */
  flipX(): Canvas {
    const out = new Canvas(this.w, this.h);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = (y * this.w + x) * 3;
        const o = (y * this.w + (this.w - 1 - x)) * 3;
        out.c[o] = this.c[i];
        out.c[o + 1] = this.c[i + 1];
        out.c[o + 2] = this.c[i + 2];
        out.a[y * this.w + (this.w - 1 - x)] = this.a[y * this.w + x];
      }
    return out;
  }

  /** Every drawn pixel's color through fn (lighting passes, tints). */
  tint(fn: (c: RGB, x: number, y: number) => RGB): this {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const p = y * this.w + x;
        if (this.a[p] <= 0) continue;
        const [r, g, b] = fn(this.get(x, y), x, y);
        this.c[p * 3] = r;
        this.c[p * 3 + 1] = g;
        this.c[p * 3 + 2] = b;
      }
    return this;
  }

  /** A dark outline one pixel wide around everything drawn (sprites read better on busy ground). */
  outline(col: RGB, k = 1): this {
    const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && this.a[y * this.w + x] > 0.5;
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) add.push([x, y]);
    for (const [x, y] of add) {
      const p = y * this.w + x;
      this.a[p] = 0;
      this.blend(x, y, col, k);
      this.a[p] = 1;
    }
    return this;
  }
}

export function segDist(px: number, py: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2)) : 0;
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

export function polySdf(x: number, y: number, pts: [number, number][]): number {
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    d = Math.min(d, segDist(x, y, xi, yi, xj, yj));
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside ? -d : d;
}

// ---------------------------------------------------------------- color math

export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k];
export const add = (a: RGB, k: number): RGB => [a[0] + k, a[1] + k, a[2] + k];
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
export const hex = (s: string): RGB => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

/** A ramp lookup: t 0..1 through a list of color stops. */
export function ramp(stops: RGB[], t: number): RGB {
  t = clamp01(t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(t));
  return mix(stops[i], stops[i + 1], t - i);
}

// ---------------------------------------------------------------- tileable noise

function hash3(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Value noise that repeats every `period` pixels in both directions, so a texture drawn with it
 * in one 20x20 block runs seamlessly into the same texture in any neighbor (period divides 20).
 * `cell` is the lattice spacing in pixels.
 */
export function tnoise(x: number, y: number, cell: number, period: number, seed: number): number {
  const n = Math.max(1, Math.round(period / cell));
  const fx = x / cell;
  const fy = y / cell;
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const tx = fx - ix;
  const ty = fy - iy;
  const w = (i: number) => ((i % n) + n) % n;
  const v = (i: number, j: number) => hash3(w(i), w(j), seed);
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = v(ix, iy) + (v(ix + 1, iy) - v(ix, iy)) * sx;
  const b = v(ix, iy + 1) + (v(ix + 1, iy + 1) - v(ix, iy + 1)) * sx;
  return a + (b - a) * sy;
}

/** Fractal tileable noise (0..1): octaves of tnoise. */
export function fbm(x: number, y: number, period: number, seed: number, cell = 10, octaves = 3): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += tnoise(x, y, cell, period, seed + o * 17) * amp;
    norm += amp;
    amp *= 0.5;
    cell /= 2;
    if (cell < 1) break;
  }
  return sum / norm;
}

/** A per-pixel hash 0..1 that repeats every `period` pixels (sparkles, pebbles, flowers). */
export function speck(x: number, y: number, period: number, seed: number): number {
  const w = (v: number) => ((Math.floor(v) % period) + period) % period;
  return hash3(w(x), w(y), seed + 991);
}
