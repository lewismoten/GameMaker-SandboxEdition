// GIFs a picture at a time, the way a 1994 BBS caller saw them: decoding only the bytes that
// have arrived so far (a viewer that shows the picture while Zmodem is still receiving it),
// and writing interlaced GIF89a files, whose rows come in four passes so the whole picture
// shows up coarse first and sharpens as the rest arrives.
//
// Interlaced row order (GIF89a appendix E): every 8th row from row 0, every 8th from row 4,
// every 4th from row 2, then every 2nd from row 1. A row from an early pass stands in for
// the rows below it that haven't arrived yet (8, 4, 2 rows), so the picture fills in blocky
// and gets finer, the way viewers that drew while downloading showed it.
import { lzwDecode, lzwEncode, type IndexedImage } from './gif';
import { PALETTE_SIZE, vga8, type Palette } from './palette';

/** A GIF read from as many of its bytes as there are so far. */
interface PartialGif {
  width: number;
  height: number;
  /** 6-bit VGA values (the DAC), as decodeGif() gives them. */
  palette: Palette;
  /** How many colors the file's color table has. */
  colors: number;
  interlaced: boolean;
  /** Indexes in file order: row by row as stored (interlaced files store their passes in turn). */
  stored: Uint8Array;
  /** How many pixels of `stored` have arrived. */
  received: number;
  /** All the pixels have arrived. */
  complete: boolean;
  /** Pixel width/height ratio from the GIF89a header (1 when not given). */
  aspect: number;
}

const PASSES: [number, number, number][] = [
  // [first row, step, rows it stands in for]
  [0, 8, 8],
  [4, 8, 4],
  [2, 4, 2],
  [1, 2, 1],
];

/** The picture row each stored row is, and how many rows it covers until finer rows arrive. */
export function storedRows(height: number, interlaced: boolean): { y: number; span: number }[] {
  if (!interlaced) return Array.from({ length: height }, (_, y) => ({ y, span: 1 }));
  const out: { y: number; span: number }[] = [];
  for (const [start, step, span] of PASSES) for (let y = start; y < height; y += step) out.push({ y, span });
  return out;
}

/**
 * Reads the start of a GIF. Undefined until the header, color table and image descriptor
 * have all arrived (a viewer can't draw anything before that).
 */
export function decodePartialGif(bytes: Uint8Array): PartialGif | undefined {
  if (bytes.length < 13 || bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) return undefined;
  let p = 10;
  let flags = bytes[p++];
  p++; // background color
  const aspectByte = bytes[p++];
  const palette = new Uint8Array(PALETTE_SIZE);
  let colors = 0;
  const readColors = (flags: number): boolean => {
    colors = 2 << (flags & 7);
    if (p + colors * 3 > bytes.length) return false;
    palette.fill(0);
    for (let i = 0; i < colors * 3; i++) palette[i] = bytes[p++] >> 2;
    return true;
  };
  if (flags & 0x80 && !readColors(flags)) return undefined;
  for (;;) {
    if (p >= bytes.length) return undefined;
    const b = bytes[p++];
    if (b === 0x2c) break;
    if (b !== 0x21) return undefined; // the trailer (or junk) before any image
    p++; // extension label
    while (p < bytes.length && bytes[p] !== 0) p += bytes[p] + 1;
    p++;
  }
  if (p + 10 > bytes.length) return undefined;
  p += 4; // left, top
  const width = bytes[p] | (bytes[p + 1] << 8);
  const height = bytes[p + 2] | (bytes[p + 3] << 8);
  p += 4;
  flags = bytes[p++];
  if (flags & 0x80 && !readColors(flags)) return undefined;
  const minCodeSize = bytes[p++];
  // The image data sub-blocks that are here, the last one maybe cut short.
  const data = new Uint8Array(Math.max(0, bytes.length - p));
  let n = 0;
  let ended = false;
  while (p < bytes.length) {
    const len = bytes[p++];
    if (!len) {
      ended = true;
      break;
    }
    const take = Math.min(len, bytes.length - p);
    data.set(bytes.subarray(p, p + take), n);
    n += take;
    p += take;
  }
  const done = { count: 0 };
  const stored = lzwDecode(data.subarray(0, n), minCodeSize, width * height, done);
  return {
    width,
    height,
    palette,
    colors,
    interlaced: (flags & 0x40) !== 0,
    stored,
    received: done.count,
    complete: ended || done.count >= width * height,
    aspect: aspectByte ? (aspectByte + 15) / 64 : 1,
  };
}

/**
 * The picture as far as it has arrived, rows in screen order. Rows not yet received are
 * `blank`, or, in an interlaced file, a copy of the coarser row above them.
 */
export function partialPixels(g: PartialGif, blank = 0): Uint8Array {
  const { width, height, stored } = g;
  const out = new Uint8Array(width * height).fill(blank);
  const rows = storedRows(height, g.interlaced);
  for (let i = 0; i < rows.length; i++) {
    const from = i * width;
    if (from >= g.received) break;
    const have = Math.min(width, g.received - from);
    const { y, span } = rows[i];
    for (let r = y; r < Math.min(height, y + span); r++) out.set(stored.subarray(from, from + have), r * width);
  }
  return out;
}

/**
 * Encodes an image as GIF89a: interlaced if asked, with a color table just big enough for
 * `colors` and an optional pixel aspect byte ((n + 15) / 64 = pixel width / height; 38 is
 * the tall pixels of 320x200 and 640x400 on a 4:3 screen).
 */
export function encodeGif89(img: IndexedImage, opts: { interlaced?: boolean; colors?: number; aspect?: number } = {}): Uint8Array {
  let bits = 1;
  while (1 << bits < (opts.colors ?? 256)) bits++;
  const out: number[] = [];
  const u16 = (v: number) => out.push(v & 0xff, (v >> 8) & 0xff);
  out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // GIF89a
  u16(img.width);
  u16(img.height);
  out.push(0x80 | ((bits - 1) << 4) | (bits - 1), 0, opts.aspect ?? 0);
  for (let i = 0; i < 3 << bits; i++) out.push(vga8(img.palette[i] ?? 0));
  out.push(0x2c);
  u16(0);
  u16(0);
  u16(img.width);
  u16(img.height);
  out.push(opts.interlaced ? 0x40 : 0);
  let pixels = img.pixels;
  if (opts.interlaced) {
    pixels = new Uint8Array(img.pixels.length);
    storedRows(img.height, true).forEach(({ y }, i) => pixels.set(img.pixels.subarray(y * img.width, (y + 1) * img.width), i * img.width));
  }
  const minCodeSize = Math.max(2, bits);
  out.push(minCodeSize);
  const data = lzwEncode(pixels, minCodeSize);
  for (let i = 0; i < data.length; i += 255) {
    const n = Math.min(255, data.length - i);
    out.push(n);
    for (let j = 0; j < n; j++) out.push(data[i + j]);
  }
  out.push(0, 0x3b);
  return Uint8Array.from(out);
}
