// Turning true-color renders into 256-color VGA pictures, the way a 1995 renderer's
// "save as 8-bit" did: one palette chosen for every frame of an animation (median cut over
// a histogram of all of them), then each pixel matched to it through an ordered dither.
// One shared palette and a dither fixed to the screen keep still areas byte-identical from
// frame to frame, which is what lets an FLI store only the changes.

/** 8-bit RGB pixels, 3 bytes each. */
type Rgb = Uint8Array;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

interface Box {
  bins: number[];
  weight: number;
}

/**
 * A palette for these frames: `fixed` colors first (8-bit RGB, such as black), then median
 * cut over a 5-bit-per-channel histogram fills the rest of the 256 entries. Returns 768
 * bytes of 6-bit VGA components.
 */
export function medianCutPalette(frames: Rgb[], fixed: [number, number, number][] = [[0, 0, 0]]): Uint8Array {
  const hist = new Float64Array(32768);
  for (const f of frames) for (let i = 0; i < f.length; i += 3) hist[((f[i] >> 3) << 10) | ((f[i + 1] >> 3) << 5) | (f[i + 2] >> 3)]++;
  // Square-rooted counts so a small bright highlight still earns colors next to a big sky.
  const bins: number[] = [];
  for (let b = 0; b < hist.length; b++) if (hist[b]) bins.push(b);
  const w = (b: number) => Math.sqrt(hist[b]);
  const chan = (b: number, c: number) => (b >> (10 - c * 5)) & 31;
  const boxes: Box[] = [{ bins, weight: bins.reduce((s, b) => s + w(b), 0) }];
  const want = 256 - fixed.length;
  while (boxes.length < want) {
    // split the box with the most weight times extent along its widest channel
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
        const score = (hi - lo) * box.weight;
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
  const pal = new Uint8Array(768);
  fixed.forEach(([r, g, b], i) => pal.set([r >> 2, g >> 2, b >> 2], i * 3));
  boxes.forEach((box, i) => {
    let r = 0;
    let g = 0;
    let bl = 0;
    for (const b of box.bins) {
      r += chan(b, 0) * w(b);
      g += chan(b, 1) * w(b);
      bl += chan(b, 2) * w(b);
    }
    // the box's center of weight, from 5-bit bins (centered) to 6-bit VGA
    const to6 = (v: number) => Math.min(63, Math.round(((v / box.weight) * 8 + 4) / 4));
    pal.set([to6(r), to6(g), to6(bl)], (fixed.length + i) * 3);
  });
  return pal;
}

/** Maps 8-bit RGB pixels to a 6-bit palette with a 4x4 ordered dither of `amount` (8-bit steps). */
export class Quantizer {
  private readonly lut = new Int16Array(64 * 64 * 64).fill(-1);
  constructor(
    readonly palette: Uint8Array,
    readonly amount = 8,
  ) {}

  /** The nearest palette entry to a 6-bit color. */
  nearest(r: number, g: number, b: number): number {
    const k = (r << 12) | (g << 6) | b;
    let v = this.lut[k];
    if (v >= 0) return v;
    let best = 1e9;
    for (let i = 0; i < 256; i++) {
      const dr = this.palette[i * 3] - r;
      const dg = this.palette[i * 3 + 1] - g;
      const db = this.palette[i * 3 + 2] - b;
      // weighted for the eye: green matters most, blue least
      const d = 3 * dr * dr + 4 * dg * dg + 2 * db * db;
      if (d < best) {
        best = d;
        v = i;
      }
    }
    this.lut[k] = v;
    return v;
  }

  /** A whole picture: `rgb` is w*h*3 bytes. */
  apply(rgb: Rgb, w: number, h: number): Uint8Array {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const d = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * this.amount;
        const c = (v: number) => Math.max(0, Math.min(63, Math.round((v + d) / 4.048)));
        out[i] = this.nearest(c(rgb[i * 3]), c(rgb[i * 3 + 1]), c(rgb[i * 3 + 2]));
      }
    return out;
  }
}
