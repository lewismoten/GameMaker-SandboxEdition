// Tiny RGBA PNG writer (stored deflate via node:zlib) for badgeSimilarReport.ts.
import { deflateSync } from 'node:zlib';
import { crc32 } from 'node:zlib';
import type { Raster } from './badgeSimilarMetrics';

function chunk(name: string, body: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(name, 4, 'latin1');
  out.set(body, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

export function encodeRgbaPng(r: Raster): Uint8Array {
  const head = Buffer.alloc(13);
  head.writeUInt32BE(r.w, 0);
  head.writeUInt32BE(r.h, 4);
  head.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc((r.w * 4 + 1) * r.h);
  for (let y = 0; y < r.h; y++) raw.set(r.data.subarray(y * r.w * 4, (y + 1) * r.w * 4), y * (r.w * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
