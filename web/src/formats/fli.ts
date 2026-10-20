// Autodesk Animator .fli (and .flc) decoder.
// GameMaker's FLI::View plays the first NumFrames frames once, waiting `speed`
// vertical retraces (70 Hz) after each frame (see code/Image/FLI/FLI.CPP).
import { PALETTE_SIZE } from './palette';

export interface FliAnimation {
  width: number;
  height: number;
  frameCount: number;
  /** Delay per frame in 1/70 s (FLI) — FLC files are converted from milliseconds. */
  speed: number;
  /** Byte offsets of each frame record. */
  frames: number[];
  bytes: Uint8Array;
}

export interface FliCanvas {
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
  let offset = magic === FLC_MAGIC ? view.getUint32(80, true) || 128 : 128;
  const frames: number[] = [];
  // Include the trailing loop frame if present (callers decide how many to play).
  while (offset + 16 <= bytes.length && frames.length <= frameCount) {
    const size = view.getUint32(offset, true);
    const type = view.getUint16(offset + 4, true);
    if (size < 16) break;
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

function ss2Chunk(b: Uint8Array, p: number, end: number, w: number, h: number, px: Uint8Array): void {
  let lines = b[p] | (b[p + 1] << 8);
  p += 2;
  let y = 0;
  while (lines > 0 && p < end && y < h) {
    let word = (b[p] | (b[p + 1] << 8)) << 16 >> 16;
    p += 2;
    if ((word & 0xc000) === 0xc000) {
      y -= word; // skip lines (word is negative)
      continue;
    }
    if ((word & 0xc000) === 0x8000) {
      px[y * w + w - 1] = word & 0xff;
      word = (b[p] | (b[p + 1] << 8)) << 16 >> 16;
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
