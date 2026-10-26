// The rules every DOS player patch keeps, and how a value becomes bytes in XFERPLAY.EXE and back.
// Strings never grow (shorter ones are padded with spaces, which GWrite draws as nothing, and
// the 0 after each is never touched); in-game text is 0x20-0x7E only (GPutChar's ROM font stops
// at 127); a printf format keeps its % codes, in order; numbers stay in their immediate's range.
import { COLOR_TARGETS, FKEY_OFF, PATCHES, type ColorName, type FramePatch, type ImmField, type PatchEntry } from './patchTable';

export type PatchValue = string | number | number[];

/** A project's DOS player choices: patch id -> value (patchTable.ts says what each takes). */
export type PlayerPatches = Record<string, PatchValue>;

const BY_ID = new Map(PATCHES.map((e) => [e.id, e]));

export function patchEntry(id: string): PatchEntry | undefined {
  return BY_ID.get(id);
}

const FORMAT_CODE = /%[-+ #0]*\d*(?:\.\d+)?[lh]?[diouxXcs]/g;

/** A printf format's % codes, in order. */
export function formatCodes(text: string): string[] {
  return text.match(FORMAT_CODE) ?? [];
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/** Why `value` can't be written for `entry`, or undefined when it can. */
export function patchProblem(entry: PatchEntry, value: unknown): string | undefined {
  switch (entry.kind) {
    case 'text':
    case 'format': {
      if (typeof value !== 'string') return 'not text';
      if (value.length > entry.length) return `longer than ${entry.length} characters`;
      if (/[^\x20-\x7e]/.test(value)) return 'only plain letters, digits and punctuation (no accents or symbols past ~)';
      const codes = formatCodes(value);
      const stock = formatCodes(entry.stock);
      if (codes.join('\n') !== stock.join('\n')) return `keep ${stock.length ? stock.join(' ') : 'no % codes'} as they are`;
      if (value.replace(FORMAT_CODE, '').includes('%')) return 'a % sign here would be read as a code';
      return undefined;
    }
    case 'number':
      return isInt(value, entry.min, entry.max) ? undefined : `a whole number from ${entry.min} to ${entry.max}`;
    case 'rgb':
      return Array.isArray(value) && value.length === 3 && value.every((c) => isInt(c, 0, 63)) ? undefined : 'three levels from 0 to 63';
    case 'select':
      return typeof value === 'string' && value in COLOR_TARGETS ? undefined : 'one of the player’s colors';
    case 'frame': {
      if (!Array.isArray(value) || value.length !== 4) return 'four numbers';
      const bad = value.findIndex((v, i) => !isInt(v, 0, frameLimit(entry, i)));
      return bad < 0 ? undefined : `${['left', 'top', 'right', 'bottom'][bad]} from 0 to ${frameLimit(entry, bad)}`;
    }
    case 'fkey':
      return value === 'off' || value === 'on' ? undefined : 'on or off';
  }
}

/** The largest value a frame's left, top, right or bottom (i: 0-3) takes: a push imm8 is sign-extended, so a 1-byte one stops at 127. */
export function frameLimit(entry: FramePatch, i: number): number {
  return entry.fields[i].size === 1 ? 127 : i % 2 === 0 ? 319 : 199;
}

/** True when `value` is what the CD's player already has (so no patch is needed). */
export function isStock(entry: PatchEntry, value: PatchValue): boolean {
  if (entry.kind === 'text' || entry.kind === 'format') return typeof value === 'string' && value.trimEnd() === entry.stock.trimEnd();
  if (entry.kind === 'fkey') return value === 'on';
  return JSON.stringify(value) === JSON.stringify(entry.stock);
}

function writeImm(exe: Uint8Array, f: ImmField, v: number): void {
  exe[f.offset] = v & 0xff;
  if (f.size === 2) exe[f.offset + 1] = (v >> 8) & 0xff;
}

function readImm(exe: Uint8Array, f: ImmField, signed: boolean): number {
  if (f.size === 2) return exe[f.offset] | (exe[f.offset + 1] << 8);
  return signed ? (exe[f.offset] << 24) >> 24 : exe[f.offset];
}

const writeWord = (exe: Uint8Array, offset: number, v: number) => writeImm(exe, { offset, size: 2 }, v);
const readWord = (exe: Uint8Array, offset: number) => readImm(exe, { offset, size: 2 }, false);

/** Writes a value already checked with patchProblem. */
export function writePatch(exe: Uint8Array, entry: PatchEntry, value: PatchValue): void {
  switch (entry.kind) {
    case 'text':
    case 'format': {
      const text = (value as string).padEnd(entry.length, ' ');
      for (let i = 0; i < entry.length; i++) exe[entry.offset + i] = text.charCodeAt(i);
      return;
    }
    case 'number':
      for (const f of entry.fields) writeImm(exe, f, value as number);
      return;
    case 'rgb':
      entry.offsets.forEach((o, i) => (exe[o] = (value as number[])[i]));
      return;
    case 'select':
      writeWord(exe, entry.offset, COLOR_TARGETS[value as ColorName]);
      return;
    case 'frame':
      entry.fields.forEach((f, i) => writeImm(exe, f, (value as number[])[i]));
      return;
    case 'fkey':
      writeWord(exe, entry.offset, value === 'off' ? FKEY_OFF : entry.stock);
      return;
  }
}

/** The entry's value in `exe` (text up to its first 0, trailing spaces dropped), or undefined when it can't be read as one. */
export function readPatch(exe: Uint8Array, entry: PatchEntry): PatchValue | undefined {
  switch (entry.kind) {
    case 'text':
    case 'format': {
      let s = '';
      for (let i = 0; i < entry.length && exe[entry.offset + i]; i++) s += String.fromCharCode(exe[entry.offset + i]);
      return s.trimEnd();
    }
    case 'number': {
      const vs = entry.fields.map((f) => readImm(exe, f, entry.signed));
      return vs.every((v) => v === vs[0]) ? vs[0] : undefined;
    }
    case 'rgb':
      return entry.offsets.map((o) => exe[o]);
    case 'select': {
      const w = readWord(exe, entry.offset);
      return (Object.keys(COLOR_TARGETS) as ColorName[]).find((k) => COLOR_TARGETS[k] === w);
    }
    case 'frame':
      return entry.fields.map((f) => readImm(exe, f, false));
    case 'fkey': {
      const w = readWord(exe, entry.offset);
      return w === FKEY_OFF ? 'off' : w === entry.stock ? 'on' : undefined;
    }
  }
}

/** Writes the CD's own value back (for every byte the entry covers, the 0s included). */
export function writeStock(exe: Uint8Array, entry: PatchEntry): void {
  if (entry.kind === 'fkey') writeWord(exe, entry.offset, entry.stock);
  else writePatch(exe, entry, entry.stock);
}

/** Only the patches that are known, valid and not the stock value; the rest are left out. */
export function cleanPatches(patches: Record<string, unknown> | undefined): PlayerPatches {
  const out: PlayerPatches = {};
  for (const [id, v] of Object.entries(patches ?? {})) {
    const e = BY_ID.get(id);
    if (e && !patchProblem(e, v) && !isStock(e, v as PatchValue)) out[id] = v as PatchValue;
  }
  return out;
}
