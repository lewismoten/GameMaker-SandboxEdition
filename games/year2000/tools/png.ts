// Development aid: writes indexed pictures as PNG files for looking at the art.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import type { Pixels } from '../../kit/pixels';

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc(b: Uint8Array): number {
  let c = 0xffffffff;
  for (const v of b) c = CRC[(c ^ v) & 255] ^ (c >>> 8);
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

/** Writes a picture scaled by `s`, palette 6-bit, transparent (255) shown magenta-grey checks. */
export function writePng(file: string, p: Pixels, pal: Uint8Array, s = 2): void {
  const w = p.w * s;
  const h = p.h * s;
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const c = p.px[Math.floor(y / s) * p.w + Math.floor(x / s)];
      const o = y * (w * 3 + 1) + 1 + x * 3;
      if (c === 255) {
        const v = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 90 : 60;
        raw.set([v, v, v], o);
      } else raw.set([pal[c * 3] * 4, pal[c * 3 + 1] * 4, pal[c * 3 + 2] * 4], o);
    }
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const parts = [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array())];
  const total = parts.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of parts) {
    out.set(a, o);
    o += a.length;
  }
  writeFileSync(file, out);
}
