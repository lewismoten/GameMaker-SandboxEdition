// A PNG preview of a LaserSheet (laserSvg.ts) without a browser: wood-colored board, engraving dark, cut lines red and
// score lines blue, anti-aliased by supersampling. Every shape the builder makes is convex (circles, rings, rectangles),
// so a point test per shape inside its bounding box is enough.
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { deflateSync } from 'node:zlib';
import { HAIRLINE, type Item, type LaserSheet } from './laserSvg';

const WOOD = [226, 190, 140];
const INK = { engrave: [74, 42, 20], score: [30, 60, 220], cut: [230, 20, 20] } as const;

/** RGB bytes, `pxPerMm` pixels to the millimeter, each pixel averaged from `ss` x `ss` samples. */
export function renderPreview(sheet: LaserSheet, pxPerMm: number, ss = 3): { w: number; h: number; rgb: Uint8Array } {
  const w = Math.ceil(sheet.w * pxPerMm);
  const h = Math.ceil(sheet.h * pxPerMm);
  const S = pxPerMm * ss;
  const W = w * ss;
  const H = h * ss;
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) rgb.set(WOOD, i * 3);
  const strokeW = Math.max(HAIRLINE, 1.2 / pxPerMm);
  for (const op of ['engrave', 'score', 'cut'] as const) {
    const mask = new Uint8Array(W * H);
    const fill = (item: Item, inside: (mx: number, my: number) => boolean, x0: number, y0: number, x1: number, y1: number) => {
      void item;
      for (let y = Math.max(0, Math.floor(y0 * S)); y < Math.min(H, Math.ceil(y1 * S)); y++)
        for (let x = Math.max(0, Math.floor(x0 * S)); x < Math.min(W, Math.ceil(x1 * S)); x++) if (inside((x + 0.5) / S, (y + 0.5) / S)) mask[y * W + x] = 1;
    };
    for (const it of sheet.items) {
      if (it.op !== op) continue;
      if (it.k === 'ring') fill(it, (x, y) => { const d = Math.hypot(x - it.cx, y - it.cy); return d >= it.r0 && d <= it.r1; }, it.cx - it.r1, it.cy - it.r1, it.cx + it.r1, it.cy + it.r1);
      else if (it.k === 'circle') {
        const line = op !== 'engrave';
        const r0 = line ? it.r - strokeW / 2 : 0;
        const r1 = line ? it.r + strokeW / 2 : it.r;
        fill(it, (x, y) => { const d = Math.hypot(x - it.cx, y - it.cy); return d >= r0 && d <= r1; }, it.cx - r1, it.cy - r1, it.cx + r1, it.cy + r1);
      } else {
        const p = it.pts;
        const xs = p.map((q) => q[0]);
        const ys = p.map((q) => q[1]);
        fill(it, (x, y) => {
          let pos = false;
          let neg = false;
          for (let i = 0; i < p.length; i++) {
            const [ax, ay] = p[i];
            const [bx, by] = p[(i + 1) % p.length];
            const c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
            if (c > 0) pos = true;
            else if (c < 0) neg = true;
          }
          return !(pos && neg);
        }, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
      }
    }
    const ink = INK[op];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let c = 0;
        for (let j = 0; j < ss; j++) for (let i = 0; i < ss; i++) c += mask[(y * ss + j) * W + x * ss + i];
        if (!c) continue;
        const a = c / (ss * ss);
        for (let k = 0; k < 3; k++) rgb[(y * w + x) * 3 + k] = Math.round(rgb[(y * w + x) * 3 + k] * (1 - a) + ink[k] * a);
      }
  }
  return { w, h, rgb };
}

const chunk = (type: string, data: Uint8Array) => {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
};
/** A truecolor PNG from RGB bytes. */
export function pngFromRgb(w: number, h: number, rgb: Uint8Array): Uint8Array {
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
  const head = new Uint8Array(13);
  const dv = new DataView(head.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  head[8] = 8;
  head[9] = 2;
  const parts = [Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
