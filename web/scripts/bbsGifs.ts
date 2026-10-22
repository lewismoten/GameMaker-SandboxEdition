// Makes the GIF Gallery on THE -= S A N D B O X =- BBS (retro/bbs/gallery.ts): the SysOp's
// snapshots scanned down the way a 1994 BBS carried them. Each is cropped, scaled to fit a
// 320x200 or 640x400 VGA screen, cut to 256 colors or fewer with Floyd-Steinberg dithering
// on a 6-bit VGA palette, and saved as an interlaced GIF89a with an 8.3 name, so a caller's
// viewer can show it coarse to fine while it downloads.
//
// Those screens have tall pixels on a 4:3 monitor (5:6), so the pictures are squeezed to
// look right there, and say so in the GIF89a pixel aspect byte.
//
// Run once (needs ffmpeg to read the photos): cd web && npx vite-node scripts/bbsGifs.ts
// Writes web/public/bbs/*.GIF and web/src/retro/bbs/gallery.json; both are committed.
// The photos are the owner's own (.for-lewis/images, not in git).
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { encodeGif89 } from '../src/formats/gifProgressive';

const PHOTOS = resolve(__dirname, '../../.for-lewis/images');
const OUT = resolve(__dirname, '../public/bbs');
const LIST = resolve(__dirname, '../src/retro/bbs/gallery.json');
/** Pixel width / height on a 4:3 monitor at 320x200 and 640x400. */
const PIXEL = 5 / 6;
const ASPECT_BYTE = Math.round(PIXEL * 64 - 15); // 38

type Box = [x0: number, y0: number, x1: number, y1: number]; // fractions

interface Shot {
  name: string;
  photo: string;
  /** What to keep of the photo. */
  crop: Box;
  /** The screen it's made for. */
  screen: 320 | 640;
  colors: number;
  /** Parts to blur (fractions of the cropped picture): things the world needn't read. */
  blur?: Box[];
}

const SHOTS: Shot[] = [
  { name: 'TEDDY.GIF', photo: 'teddy smiling.jpg', crop: [0, 0, 1, 1], screen: 640, colors: 256 },
  { name: 'GWINN.GIF', photo: 'teddy-and-gwinn-in-grass.jpg', crop: [0, 0, 1, 1], screen: 640, colors: 256 },
  { name: 'GAZEBO.GIF', photo: 'lewie-and-teddy-at-gazebo.jpg', crop: [0, 0, 1, 1], screen: 640, colors: 256 },
  // the pins on his jacket are cropped off (club names and numbers)
  { name: 'HOBO1.GIF', photo: 'lewies-first-dressout-as-a-hobo-clown.jpg', crop: [0, 0, 0.96, 0.9], screen: 320, colors: 256 },
  { name: 'HOBO2.GIF', photo: 'lewie-as-hobo-clown-2.jpg', crop: [0, 0, 1, 1], screen: 320, colors: 128 },
  { name: 'HOBO3.GIF', photo: 'lewie-at-clown-club-as-hobo.jpg', crop: [0.04, 0, 1, 0.84], screen: 640, colors: 256 },
  { name: 'COLONIAL.GIF', photo: 'lewie dressed up for SAR with George Washington.jpg', crop: [0, 0, 0.95, 1], screen: 640, colors: 256 },
  // the library's charter number on its sign is blurred
  { name: 'DOGHOUSE.GIF', photo: 'lewies-little-free-library-with-wall-of-rock.jpg', crop: [0, 0, 1, 1], screen: 640, colors: 256, blur: [[0.322, 0.138, 0.455, 0.17]] },
  // just the picture of the library from the app screenshot (not its address); its "1/2" blurred
  { name: 'LIBRARY.GIF', photo: 'lewies-tiny-little-library.jpg', crop: [0.05, 0.29, 0.46, 0.505], screen: 320, colors: 64, blur: [[0.8, 0, 1, 0.1]] },
  // the restaurant sign above is cropped off; the plate is the car's name
  { name: 'CHEZ.GIF', photo: 'citicar-at-public-charging-station.webp', crop: [0, 0.2, 0.84, 0.88], screen: 640, colors: 256 },
];

function photoSize(file: string): [number, number] {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const [w, h] = r.stdout.trim().split(',').map(Number);
  return [w, h];
}

/** The cropped photo scaled to w x h, as RGB bytes. */
function readPhoto(file: string, crop: Box, w: number, h: number): Uint8Array {
  const [pw, ph] = photoSize(file);
  const [x0, y0, x1, y1] = crop;
  const c = [Math.round((x1 - x0) * pw), Math.round((y1 - y0) * ph), Math.round(x0 * pw), Math.round(y0 * ph)];
  const r = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-vf', `crop=${c.join(':')},scale=${w}:${h}:flags=lanczos`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    { maxBuffer: 64 << 20 },
  );
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
  return new Uint8Array(r.stdout);
}

/** Blurs a box of the picture until any writing in it can't be read. */
function blurBox(rgb: Uint8Array, w: number, h: number, [x0, y0, x1, y1]: Box): void {
  const bx = [Math.floor(x0 * w), Math.floor(y0 * h), Math.ceil(x1 * w), Math.ceil(y1 * h)];
  const radius = 4;
  for (let pass = 0; pass < 4; pass++) {
    const src = rgb.slice();
    for (let y = bx[1]; y < bx[3]; y++)
      for (let x = bx[0]; x < bx[2]; x++)
        for (let ch = 0; ch < 3; ch++) {
          let sum = 0;
          let n = 0;
          for (let dy = -radius; dy <= radius; dy++)
            for (let dx = -radius; dx <= radius; dx++) {
              const sx = Math.min(bx[2] - 1, Math.max(bx[0], x + dx));
              const sy = Math.min(bx[3] - 1, Math.max(bx[1], y + dy));
              sum += src[(sy * w + sx) * 3 + ch];
              n++;
            }
          rgb[(y * w + x) * 3 + ch] = Math.round(sum / n);
        }
  }
}

/** Median cut: the picture's colors in `count` boxes, each box's average a palette color (6-bit). */
function medianCut(rgb: Uint8Array, count: number): number[][] {
  // a histogram of 5-bit colors
  const hist = new Map<number, number>();
  for (let i = 0; i < rgb.length; i += 3) {
    const k = ((rgb[i] >> 3) << 10) | ((rgb[i + 1] >> 3) << 5) | (rgb[i + 2] >> 3);
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
  type C = { c: number[]; n: number };
  const all: C[] = [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([k, n]) => ({ c: [(k >> 10) & 31, (k >> 5) & 31, k & 31], n }));
  let boxes: C[][] = [all];
  const range = (b: C[], ch: number) => Math.max(...b.map((e) => e.c[ch])) - Math.min(...b.map((e) => e.c[ch]));
  const weight = (b: C[]) => b.reduce((s, e) => s + e.n, 0);
  while (boxes.length < count) {
    // split the box with the most pixels times its widest spread
    let best = -1;
    let score = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      const s = Math.max(range(b, 0), range(b, 1), range(b, 2)) * Math.sqrt(weight(b));
      if (s > score) [score, best] = [s, i];
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
    return [0, 1, 2].map((ch) => Math.min(63, Math.round((b.reduce((s, e) => s + (e.c[ch] * 8 + 4) * e.n, 0) / n) / 4)));
  });
}

/** Floyd-Steinberg dithering to the palette (6-bit colors shown as 8-bit, like the VGA DAC). */
function dither(rgb: Uint8Array, w: number, h: number, pal: number[][]): Uint8Array {
  const v8 = (v: number) => (v << 2) | (v >> 4);
  const p8 = pal.map((c) => c.map(v8));
  const cache = new Map<number, number>();
  const nearest = (r: number, g: number, b: number) => {
    const k = (r << 16) | (g << 8) | b;
    let best = cache.get(k);
    if (best !== undefined) return best;
    let d = Infinity;
    best = 0;
    p8.forEach((c, i) => {
      const e = 3 * (c[0] - r) ** 2 + 4 * (c[1] - g) ** 2 + 2 * (c[2] - b) ** 2;
      if (e < d) [d, best] = [e, i];
    });
    cache.set(k, best);
    return best;
  };
  const err = Float32Array.from(rgb);
  const out = new Uint8Array(w * h);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const r = clamp(err[i * 3]);
      const g = clamp(err[i * 3 + 1]);
      const b = clamp(err[i * 3 + 2]);
      const q = nearest(r, g, b);
      out[i] = q;
      const e = [r - p8[q][0], g - p8[q][1], b - p8[q][2]];
      const spread = (dx: number, dy: number, f: number) => {
        const xx = x + dx;
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
  return out;
}

/** The biggest even size that fits the screen and shows the crop's shape on a 4:3 monitor. */
function fit(screen: 320 | 640, shape: number): [number, number] {
  const [sw, sh] = screen === 320 ? [320, 200] : [640, 400];
  let w = sw;
  let h = Math.round((w * PIXEL) / shape);
  if (h > sh) {
    h = sh;
    w = Math.round((h * shape) / PIXEL);
  }
  return [w & ~1, h & ~1];
}

mkdirSync(OUT, { recursive: true });
const list: { name: string; bytes: number; width: number; height: number; colors: number }[] = [];
for (const s of SHOTS) {
  const file = resolve(PHOTOS, s.photo);
  const [pw, ph] = photoSize(file);
  const shape = ((s.crop[2] - s.crop[0]) * pw) / ((s.crop[3] - s.crop[1]) * ph);
  const [w, h] = fit(s.screen, shape);
  const rgb = readPhoto(file, s.crop, w, h);
  for (const b of s.blur ?? []) blurBox(rgb, w, h, b);
  const pal = medianCut(rgb, s.colors);
  const palette = new Uint8Array(768);
  pal.forEach((c, i) => palette.set(c, i * 3));
  const pixels = dither(rgb, w, h, pal);
  const gif = encodeGif89({ width: w, height: h, pixels, palette }, { interlaced: true, colors: s.colors, aspect: ASPECT_BYTE });
  writeFileSync(resolve(OUT, s.name), gif);
  list.push({ name: s.name, bytes: gif.length, width: w, height: h, colors: s.colors });
  console.log(`${s.name.padEnd(13)} ${w}x${h} ${s.colors} colors ${gif.length} bytes`);
}
writeFileSync(LIST, JSON.stringify(list, null, 2) + '\n');
