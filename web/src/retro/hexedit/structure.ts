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
import { ADV_FILES, END_FILES, START_FILES } from '../../formats/game';
import { SEQUENCE_NAMES } from '../../formats/character';
import { SOUND_NAMES } from '../../formats/sound';

export type FieldType = 'u8' | 'i8' | 'u16' | 'i16' | 'u24' | 'u32' | 'i32' | 'vlq' | 'str' | 'text' | 'raw';

const SIZE: Partial<Record<FieldType, number>> = { u8: 1, i8: 1, u16: 2, i16: 2, u24: 3, u32: 4, i32: 4 };

/** One part of an array's record. */
export interface Part {
  at: number;
  len: number;
  name: string;
  type: FieldType;
  key?: (i: number) => string;
  note?: (v: number | string, i: number) => string;
}

export interface Field {
  off: number;
  len: number;
  name: string;
  type: FieldType;
  key?: string;
  note?: (v: number | string) => string;
  /** `len / size` records of `size` bytes, each made of `parts`; label(i) names record i. */
  array?: { size: number; parts: Part[]; label: (i: number) => string; /** one color for the whole array (pixels) */ solid?: boolean };
}

export interface Section {
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
export function decode(bytes: Uint8Array, off: number, type: FieldType, len: number): number | string | undefined {
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
export function fieldIndexAt(st: Structure, off: number): number {
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
    return { off: f.off, len: f.len, group: f.name, name: '', type: f.type, key: f.key, value, note: value !== undefined && f.note ? f.note(value) : '', color: fi, sect: sectionAt(st, f.off) };
  }
  const i = Math.floor((off - f.off) / a.size);
  const b = off - f.off - i * a.size;
  const pi = Math.max(0, a.parts.findIndex((p) => b >= p.at && b < p.at + p.len));
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

const hex = (n: number, w = 2) => n.toString(16).toUpperCase().padStart(w, '0');

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
    const len = o.len ?? (type === 'vlq' ? readVlq(this.bytes, this.off).len : SIZE[type] ?? 1);
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
export const part = (at: number, name: string, type: FieldType, key?: (i: number) => string, note?: Part['note'], len = SIZE[type] ?? 1): Part => ({ at, len, name, type, key, note });

// ---------------------------------------------------------------- Game-Maker's formats

const sceneKind = (t: number | string) => (t === 1 ? 'title & menus' : t === 2 ? 'game over' : t === 10 ? 'level' : t === 0xffff ? 'unused' : '?');
const scroll = (v: number | string) => (v === 0 ? 'no scrolling' : v === 0xff ? 'scrolls near the edge' : '');

/** .GAM: the scene graph (GRATOR.H). */
function gam(b: Builder): void {
  const bytes = b.bytes;
  if (!(bytes[0] === 0x47 && bytes[1] === 0x4d)) return oldGam(b);
  b.sect('DataFileHeader');
  b.f('Signature', 'str', { len: 2, note: () => 'Game-Maker data file' });
  b.f('Version', 'i16', { key: 'version', note: (v) => (v === 300 ? 'Game-Maker 3.00' : '') });
  b.f('Encrypt', 'u8');
  b.f('File type', 'u8', { note: (v) => (v === 8 ? '.GAM' : '') });
  b.f('Filler ("RSDRSD...")', 'raw', { len: 250 });
  b.sect('GratorHeader');
  const n = Math.max(0, b.f('Number of scenes', 'i16', { key: 'scenes.length' }));
  b.f('Files per scene', 'i16', { key: 'filesPerScene' });
  b.f('Links per scene', 'i16', { key: 'linksPerScene' });
  const poolAt = 256 + 6 + n * 283 + 2;
  const poolLen = b.u16(poolAt - 2);
  const poolName = (v: number | string) => (v === 0 ? '(none)' : typeof v === 'number' && v < poolLen ? `"${cString(bytes.subarray(poolAt + v, poolAt + poolLen))}"` : 'past the pool!');
  for (let s = 0; s < n; s++) {
    const type = b.u16();
    const desc = cString(bytes.subarray(b.off + 23, b.off + 43));
    const k = `scenes.${s}`;
    b.sect(`Scene ${s}: ${desc || sceneKind(type)}`);
    b.f('Scene type', 'u16', { key: `${k}.gametype`, note: sceneKind });
    b.f('World view x', 'i16', { key: `${k}.pos.x` });
    b.f('World view y', 'i16', { key: `${k}.pos.y` });
    for (const d of ['up', 'down', 'left', 'right']) b.f(`Scroll ${d}`, 'u8', { key: `${k}.scroll.${d}`, note: scroll });
    b.f('Scroll style', 'u8', { key: `${k}.scroll.style` });
    b.f('Scroll extra', 'raw', { len: 11 });
    b.f('Links used', 'u8', { key: `${k}.numLinks` });
    b.f('Description', 'str', { len: 20, key: `${k}.desc` });
    const slots: readonly string[] = type === 1 ? START_FILES : type === 2 ? END_FILES : ADV_FILES;
    b.arr('Files', 20, 2, [part(0, '', 'u16', (i) => `poolOffsets.${s}.${i}`, poolName)], (i) => `[${i}] ${slots[i] ?? 'unused slot'}`);
    b.arr(
      'Links',
      20,
      10,
      [
        part(0, 'to scene', 'u16', (i) => `${k}.links.${i}.toScene`, (v) => (v === 0xffff ? 'unused' : '')),
        part(2, 'from x', 'i16', (i) => `${k}.links.${i}.from.x`),
        part(4, 'from y', 'i16', (i) => `${k}.links.${i}.from.y`),
        part(6, 'to x', 'i16', (i) => `${k}.links.${i}.to.x`),
        part(8, 'to y', 'i16', (i) => `${k}.links.${i}.to.y`),
      ],
      (i) => `[${i}]`,
    );
  }
  b.sect('SceneFiles pool');
  b.f('Pool length', 'u16', { key: 'pool.length' });
  const end = Math.min(bytes.length, poolAt + poolLen);
  while (b.off < end) {
    const rel = b.off - poolAt;
    const nul = bytes.indexOf(0, b.off);
    const len = (nul < 0 || nul >= end ? end : nul + 1) - b.off;
    b.f(rel === 0 ? 'Name 0 (empty: offset 0 means no file)' : `Name at pool offset ${rel}`, 'str', { len });
  }
}

/** A .GAM from before 3.00: 20 records of 330 bytes (OLDintegratorstruct). */
function oldGam(b: Builder): void {
  const count = Math.min(20, Math.floor(b.bytes.length / 330));
  for (let s = 0; s < count; s++) {
    const k = `scenes.${s}`;
    b.sect(`Scene ${s} (old format): ${cString(b.bytes.subarray(b.off + 6, b.off + 21))}`);
    b.f('Scene type', 'u16', { note: sceneKind });
    b.f('World view x', 'i16', { key: `${k}.pos.x` });
    b.f('World view y', 'i16', { key: `${k}.pos.y` });
    b.f('Description', 'str', { len: 15, key: `${k}.desc` });
    b.arr('File names (no extension)', 9, 10, [part(0, '', 'str', undefined, undefined, 10)], (i) => `[${i}]`);
    b.arr(
      'Links',
      20,
      10,
      [
        part(0, 'from x', 'i16', (i) => `${k}.links.${i}.from.x`),
        part(2, 'from y', 'i16', (i) => `${k}.links.${i}.from.y`),
        part(4, 'to scene', 'i16', undefined, (v) => (v === 20 ? 'unused' : '')),
        part(6, 'to x', 'i16', (i) => `${k}.links.${i}.to.x`),
        part(8, 'to y', 'i16', (i) => `${k}.links.${i}.to.y`),
      ],
      (i) => `[${i}]`,
    );
    for (const c of ['red', 'green', 'blue']) b.f(`Palette shift ${c} (unused by 3.00)`, 'i8');
    for (const d of ['up', 'down', 'left', 'right']) b.f(`Scroll ${d}`, 'u8', { key: `${k}.scroll.${d}`, note: scroll });
    b.f('PinChar', 'u8');
    b.f('Extra', 'raw', { len: 11 });
  }
}

/** .MAP: 100x100 cells, then 200 placed monsters (MAP.H). */
function map(b: Builder): void {
  for (let y = 0; y < 100; y += 10) b.sect(`Map rows ${y}-${y + 9}`, y * 200);
  b.arr(
    'Map grid',
    10000,
    2,
    [part(0, 'block', 'u8', (i) => `blocks.${i}`, (v) => `background block ${v}`), part(1, 'monster', 'u8', (i) => `mons.${i}`, (v) => (Number(v) >= 200 ? 'no monster' : `placed monster ${v}`))],
    (i) => `Cell (${i % 100},${Math.floor(i / 100)})`,
  );
  b.sect('Placed monsters');
  const k = (f: string) => (i: number) => `monsters.${i}.${f}`;
  b.arr(
    'Placed monsters',
    200,
    10,
    [
      part(0, 'monster', 'u8', k('monnum'), (v) => (Number(v) >= 64 ? 'empty slot' : `monster ${v} of the .MON`)),
      part(1, 'status', 'i16', k('status')),
      part(3, 'xtra', 'u8', k('xtra')),
      part(4, 'x', 'i16', k('curx')),
      part(6, 'y', 'i16', k('cury')),
      part(8, 'extra', 'i16', k('extra')),
    ],
    (i) => `[${i}]`,
  );
}

const sides = (v: number | string) => {
  const n = Number(v);
  const out = ['top', 'right', 'bottom', 'left'].filter((_, i) => n & (1 << i));
  return out.length ? out.join('+') : 'none';
};
const gravity = (v: number | string) => {
  const n = Number(v) & 15;
  const out = ['up', 'right', 'down', 'left'].filter((_, i) => n & (1 << i));
  return out.length ? `pulls ${out.join('+')}` : 'none';
};
const effectName = (v: number | string) => {
  const n = Number(v);
  return n === 0 ? 'none' : n === 1 ? 'lives' : n === 3 ? 'money' : n >= 5 && n < 20 ? `sequence ${n} counter` : n >= 20 && n < 30 ? `extra counter ${n - 20}` : '';
};

/** .BBL/.MBL/.CBL: 420-byte blocks (BLOC.H). */
function blocks(b: Builder, count: number): void {
  for (let i = 0; i < count; i++) {
    const k = (f: string) => ({ key: `${i}.${f}` });
    b.sect(`Block ${i}`);
    b.arr('Block ' + i + ' pixels', 400, 1, [part(0, '', 'u8', (j) => `${i}.pixels.${j}`, (v) => (v === 255 ? 'transparent (255)' : `color ${v}`))], (j) => `(${j % 20},${Math.floor(j / 20)})`, true);
    b.f('Birth monster', 'u8', k('birthMon'));
    b.f('Birth time', 'i16', { ...k('birthTime'), note: (v) => (v === 0 ? 'never' : 'ticks') });
    b.f('Extra', 'raw', { len: 2 });
    b.f('Solid sides', 'u8', { ...k('solid'), note: sides });
    b.f('Hurting sides', 'u8', k('hitpt'));
    b.f('Score points', 'i16', k('scorePts'));
    b.f('Hit points', 'i16', k('chHitPt'));
    b.f('Animates into block', 'u8', { ...k('nextBl'), note: (v) => (v === i ? 'itself (no animation)' : '') });
    b.f('Animation time', 'i16', k('ntime'));
    b.f('Becomes when touched', 'u8', { ...k('touchBl'), note: (v) => (v === i ? 'itself' : '') });
    b.f('Gravity', 'i8', { ...k('grav'), note: gravity });
    b.f('Can be picked up', 'u8', { ...k('obj'), note: (v) => (v ? 'yes' : 'no') });
    b.f('Counter affected', 'u8', { ...k('effect'), note: effectName });
    b.f('Counter change', 'i16', k('eamt'));
  }
}

const METER_NAMES = (i: number) => (i === 0 ? 'hit points' : i === 1 ? 'lives' : i === 3 ? 'money' : i < 20 ? `sequence ${i}` : `extra counter ${i - 20}`);

/** .CHR: two chrstruct records of 3784 bytes; PLAYGAME uses the first (CHAR.H). */
function chr(b: Builder): void {
  for (let s = 0; s < 20; s++) {
    const k = `sequences.${s}`;
    b.sect(`Sequence ${s}${SEQUENCE_NAMES[s] ? ` (${SEQUENCE_NAMES[s]})` : ''}`);
    const fk = (f: string) => (i: number) => `${k}.frames.${i}.${f}`;
    b.arr(
      `Sequence ${s} frames`,
      10,
      17,
      [
        part(0, 'x move', 'i16', fk('x')),
        part(2, 'y move', 'i16', fk('y')),
        part(4, 'orientation', 'u16', fk('orient'), (v) => `top ${Number(v) & 15}, bottom ${(Number(v) >> 4) & 15}`),
        part(6, 'top block', 'u16', fk('pic1'), (v) => (v === 50 ? 'none' : '')),
        part(8, 'bottom block', 'u16', fk('pic2'), (v) => (v === 51 ? 'END of sequence' : v === 50 ? 'none' : v === 100 ? 'births monster (top)' : '')),
        part(10, 'pause', 'u16', fk('pause'), () => 'ticks'),
        part(12, 'extra', 'raw', undefined, undefined, 5),
      ],
      (i) => `frame ${i}`,
    );
    b.f('Key', 'u16', { key: `${k}.key`, note: (v) => (v ? `scan ${hex(Number(v) >> 8)}h, ASCII ${hex(Number(v) & 255)}h` : 'none') });
    b.f('Sound', 'i8', { key: `${k}.sound`, note: (v) => (Number(v) >= 30 ? 'none' : '') });
    b.f('On', 'i8', { key: `${k}.on` });
    b.f('Needs block', 'u8', { key: `${k}.bloc`, note: (v) => (v === 150 ? 'none' : 'in inventory') });
    b.f('Uninterruptible', 'i8', { key: `${k}.ground` });
    b.f('Joystick button', 'i8', { key: `${k}.jstkBut` });
    b.f('Joystick direction', 'i8', { key: `${k}.jstkMov` });
    b.f('No repeat', 'i8', { key: `${k}.norepeat` });
    b.f('Momentum', 'i8', { key: `${k}.momentum` });
    b.f('Extra', 'raw', { len: 5 });
  }
  b.sect('Position, inventory, counters');
  b.arr('X', 3, 2, [part(0, '', 'i16', (i) => `x.${i}`)], (i) => `[${i}]`);
  b.arr('Y', 3, 2, [part(0, '', 'i16', (i) => `y.${i}`)], (i) => `[${i}]`);
  b.f('Current frame', 'i8', { key: 'cframe' });
  b.f('Current sequence', 'i8', { key: 'cseq' });
  b.arr('Inventory', 10, 1, [part(0, '', 'u8', (i) => `inv.${i}`, (v) => (v === 150 ? 'empty' : `block ${v}`))], (i) => `[${i}]`);
  b.arr('Counters', 30, 2, [part(0, '', 'i16', (i) => `meter.${i}`, (v) => (v === 32767 ? 'unlimited' : ''))], (i) => `[${i}] ${METER_NAMES(i)}`);
  b.sect('Player 2 (unused)');
  b.f('Player 2 record (PLAYGAME uses only the first)', 'raw', { len: 3784 });
}

/** .MON: 64 monsters of 300 bytes (MON.H). */
function mon(b: Builder): void {
  for (let m = 0; m < 64; m++) {
    const k = (f: string) => ({ key: `${m}.${f}` });
    b.sect(`Monster ${m}`);
    b.f('Used', 'i16', k('used'));
    b.f('Flies', 'i16', k('fly'));
    b.f('Jump', 'i16', k('jump'));
    b.f('Stick', 'i16', k('stick'));
    b.f('Power', 'u8', { ...k('power'), note: (v) => (Number(v) >= 100 ? "can't be killed by touch" : '') });
    b.f('Stops at solid blocks', 'i8', k('thru'));
    b.arr('Animation', 21, 4, [part(0, 'block', 'i16', (i) => `${m}.pic.${i}.0`, (v) => (Number(v) >= 100 ? 'end' : '')), part(2, 'ticks', 'i16', (i) => `${m}.pic.${i}.1`)], (i) => `[${i}]`);
    b.f('Last time', 'u32', k('lasttime'));
    b.f('Becomes when it dies', 'i8', { ...k('newmon'), note: (v) => (v === 64 ? 'none' : '') });
    b.f('Score bonus', 'i16', k('upscore'));
    b.f('Extra', 'raw', { len: 21 });
    b.f('Attack path', 'i16', { ...k('activate'), note: (v) => ['none', 'absolute', 'relative to the character'][Number(v)] ?? '' });
    b.f('Life', 'i16', { ...k('end'), note: (v) => (v === -2 ? 'never dies' : v === -1 ? 'dies after its path' : v === 0 ? 'dies when killed' : 'ticks') });
    b.f('Towards', 'i16', { ...k('towards'), note: (v) => (v === 0 ? 'follows its path' : Number(v) >= 64 ? 'random' : Number(v) > 0 ? 'toward the character' : 'away from the character') });
    b.arr('Close', 2, 2, [part(0, '', 'i16', (i) => `${m}.close.${i}`)], (i) => `[${i}]`);
    for (const [p, name] of ['Normal path', 'Attack path'].entries()) {
      const mk = (f: string) => (i: number) => `${m}.march.${p}.${i}.${f}`;
      b.arr(name, 10, 8, [part(0, 'x', 'i16', mk('x')), part(2, 'y', 'i16', mk('y')), part(4, 'speed', 'i16', mk('pic'), (v) => (v === 0 ? 'end of path' : '')), part(6, 'orientation', 'i16', mk('orient'))], (i) => `corner ${i}`);
    }
    for (const f of ['x', 'y', 'pic', 'orient']) b.f(`Current ${f === 'pic' ? 'speed' : f}`, 'i16', k(`cur.${f}`));
  }
}

/** .PAL: 256 VGA colors of three 0-63 levels. */
function pal(b: Builder): void {
  b.sect('Palette');
  const lvl = (v: number | string) => (Number(v) > 63 ? 'over 63!' : `${Math.round((Number(v) * 100) / 63)}%`);
  b.arr('Palette', 256, 3, [part(0, 'red', 'u8', (i) => `${i * 3}`, lvl), part(1, 'green', 'u8', (i) => `${i * 3 + 1}`, lvl), part(2, 'blue', 'u8', (i) => `${i * 3 + 2}`, lvl)], (i) => `Color ${i}`);
}

/** .HIS: the top ten (HISCOREL.C). */
function his(b: Builder): void {
  b.sect('High scores');
  b.arr('High scores', 10, 34, [part(0, 'score', 'i32', (i) => `${i}.score`), part(4, 'name', 'str', (i) => `${i}.name`, undefined, 30)], (i) => `#${i + 1}`);
}

/** SAVNAMES.DAT: ten 20-character names, each with its NUL. */
function savnames(b: Builder): void {
  b.sect('Save slot names');
  b.arr('Slot names', 10, 21, [part(0, 'name', 'str', (i) => `${i}`, undefined, 20), part(20, 'end (NUL)', 'u8')], (i) => `GAME${i}.SAV`);
}

/** .SND: 30 PC speaker effects of 36 frequencies, then 30 .VOC names (SOUND.H). */
function snd(b: Builder): void {
  for (let e = 0; e < 30; e++) b.sect(`Effect ${e}${SOUND_NAMES[e] ? ` (${SOUND_NAMES[e]})` : ''}`, e * 72);
  b.arr('PC speaker', 30 * 36, 2, [part(0, 'Hz', 'u16', (i) => `freqs.${Math.floor(i / 36)}.${i % 36}`, (v) => (v === 0 ? 'silence' : ''))], (i) => `effect ${Math.floor(i / 36)} step ${i % 36}`);
  b.sect('Sound Blaster .VOC names');
  b.arr('.VOC names', 30, 9, [part(0, '', 'str', (i) => `digital.${i}`, (v) => (v ? `${v}.VOC` : 'PC speaker'), 9)], (i) => `effect ${i}`);
}

/** .REC: demo key presses (PLAYGAME.C Recording). */
function rec(b: Builder): void {
  b.sect('Recorded keys');
  const n = Math.min(1000, Math.floor(b.bytes.length / 3));
  b.arr('Keys', n, 3, [part(0, 'ticks since last', 'u16', (i) => `${i}.delta`), part(2, 'scan code', 'u8', (i) => `${i}.key`, (v) => `${hex(Number(v) & 0x7f)}h ${Number(v) & 0x80 ? 'released' : 'pressed'}`)], (i) => `Key ${i}`);
}

/** Text: one field a line (DOS text ends at Ctrl-Z). */
export function text(b: Builder): void {
  const bytes = b.bytes;
  let line = 0;
  while (b.off < bytes.length) {
    if (bytes[b.off] === 0x1a) {
      b.f('End of file (Ctrl-Z)', 'u8');
      continue;
    }
    if (line % 20 === 0) b.sect(`Lines ${line + 1}-${line + 20}`);
    const nl = bytes.indexOf(10, b.off);
    const len = (nl < 0 ? bytes.length : nl + 1) - b.off;
    b.f(`Line ${line + 1}`, 'text', { len });
    line++;
  }
}

export type Describer = (b: Builder) => void;

/** The formats known by extension (and the name of the format). */
export const GM_FORMATS: Record<string, [string, Describer]> = {
  gam: ['Game-Maker game (.GAM)', gam],
  map: ['Game-Maker map (.MAP)', map],
  bbl: ['Background block set (.BBL)', (b) => blocks(b, 150)],
  mbl: ['Monster block set (.MBL)', (b) => blocks(b, 100)],
  cbl: ['Character block set (.CBL)', (b) => blocks(b, 50)],
  chr: ['Character (.CHR)', chr],
  mon: ['Monster set (.MON)', mon],
  pal: ['VGA palette (.PAL)', pal],
  his: ['High scores (.HIS)', his],
  snd: ['Sound set (.SND)', snd],
  rec: ['Demo recording (.REC)', rec],
  'savnames.dat': ['Saved game names (SAVNAMES.DAT)', savnames],
};
