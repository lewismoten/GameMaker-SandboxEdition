// Indexed image export for build scripts.
export { encodePng, type IndexedPicture } from './image/png';
export { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';

// Project median-cut implementation; method by Paul S. Heckbert, credited in ../NOTICE.md.
/** Portable RGBA pixels; accepts ImageData without requiring canvas or a DOM. RGB is treated as opaque. */
export interface RgbaPixels {
  width: number;
  height: number;
  data: ArrayLike<number>;
}

/** Median cut over the given RGBA images: up to `colors` 8-bit colors. */
export function medianCutRgba(images: readonly RgbaPixels[], colors = 256): [number, number, number][] {
  if (!Number.isInteger(colors) || colors < 1 || colors > 256) throw new RangeError('Color count must be 1..256');
  if (
    images.some(
      (im) =>
        !Number.isSafeInteger(im.width) || !Number.isSafeInteger(im.height) || im.width < 0 || im.height < 0 || im.data.length !== im.width * im.height * 4,
    )
  )
    throw new RangeError('Expected width × height RGBA pixels');
  if (!images.some((im) => im.data.length)) return [];
  // sample at most ~120k pixels
  const total = images.reduce((n, im) => n + im.width * im.height, 0);
  const step = Math.max(1, Math.floor(total / 120_000));
  const pts: number[] = [];
  for (const im of images) for (let i = 0; i < im.data.length; i += 4 * step) pts.push((im.data[i] << 16) | (im.data[i + 1] << 8) | im.data[i + 2]);
  const unique = [...new Set(pts)];
  if (unique.length <= colors) return unique.map((color) => [(color >> 16) & 255, (color >> 8) & 255, color & 255]);
  type Box = number[];
  const boxes: Box[] = [pts];
  const ch = (v: number, c: number) => (v >> (16 - c * 8)) & 255;
  while (boxes.length < colors) {
    // split the box with the widest channel range
    let best = -1;
    let bestRange = -1;
    let bestCh = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let lo = 255;
        let hi = 0;
        for (const p of b) {
          const v = ch(p, c);
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        if (hi - lo > bestRange) {
          bestRange = hi - lo;
          best = i;
          bestCh = c;
        }
      }
    });
    if (best < 0 || bestRange === 0) break;
    const b = boxes[best].sort((x, y) => ch(x, bestCh) - ch(y, bestCh));
    const mid = b.length >> 1;
    boxes.splice(best, 1, b.slice(0, mid), b.slice(mid));
  }
  return boxes.map((b) => {
    let r = 0;
    let g = 0;
    let bl = 0;
    for (const p of b) {
      r += (p >> 16) & 255;
      g += (p >> 8) & 255;
      bl += p & 255;
    }
    const n = Math.max(1, b.length);
    return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)];
  });
}
