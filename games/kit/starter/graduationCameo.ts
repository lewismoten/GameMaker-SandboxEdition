// The Cast's guests in the graduation halls: each is the character's own picture (web/public/cast/<id>.png, which
// the Cast page shows and which came from the character's game), or Teddy's and Gwinn's own sprites from the Teddy
// game, redrawn into the hall's palette by nearest color and put on the wall color. Never a new look.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { chezPicture, type ChezInk } from '../chez';
import { GWINN } from '../../teddy/src/sprites/gwinn';
import { POSES } from '../../teddy/src/sprites/teddy';
import { P as TEDDY_PAL } from '../../teddy/src/art/pal';
import { skyOf, type Pal } from './palette';

const CAST = new URL('../../../web/public/cast/', import.meta.url);
type RGB = [number, number, number];

/** A PNG (8-bit colormap, RGB or RGBA) as rows of RGB, `null` where it is clear. */
function decodePng(file: string): { w: number; h: number; px: (RGB | null)[] } {
  const buf = readFileSync(new URL(file, CAST));
  let pos = 8;
  let w = 0;
  let h = 0;
  let type = 0;
  let depth = 8;
  let plte: RGB[] = [];
  let trns: number[] = [];
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const kind = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === 'IHDR') [w, h, depth, type] = [data.readUInt32BE(0), data.readUInt32BE(4), data[8], data[9]];
    else if (kind === 'PLTE') plte = Array.from({ length: len / 3 }, (_, i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]] as RGB);
    else if (kind === 'tRNS') trns = [...data];
    else if (kind === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const chans = type === 6 ? 4 : type === 2 ? 3 : 1;
  const bits = chans * depth;
  const stride = Math.ceil((w * bits) / 8);
  const bpp = Math.max(1, bits / 8);
  const raw = inflateSync(Buffer.concat(idat));
  const rows: Uint8Array[] = [];
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = Uint8Array.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    const up = y ? rows[y - 1] : new Uint8Array(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0;
      const b = up[i];
      const c = i >= bpp ? up[i - bpp] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      const paeth = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      line[i] = (line[i] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? paeth : 0)) & 255;
    }
    rows.push(line);
  }
  const px: (RGB | null)[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const r = rows[y];
      if (type === 3) {
        const at = (x * depth) >> 3;
        const i = (r[at] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1);
        px.push((trns[i] ?? 255) < 128 ? null : plte[i]);
      } else {
        const o = x * chans;
        px.push(chans === 4 && r[o + 3] < 128 ? null : [r[o], r[o + 1], r[o + 2]]);
      }
    }
  return { w, h, px };
}

/** The palette's colors that are in use (not the black fill after the last ramp), as 8-bit RGB by index. */
function usedColors(pal: Pal): [number, RGB][] {
  const out: [number, RGB][] = [];
  for (let i = 0; i < 255; i++) {
    const [r, g, b] = [pal.pal[i * 3], pal.pal[i * 3 + 1], pal.pal[i * 3 + 2]];
    if (i > 0 && !r && !g && !b) continue;
    out.push([i, [(r << 2) | (r >> 4), (g << 2) | (g >> 4), (b << 2) | (b >> 4)]]);
  }
  return out;
}

const nearest = (colors: [number, RGB][], c: RGB): number => {
  let best = 0;
  let d = Infinity;
  for (const [i, k] of colors) {
    const e = (k[0] - c[0]) ** 2 * 3 + (k[1] - c[1]) ** 2 * 4 + (k[2] - c[2]) ** 2 * 2;
    if (e < d) [best, d] = [i, e];
  }
  return best;
};

/** Cuts a picture of any height into 20x20 blocks, top first, on the wall color: the picture sits on the bottom of the last block and is centered across. */
function blocksOf(pic: Pixels, wall: number): Pixels[] {
  const n = Math.ceil(pic.h / 20);
  const sheet = new Pixels(20, n * 20, wall);
  sheet.blit(pic, Math.floor((20 - pic.w) / 2), n * 20 - pic.h, 255);
  return Array.from({ length: n }, (_, i) => sheet.crop(0, i * 20, 20, 20));
}

/** The chicken's picture has a scene behind it: whatever touches the edge and is not the chicken's yellow, red or wrapped box goes clear. */
function cutOut(w: number, h: number, px: (RGB | null)[]): void {
  const keep = (c: RGB): boolean =>
    (c[0] > 200 && c[1] > 130 && c[2] < 160) || (c[0] > 190 && c[1] < 100 && c[2] < 100) || (c[0] > 170 && c[1] > 120 && c[2] > 80 && c[0] - c[2] > 40);
  const todo: number[] = [];
  for (let x = 0; x < w; x++) todo.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) todo.push(y * w, y * w + w - 1);
  while (todo.length) {
    const i = todo.pop()!;
    const c = px[i];
    if (!c || keep(c)) continue;
    px[i] = null;
    const [x, y] = [i % w, Math.floor(i / w)];
    if (x > 0) todo.push(i - 1);
    if (x < w - 1) todo.push(i + 1);
    if (y > 0) todo.push(i - w);
    if (y < h - 1) todo.push(i + w);
  }
}

/** A Cast picture (web/public/cast/<id>.png), brought down by `shrink` (whole times) and into the hall's palette: its blocks, top first. */
export function castBlocks(pal: Pal, id: string, shrink = 1): Pixels[] {
  const { w, h, px } = decodePng(`${id}.png`);
  if (id === 'chicken') cutOut(w, h, px);
  const colors = usedColors(pal);
  const pic = new Pixels(Math.floor(w / shrink), Math.floor(h / shrink), 255);
  for (let y = 0; y < pic.h; y++)
    for (let x = 0; x < pic.w; x++) {
      const c = px[(y * shrink + (shrink >> 1)) * w + x * shrink + (shrink >> 1)];
      if (c) pic.set(x, y, nearest(colors, c));
    }
  return blocksOf(pic, skyOf(pal));
}

/** One of Teddy's or Gwinn's sprites from the Teddy game, into the hall's palette. */
export function dogBlocks(pal: Pal, who: 'teddy' | 'gwinn', pose: string): Pixels[] {
  const src = who === 'teddy' ? POSES[pose] : GWINN[pose];
  if (!src) throw new Error(`No ${who} pose ${pose}`);
  const colors = usedColors(pal);
  const pic = new Pixels(src.w, src.h, 255);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c === 255 || c === 0) continue;
      const [r, g, b] = [TEDDY_PAL.pal[c * 3], TEDDY_PAL.pal[c * 3 + 1], TEDDY_PAL.pal[c * 3 + 2]];
      pic.set(x, y, nearest(colors, [(r << 2) | (r >> 4), (g << 2) | (g >> 4), (b << 2) | (b >> 4)]));
    }
  return blocksOf(pic, skyOf(pal));
}

/** THE CHEZ (games/kit/chez.ts, true to the photos: 40x20) in the hall's own ramps: two blocks, left then right. */
export function chezBlocks(pal: Pal): Pixels[] {
  const { c } = pal;
  const ink: ChezInk = {
    body: [c('red', 1), c('red', 2), c('red', 3)],
    trim: c('red', 0),
    glass: [c('blue', 1), c('sky', 4)],
    roof: c('ink', 0),
    tire: c('ink', 0),
    hub: c('stone', 4),
    rim: c('white', 3),
    bumper: c('ink', 1),
    lamp: c('gold', 2),
    tail: c('red', 3),
    stripe: c('ink', 1),
    pin: c('white', 3),
    chrome: c('stone', 4),
  };
  const car = chezPicture(ink, 'right');
  const wall = skyOf(pal);
  const sheet = new Pixels(40, 20, wall).blit(car, 0, 20 - car.h, 255);
  return [sheet.crop(0, 0, 20, 20), sheet.crop(20, 0, 20, 20)];
}

/** The guests the halls can seat, by name: each a list of frames (a still picture has one), each frame its blocks, top first. */
export const CAMEO_NAMES = ['teddy', 'gwinn', 'chicken', 'lewie', 'joe', 'watt', 'carl', 'goat', 'will', 'camel', 'loaf', 'seed'] as const;
export type CameoName = (typeof CAMEO_NAMES)[number];

export function cameoFrames(pal: Pal, name: CameoName): Pixels[][] {
  if (name === 'teddy') return [dogBlocks(pal, 'teddy', 'front'), dogBlocks(pal, 'teddy', 'frontBark')];
  if (name === 'gwinn') return [dogBlocks(pal, 'gwinn', 'gwinn1'), dogBlocks(pal, 'gwinn', 'gwinn2')];
  return [castBlocks(pal, name, name === 'chicken' ? 3 : 1)];
}
