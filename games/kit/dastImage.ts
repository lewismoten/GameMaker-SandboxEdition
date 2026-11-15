// True-color pictures for the DAST tool (dast.ts): indexed pixels to 0xRRGGBB, a PNG writer (no canvas),
// silhouettes (everything that is not the background filled solid), 90 and 180 degree turns, and the one
// sheet per picture that shows them all together.
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

export interface Pix {
  w: number;
  h: number;
  /** 0xRRGGBB per pixel. */
  px: Uint32Array;
}

export const BLACK = 0x000000;
export const WHITE = 0xffffff;
export const GAP = 0x808080;

/** Indexed pixels and a 6-bit VGA palette as a Pix. */
export function fromIndexed(w: number, h: number, pixels: Uint8Array, palette: Uint8Array): Pix {
  const lut = new Uint32Array(256);
  for (let i = 0; i < 256; i++) lut[i] = (vga8(palette[i * 3] ?? 0) << 16) | (vga8(palette[i * 3 + 1] ?? 0) << 8) | vga8(palette[i * 3 + 2] ?? 0);
  const px = new Uint32Array(w * h);
  for (let i = 0; i < px.length; i++) px[i] = lut[pixels[i]];
  return { w, h, px };
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const v = new DataView(out.buffer);
  v.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  v.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)) >>> 0);
  return out;
}

/** A true-color PNG, scaled up by whole pixels (nearest neighbor). */
export async function toPng(p: Pix, scale = 1): Promise<Uint8Array> {
  const w = p.w * scale;
  const h = p.h * scale;
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    let o = y * (w * 3 + 1) + 1;
    const row = Math.floor(y / scale) * p.w;
    for (let x = 0; x < w; x++) {
      const c = p.px[row + Math.floor(x / scale)];
      raw[o++] = c >> 16;
      raw[o++] = (c >> 8) & 255;
      raw[o++] = c & 255;
    }
  }
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, w);
  v.setUint32(4, h);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', await deflate(raw)),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, q) => n + q.length, 0));
  let at = 0;
  for (const q of parts) (out.set(q, at), (at += q.length));
  return out;
}

const near = (a: number, b: number) => Math.abs((a >> 16) - (b >> 16)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) + Math.abs((a & 255) - (b & 255)) < 60;

/**
 * Every pixel that is not background black, the rest white. The background is the colors that make up a
 * fifth of the picture's edge or more, and anything close to them (dithered sky counts as sky).
 */
export function silhouette(p: Pix, bg?: number): Pix {
  const bgs = bg === undefined ? edgeColors(p) : [bg];
  const px = new Uint32Array(p.px.length);
  for (let i = 0; i < px.length; i++) px[i] = bgs.some((b) => p.px[i] === b || (bg === undefined && near(p.px[i], b))) ? WHITE : BLACK;
  return { w: p.w, h: p.h, px };
}

function edgeColors(p: Pix): number[] {
  const n = new Map<number, number>();
  const add = (x: number, y: number) => n.set(p.px[y * p.w + x], (n.get(p.px[y * p.w + x]) ?? 0) + 1);
  for (let x = 0; x < p.w; x++) (add(x, 0), add(x, p.h - 1));
  for (let y = 1; y < p.h - 1; y++) (add(0, y), add(p.w - 1, y));
  const total = 2 * (p.w + p.h) - 4;
  const sorted = [...n].sort((a, b) => b[1] - a[1]);
  return sorted.filter(([, k], i) => i === 0 || k * 5 >= total).map(([c]) => c);
}

/** Turned a quarter turn clockwise `turns` times. */
export function rotate(p: Pix, turns: number): Pix {
  let cur = p;
  for (let t = 0; t < (turns & 3); t++) {
    const px = new Uint32Array(cur.px.length);
    for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) px[x * cur.h + (cur.h - 1 - y)] = cur.px[y * cur.w + x];
    cur = { w: cur.h, h: cur.w, px };
  }
  return cur;
}

/** Smaller by a whole factor; a silhouette cell is ink when a quarter of it is, a picture keeps its middle pixel. */
export function shrink(p: Pix, f: number, ink = false): Pix {
  if (f <= 1) return p;
  const w = Math.max(1, Math.floor(p.w / f));
  const h = Math.max(1, Math.floor(p.h / f));
  const px = new Uint32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!ink) {
        px[y * w + x] = p.px[Math.min(p.h - 1, y * f + (f >> 1)) * p.w + Math.min(p.w - 1, x * f + (f >> 1))];
        continue;
      }
      let dark = 0;
      for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) if (p.px[(y * f + j) * p.w + x * f + i] === BLACK) dark++;
      px[y * w + x] = dark * 4 >= f * f ? BLACK : WHITE;
    }
  return { w, h, px };
}

/** Pictures set out in a grid, each cell as large as the biggest, with gray gaps between. */
export function grid(cells: Pix[], cols: number, gap = 2): Pix {
  const cw = Math.max(...cells.map((c) => c.w));
  const ch = Math.max(...cells.map((c) => c.h));
  const rows = Math.ceil(cells.length / cols);
  const w = cols * cw + (cols + 1) * gap;
  const h = rows * ch + (rows + 1) * gap;
  const px = new Uint32Array(w * h).fill(GAP);
  cells.forEach((c, k) => {
    const ox = gap + (k % cols) * (cw + gap);
    const oy = gap + Math.floor(k / cols) * (ch + gap);
    for (let y = 0; y < c.h; y++) px.set(c.px.subarray(y * c.w, (y + 1) * c.w), (oy + y) * w + ox);
  });
  return { w, h, px };
}

/**
 * The review sheet for one picture: the picture, turned 90 and 180 degrees, over its silhouette turned the
 * same ways. A big picture (a whole map) is shrunk to fit `maxWidth`. `bg` is the background color,
 * or a silhouette already made (a sheet of blocks is done block by block).
 */
export function rotationSheet(p: Pix, bg?: number | Pix, maxWidth = 2400): Pix {
  const f = Math.max(1, Math.ceil((p.w * 3 + 8) / maxWidth));
  const sil = shrink(typeof bg === 'object' ? bg : silhouette(p, bg), f, true);
  const pic = shrink(p, f);
  return grid([pic, rotate(pic, 1), rotate(pic, 2), sil, rotate(sil, 1), rotate(sil, 2)], 3);
}

/** Whole-number enlargement (nearest neighbor). */
function enlarge(p: Pix, f: number): Pix {
  if (f <= 1) return p;
  const w = p.w * f;
  const px = new Uint32Array(w * p.h * f);
  for (let y = 0; y < p.h * f; y++) for (let x = 0; x < w; x++) px[y * w + x] = p.px[Math.floor(y / f) * p.w + Math.floor(x / f)];
  return { w, h: p.h * f, px };
}

/**
 * A contact sheet: every picture on shelves of `width` pixels, big ones shrunk and small ones enlarged to a
 * readable size, each followed by its silhouette (black on white) for the pictures in `sil`. The tiles keep their order.
 */
export function shelfSheet(pics: Pix[], width = 1800, sil: Set<Pix> = new Set()): Pix {
  const tiles: Pix[] = [];
  for (const p of pics) {
    const f = Math.max(1, Math.ceil(p.w / (width / 2 - 4)));
    const small = p.w < 200 ? Math.min(3, Math.floor(200 / p.w)) : 1;
    const pic = small > 1 ? enlarge(p, small) : shrink(p, f);
    tiles.push(pic);
    if (sil.has(p) && p.w <= width / 2) tiles.push(small > 1 ? enlarge(silhouette(p), small) : shrink(silhouette(p), f, true));
  }
  const gap = 4;
  const rows: { y: number; h: number; items: [Pix, number][] }[] = [];
  let x = gap;
  let cur = { y: gap, h: 0, items: [] as [Pix, number][] };
  for (const t of tiles) {
    if (x + t.w + gap > width && cur.items.length) {
      rows.push(cur);
      cur = { y: cur.y + cur.h + gap, h: 0, items: [] };
      x = gap;
    }
    cur.items.push([t, x]);
    cur.h = Math.max(cur.h, t.h);
    x += t.w + gap;
  }
  rows.push(cur);
  const h = cur.y + cur.h + gap;
  const px = new Uint32Array(width * h).fill(GAP);
  for (const r of rows) for (const [t, ox] of r.items) for (let y = 0; y < t.h; y++) px.set(t.px.subarray(y * t.w, (y + 1) * t.w), (r.y + y) * width + ox);
  return { w: width, h, px };
}
