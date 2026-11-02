// Lossless GIF color-table shrink for the Optimize dialog. A picture file often carries a 256-entry
// color table for an image that only draws with a few of the first colors. PLAYGAME (code/GM/GIFC.C
// intro/readcols) loads the table into VGA colors 0..N-1, zeroes the rest, and takes N from the table
// size (the LZW clear code must equal N, so the table never goes below 4 entries). So a smaller
// table gives the same screen only when (a) every color number the image uses is below the new size
// and (b) every dropped entry is already black. Colors are never renumbered: the engine and the
// game's text draw over these pictures with the same color numbers. Pure: bytes in, bytes out.
import { decodeGif, isGif, lzwEncode } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';

export interface GifShrink {
  bytes: Uint8Array;
  /** Table size before and after. */
  from: number;
  to: number;
}

/** Entries of the table PLAYGAME ends up using (a local table replaces the global one) and where its raw bytes start. */
function tableOf(g: Uint8Array): { count: number; at: number } | undefined {
  let p = 10;
  const flags = g[p];
  p += 3;
  let table: { count: number; at: number } | undefined;
  if (flags & 0x80) {
    table = { count: 2 << (flags & 7), at: p };
    p += table.count * 3;
  }
  for (;;) {
    const b = g[p++];
    if (b === 0x21) {
      p++;
      while (p < g.length && g[p] !== 0) p += g[p] + 1;
      p++;
    } else if (b === 0x2c) break;
    else return undefined;
  }
  p += 8;
  const f = g[p++];
  if (f & 0x80) table = { count: 2 << (f & 7), at: p };
  return table;
}

/** The smaller file, or undefined when the table can't shrink without changing what PLAYGAME shows. */
export function shrinkGif(bytes: Uint8Array): GifShrink | undefined {
  if (!isGif(bytes)) return undefined;
  try {
    const t = tableOf(bytes);
    if (!t) return undefined;
    const img = decodeGif(bytes);
    let top = 0;
    for (const v of img.pixels) if (v > top) top = v;
    let n = 4;
    while (n <= top) n *= 2;
    for (; n < t.count; n *= 2) {
      let black = true;
      for (let i = n * 3; i < img.palette.length && black; i++) black = img.palette[i] === 0;
      if (black) break;
    }
    if (n >= t.count) return undefined;
    const bits = Math.log2(n);
    const out: number[] = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61, bytes[6], bytes[7], bytes[8], bytes[9], 0x80 | 0x70 | (bits - 1), 0, 0];
    for (let i = 0; i < n * 3; i++) out.push(bytes[t.at + i] ?? 0);
    out.push(0x2c, 0, 0, 0, 0, img.width & 255, img.width >> 8, img.height & 255, img.height >> 8, 0, bits);
    const data = lzwEncode(img.pixels, bits);
    for (let i = 0; i < data.length; i += 255) {
      out.push(Math.min(255, data.length - i));
      for (let j = i; j < Math.min(data.length, i + 255); j++) out.push(data[j]);
    }
    out.push(0, 0x3b);
    const next = Uint8Array.from(out);
    if (next.length >= bytes.length) return undefined;
    // proof: the decoded picture and all 256 VGA colors are identical
    const back = decodeGif(next);
    if (
      back.width !== img.width ||
      back.height !== img.height ||
      back.pixels.some((v, i) => v !== img.pixels[i]) ||
      back.palette.some((v, i) => v !== img.palette[i])
    )
      return undefined;
    return { bytes: next, from: t.count, to: n };
  } catch {
    return undefined;
  }
}
