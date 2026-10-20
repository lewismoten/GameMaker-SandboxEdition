// A tiny PNG writer for previews of block sheets and screens while designing (not part
// of the game disk).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { Pixels, Pixels as PixelsCtor } from '../kit/pixels';

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc(out.subarray(4, 8 + data.length)));
  return out;
}

/** Writes an indexed picture through a 6-bit VGA palette, scaled up `s` times. */
export function writePng(file: string, p: Pixels, pal: Uint8Array, s = 1): void {
  const w = p.w * s;
  const h = p.h * s;
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const c = p.px[Math.floor(y / s) * p.w + Math.floor(x / s)];
      const o = y * (w * 3 + 1) + 1 + x * 3;
      if (c === 255) {
        const k = ((x >> 3) + (y >> 3)) & 1 ? 200 : 160;
        raw[o] = raw[o + 1] = raw[o + 2] = k;
      } else for (let i = 0; i < 3; i++) raw[o + i] = (pal[c * 3 + i] << 2) | (pal[c * 3 + i] >> 4);
    }
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const sig = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((n, x) => n + x.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const x of parts) {
    out.set(x, o);
    o += x.length;
  }
  writeFileSync(file, out);
}

/** A sheet of 20x20 blocks, `cols` across, with a 2 pixel gap. */
export function blockSheet(blocks: { pixels: Uint8Array }[], cols = 16, bg = 0): Pixels {
  const rows = Math.ceil(blocks.length / cols);
  const sheet = new PixelsCtor(cols * 22, rows * 22, bg);
  blocks.forEach((b, i) => {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) sheet.set((i % cols) * 22 + x, Math.floor(i / cols) * 22 + y, b.pixels[y * 20 + x]);
  });
  return sheet;
}
