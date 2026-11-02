// Pure image metrics for badgeSimilar.ts: luminance, edges, color-vision-deficiency filters and
// pair distances. Kept here, not in packages/tools, because nothing else uses them yet and a package
// module needs a built dist for tsc and `verify:packages`; lift it there if a second user appears.
//
// CVD matrices: Machado, Oliveira and Fernandes, "A Physiologically-based Model for Simulation of
// Color Vision Deficiency", IEEE TVCG 15(6), 2009, severity 1.0 (the published tables, applied to
// linear RGB). Achromatopsia is plain luminance. See NOTICE.md.

import { MACHADO } from '../src/editor/editors/palette/machadoMatrices';

/** 8-bit RGBA, row-major. */
export interface Raster {
  w: number;
  h: number;
  data: Uint8Array;
}

export type Matrix = readonly [number, number, number, number, number, number, number, number, number];

export const CVD: Record<string, Matrix> = {
  protanopia: MACHADO.protan,
  deuteranopia: MACHADO.deutan,
  tritanopia: MACHADO.tritan,
};
export const FILTERS = [...Object.keys(CVD), 'achromatopsia'] as const;

const toLinear = (v: number): number => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number): number => {
  const v = Math.min(1, Math.max(0, c));
  return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
};

/** Rec. 601 luma of gamma-encoded RGB, 0-255. */
export const luma = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;

/** Flatten transparency onto a flat gray so alpha never reads as black. */
export function flatten(r: Raster, bg = 128): Raster {
  const data = new Uint8Array(r.data.length);
  for (let i = 0; i < r.data.length; i += 4) {
    const a = r.data[i + 3] / 255;
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(r.data[i + c] * a + bg * (1 - a));
    data[i + 3] = 255;
  }
  return { w: r.w, h: r.h, data };
}

/** Nearest-neighbour resize (an integer factor keeps pixel art exact). */
export function resize(r: Raster, w: number, h: number): Raster {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const s = (Math.floor((y * r.h) / h) * r.w + Math.floor((x * r.w) / w)) * 4;
      data.set(r.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  return { w, h, data };
}

/** The picture as a person with the given vision would see it. */
export function simulate(r: Raster, filter: string): Raster {
  const data = new Uint8Array(r.data.length);
  const m = CVD[filter];
  for (let i = 0; i < r.data.length; i += 4) {
    const R = r.data[i],
      G = r.data[i + 1],
      B = r.data[i + 2];
    if (m) {
      const lr = toLinear(R),
        lg = toLinear(G),
        lb = toLinear(B);
      data[i] = fromLinear(m[0] * lr + m[1] * lg + m[2] * lb);
      data[i + 1] = fromLinear(m[3] * lr + m[4] * lg + m[5] * lb);
      data[i + 2] = fromLinear(m[6] * lr + m[7] * lg + m[8] * lb);
    } else data[i] = data[i + 1] = data[i + 2] = Math.round(luma(R, G, B));
    data[i + 3] = 255;
  }
  return { w: r.w, h: r.h, data };
}

export const gray = (r: Raster): Raster => simulate(r, 'achromatopsia');

const lumas = (r: Raster): Float32Array => Float32Array.from({ length: r.w * r.h }, (_, i) => luma(r.data[i * 4], r.data[i * 4 + 1], r.data[i * 4 + 2]));

/** Mean absolute luminance difference, 0 (same) to 1. Rasters must be the same size. */
export function lumaDiff(a: Raster, b: Raster): number {
  const x = lumas(a),
    y = lumas(b);
  let s = 0;
  for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i]);
  return s / x.length / 255;
}

/** Mean absolute difference over all color channels, 0 to 1. */
export function colorDiff(a: Raster, b: Raster): number {
  let s = 0;
  for (let i = 0; i < a.data.length; i += 4) for (let c = 0; c < 3; c++) s += Math.abs(a.data[i + c] - b.data[i + c]);
  return s / (a.w * a.h * 3) / 255;
}

/** Edge mask: where the luminance step to the right or below is at least `step` (of 255). */
export function edges(r: Raster, step = 24): Uint8Array {
  const l = lumas(r),
    m = new Uint8Array(r.w * r.h);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const i = y * r.w + x;
      const dx = x + 1 < r.w ? Math.abs(l[i] - l[i + 1]) : 0;
      const dy = y + 1 < r.h ? Math.abs(l[i] - l[i + r.w]) : 0;
      m[i] = dx >= step || dy >= step ? 1 : 0;
    }
  return m;
}

/** 1 - Jaccard overlap of two masks (0 same shape, 1 nothing shared); two empty masks are the same. */
export function maskDistance(a: Uint8Array, b: Uint8Array): number {
  let both = 0,
    either = 0;
  for (let i = 0; i < a.length; i++) {
    both += a[i] & b[i];
    either += a[i] | b[i];
  }
  return either === 0 ? 0 : 1 - both / either;
}

/** Area-average down to w x h (for the coarse pass). */
export function downsample(r: Raster, w: number, h: number): Raster {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * r.w) / w),
        x1 = Math.max(x0 + 1, Math.floor(((x + 1) * r.w) / w));
      const y0 = Math.floor((y * r.h) / h),
        y1 = Math.max(y0 + 1, Math.floor(((y + 1) * r.h) / h));
      const sum = [0, 0, 0];
      let n = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++, n++) for (let c = 0; c < 3; c++) sum[c] += r.data[(yy * r.w + xx) * 4 + c];
      for (let c = 0; c < 3; c++) data[(y * w + x) * 4 + c] = Math.round(sum[c] / n);
      data[(y * w + x) * 4 + 3] = 255;
    }
  return { w, h, data };
}

/**
 * Structural luminance distance, 0 (look the same in gray) to about 1: the mean luminance
 * difference scaled so a typical unrelated pair lands near 0.5, blended with the edge-shape distance.
 */
export function grayDistance(a: Raster, b: Raster): number {
  return viewDistance(view(a, 'achromatopsia'), view(b, 'achromatopsia'));
}

/** A picture as seen through a filter ('none' = normal), with its edge mask worked out once. */
export interface View {
  r: Raster;
  edge: Uint8Array;
}
export function view(r: Raster, filter: string): View {
  const v = filter === 'none' ? r : simulate(r, filter);
  return { r: v, edge: edges(v) };
}
/** Color difference (scaled so an unrelated pair lands near 0.5) blended with edge-shape distance. */
export function viewDistance(a: View, b: View): number {
  return 0.5 * Math.min(1, colorDiff(a.r, b.r) * 4) + 0.5 * maskDistance(a.edge, b.edge);
}

/** Average distance of the two pictures as seen through a filter: color difference plus shape. */
export function filteredDistance(a: Raster, b: Raster, filter: string): number {
  return viewDistance(view(a, filter), view(b, filter));
}

/** Mean distance of the colors from their own gray, over 0-1 (0 = already a gray picture). */
export function chroma(r: Raster): number {
  let s = 0;
  for (let i = 0; i < r.data.length; i += 4) {
    const l = luma(r.data[i], r.data[i + 1], r.data[i + 2]);
    s += (Math.abs(r.data[i] - l) + Math.abs(r.data[i + 1] - l) + Math.abs(r.data[i + 2] - l)) / 3;
  }
  return s / (r.w * r.h) / 255;
}

/** The page's unearned look: grayscale(1) at 60% opacity over a light panel. */
export function unearned(r: Raster, panel = 244): Raster {
  const g = gray(r),
    data = new Uint8Array(g.data.length);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(g.data[i + c] * 0.6 + panel * 0.4);
    data[i + 3] = 255;
  }
  return { w: r.w, h: r.h, data };
}
