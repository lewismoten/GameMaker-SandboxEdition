// Real photos on a 1995 VGA screen: a scan (games/kit/scans/*.jpg, made by scans/scan.ts)
// cropped and resampled to the size it will have on screen, then reduced to the picture's
// 256-color palette the way a paint program's "paste photo" did. The colors the picture
// doesn't use become the photo's own (median cut), and Floyd-Steinberg dithering matches
// every pixel to those and the picture's colors. Polaroid frames, tape and the like are left
// to each game, in its own colors.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decodePartialJpeg } from '../../web/src/formats/jpeg';
import { Pixels } from './pixels';

/** True-color pixels, 3 bytes each, square. */
export interface Scan {
  w: number;
  h: number;
  rgb: Uint8Array;
}

/** Pixel width / height on a 4:3 monitor at 320x200. */
export const VGA_PIXEL = 5 / 6;

export function loadScan(name: string): Scan {
  const j = decodePartialJpeg(new Uint8Array(readFileSync(resolve(__dirname, 'scans', `${name}.jpg`))));
  if (!j?.complete || j.channels !== 3) throw new Error(`scan ${name} did not decode`);
  return { w: j.width, h: j.height, rgb: j.pixels };
}

/**
 * The part of a scan inside `crop` (fractions), resampled by area to w x h screen pixels.
 * Pass h = 0 for the height that keeps its shape on a 4:3 monitor (tall VGA pixels).
 */
export function resample(s: Scan, w: number, h = 0, crop: [number, number, number, number] = [0, 0, 1, 1]): Scan {
  const [x0, y0, x1, y1] = crop;
  const sx0 = x0 * s.w;
  const sy0 = y0 * s.h;
  const cw = (x1 - x0) * s.w;
  const ch = (y1 - y0) * s.h;
  if (!h) h = Math.round((w * VGA_PIXEL * ch) / cw);
  const rgb = new Uint8Array(w * h * 3);
  const fx = cw / w;
  const fy = ch / h;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // a box filter over the source pixels this one covers (bilinear when enlarging)
      const ax = sx0 + x * fx;
      const ay = sy0 + y * fy;
      const bx = ax + Math.max(fx, 1);
      const by = ay + Math.max(fy, 1);
      const acc = [0, 0, 0];
      let n = 0;
      for (let yy = Math.floor(ay); yy < Math.ceil(by); yy++)
        for (let xx = Math.floor(ax); xx < Math.ceil(bx); xx++) {
          const wgt = (Math.min(xx + 1, bx) - Math.max(xx, ax)) * (Math.min(yy + 1, by) - Math.max(yy, ay));
          if (wgt <= 0) continue;
          const o = (Math.min(s.h - 1, yy) * s.w + Math.min(s.w - 1, xx)) * 3;
          for (let c = 0; c < 3; c++) acc[c] += s.rgb[o + c] * wgt;
          n += wgt;
        }
      for (let c = 0; c < 3; c++) rgb[(y * w + x) * 3 + c] = Math.round(acc[c] / n);
    }
  return { w, h, rgb };
}

/** Each pixel through fn([r, g, b]) → [r, g, b] (0..255): tints, sepia, brightness. */
export function tone(s: Scan, fn: (rgb: [number, number, number]) => [number, number, number]): Scan {
  const rgb = new Uint8Array(s.rgb.length);
  for (let i = 0; i < rgb.length; i += 3) {
    const o = fn([s.rgb[i], s.rgb[i + 1], s.rgb[i + 2]]);
    for (let c = 0; c < 3; c++) rgb[i + c] = Math.max(0, Math.min(255, Math.round(o[c])));
  }
  return { ...s, rgb };
}

/** An old print: gray, then toned from `dark` to `light` (8-bit RGB). */
export function sepia(s: Scan, dark: [number, number, number] = [40, 24, 10], light: [number, number, number] = [250, 230, 190], contrast = 1.1): Scan {
  return tone(s, ([r, g, b]) => {
    const v = Math.max(0, Math.min(1, ((0.299 * r + 0.587 * g + 0.114 * b) / 255 - 0.5) * contrast + 0.5));
    return [0, 1, 2].map((c) => dark[c] + (light[c] - dark[c]) * v) as [number, number, number];
  });
}

/** Median cut over a 5-bit histogram: `count` colors for the scan, as 6-bit VGA values. */
export function medianCut(s: Scan, count: number): [number, number, number][] {
  const hist = new Map<number, number>();
  for (let i = 0; i < s.rgb.length; i += 3) {
    const k = ((s.rgb[i] >> 3) << 10) | ((s.rgb[i + 1] >> 3) << 5) | (s.rgb[i + 2] >> 3);
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
  type C = { c: number[]; n: number };
  const all: C[] = [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([k, n]) => ({ c: [(k >> 10) & 31, (k >> 5) & 31, k & 31], n }));
  let boxes: C[][] = [all];
  const range = (b: C[], ch: number) => {
    let lo = 31;
    let hi = 0;
    for (const e of b) {
      lo = Math.min(lo, e.c[ch]);
      hi = Math.max(hi, e.c[ch]);
    }
    return hi - lo;
  };
  const weight = (b: C[]) => b.reduce((t, e) => t + e.n, 0);
  while (boxes.length < count) {
    let best = -1;
    let score = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      const sc = Math.max(range(b, 0), range(b, 1), range(b, 2)) * Math.sqrt(weight(b));
      if (sc > score) [score, best] = [sc, i];
    });
    if (best < 0) break;
    const b = boxes[best];
    const ch = [0, 1, 2].reduce((a, c) => (range(b, c) > range(b, a) ? c : a), 0);
    b.sort((p, q) => p.c[ch] - q.c[ch] || p.c[0] - q.c[0] || p.c[1] - q.c[1] || p.c[2] - q.c[2]);
    const half = weight(b) / 2;
    let acc = 0;
    let cut = 1;
    for (; cut < b.length - 1; cut++) if ((acc += b[cut - 1].n) >= half) break;
    boxes = [...boxes.slice(0, best), b.slice(0, cut), b.slice(cut), ...boxes.slice(best + 1)];
  }
  return boxes.map((b) => {
    const n = weight(b);
    return [0, 1, 2].map((ch) => Math.min(63, Math.round(b.reduce((t, e) => t + (e.c[ch] * 8 + 4) * e.n, 0) / n / 4))) as [number, number, number];
  });
}

/** Palette entries a picture never uses (outside `skip`, a rectangle about to be painted over). */
export function freeColors(p: Pixels, skip?: { x: number; y: number; w: number; h: number }, reserved: number[] = []): number[] {
  const used = new Set<number>(reserved);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (skip && x >= skip.x && y >= skip.y && x < skip.x + skip.w && y < skip.y + skip.h) continue;
      used.add(p.px[y * p.w + x]);
    }
  const free: number[] = [];
  for (let i = 0; i < 256; i++) if (!used.has(i)) free.push(i);
  return free;
}

/**
 * Floyd-Steinberg dithers the scan onto the palette, choosing only among `allowed` entries,
 * with serpentine rows so the error doesn't streak. Returns the palette indices.
 */
export function ditherTo(s: Scan, pal: Uint8Array, allowed: number[]): Uint8Array {
  const v8 = (v: number) => (v << 2) | (v >> 4);
  const cols = allowed.map((i) => [v8(pal[i * 3]), v8(pal[i * 3 + 1]), v8(pal[i * 3 + 2])]);
  const cache = new Map<number, number>();
  const nearest = (r: number, g: number, b: number) => {
    const k = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    let best = cache.get(k);
    if (best !== undefined) return best;
    let d = Infinity;
    best = 0;
    cols.forEach((c, i) => {
      const e = 3 * (c[0] - r) ** 2 + 4 * (c[1] - g) ** 2 + 2 * (c[2] - b) ** 2;
      if (e < d) [d, best] = [e, i];
    });
    cache.set(k, best);
    return best;
  };
  const err = Float32Array.from(s.rgb);
  const out = new Uint8Array(s.w * s.h);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  for (let y = 0; y < s.h; y++) {
    const rtl = y % 2 === 1;
    for (let k = 0; k < s.w; k++) {
      const x = rtl ? s.w - 1 - k : k;
      const i = y * s.w + x;
      const r = clamp(err[i * 3]);
      const g = clamp(err[i * 3 + 1]);
      const b = clamp(err[i * 3 + 2]);
      const q = nearest(r, g, b);
      out[i] = allowed[q];
      const e = [r - cols[q][0], g - cols[q][1], b - cols[q][2]];
      const dir = rtl ? -1 : 1;
      const spread = (dx: number, dy: number, f: number) => {
        const xx = x + dx * dir;
        const yy = y + dy;
        if (xx < 0 || xx >= s.w || yy >= s.h) return;
        const j = (yy * s.w + xx) * 3;
        for (let c = 0; c < 3; c++) err[j + c] += e[c] * f;
      };
      spread(1, 0, 7 / 16);
      spread(-1, 1, 3 / 16);
      spread(0, 1, 5 / 16);
      spread(1, 1, 1 / 16);
    }
  }
  return out;
}

export interface PasteOptions {
  /** Most palette entries to give the photo (default: every free one). */
  colors?: number;
  /** Entries the picture needs kept as they are even though no pixel uses them yet. */
  reserved?: number[];
  /** Let the photo use the picture's own colors as well as its new ones (default true). */
  share?: boolean;
}

/**
 * Pastes a scan (already the size it will be on screen) into the picture at (x, y). The
 * picture's unused palette entries get the photo's colors. Returns the new palette and the
 * entries the photo was given.
 */
export function pastePhoto(p: Pixels, pal: Uint8Array, s: Scan, x: number, y: number, o: PasteOptions = {}): { pal: Uint8Array; slots: number[] } {
  const free = freeColors(p, { x, y, w: s.w, h: s.h }, o.reserved);
  const slots = free.slice(0, o.colors ?? free.length);
  if (slots.length < 16) throw new Error(`pastePhoto: only ${slots.length} free palette entries`);
  const out = pal.slice();
  medianCut(s, slots.length).forEach((c, i) => out.set(c, slots[i] * 3));
  let allowed = slots;
  if (o.share ?? true) {
    const own = new Set<number>();
    for (let yy = 0; yy < p.h; yy++) for (let xx = 0; xx < p.w; xx++) if (xx < x || yy < y || xx >= x + s.w || yy >= y + s.h) own.add(p.px[yy * p.w + xx]);
    allowed = [...slots, ...[...own].filter((i) => !(o.reserved ?? []).includes(i)).sort((a, b) => a - b)];
  }
  const idx = ditherTo(s, out, allowed);
  for (let yy = 0; yy < s.h; yy++) for (let xx = 0; xx < s.w; xx++) p.set(x + xx, y + yy, idx[yy * s.w + xx]);
  return { pal: out, slots };
}

export interface FrameColors {
  /** The print's white border. */
  paper: number;
  /** Its outline. */
  edge: number;
  /** A drop shadow on what's under it (-1: none). */
  shadow?: number;
  /** Strips of tape over the top corners (-1: none), every other pixel so the print shows through. */
  tape?: number;
}

/**
 * An instant print with its photo area w x h at (x, y): a white border, deeper at the bottom
 * for a caption, an outline, a drop shadow and tape at the top corners. Returns where the
 * caption strip's middle is.
 */
export function polaroid(p: Pixels, x: number, y: number, w: number, h: number, c: FrameColors, bottom = 14): { cx: number; cy: number } {
  const [fx, fy, fw, fh] = [x - 4, y - 4, w + 8, h + 4 + bottom];
  if ((c.shadow ?? -1) >= 0) p.rect(fx + 3, fy + 3, fw, fh, c.shadow!);
  p.rect(fx, fy, fw, fh, c.paper).frame(fx, fy, fw, fh, c.edge);
  if ((c.tape ?? -1) >= 0)
    for (const [tx, flip] of [
      [fx - 5, 1],
      [fx + fw - 17, -1],
    ] as const)
      for (let k = 0; k < 22; k++)
        for (let t = 0; t < 7; t++) {
          const px = tx + k;
          const py = fy - 6 + t + Math.round((flip > 0 ? 21 - k : k) / 3);
          if ((px + py) % 2 === 0 || t === 0 || t === 6) p.set(px, py, c.tape!);
        }
  return { cx: fx + fw / 2, cy: y + h + bottom / 2 };
}
