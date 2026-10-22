// From renders to VGA: median cut picks the colors, then each pixel is matched through an
// ordered dither (tiles, sprites and animations: still areas stay byte-identical, blocks tile
// without seams) or Floyd-Steinberg error diffusion (still pictures: the smoothest gradients
// 256 colors can give).

/** 8-bit RGB, 3 bytes a pixel. */
export type Rgb = Uint8Array;
export type Col = [number, number, number];

/**
 * `want` colors (8-bit RGB) for these pixels by median cut over a 5-bit histogram. Counts are
 * square-rooted so a small highlight still earns colors next to a big floor. `weight` scales
 * a frame's say.
 */
export function medianCut(frames: Rgb[], want: number, weights?: number[]): Col[] {
  const hist = new Float64Array(32768);
  frames.forEach((f, k) => {
    const wt = weights?.[k] ?? 1;
    for (let i = 0; i < f.length; i += 3) hist[((f[i] >> 3) << 10) | ((f[i + 1] >> 3) << 5) | (f[i + 2] >> 3)] += wt;
  });
  const bins: number[] = [];
  for (let b = 0; b < hist.length; b++) if (hist[b]) bins.push(b);
  if (!bins.length) return [];
  const w = (b: number) => Math.sqrt(hist[b]);
  const chan = (b: number, c: number) => (b >> (10 - c * 5)) & 31;
  type Box = { bins: number[]; weight: number };
  const boxes: Box[] = [{ bins, weight: bins.reduce((s, b) => s + w(b), 0) }];
  while (boxes.length < want) {
    let best = -1;
    let bestScore = 0;
    let bestChan = 0;
    boxes.forEach((box, i) => {
      if (box.bins.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let lo = 31;
        let hi = 0;
        for (const b of box.bins) {
          const v = chan(b, c);
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        // green differences show most, blue least
        const score = (hi - lo) * [1.0, 1.2, 0.8][c] * Math.sqrt(box.weight);
        if (score > bestScore) {
          bestScore = score;
          best = i;
          bestChan = c;
        }
      }
    });
    if (best < 0) break;
    const box = boxes[best];
    box.bins.sort((a, b) => chan(a, bestChan) - chan(b, bestChan) || a - b);
    let acc = 0;
    let cut = 1;
    for (; cut < box.bins.length - 1; cut++) {
      acc += w(box.bins[cut - 1]);
      if (acc >= box.weight / 2) break;
    }
    const a = box.bins.slice(0, cut);
    const b = box.bins.slice(cut);
    boxes.splice(best, 1, { bins: a, weight: a.reduce((s, x) => s + w(x), 0) }, { bins: b, weight: b.reduce((s, x) => s + w(x), 0) });
  }
  return boxes.map((box) => {
    let r = 0;
    let g = 0;
    let bl = 0;
    for (const b of box.bins) {
      r += chan(b, 0) * w(b);
      g += chan(b, 1) * w(b);
      bl += chan(b, 2) * w(b);
    }
    const to8 = (v: number) => Math.min(255, Math.round((v / box.weight) * 8 + 4));
    return [to8(r), to8(g), to8(bl)] as Col;
  });
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Matches colors to a 6-bit VGA palette (768 bytes), choosing only from `allowed` entries. */
export class Matcher {
  private readonly lut = new Map<number, number>();
  readonly allowed: number[];
  constructor(
    readonly pal: Uint8Array,
    allowed?: number[],
  ) {
    this.allowed = allowed ?? Array.from({ length: 255 }, (_, i) => i);
  }

  /** Nearest entry to an 8-bit color. */
  nearest(r: number, g: number, b: number): number {
    const r6 = Math.max(0, Math.min(63, Math.round(r / 4.048)));
    const g6 = Math.max(0, Math.min(63, Math.round(g / 4.048)));
    const b6 = Math.max(0, Math.min(63, Math.round(b / 4.048)));
    const key = (r6 << 12) | (g6 << 6) | b6;
    const hit = this.lut.get(key);
    if (hit !== undefined) return hit;
    let best = Infinity;
    let v = this.allowed[0];
    for (const i of this.allowed) {
      const dr = this.pal[i * 3] - r6;
      const dg = this.pal[i * 3 + 1] - g6;
      const db = this.pal[i * 3 + 2] - b6;
      const rm = (this.pal[i * 3] + r6) / 2;
      // a cheap perceptual weighting ("redmean")
      const d = (2 + rm / 64) * dr * dr + 4 * dg * dg + (3 - rm / 64) * db * db;
      if (d < best) {
        best = d;
        v = i;
      }
    }
    this.lut.set(key, v);
    return v;
  }

  color(i: number): Col {
    return [this.pal[i * 3] * 4.048, this.pal[i * 3 + 1] * 4.048, this.pal[i * 3 + 2] * 4.048];
  }

  /** Ordered dither (4x4 Bayer of `amount` 8-bit steps), aligned to (ox, oy) so tiles repeat seamlessly. */
  ordered(rgb: Rgb, w: number, h: number, amount = 10, ox = 0, oy = 0, alpha?: Float32Array, clear = 255): Uint8Array {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (alpha && alpha[i] < 0.5) {
          out[i] = clear;
          continue;
        }
        const d = (BAYER[((y + oy) & 3) * 4 + ((x + ox) & 3)] / 16 - 0.47) * amount;
        out[i] = this.nearest(rgb[i * 3] + d, rgb[i * 3 + 1] + d, rgb[i * 3 + 2] + d);
      }
    return out;
  }

  /** Floyd-Steinberg error diffusion, serpentine, with errors damped a little (less crawl). */
  diffuse(rgb: Rgb, w: number, h: number, damp = 0.85): Uint8Array {
    const out = new Uint8Array(w * h);
    const err = new Float32Array(rgb.length);
    for (let i = 0; i < rgb.length; i++) err[i] = rgb[i];
    for (let y = 0; y < h; y++) {
      const ltr = y % 2 === 0;
      for (let k = 0; k < w; k++) {
        const x = ltr ? k : w - 1 - k;
        const i = y * w + x;
        const r = err[i * 3];
        const g = err[i * 3 + 1];
        const b = err[i * 3 + 2];
        const p = this.nearest(r, g, b);
        out[i] = p;
        const c = this.color(p);
        const e = [(r - c[0]) * damp, (g - c[1]) * damp, (b - c[2]) * damp];
        const spread = (dx: number, dy: number, f: number) => {
          const xx = x + (ltr ? dx : -dx);
          const yy = y + dy;
          if (xx < 0 || xx >= w || yy >= h) return;
          const j = (yy * w + xx) * 3;
          for (let ch = 0; ch < 3; ch++) err[j + ch] += e[ch] * f;
        };
        spread(1, 0, 7 / 16);
        spread(-1, 1, 3 / 16);
        spread(0, 1, 5 / 16);
        spread(1, 1, 1 / 16);
      }
    }
    return out;
  }
}

/** A palette (768 bytes of 6-bit VGA) from 8-bit colors placed at `at`. */
export function putColors(pal: Uint8Array, at: number, cols: Col[]): number[] {
  return cols.map((c, i) => {
    pal.set([c[0] >> 2, c[1] >> 2, c[2] >> 2], (at + i) * 3);
    return at + i;
  });
}

/** A whole-picture palette: `fixed` entries first, then median cut for the rest (255 left black). */
export function pictureColors(frames: Rgb[], fixed: Col[] = [], total = 255): { pal: Uint8Array; matcher: Matcher } {
  const pal = new Uint8Array(768);
  putColors(pal, 0, fixed);
  putColors(pal, fixed.length, medianCut(frames, total - fixed.length));
  return { pal, matcher: new Matcher(pal, Array.from({ length: total }, (_, i) => i)) };
}
