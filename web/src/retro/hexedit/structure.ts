// HEXEDIT's map of a file: which bytes are which field, for Game-Maker's own formats (and the
// media files it uses, see structureMedia.ts). A Structure is a sorted list of fields that
// never overlap; a field is one value (a number, a fixed string, raw bytes) or an array of
// equal records (a map's cells, a palette's colors, a block's pixels) whose parts name each
// byte. Sections are the jump list's entries (a scene, a block, a monster...).
//
// Every field may carry a `key`: where the same value is in the format module's parsed
// object ('scenes.3.links.2.from.x' in parseGame's result), so tests check the map against
// the parsers byte for byte (test/hexStructure.test.ts).
import { cString, latin1Text } from '../../formats/binary';

type FieldType = 'u8' | 'i8' | 'u16' | 'i16' | 'u24' | 'u32' | 'i32' | 'vlq' | 'str' | 'text' | 'raw';

const SIZE: Partial<Record<FieldType, number>> = { u8: 1, i8: 1, u16: 2, i16: 2, u24: 3, u32: 4, i32: 4 };

/** One part of an array's record. */
interface Part {
  at: number;
  len: number;
  name: string;
  type: FieldType;
  key?: (i: number) => string;
  note?: (v: number | string, i: number) => string;
}

interface Field {
  off: number;
  len: number;
  name: string;
  type: FieldType;
  key?: string;
  note?: (v: number | string) => string;
  /** `len / size` records of `size` bytes, each made of `parts`; label(i) names record i. */
  array?: { size: number; parts: Part[]; label: (i: number) => string; /** one color for the whole array (pixels) */ solid?: boolean };
}

interface Section {
  name: string;
  off: number;
}

export interface Structure {
  /** What the file is ("Game-Maker 3.00 game (.GAM)"). */
  format: string;
  fields: Field[];
  sections: Section[];
}

/** One value: a field, or one part of one record of an array field. */
export interface Leaf {
  off: number;
  len: number;
  /** The field's (or array's) name. */
  group: string;
  /** The record and part ("Cell (12,3) block"); '' for a plain field. */
  name: string;
  type: FieldType;
  key?: string;
  value?: number | string;
  note: string;
  /** Which color to draw the bytes in (cycles through the editor's field colors). */
  color: number;
  /** The section it is in (index into sections, -1 before the first). */
  sect: number;
}

// ---------------------------------------------------------------- reading values

/** A variable-length number (MIDI delta time): its value and how many bytes it took. */
export function readVlq(bytes: Uint8Array, off: number): { value: number; len: number } {
  let value = 0;
  let len = 0;
  for (;;) {
    const b = bytes[off + len] ?? 0;
    len++;
    value = value * 128 + (b & 0x7f);
    if (!(b & 0x80) || len >= 4 || off + len >= bytes.length) return { value, len };
  }
}

/** The value of `len` bytes at `off` read as `type` (undefined for raw bytes). */
function decode(bytes: Uint8Array, off: number, type: FieldType, len: number): number | string | undefined {
  const u8 = (o: number) => bytes[off + o] ?? 0;
  switch (type) {
    case 'u8':
      return u8(0);
    case 'i8':
      return (u8(0) << 24) >> 24;
    case 'u16':
      return u8(0) | (u8(1) << 8);
    case 'i16':
      return ((u8(0) | (u8(1) << 8)) << 16) >> 16;
    case 'u24':
      return u8(0) | (u8(1) << 8) | (u8(2) << 16);
    case 'u32':
      return (u8(0) | (u8(1) << 8) | (u8(2) << 16) | (u8(3) << 24)) >>> 0;
    case 'i32':
      return u8(0) | (u8(1) << 8) | (u8(2) << 16) | (u8(3) << 24);
    case 'vlq':
      return readVlq(bytes, off).value;
    case 'str':
      return cString(bytes.subarray(off, off + len));
    case 'text':
      return latin1Text(bytes.subarray(off, off + len)).replace(/\r?\n$/, '');
    default:
      return undefined;
  }
}

/** The field holding byte `off` (binary search), or undefined between fields. */
function fieldIndexAt(st: Structure, off: number): number {
  const f = st.fields;
  let lo = 0;
  let hi = f.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (off < f[mid].off) hi = mid - 1;
    else if (off >= f[mid].off + f[mid].len) lo = mid + 1;
    else return mid;
  }
  return -1;
}

/** The section byte `off` is in (the last one starting at or before it). */
export function sectionAt(st: Structure, off: number): number {
  const s = st.sections;
  let lo = 0;
  let hi = s.length - 1;
  let best = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (s[mid].off <= off) {
      best = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return best;
}

function leafOf(st: Structure, bytes: Uint8Array, fi: number, off: number): Leaf {
  const f = st.fields[fi];
  const a = f.array;
  if (!a) {
    const value = decode(bytes, f.off, f.type, f.len);
    return {
      off: f.off,
      len: f.len,
      group: f.name,
      name: '',
      type: f.type,
      key: f.key,
      value,
      note: value !== undefined && f.note ? f.note(value) : '',
      color: fi,
      sect: sectionAt(st, f.off),
    };
  }
  const i = Math.floor((off - f.off) / a.size);
  const b = off - f.off - i * a.size;
  const pi = Math.max(
    0,
    a.parts.findIndex((p) => b >= p.at && b < p.at + p.len),
  );
  const p = a.parts[pi];
  const start = f.off + i * a.size + p.at;
  const value = decode(bytes, start, p.type, p.len);
  return {
    off: start,
    len: p.len,
    group: f.name,
    name: [a.label(i), p.name].filter(Boolean).join(' '),
    type: p.type,
    key: p.key?.(i),
    value,
    note: value !== undefined && p.note ? p.note(value, i) : '',
    color: a.solid ? fi : fi + i * a.parts.length + pi,
    sect: sectionAt(st, start),
  };
}

/** The value byte `off` belongs to, or undefined when no field covers it. */
export function leafAt(st: Structure, bytes: Uint8Array, off: number): Leaf | undefined {
  const fi = fieldIndexAt(st, off);
  return fi < 0 ? undefined : leafOf(st, bytes, fi, off);
}

/** Every value in the file, in order (array records expanded). */
export function* leaves(st: Structure, bytes: Uint8Array): Generator<Leaf> {
  for (let fi = 0; fi < st.fields.length; fi++) {
    const f = st.fields[fi];
    if (!f.array) {
      yield leafOf(st, bytes, fi, f.off);
      continue;
    }
    for (let o = 0; o + f.array.size <= f.len; o += f.array.size) for (const p of f.array.parts) yield leafOf(st, bytes, fi, f.off + o + p.at);
  }
}

// ---------------------------------------------------------------- building a structure

/** A number in upper-case hex, `w` digits at least. */
export const hex = (n: number, w = 2) => n.toString(16).toUpperCase().padStart(w, '0');

export class Builder {
  fields: Field[] = [];
  sections: Section[] = [];
  off = 0;

  constructor(
    readonly bytes: Uint8Array,
    readonly format: string,
  ) {}

  sect(name: string, off = this.off): void {
    this.sections.push({ name, off });
  }

  /** A field at the current offset; returns its value. */
  f(name: string, type: FieldType, o: { len?: number; key?: string; note?: (v: number | string) => string } = {}): number {
    const len = o.len ?? (type === 'vlq' ? readVlq(this.bytes, this.off).len : (SIZE[type] ?? 1));
    this.fields.push({ off: this.off, len, name, type, key: o.key, note: o.note });
    const v = decode(this.bytes, this.off, type, len);
    this.off += len;
    return typeof v === 'number' ? v : 0;
  }

  /** `count` records of `size` bytes. */
  arr(name: string, count: number, size: number, parts: Part[], label: (i: number) => string, solid = false): void {
    if (count <= 0) return;
    this.fields.push({ off: this.off, len: count * size, name, type: 'raw', array: { size, parts, label, solid } });
    this.off += count * size;
  }

  /** Values read here without moving on. */
  u8(at = this.off): number {
    return this.bytes[at] ?? 0;
  }
  u16(at = this.off): number {
    return this.u8(at) | (this.u8(at + 1) << 8);
  }
  u32(at = this.off): number {
    return (this.u16(at) | (this.u16(at + 2) << 16)) >>> 0;
  }

  get left(): number {
    return this.bytes.length - this.off;
  }

  /**
   * The finished map: fields cut at the end of the file (a short file, as DOS Game-Maker
   * fread() them), and whatever is past the last field named as extra bytes.
   */
  build(): Structure {
    const n = this.bytes.length;
    const fields: Field[] = [];
    let end = 0;
    for (const f of this.fields) {
      if (f.off < end || f.off >= n || f.len <= 0) continue;
      const len = Math.min(f.len, n - f.off);
      if (len === f.len) fields.push(f);
      else if (f.array) {
        const whole = Math.floor(len / f.array.size) * f.array.size;
        if (whole) fields.push({ ...f, len: whole });
        if (len > whole) fields.push({ off: f.off + whole, len: len - whole, name: `${f.name} (cut short)`, type: 'raw' });
      } else fields.push({ ...f, len, type: f.type === 'str' || f.type === 'text' ? f.type : 'raw', name: `${f.name} (cut short)` });
      end = f.off + len;
    }
    if (end < n) {
      fields.push({ off: end, len: n - end, name: 'Extra bytes (past what the format holds)', type: 'raw' });
      this.sections.push({ name: 'Extra bytes', off: end });
    }
    const sections = this.sections.filter((s) => s.off < n).sort((a, b) => a.off - b.off);
    return { format: this.format, fields, sections };
  }
}

/** Shorthand for an array part. */
export const part = (at: number, name: string, type: FieldType, key?: (i: number) => string, note?: Part['note'], len = SIZE[type] ?? 1): Part => ({
  at,
  len,
  name,
  type,
  key,
  note,
});

/** Fills in a Builder for one format. */
export type Describer = (b: Builder) => void;
