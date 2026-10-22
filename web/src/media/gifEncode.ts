// Animated GIF89a: palette-indexed frames (the VGA's 256 colors of 6-bit components),
// each shown for its own time, looping forever. A frame only stores the rectangle that
// changed since the one before; a frame whose palette changed carries its own color table
// and is stored whole (on a real VGA a palette change recolors the whole screen at once).
// Block layout follows the GIF89a specification: header, logical screen descriptor and
// global color table, the NETSCAPE2.0 loop extension, then per frame a graphic control
// extension, an image descriptor (with an optional local color table) and LZW data in
// sub-blocks of up to 255 bytes, ending with the 0x3B trailer.

export interface GifFrame {
  /** width * height palette indexes */
  pixels: Uint8Array;
  /** 768 bytes of 6-bit (0..63) components */
  palette: Uint8Array;
  /** How long the frame is shown, in milliseconds. */
  ms: number;
}

export interface GifOptions {
  /** 0 = loop forever (the default); otherwise how many times to repeat. */
  loops?: number;
}

/** The shortest delay browsers honor, in 1/100 s. */
const MIN_DELAY = 2;

// 6-bit DAC component to 8 bits, copying the top bits into the low ones so 63 becomes 255.
const vga8 = (v: number) => ((v & 63) << 2) | ((v & 63) >> 4);

function samePalette(a: Uint8Array, b: Uint8Array): boolean {
  if (a === b) return true;
  for (let i = 0; i < 768; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** The smallest rectangle where two frames differ, or undefined when they are the same. */
export function changedRect(a: Uint8Array, b: Uint8Array, w: number, h: number): [number, number, number, number] | undefined {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++)
      if (a[row + x] !== b[row + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
  }
  return x1 < 0 ? undefined : [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}

class Bytes {
  buf = new Uint8Array(1 << 16);
  len = 0;
  private grow(n: number): void {
    if (this.len + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.len + n) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  }
  push(...v: number[]): void {
    this.grow(v.length);
    for (const b of v) this.buf[this.len++] = b;
  }
  u16(v: number): void {
    this.push(v & 0xff, (v >> 8) & 0xff);
  }
  bytes(v: Uint8Array): void {
    this.grow(v.length);
    this.buf.set(v, this.len);
    this.len += v.length;
  }
  result(): Uint8Array {
    return this.buf.slice(0, this.len);
  }
}

function colorTable(out: Bytes, palette: Uint8Array): void {
  const t = new Uint8Array(768);
  for (let i = 0; i < 768; i++) t[i] = vga8(palette[i] ?? 0);
  out.bytes(t);
}

/** GIF's variable-length LZW, 8-bit roots, a clear code when the table fills. */
export function lzw(pixels: Uint8Array): Uint8Array {
  const minCodeSize = 8;
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  const out = new Bytes();
  let codeSize = minCodeSize + 1;
  let next = eoi + 1;
  let bitBuf = 0;
  let bits = 0;
  // Codes are packed least significant bit first, as GIF requires.
  const emit = (code: number) => {
    bitBuf |= code << bits;
    bits += codeSize;
    while (bits >= 8) {
      out.push(bitBuf & 0xff);
      bitBuf >>>= 8;
      bits -= 8;
    }
  };
  // String table: key is (prefix code << 8) | next byte, value is that string's code.
  let dict = new Map<number, number>();
  emit(clear);
  if (pixels.length) {
    let cur = pixels[0];
    for (let i = 1; i < pixels.length; i++) {
      const k = pixels[i];
      const key = (cur << 8) | k;
      const found = dict.get(key);
      // Extend the current string while the table has it; otherwise output it and add the new one.
      if (found !== undefined) {
        cur = found;
        continue;
      }
      emit(cur);
      if (next < 4096) {
        dict.set(key, next++);
        // Widen once the code just added needs another bit. The decoder adds its entries one
        // code later than the encoder, so widening after code 2^codeSize keeps both in step.
        if (next > 1 << codeSize && codeSize < 12) codeSize++;
      } else {
        // The table holds 4096 codes (12 bits) at most: start over with a clear code.
        emit(clear);
        dict = new Map();
        codeSize = minCodeSize + 1;
        next = eoi + 1;
      }
      cur = k;
    }
    emit(cur);
  }
  emit(eoi);
  if (bits) out.push(bitBuf & 0xff);
  return out.result();
}

/** Encodes frames of the same size as an animated GIF. */
export function encodeAnimatedGif(width: number, height: number, frames: GifFrame[], opts: GifOptions = {}): Uint8Array {
  if (!frames.length) throw new Error('No frames');
  const out = new Bytes();
  const global = frames[0].palette;
  out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // GIF89a
  out.u16(width);
  out.u16(height);
  // Packed byte: table present, 8-bit color resolution, size 2^(7+1); background 0, no aspect ratio.
  out.push(0xf7, 0, 0); // a global table of 256 colors
  colorTable(out, global);
  if (frames.length > 1) {
    // NETSCAPE2.0: loop
    out.push(0x21, 0xff, 11, ...[...'NETSCAPE2.0'].map((c) => c.charCodeAt(0)), 3, 1);
    out.u16(opts.loops ?? 0);
    out.push(0);
  }
  // Delays are hundredths of a second: round the running time so they add up exactly.
  let elapsed = 0;
  let shownCs = 0;
  let prev: GifFrame | undefined;
  for (let n = 0; n < frames.length; n++) {
    const f = frames[n];
    elapsed += f.ms;
    const endCs = Math.round(elapsed / 10);
    const delay = Math.max(0, endCs - shownCs);
    // Browsers show a delay under 2/100 s as 1/10 s: skip such a frame (the next one makes
    // up its time) rather than slow the whole animation down.
    if (delay < MIN_DELAY && n < frames.length - 1 && frames.length > 1) continue;
    shownCs = endCs;
    const newPalette = prev ? !samePalette(prev.palette, f.palette) : false;
    let rect: [number, number, number, number] | undefined = [0, 0, width, height];
    if (prev && !newPalette) rect = changedRect(prev.pixels, f.pixels, width, height) ?? [0, 0, 1, 1];
    const [x, y, w, h] = rect;
    // graphic control: disposal method 1, do not dispose (frames build on each other), delay
    out.push(0x21, 0xf9, 4, 0x04);
    out.u16(Math.min(0xffff, delay));
    out.push(0, 0);
    out.push(0x2c);
    out.u16(x);
    out.u16(y);
    out.u16(w);
    out.u16(h);
    const local = !samePalette(f.palette, global);
    // Image descriptor packed byte: local table of 256 colors, or none.
    out.push(local ? 0x87 : 0);
    if (local) colorTable(out, f.palette);
    // Copy the frame's changed rectangle out row by row.
    const sub = new Uint8Array(w * h);
    for (let yy = 0; yy < h; yy++) sub.set(f.pixels.subarray((y + yy) * width + x, (y + yy) * width + x + w), yy * w);
    // LZW minimum code size, then the data in length-prefixed sub-blocks and a 0 terminator.
    out.push(8);
    const data = lzw(sub);
    for (let i = 0; i < data.length; i += 255) {
      const n = Math.min(255, data.length - i);
      out.push(n);
      out.bytes(data.subarray(i, i + n));
    }
    out.push(0);
    prev = f;
  }
  out.push(0x3b);
  return out.result();
}
