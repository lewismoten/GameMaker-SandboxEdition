// Drawing 20x20 Game-Maker blocks (and 320x200 screens) in code: a tiny indexed-color
// canvas with the shapes pixel artists reach for, plus seeded randomness for texture.
export class Pixels {
  readonly px: Uint8Array;
  constructor(
    readonly w: number,
    readonly h: number,
    fill = 0,
  ) {
    this.px = new Uint8Array(w * h).fill(fill);
  }

  get(x: number, y: number): number {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : this.px[y * this.w + x];
  }

  set(x: number, y: number, c: number): this {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: number): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    return this;
  }

  frame(x: number, y: number, w: number, h: number, c: number): this {
    this.rect(x, y, w, 1, c).rect(x, y + h - 1, w, 1, c);
    return this.rect(x, y, 1, h, c).rect(x + w - 1, y, 1, h, c);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: number): this {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
    return this;
  }

  disc(cx: number, cy: number, r: number, c: number): this {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, c);
    return this;
  }

  ring(cx: number, cy: number, r: number, c: number): this {
    for (let a = 0; a < Math.PI * 2; a += 0.5 / Math.max(1, r)) this.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c);
    return this;
  }

  /** Every pixel through fn(x, y, current) → new color (or the same). */
  map(fn: (x: number, y: number, c: number) => number): this {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.px[y * this.w + x] = fn(x, y, this.px[y * this.w + x]);
    return this;
  }

  /** Copies another picture in, skipping `transparent` pixels. */
  blit(src: Pixels, dx: number, dy: number, transparent = -1): this {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.px[y * src.w + x];
        if (c !== transparent) this.set(dx + x, dy + y, c);
      }
    return this;
  }

  /** A sub-rectangle as a new picture (cutting a 20x20 block out of a big drawing). */
  crop(x: number, y: number, w: number, h: number): Pixels {
    const p = new Pixels(w, h);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) p.px[yy * w + xx] = this.get(x + xx, y + yy) & 255;
    return p;
  }

  flipX(): Pixels {
    const p = new Pixels(this.w, this.h);
    return p.map((x, y) => this.get(this.w - 1 - x, y));
  }

  /** ASCII art: each character maps to a color through `key`; others are skipped. */
  draw(x: number, y: number, rows: string[], key: Record<string, number>): this {
    rows.forEach((row, yy) => [...row].forEach((ch, xx) => ch in key && this.set(x + xx, y + yy, key[ch])));
    return this;
  }
}

/** A seeded random number generator (mulberry32), so builds are reproducible. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 4x4 Bayer matrix ordered dither: true where a pixel at (x, y) should take the lighter color for level 0..1. */
export function dither(x: number, y: number, level: number): boolean {
  const M = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  return level * 16 > M[(y & 3) * 4 + (x & 3)];
}
