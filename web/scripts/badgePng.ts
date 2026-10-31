// Minimal PNG reader for the badge art in blockArt.json (8-bit palette, gray, RGB or RGBA, not interlaced).
import { inflateSync } from 'node:zlib';
import type { Raster } from './badgeSimilarMetrics';

export function decodePng(bytes: Uint8Array): Raster {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let w = 0,
    h = 0,
    type = 0,
    depth = 0,
    plte: Uint8Array = new Uint8Array(0),
    trns: Uint8Array = new Uint8Array(0);
  const idat: Uint8Array[] = [];
  for (let p = 8; p < bytes.length;) {
    const len = dv.getUint32(p),
      name = String.fromCharCode(...bytes.subarray(p + 4, p + 8)),
      body = bytes.subarray(p + 8, p + 8 + len);
    if (name === 'IHDR') [w, h, depth, type] = [dv.getUint32(p + 8), dv.getUint32(p + 12), bytes[p + 16], bytes[p + 17]];
    else if (name === 'PLTE') plte = body;
    else if (name === 'tRNS') trns = body;
    else if (name === 'IDAT') idat.push(body);
    p += 12 + len;
  }
  if (depth !== 8 || ![0, 2, 3, 6].includes(type)) throw new Error(`Unsupported PNG (depth ${depth}, type ${type})`);
  const bpp = { 0: 1, 2: 3, 3: 1, 6: 4 }[type as 0 | 2 | 3 | 6];
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp,
    px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let i = 0; i < stride; i++) {
      const cur = raw[y * (stride + 1) + 1 + i];
      const a = i >= bpp ? px[y * stride + i - bpp] : 0,
        b = y ? px[(y - 1) * stride + i] : 0,
        c = i >= bpp && y ? px[(y - 1) * stride + i - bpp] : 0;
      const pa = Math.abs(b - c),
        pb = Math.abs(a - c),
        pc = Math.abs(a + b - 2 * c);
      const paeth = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      px[y * stride + i] = (cur + [0, a, b, (a + b) >> 1, paeth][f]) & 255;
    }
  }
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (type === 3) {
      const k = px[i];
      data.set([plte[k * 3], plte[k * 3 + 1], plte[k * 3 + 2], k < trns.length ? trns[k] : 255], o);
    } else if (type === 0) data.set([px[i], px[i], px[i], 255], o);
    else if (type === 2) data.set([px[i * 3], px[i * 3 + 1], px[i * 3 + 2], 255], o);
    else data.set(px.subarray(i * 4, i * 4 + 4), o);
  }
  return { w, h, data };
}
