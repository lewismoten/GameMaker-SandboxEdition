// The Mac app's icon (Contents/Resources/AppIcon.icns), drawn without a canvas so the web
// app and web/scripts/macDmg.ts make the same one: a rounded tile in the shape of a macOS icon
// with a little 4:3 screen showing the game (its first level, as the home page's tiles do,
// or its title picture), saved as PNGs inside an .icns file.
//
// .icns: "icns", the file's length, then entries of a 4-byte type, the entry's length
// (8 + data) and its data; types ic07..ic10 hold PNGs of 128, 256, 512 and 1024 pixels.
import { crc32 } from '../project/zip';
import { vga8 } from '../formats/palette';
import type { IndexedImage } from '../formats/gif';

export interface IconColors {
  /** Tile gradient, top and bottom (CSS hex, #rgb or #rrggbb). */
  top: string;
  bottom: string;
}

const DEFAULT_COLORS: IconColors = { top: '#3b4a7a', bottom: '#151a2e' };

function hex(c: string): [number, number, number] {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return [32, 32, 48];
  const h = m[1].length === 3 ? [...m[1]].map((d) => d + d).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Signed distance from (x, y) to a rounded rectangle (negative inside). */
function roundRect(x: number, y: number, left: number, top: number, w: number, h: number, r: number): number {
  const qx = Math.abs(x - (left + w / 2)) - (w / 2 - r);
  const qy = Math.abs(y - (top + h / 2)) - (h / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The icon at 1024 x 1024, RGBA. `picture` fills the screen, cropped to 4:3 (a 320 x 200
 * picture is shown at 4:3, as a VGA monitor stretched it).
 */
export function drawIcon(picture: IndexedImage | undefined, colors: IconColors = DEFAULT_COLORS): Uint8Array {
  const S = 1024;
  const out = new Uint8Array(S * S * 4);
  const [t, b] = [hex(colors.top), hex(colors.bottom)];
  // the macOS icon grid: an 824 px tile with 185 px corners, a soft shadow below it
  const tile = { x: 100, y: 100, w: 824, h: 824, r: 185 };
  const screen = { x: 164, y: 214, w: 696, h: 522, r: 28 };
  const bezel = 14;
  const rgb = picture ? Array.from({ length: 256 }, (_, i) => [0, 1, 2].map((k) => vga8(picture.palette[i * 3 + k] ?? 0))) : [];
  // the part of the picture shown: a 4:3 crop (320 x 200 pictures are already 4:3 on screen)
  let crop = { x: 0, y: 0, w: 1, h: 1 };
  if (picture) {
    const aspect = picture.width === 320 && picture.height === 200 ? 4 / 3 : picture.width / picture.height;
    crop =
      aspect > 4 / 3
        ? { x: (picture.width * (1 - 4 / 3 / aspect)) / 2, y: 0, w: (picture.width * (4 / 3)) / aspect, h: picture.height }
        : { x: 0, y: (picture.height * (1 - aspect / (4 / 3))) / 2, w: picture.width, h: (picture.height * aspect) / (4 / 3) };
  }
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const o = (y * S + x) * 4;
      // shadow
      const sd = roundRect(px, py - 14, tile.x, tile.y, tile.w, tile.h, tile.r);
      let a = 0.32 * (1 - clamp01(sd / 30));
      let r = 0;
      let g = 0;
      let bl = 0;
      const inTile = clamp01(0.5 - roundRect(px, py, tile.x, tile.y, tile.w, tile.h, tile.r));
      if (inTile > 0) {
        const f = (py - tile.y) / tile.h;
        let cr = t[0] + (b[0] - t[0]) * f;
        let cg = t[1] + (b[1] - t[1]) * f;
        let cb = t[2] + (b[2] - t[2]) * f;
        // a light rim at the top of the tile
        const rim = clamp01(1 - (py - tile.y) / 6) * 0.25;
        cr += (255 - cr) * rim;
        cg += (255 - cg) * rim;
        cb += (255 - cb) * rim;
        // the screen's bezel, then the screen
        const inBezel = clamp01(0.5 - roundRect(px, py, screen.x - bezel, screen.y - bezel, screen.w + 2 * bezel, screen.h + 2 * bezel, screen.r + bezel));
        if (inBezel > 0) {
          cr += (8 - cr) * inBezel * 0.85;
          cg += (8 - cg) * inBezel * 0.85;
          cb += (12 - cb) * inBezel * 0.85;
        }
        const inScreen = clamp01(0.5 - roundRect(px, py, screen.x, screen.y, screen.w, screen.h, screen.r));
        if (inScreen > 0) {
          let sr = 20;
          let sg = 24;
          let sb = 40;
          if (picture) {
            const sx = Math.min(picture.width - 1, Math.floor(crop.x + ((px - screen.x) / screen.w) * crop.w));
            const sy = Math.min(picture.height - 1, Math.floor(crop.y + ((py - screen.y) / screen.h) * crop.h));
            [sr, sg, sb] = rgb[picture.pixels[Math.max(0, sy) * picture.width + Math.max(0, sx)]] ?? [0, 0, 0];
          }
          // a faint glass highlight across the top of the screen
          const glare = clamp01(1 - (py - screen.y) / (screen.h * 0.45)) * 0.1;
          sr += (255 - sr) * glare;
          sg += (255 - sg) * glare;
          sb += (255 - sb) * glare;
          cr += (sr - cr) * inScreen;
          cg += (sg - cg) * inScreen;
          cb += (sb - cb) * inScreen;
        }
        r = cr;
        g = cg;
        bl = cb;
        a = inTile + a * (1 - inTile);
        // over the shadow: tile color weighted by its coverage
        const k = a ? inTile / a : 0;
        r *= k;
        g *= k;
        bl *= k;
      }
      out[o] = Math.round(r);
      out[o + 1] = Math.round(g);
      out[o + 2] = Math.round(bl);
      out[o + 3] = Math.round(a * 255);
    }
  }
  return out;
}

/** Halves an RGBA image (each pixel the average of four, weighted by alpha). */
function halve(rgba: Uint8Array, size: number): Uint8Array {
  const h = size / 2;
  const out = new Uint8Array(h * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < h; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]) {
        const i = ((2 * y + dy) * size + 2 * x + dx) * 4;
        const al = rgba[i + 3];
        r += rgba[i] * al;
        g += rgba[i + 1] * al;
        b += rgba[i + 2] * al;
        a += al;
      }
      const o = (y * h + x) * 4;
      if (a) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      out[o + 3] = Math.round(a / 4);
    }
  return out;
}

async function zlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

export function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** An RGBA PNG (8 bits a channel, rows filtered with "up", which suits flat art). */
export async function encodeRgbaPng(rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 2; // up
    for (let i = 0; i < stride; i++) raw[y * (stride + 1) + 1 + i] = (rgba[y * stride + i] - (y ? rgba[(y - 1) * stride + i] : 0)) & 255;
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return concat([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', await zlib(raw)), chunk('IEND', new Uint8Array(0))]);
}

/** An .icns file of PNGs: [type, png] entries. */
export function icns(entries: [type: string, png: Uint8Array][]): Uint8Array {
  const parts = entries.map(([type, png]) => {
    const head = new Uint8Array(8);
    for (let i = 0; i < 4; i++) head[i] = type.charCodeAt(i);
    new DataView(head.buffer).setUint32(4, 8 + png.length);
    return concat([head, png]);
  });
  const head = new Uint8Array(8);
  head.set([0x69, 0x63, 0x6e, 0x73]); // "icns"
  new DataView(head.buffer).setUint32(4, 8 + parts.reduce((n, p) => n + p.length, 0));
  return concat([head, ...parts]);
}

/** The app's icon: AppIcon.icns, plus the 512 px PNG (for a disk image's volume icon or a page). */
export async function macIcon(picture: IndexedImage | undefined, colors?: IconColors): Promise<{ icns: Uint8Array; png512: Uint8Array }> {
  const big = drawIcon(picture, colors);
  const p512 = halve(big, 1024);
  const p256 = halve(p512, 512);
  const p128 = halve(p256, 256);
  const p64 = halve(p128, 128);
  const p32 = halve(p64, 64);
  const [png1024, png512, png256, png128, png64, png32] = await Promise.all([
    encodeRgbaPng(big, 1024, 1024),
    encodeRgbaPng(p512, 512, 512),
    encodeRgbaPng(p256, 256, 256),
    encodeRgbaPng(p128, 128, 128),
    encodeRgbaPng(p64, 64, 64),
    encodeRgbaPng(p32, 32, 32),
  ]);
  // ic11/ic12: 16 and 32 pt at 2x; ic07-ic10: 128 to 1024; ic13/ic14: 128 and 256 pt at 2x
  return {
    icns: icns([
      ['ic11', png32],
      ['ic12', png64],
      ['ic07', png128],
      ['ic13', png256],
      ['ic08', png256],
      ['ic14', png512],
      ['ic09', png512],
      ['ic10', png1024],
    ]),
    png512,
  };
}
