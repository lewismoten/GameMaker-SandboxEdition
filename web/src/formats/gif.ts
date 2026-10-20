// GIF87a/89a decoder and encoder for 8-bit indexed images.
// Mirrors GIFC.C: only the first image is used, it is drawn at (0,0) regardless of its
// position, and palette entries are reduced to 6-bit VGA values (unused entries are black).
import { PALETTE_SIZE, vga8, type Palette } from './palette';

export interface IndexedImage {
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: Palette;
}

export function isGif(bytes: Uint8Array): boolean {
  return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
}

export function decodeGif(bytes: Uint8Array): IndexedImage {
  if (!isGif(bytes)) throw new Error('Not a GIF file');
  let p = 6;
  const u16 = () => {
    const v = bytes[p] | (bytes[p + 1] << 8);
    p += 2;
    return v;
  };
  u16(); // logical screen width
  u16(); // logical screen height
  let flags = bytes[p++];
  p += 2; // background color, aspect
  const palette = new Uint8Array(PALETTE_SIZE);
  const readColors = (count: number) => {
    palette.fill(0);
    for (let i = 0; i < count; i++) {
      palette[i * 3] = (bytes[p++] ?? 0) >> 2;
      palette[i * 3 + 1] = (bytes[p++] ?? 0) >> 2;
      palette[i * 3 + 2] = (bytes[p++] ?? 0) >> 2;
    }
  };
  if (flags & 0x80) readColors(2 << (flags & 7));

  for (;;) {
    const b = bytes[p++];
    if (b === 0x21) {
      p++; // label
      while (p < bytes.length && bytes[p] !== 0) p += bytes[p] + 1;
      p++;
    } else if (b === 0x2c) break;
    else throw new Error('GIF has no image');
  }

  p += 4; // left, top: GameMaker always draws at 0,0
  const width = u16();
  const height = u16();
  flags = bytes[p++];
  const interlaced = (flags & 0x40) !== 0;
  if (flags & 0x80) readColors(2 << (flags & 7));
  const minCodeSize = bytes[p++];

  // Gather data sub-blocks.
  const chunks: number[] = [];
  while (p < bytes.length) {
    const len = bytes[p++];
    if (!len) break;
    for (let i = 0; i < len && p < bytes.length; i++) chunks.push(bytes[p++]);
  }
  const indices = lzwDecode(Uint8Array.from(chunks), minCodeSize, width * height);

  const pixels = new Uint8Array(width * height);
  if (!interlaced) pixels.set(indices.subarray(0, pixels.length));
  else {
    let src = 0;
    for (const [start, step] of [
      [0, 8],
      [4, 8],
      [2, 4],
      [1, 2],
    ])
      for (let y = start; y < height; y += step) {
        pixels.set(indices.subarray(src, src + width), y * width);
        src += width;
      }
  }
  return { width, height, pixels, palette };
}

function lzwDecode(data: Uint8Array, minCodeSize: number, pixelCount: number): Uint8Array {
  const out = new Uint8Array(pixelCount);
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  const prefix = new Int16Array(4096);
  const suffix = new Uint8Array(4096);
  const first = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  let codeSize = minCodeSize + 1;
  let next = clear + 2;
  let prev = -1;
  let bitBuf = 0;
  let bits = 0;
  let pos = 0;
  let o = 0;
  for (let i = 0; i < clear; i++) {
    prefix[i] = -1;
    suffix[i] = i;
    first[i] = i;
  }
  while (o < pixelCount) {
    while (bits < codeSize) {
      if (pos >= data.length) return out;
      bitBuf |= data[pos++] << bits;
      bits += 8;
    }
    const code = bitBuf & ((1 << codeSize) - 1);
    bitBuf >>>= codeSize;
    bits -= codeSize;
    if (code === clear) {
      codeSize = minCodeSize + 1;
      next = clear + 2;
      prev = -1;
      continue;
    }
    if (code === eoi) break;
    let c = code;
    let sp = 0;
    if (prev >= 0 && code >= next) {
      // KwKwK case
      stack[sp++] = first[prev];
      c = prev;
    }
    while (c >= clear && sp < 4096) {
      stack[sp++] = suffix[c];
      c = prefix[c];
    }
    stack[sp++] = c;
    const head = c;
    while (sp > 0 && o < pixelCount) out[o++] = stack[--sp];
    if (prev >= 0 && next < 4096) {
      prefix[next] = prev;
      suffix[next] = head;
      first[next] = first[prev];
      next++;
      if (next === 1 << codeSize && codeSize < 12) codeSize++;
    }
    if (prev < 0) first[code] = code;
    prev = code;
  }
  return out;
}

/** Encodes an 8-bit indexed image as GIF87a with a full 256 color table. */
export function encodeGif(img: IndexedImage): Uint8Array {
  const out: number[] = [];
  const u16 = (v: number) => out.push(v & 0xff, (v >> 8) & 0xff);
  out.push(...[0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
  u16(img.width);
  u16(img.height);
  out.push(0xf7, 0, 0); // global color table, 256 entries
  for (let i = 0; i < PALETTE_SIZE; i++) out.push(vga8(img.palette[i]));
  out.push(0x2c);
  u16(0);
  u16(0);
  u16(img.width);
  u16(img.height);
  out.push(0);
  const minCodeSize = 8;
  out.push(minCodeSize);
  const data = lzwEncode(img.pixels, minCodeSize);
  for (let i = 0; i < data.length; i += 255) {
    const n = Math.min(255, data.length - i);
    out.push(n);
    for (let j = 0; j < n; j++) out.push(data[i + j]);
  }
  out.push(0, 0x3b);
  return Uint8Array.from(out);
}

function lzwEncode(pixels: Uint8Array, minCodeSize: number): Uint8Array {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  const out: number[] = [];
  let codeSize = minCodeSize + 1;
  let next = eoi + 1;
  let bitBuf = 0;
  let bits = 0;
  const emit = (code: number) => {
    bitBuf |= code << bits;
    bits += codeSize;
    while (bits >= 8) {
      out.push(bitBuf & 0xff);
      bitBuf >>>= 8;
      bits -= 8;
    }
  };
  let dict = new Map<number, number>();
  emit(clear);
  if (pixels.length === 0) {
    emit(eoi);
    if (bits) out.push(bitBuf & 0xff);
    return Uint8Array.from(out);
  }
  let cur = pixels[0];
  for (let i = 1; i < pixels.length; i++) {
    const k = pixels[i];
    const key = (cur << 8) | k;
    const found = dict.get(key);
    if (found !== undefined) {
      cur = found;
      continue;
    }
    emit(cur);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > 1 << codeSize && codeSize < 12) codeSize++;
    } else {
      emit(clear);
      dict = new Map();
      codeSize = minCodeSize + 1;
      next = eoi + 1;
    }
    cur = k;
  }
  emit(cur);
  emit(eoi);
  if (bits) out.push(bitBuf & 0xff);
  return Uint8Array.from(out);
}
