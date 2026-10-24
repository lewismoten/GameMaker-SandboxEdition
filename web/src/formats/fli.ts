// Autodesk Animator .fli (and .flc) decoder.
// GameMaker's FLI::View plays the first NumFrames frames once, waiting `speed`
// vertical retraces (70 Hz) after each frame (see code/Image/FLI/FLI.CPP).
//
// Layout (FLIHeader in code/Image/FLI/FLI.HPP): a 128-byte header of file size u32,
// magic u16 (0xAF11 FLI, 0xAF12 FLC), frame count u16, width u16, height u16, depth u16 (8),
// flags u16, speed (u16 jiffies for FLI; u32 milliseconds for FLC), ... Frames follow,
// each a 16-byte header (size u32, magic 0xF1FA, chunk count u16, 8 reserved) and its
// chunks, each a 6-byte header (size u32 including the header, type u16) and data.
// Chunk types FLI.CPP handles: 11 COLOR (64-level palette), 12 LC (line delta),
// 13 BLACK, 15 BRUN (run-length full frame), 16 COPY (raw pixels). This decoder also reads
// the FLC chunks 4 COLOR_256 and 7 SS2 (word-oriented delta), which FLI.CPP does not.
import { PALETTE_SIZE } from './palette';

interface FliAnimation {
  width: number;
  height: number;
  frameCount: number;
  /** Delay per frame in 1/70 s (FLI) — FLC files are converted from milliseconds. */
  speed: number;
  /** Byte offsets of each frame record. */
  frames: number[];
  bytes: Uint8Array;
}

interface FliCanvas {
  pixels: Uint8Array;
  /** 6-bit palette, 768 bytes. */
  palette: Uint8Array;
}

const FLI_MAGIC = 0xaf11;
const FLC_MAGIC = 0xaf12;
const FRAME_MAGIC = 0xf1fa;

export function isFli(bytes: Uint8Array): boolean {
  const magic = bytes[4] | (bytes[5] << 8);
  return magic === FLI_MAGIC || magic === FLC_MAGIC;
}

export function parseFli(bytes: Uint8Array): FliAnimation {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = view.getUint16(4, true);
  if (magic !== FLI_MAGIC && magic !== FLC_MAGIC) throw new Error('Not an FLI file');
  const frameCount = view.getUint16(6, true);
  const width = view.getUint16(8, true) || 320;
  const height = view.getUint16(10, true) || 200;
  let speed = view.getUint16(16, true);
  if (magic === FLC_MAGIC) speed = Math.round((view.getUint32(16, true) * 70) / 1000);
  // FLC stores the offset of frame 1 at byte 80; FLI frames always start after the header.
  let offset = magic === FLC_MAGIC ? view.getUint32(80, true) || 128 : 128;
  const frames: number[] = [];
  // Include the trailing loop frame if present (callers decide how many to play).
  while (offset + 16 <= bytes.length && frames.length <= frameCount) {
    const size = view.getUint32(offset, true);
    const type = view.getUint16(offset + 4, true);
    if (size < 16) break;
    // Records with another magic (such as FLC prefix chunks, 0xF100) are skipped.
    if (type === FRAME_MAGIC) frames.push(offset);
    offset += size;
  }
  return { width, height, frameCount, speed, frames, bytes };
}

export function newFliCanvas(anim: FliAnimation): FliCanvas {
  return { pixels: new Uint8Array(anim.width * anim.height), palette: new Uint8Array(PALETTE_SIZE) };
}

/** Applies frame n to the canvas. Returns true if the palette changed. */
export function applyFliFrame(anim: FliAnimation, n: number, c: FliCanvas): boolean {
  const start = anim.frames[n];
  if (start === undefined) return false;
  const b = anim.bytes;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const frameSize = view.getUint32(start, true);
  const chunks = view.getUint16(start + 6, true);
  const end = Math.min(b.length, start + frameSize);
  let p = start + 16;
  let paletteChanged = false;
  for (let i = 0; i < chunks && p + 6 <= end; i++) {
    const size = view.getUint32(p, true);
    const type = view.getUint16(p + 4, true);
    const data = p + 6;
    const chunkEnd = Math.min(end, p + Math.max(size, 6));
    switch (type) {
      case 11: // FLI_COLOR (0..63)
      case 4: // FLC COLOR_256 (0..255)
        colorChunk(b, data, c.palette, type === 4);
        paletteChanged = true;
        break;
      case 12:
        lcChunk(b, data, chunkEnd, anim.width, c.pixels);
        break;
      case 7:
        ss2Chunk(b, data, chunkEnd, anim.width, anim.height, c.pixels);
        break;
      case 13:
        c.pixels.fill(0);
        break;
      case 15:
        brunChunk(b, data, chunkEnd, anim.width, anim.height, c.pixels);
        break;
      case 16:
        c.pixels.set(b.subarray(data, Math.min(chunkEnd, data + c.pixels.length)));
        break;
    }
    if (size < 6) break;
    p += size;
  }
  return paletteChanged;
}

// COLOR: packet count u16, then per packet a skip u8 (palette entries to leave alone) and
// a count u8 (0 means 256) followed by that many RGB triples (DoColorChange in FLI.CPP).
function colorChunk(b: Uint8Array, p: number, pal: Uint8Array, eightBit: boolean): void {
  const packets = b[p] | (b[p + 1] << 8);
  p += 2;
  let idx = 0;
  for (let i = 0; i < packets; i++) {
    idx += b[p++];
    let count = b[p++];
    if (count === 0) count = 256;
    for (let j = 0; j < count && idx < 256; j++, idx++) {
      for (let k = 0; k < 3; k++) {
        const v = b[p++] ?? 0;
        pal[idx * 3 + k] = eightBit ? v >> 2 : v & 63;
      }
    }
  }
}

// BRUN: every line is a packet count u8, then packets of a signed count: positive = repeat
// the next byte that many times, negative = copy that many literal bytes.
function brunChunk(b: Uint8Array, p: number, end: number, w: number, h: number, px: Uint8Array): void {
  for (let y = 0; y < h && p < end; y++) {
    p++; // packet count (unreliable for wide images; decode by width)
    let x = 0;
    const row = y * w;
    while (x < w && p < end) {
      const n = (b[p++] << 24) >> 24;
      if (n >= 0) {
        const v = b[p++];
        for (let i = 0; i < n && x < w; i++) px[row + x++] = v;
      } else {
        for (let i = 0; i < -n && x < w; i++) px[row + x++] = b[p++];
      }
    }
  }
}

// LC: first changed line u16, line count u16; each line has a packet count u8 and packets
// of skip u8 (pixels left unchanged) then a signed count: positive = that many literal
// bytes, negative = repeat the next byte. Note the signs are the reverse of BRUN.
function lcChunk(b: Uint8Array, p: number, end: number, w: number, px: Uint8Array): void {
  let y = b[p] | (b[p + 1] << 8);
  const lines = b[p + 2] | (b[p + 3] << 8);
  p += 4;
  for (let l = 0; l < lines && p < end; l++, y++) {
    const packets = b[p++];
    let x = 0;
    for (let i = 0; i < packets && p < end; i++) {
      x += b[p++];
      const n = (b[p++] << 24) >> 24;
      const row = y * w;
      if (n >= 0) {
        for (let j = 0; j < n; j++) px[row + x++] = b[p++];
      } else {
        const v = b[p++];
        for (let j = 0; j < -n; j++) px[row + x++] = v;
      }
    }
  }
}

// SS2 (FLC delta): line count u16, then per line one or more i16 words. Top bits 11 = a
// negative count of lines to skip; 10 = the low byte is the line's last pixel (odd widths), and a packet count
// word follows; 00 = the packet count. Packets are skip u8 then a signed count of pixel
// pairs: positive = that many literal pairs, negative = repeat the next pair.
function ss2Chunk(b: Uint8Array, p: number, end: number, w: number, h: number, px: Uint8Array): void {
  let lines = b[p] | (b[p + 1] << 8);
  p += 2;
  let y = 0;
  while (lines > 0 && p < end && y < h) {
    let word = ((b[p] | (b[p + 1] << 8)) << 16) >> 16;
    p += 2;
    if ((word & 0xc000) === 0xc000) {
      y -= word; // skip lines (word is negative)
      continue;
    }
    if ((word & 0xc000) === 0x8000) {
      px[y * w + w - 1] = word & 0xff;
      word = ((b[p] | (b[p + 1] << 8)) << 16) >> 16;
      p += 2;
    }
    let x = 0;
    const row = y * w;
    for (let i = 0; i < word && p < end; i++) {
      x += b[p++];
      const n = (b[p++] << 24) >> 24;
      if (n >= 0) {
        for (let j = 0; j < n; j++) {
          px[row + x++] = b[p++];
          px[row + x++] = b[p++];
        }
      } else {
        const v1 = b[p++];
        const v2 = b[p++];
        for (let j = 0; j < -n; j++) {
          px[row + x++] = v1;
          px[row + x++] = v2;
        }
      }
    }
    y++;
    lines--;
  }
}

/** BRUN: each line as runs of one value or stretches of literal pixels. */
function brun(px: Uint8Array, w: number, h: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < h; y++) {
    // Runs of 3 or more equal pixels become run packets (count 1..127, value); anything
    // else goes in literal packets (count -1..-128) that stop where a 3-run begins.
    const row = px.subarray(y * w, y * w + w);
    const line: number[] = [];
    let packets = 0;
    let x = 0;
    while (x < w) {
      let run = 1;
      while (x + run < w && run < 127 && row[x + run] === row[x]) run++;
      if (run >= 3 || x + run >= w) {
        line.push(run, row[x]);
        x += run;
      } else {
        let n = 0;
        while (x + n < w && n < 128 && !(x + n + 2 < w && row[x + n] === row[x + n + 1] && row[x + n] === row[x + n + 2])) n++;
        line.push((256 - n) & 255, ...row.subarray(x, x + n));
        x += n;
      }
      packets++;
    }
    // The packet count byte is capped; readers (brunChunk here) decode by width instead.
    out.push(Math.min(255, packets), ...line);
  }
  return out;
}

/**
 * LC (delta) chunk: only the lines and spans that changed since the previous frame.
 * Returns undefined when nothing changed, or when a full BRUN frame would be smaller.
 */
function lineDelta(prev: Uint8Array, px: Uint8Array, w: number, h: number, runs = false): number[] | undefined {
  let first = 0;
  while (first < h && rowSame(prev, px, first, w)) first++;
  if (first === h) return [0, 0, 0, 0]; // an empty change: same picture
  let last = h - 1;
  while (last > first && rowSame(prev, px, last, w)) last--;
  // LC header: first changed line, then how many lines follow (unchanged lines inside the
  // range get a packet count of 0).
  const out = [first & 255, first >> 8, (last - first + 1) & 255, (last - first + 1) >> 8];
  for (let y = first; y <= last; y++) {
    const row = y * w;
    const packets: number[] = [];
    let count = 0;
    let x = 0;
    let lastEnd = 0;
    while (x < w) {
      if (prev[row + x] === px[row + x]) {
        x++;
        continue;
      }
      // a span of changed pixels (a short run of unchanged ones inside it is kept)
      let end = x;
      while (end < w && end - x < 127 && (prev[row + end] !== px[row + end] || (end + 1 < w && prev[row + end + 1] !== px[row + end + 1]))) end++;
      let skip = x - lastEnd;
      while (skip > 255) {
        // a skip longer than 255: an empty literal packet carries part of it
        packets.push(255, 0);
        count++;
        skip -= 255;
      }
      const n = end - x;
      const allSame = px.subarray(row + x, row + end).every((v) => v === px[row + x]);
      if (runs && !allSame) count += packRuns(px, row + x, row + end, skip, packets);
      else {
        if (allSame && n > 2) packets.push(skip, (256 - n) & 255, px[row + x]);
        else packets.push(skip, n, ...px.subarray(row + x, row + end));
        count++;
      }
      lastEnd = end;
      x = end;
    }
    // The per-line packet count is one byte; more packets means use BRUN instead.
    if (count > 255) return undefined;
    out.push(count, ...packets);
  }
  return out;
}

/** Splits px[from, to) into run packets (3 or more of a color) and literal ones; returns how many. */
function packRuns(px: Uint8Array, from: number, to: number, skip: number, packets: number[]): number {
  let count = 0;
  let lit = from;
  const flush = (end: number) => {
    if (end > lit) {
      packets.push(count ? 0 : skip, end - lit, ...px.subarray(lit, end));
      count++;
    }
  };
  let i = from;
  while (i < to) {
    let r = 1;
    while (i + r < to && r < 127 && px[i + r] === px[i]) r++;
    if (r >= 3) {
      flush(i);
      packets.push(count ? 0 : skip, (256 - r) & 255, px[i]);
      count++;
      i += r;
      lit = i;
    } else {
      i += r;
      while (i - lit > 127) {
        flush(lit + 127);
        lit += 127;
      }
    }
  }
  flush(to);
  return count;
}

function rowSame(a: Uint8Array, b: Uint8Array, y: number, w: number): boolean {
  for (let i = y * w, e = i + w; i < e; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Wraps data in a chunk header (size u32 including the 6 header bytes, type u16), padded
// to an even size.
function fliChunk(type: number, data: number[]): number[] {
  let size = data.length + 6;
  const pad = size & 1;
  size += pad;
  return [size & 255, (size >> 8) & 255, (size >> 16) & 255, size >>> 24, type & 255, type >> 8, ...data, ...(pad ? [0] : [])];
}

/**
 * Writes an Autodesk Animator .FLI (Game-Maker shows 320x200): every frame run-length
 * coded, the 6-bit palette in the first frame, and a closing "ring" frame that leads back
 * to the start. `speed` is the delay after each frame in 1/70 s.
 */
export function encodeFli(
  frames: Uint8Array[],
  palette: Uint8Array,
  opts: {
    width?: number;
    height?: number;
    speed?: number;
    /** A palette per frame (fades, flashes); changes are stored where they happen. */ palettes?: Uint8Array[];
    /** Code runs of a color inside changed spans as run packets too (smaller deltas for drawn art). */ runs?: boolean;
  } = {},
): Uint8Array {
  const w = opts.width ?? 320;
  const h = opts.height ?? 200;
  const all = [...frames, frames[0]];
  const pals = opts.palettes ? [...frames.map((_, i) => opts.palettes![i] ?? palette), opts.palettes[0] ?? palette] : undefined;
  const records = all.map((px, i) => {
    const chunks: number[][] = [];
    const pal = pals?.[i] ?? palette;
    if (i === 0 || (pals && pals[i - 1].some((v, c) => c < 768 && (v & 63) !== (pal[c] & 63)))) {
      const colors: number[] = [1, 0, 0, 0]; // one packet: skip 0, count 0 = 256 colors
      for (let c = 0; c < 768; c++) colors.push(pal[c] & 63);
      chunks.push(fliChunk(11, colors));
    }
    // After the first frame, store only what changed, when that is smaller.
    const prev = i > 0 ? all[i - 1] : undefined;
    const delta = prev ? lineDelta(prev, px, w, h, opts.runs) : undefined;
    // BRUN is only built to compare against when the delta is 64000 bytes (a raw frame) or more.
    const full = delta && delta.length < 64000 ? undefined : brun(px, w, h);
    if (delta && (!full || delta.length < full.length)) chunks.push(fliChunk(12, delta));
    else chunks.push(fliChunk(15, full ?? brun(px, w, h)));
    const body = chunks.flat();
    // Frame header: size u32, magic 0xF1FA, chunk count u16, 8 reserved bytes.
    const size = body.length + 16;
    return [size & 255, (size >> 8) & 255, (size >> 16) & 255, size >>> 24, 0xfa, 0xf1, chunks.length, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...body];
  });
  const total = 128 + records.reduce((n, r) => n + r.length, 0);
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  // FLIHeader: size, magic, frame count (not counting the ring frame), width, height,
  // depth 8, speed; the rest of the 128 bytes stay 0.
  dv.setUint32(0, total, true);
  dv.setUint16(4, 0xaf11, true);
  dv.setUint16(6, frames.length, true);
  dv.setUint16(8, w, true);
  dv.setUint16(10, h, true);
  dv.setUint16(12, 8, true);
  dv.setUint16(16, opts.speed ?? 5, true);
  let p = 128;
  for (const r of records) {
    out.set(r, p);
    p += r.length;
  }
  return out;
}
