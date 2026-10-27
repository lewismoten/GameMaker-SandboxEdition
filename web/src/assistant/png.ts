// A palette-indexed picture as a PNG (color type 3, 8 bits), scaled up by whole pixels, with
// no canvas: the browser and Node both compress it with CompressionStream('deflate'), whose
// zlib stream is what a PNG's IDAT holds (RFC 2083). Colors are VGA's 6-bit levels widened to 8.
import { crc32 } from '../project/zip';
import { vga8 } from '../formats/palette';

export interface IndexedPicture {
  width: number;
  height: number;
  pixels: Uint8Array;
  /** 256 colors x 3 levels of 0-63. */
  palette: Uint8Array;
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

export async function encodePng(pic: IndexedPicture, scale = 1): Promise<Uint8Array> {
  const s = Math.max(1, Math.floor(scale));
  const w = pic.width * s;
  const h = pic.height * s;
  const raw = new Uint8Array((w + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = (y * (w + 1)) | 0;
    const src = Math.floor(y / s) * pic.width;
    for (let x = 0; x < w; x++) raw[row + 1 + x] = pic.pixels[src + Math.floor(x / s)];
  }
  const ihdr = new Uint8Array(13);
  const iv = new DataView(ihdr.buffer);
  iv.setUint32(0, w);
  iv.setUint32(4, h);
  ihdr.set([8, 3, 0, 0, 0], 8);
  const plte = new Uint8Array(768);
  for (let i = 0; i < 768; i++) plte[i] = vga8(pic.palette[i] ?? 0);
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('IDAT', await deflate(raw)),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) (out.set(p, at), (at += p.length));
  return out;
}

/** Bytes as base64 (an MCP image block's data). */
export function base64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
