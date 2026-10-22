// Drawing tools for Maximus: ASCII sprites, masks shaded like lit volumes, automatic
// outlines, and textures for terrain. Everything is 20x20 palette indices; 255 is clear.
import { Pixels, rng } from '../../../kit/pixels';
import { TRANSPARENT, emptyBlock, type Block } from '../../../../web/src/formats/blocks';

export const CLEAR = TRANSPARENT;
export const N = 20;

export function sprite(): Pixels {
  return new Pixels(N, N, CLEAR);
}

/** ASCII art → pixels; unknown characters stay clear. */
export function ascii(rows: string[], key: Record<string, number>, into = sprite()): Pixels {
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch in key && into.set(x, y, key[ch])));
  return into;
}

/** A boolean mask (20x20 unless sized). */
export class Mask {
  readonly m: Uint8Array;
  constructor(
    readonly w = N,
    readonly h = N,
  ) {
    this.m = new Uint8Array(w * h);
  }
  get(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.m[y * this.w + x] === 1;
  }
  set(x: number, y: number, on = true): this {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = on ? 1 : 0;
    return this;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, on = true): this {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++)
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.set(x, y, on);
    return this;
  }
  rect(x: number, y: number, w: number, h: number, on = true): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, on);
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, width = 1, on = true): this {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      if (width <= 1) this.set(x, y, on);
      else this.ellipse(x + 0.5, y + 0.5, width / 2, width / 2, on);
    }
    return this;
  }
  poly(pts: [number, number][], on = true): this {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        const yy = y + 0.5;
        if (ay <= yy !== by <= yy) xs.push(ax + ((yy - ay) * (bx - ax)) / (by - ay));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.set(x, y, on);
    }
    return this;
  }
  or(o: Mask): this {
    for (let i = 0; i < this.m.length; i++) this.m[i] |= o.m[i];
    return this;
  }
  minus(o: Mask): this {
    for (let i = 0; i < this.m.length; i++) if (o.m[i]) this.m[i] = 0;
    return this;
  }
  count(): number {
    return this.m.reduce((a, b) => a + b, 0);
  }
  clone(): Mask {
    const c = new Mask(this.w, this.h);
    c.m.set(this.m);
    return c;
  }
  flipX(): Mask {
    const c = new Mask(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.get(x, y)) c.set(this.w - 1 - x, y);
    return c;
  }
  shift(dx: number, dy: number): Mask {
    const c = new Mask(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.get(x, y)) c.set(x + dx, y + dy);
    return c;
  }
}

/**
 * Paints a mask as a lit volume: light from the upper left, so pixels near the top-left
 * edge are bright and the lower-right ones dark. `ramp` is dark..light.
 */
export function shade(p: Pixels, mask: Mask, ramp: number[], opts: { light?: [number, number]; flat?: number; dither?: boolean; seed?: number } = {}): Pixels {
  const [lx, ly] = opts.light ?? [-1, -1];
  // distance to the edge along the light direction and away from it
  const r = rng(opts.seed ?? 3);
  let minV = Infinity;
  let maxV = -Infinity;
  const vals = new Float32Array(mask.w * mask.h);
  for (let y = 0; y < mask.h; y++)
    for (let x = 0; x < mask.w; x++) {
      if (!mask.get(x, y)) continue;
      let toward = 0;
      while (mask.get(x + Math.sign(lx) * (toward + 1), y + Math.sign(ly) * (toward + 1)) && toward < 20) toward++;
      let away = 0;
      while (mask.get(x - Math.sign(lx) * (away + 1), y - Math.sign(ly) * (away + 1)) && away < 20) away++;
      // bright near the lit edge, dark near the far edge, a rim of light in the middle
      const v = away / (toward + away + 1) - (toward === 0 ? -0.25 : 0) + (opts.flat ?? 0);
      vals[y * mask.w + x] = v;
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }
  for (let y = 0; y < mask.h; y++)
    for (let x = 0; x < mask.w; x++) {
      if (!mask.get(x, y)) continue;
      let t = (vals[y * mask.w + x] - minV) / Math.max(0.001, maxV - minV);
      if (opts.dither) t += (r() - 0.5) * 0.18;
      const k = Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1) * 0.85 + 0.15 * (ramp.length - 1) * 0.5)));
      p.set(x, y, ramp[k]);
    }
  return p;
}

/** Fills a mask with one color. */
export function fill(p: Pixels, mask: Mask, c: number): Pixels {
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) if (mask.get(x, y)) p.set(x, y, c);
  return p;
}

/** Draws a 1 pixel outline around every opaque pixel (on clear pixels only). */
export function outline(p: Pixels, c: number, diagonal = false): Pixels {
  const src = p.px.slice();
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < p.w && y < p.h && src[y * p.w + x] !== CLEAR;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (at(x, y)) continue;
      const near =
        at(x - 1, y) ||
        at(x + 1, y) ||
        at(x, y - 1) ||
        at(x, y + 1) ||
        (diagonal && (at(x - 1, y - 1) || at(x + 1, y - 1) || at(x - 1, y + 1) || at(x + 1, y + 1)));
      if (near) p.set(x, y, c);
    }
  return p;
}

/** Copies pixels into a block record. */
export function toBlock(p: Pixels, index: number, props: Partial<Block> = {}): Block {
  const b = emptyBlock(index);
  b.pixels.set(p.px);
  return Object.assign(b, props);
}

/** Replaces colors through a map (palette-swapping a sprite between ramps). */
export function recolor(p: Pixels, map: Map<number, number>): Pixels {
  const q = new Pixels(p.w, p.h);
  q.px.set(p.px);
  return q.map((_x, _y, c) => map.get(c) ?? c);
}

/** Value noise in 0..1 that tiles every `period` pixels (for seamless block textures). */
export function tileNoise(seed: number, period = N, cells = 4): (x: number, y: number) => number {
  const r = rng(seed);
  const g = Array.from({ length: cells * cells }, () => r());
  const at = (i: number, j: number) => g[(((j % cells) + cells) % cells) * cells + (((i % cells) + cells) % cells)];
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / period) * cells;
    const fy = (y / period) * cells;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const u = s(fx - i);
    const v = s(fy - j);
    return at(i, j) * (1 - u) * (1 - v) + at(i + 1, j) * u * (1 - v) + at(i, j + 1) * (1 - u) * v + at(i + 1, j + 1) * u * v;
  };
}

/** Two octaves of tiling noise. */
export function fbm(seed: number): (x: number, y: number) => number {
  const a = tileNoise(seed, N, 4);
  const b = tileNoise(seed + 77, N, 10);
  return (x, y) => a(x, y) * 0.7 + b(x, y) * 0.3;
}

/** Picks from a ramp by 0..1. */
export const pick = (ramp: number[], t: number) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))];
