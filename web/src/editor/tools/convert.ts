// Turning today's pictures into Game-Maker's: scale to 320x200, reduce to a 256-color VGA
// palette (median cut, or an existing game palette), with optional Floyd–Steinberg
// dithering. Used for importing pictures as GIFs and frames into FLI animations.
import type { Palette } from '../../formats/palette';

export type Fit = 'fit' | 'fill' | 'stretch';

export interface Indexed {
  width: number;
  height: number;
  pixels: Uint8Array;
  /** 6-bit VGA palette, 768 bytes. */
  palette: Palette;
}

/** Draws any image source onto a w x h RGBA buffer, fitted, cropped or stretched. */
export function rgbaOf(src: CanvasImageSource & { width: number; height: number }, w = 320, h = 200, fit: Fit = 'fit', background = '#000'): ImageData {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  const sw = src.width;
  const sh = src.height;
  let dw = w;
  let dh = h;
  if (fit !== 'stretch') {
    const k = fit === 'fit' ? Math.min(w / sw, h / sh) : Math.max(w / sw, h / sh);
    dw = sw * k;
    dh = sh * k;
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return ctx.getImageData(0, 0, w, h);
}

/** Median cut over the given RGBA images: up to `colors` 8-bit colors. */
export function medianCut(images: ImageData[], colors = 256): [number, number, number][] {
  // sample at most ~120k pixels
  const total = images.reduce((n, im) => n + im.width * im.height, 0);
  const step = Math.max(1, Math.floor(total / 120_000));
  const pts: number[] = [];
  for (const im of images) for (let i = 0; i < im.data.length; i += 4 * step) pts.push((im.data[i] << 16) | (im.data[i + 1] << 8) | im.data[i + 2]);
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

/** A 6-bit VGA palette from 8-bit colors (missing entries black). */
export function vgaPalette(colors: [number, number, number][]): Palette {
  const pal = new Uint8Array(768);
  colors.slice(0, 256).forEach(([r, g, b], i) => pal.set([r >> 2, g >> 2, b >> 2], i * 3));
  return pal;
}

/** Maps RGBA to palette indexes, optionally dithering; `usable` limits which entries may be used. */
export function remap(im: ImageData, palette: Palette, opts: { dither?: boolean; usable?: number } = {}): Uint8Array {
  const usable = opts.usable ?? 256;
  const pr = new Float32Array(usable);
  const pg = new Float32Array(usable);
  const pb = new Float32Array(usable);
  for (let i = 0; i < usable; i++) {
    pr[i] = (palette[i * 3] << 2) | (palette[i * 3] >> 4);
    pg[i] = (palette[i * 3 + 1] << 2) | (palette[i * 3 + 1] >> 4);
    pb[i] = (palette[i * 3 + 2] << 2) | (palette[i * 3 + 2] >> 4);
  }
  const cache = new Map<number, number>();
  const nearest = (r: number, g: number, b: number): number => {
    const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < usable; i++) {
      // weighted for how eyes see brightness
      const d = 2 * (r - pr[i]) ** 2 + 4 * (g - pg[i]) ** 2 + 3 * (b - pb[i]) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    cache.set(key, best);
    return best;
  };
  const w = im.width;
  const h = im.height;
  const out = new Uint8Array(w * h);
  const err = opts.dither ? new Float32Array(w * h * 3) : undefined;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let r = im.data[i * 4];
      let g = im.data[i * 4 + 1];
      let b = im.data[i * 4 + 2];
      if (err) {
        r = Math.max(0, Math.min(255, r + err[i * 3]));
        g = Math.max(0, Math.min(255, g + err[i * 3 + 1]));
        b = Math.max(0, Math.min(255, b + err[i * 3 + 2]));
      }
      const c = nearest(Math.round(r), Math.round(g), Math.round(b));
      out[i] = c;
      if (err) {
        const er = r - pr[c];
        const eg = g - pg[c];
        const eb = b - pb[c];
        const spread = (dx: number, dy: number, k: number) => {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || xx >= w || yy >= h) return;
          const j = (yy * w + xx) * 3;
          err[j] += er * k;
          err[j + 1] += eg * k;
          err[j + 2] += eb * k;
        };
        spread(1, 0, 7 / 16);
        spread(-1, 1, 3 / 16);
        spread(0, 1, 5 / 16);
        spread(1, 1, 1 / 16);
      }
    }
  return out;
}

/** Converts images to indexed 320x200 pictures sharing one palette (a new one, or `palette`). */
export function toIndexed(images: ImageData[], opts: { palette?: Palette; dither?: boolean; colors?: number } = {}): Indexed[] {
  const palette = opts.palette ?? vgaPalette(medianCut(images, opts.colors ?? 256));
  return images.map((im) => ({ width: im.width, height: im.height, palette, pixels: remap(im, palette, { dither: opts.dither }) }));
}

/** Loads a File as an image (any format the browser understands). */
export async function loadImage(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

/** Every frame of an animated GIF (or a single picture), with its delay in ms, via the browser's decoder. */
export async function decodeFrames(file: File): Promise<{ frames: ImageBitmap[]; delays: number[] }> {
  const Decoder = (
    globalThis as unknown as {
      ImageDecoder?: new (init: { data: ReadableStream | ArrayBuffer; type: string }) => {
        tracks: { ready: Promise<void>; selectedTrack?: { frameCount: number } };
        decode(o: { frameIndex: number }): Promise<{ image: VideoFrame }>;
      };
    }
  ).ImageDecoder;
  if (Decoder && /gif|webp|png/i.test(file.type)) {
    try {
      const dec = new Decoder({ data: await file.arrayBuffer(), type: file.type });
      await dec.tracks.ready;
      const count = dec.tracks.selectedTrack?.frameCount ?? 1;
      const frames: ImageBitmap[] = [];
      const delays: number[] = [];
      for (let i = 0; i < count; i++) {
        const { image } = await dec.decode({ frameIndex: i });
        frames.push(await createImageBitmap(image));
        delays.push((image.duration ?? 100_000) / 1000);
        image.close();
      }
      return { frames, delays };
    } catch {
      /* fall back to one picture */
    }
  }
  return { frames: [await loadImage(file)], delays: [100] };
}
