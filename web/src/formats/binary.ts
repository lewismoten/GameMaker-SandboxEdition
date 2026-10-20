// Little-endian readers/writers matching Borland C++ 3.1 (16-bit) data layout:
// char = signed 8-bit, int = 16-bit, long = 32-bit, structs byte-packed.
//
// Reading past the end yields zeros instead of throwing, because several files on
// the original CD image are truncated and DOS GameMaker happily fread()s short files.

const latin1 = new TextDecoder('latin1');

export class Reader {
  readonly bytes: Uint8Array;
  offset: number;

  constructor(bytes: Uint8Array, offset = 0) {
    this.bytes = bytes;
    this.offset = offset;
  }

  get length(): number {
    return this.bytes.length;
  }

  get eof(): boolean {
    return this.offset >= this.bytes.length;
  }

  skip(n: number): this {
    this.offset += n;
    return this;
  }

  u8(): number {
    const v = this.offset < this.bytes.length ? this.bytes[this.offset] : 0;
    this.offset++;
    return v;
  }

  i8(): number {
    const v = this.u8();
    return v > 127 ? v - 256 : v;
  }

  u16(): number {
    return this.u8() | (this.u8() << 8);
  }

  i16(): number {
    const v = this.u16();
    return v > 32767 ? v - 65536 : v;
  }

  u32(): number {
    return (this.u16() | (this.u16() << 16)) >>> 0;
  }

  i32(): number {
    return this.u16() | (this.u16() << 16);
  }

  /** Copies n bytes (zero padded when the source is short). */
  bytesOf(n: number): Uint8Array {
    const out = new Uint8Array(n);
    const avail = Math.max(0, Math.min(n, this.bytes.length - this.offset));
    if (avail > 0) out.set(this.bytes.subarray(this.offset, this.offset + avail));
    this.offset += n;
    return out;
  }

  /** Reads a fixed size, NUL terminated string field. */
  cstr(n: number): string {
    return cString(this.bytesOf(n));
  }
}

export class Writer {
  private buf: Uint8Array;
  offset = 0;

  constructor(initial = 1024) {
    this.buf = new Uint8Array(initial);
  }

  private ensure(n: number): void {
    if (this.offset + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.offset + n) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf);
    this.buf = next;
  }

  u8(v: number): this {
    this.ensure(1);
    this.buf[this.offset++] = v & 0xff;
    return this;
  }

  i8(v: number): this {
    return this.u8(v);
  }

  u16(v: number): this {
    return this.u8(v).u8(v >> 8);
  }

  i16(v: number): this {
    return this.u16(v);
  }

  u32(v: number): this {
    return this.u16(v & 0xffff).u16((v >>> 16) & 0xffff);
  }

  i32(v: number): this {
    return this.u32(v >>> 0);
  }

  bytes(b: ArrayLike<number>, length = b.length): this {
    this.ensure(length);
    for (let i = 0; i < length; i++) this.buf[this.offset++] = i < b.length ? b[i] & 0xff : 0;
    return this;
  }

  /** Writes a string into a fixed size NUL padded field. */
  cstr(s: string, length: number): this {
    const out = new Uint8Array(length);
    for (let i = 0; i < Math.min(s.length, length - 1); i++) out[i] = s.charCodeAt(i) & 0xff;
    return this.bytes(out);
  }

  /**
   * Writes a fixed size string field. When the text is unchanged the original raw
   * bytes (including any garbage after the NUL) are kept so files round-trip exactly.
   */
  cstrOver(s: string, original: Uint8Array | undefined, length: number): this {
    if (original && original.length === length && cString(original) === s) return this.bytes(original);
    return this.cstr(s, length);
  }

  toBytes(): Uint8Array {
    return this.buf.slice(0, this.offset);
  }
}

export function cString(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return latin1.decode(end < 0 ? bytes : bytes.subarray(0, end));
}

export function latin1Text(bytes: Uint8Array): string {
  return latin1.decode(bytes);
}

export function textBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}
