// The kept copies of damaged saves (`<id>~damaged`, made by storage.ts loadProject when the
// editor opens a damaged game) and the rule for letting one go: a copy goes only when its
// original is still stored, reads back with no damage (recover.ts), and the copy holds nothing
// the original lacks (the same files, byte for byte; any companion or checkpoints the copy has,
// the original has as they are). Anything else stays. Pure: no IndexedDB here.
import { recoverRecord } from './recover';

/** Suffix of the id a damaged project's untouched copy is kept under. */
export const DAMAGED_SUFFIX = '~damaged';

export const isDamagedCopy = (id: string): boolean => id.endsWith(DAMAGED_SUFFIX);

/** The id of the game a kept copy was made from. */
export const originalOf = (copyId: string): string => copyId.slice(0, -DAMAGED_SUFFIX.length);

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';

/** Deep equality of stored values: bytes by content, arrays and objects by their entries. */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (ArrayBuffer.isView(a) || ArrayBuffer.isView(b)) {
    if (!ArrayBuffer.isView(a) || !ArrayBuffer.isView(b) || a.byteLength !== b.byteLength) return false;
    const x = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    const y = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    return x.every((v, i) => v === y[i]);
  }
  if (!isObject(a) || !isObject(b) || Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
}

/** True when the copy holds nothing that its stored original lacks, and the original reads back clean. */
export function holdsNothingExtra(copy: unknown, original: unknown, originalId: string): boolean {
  if (!isObject(copy) || !isObject(original)) return false;
  if (recoverRecord(originalId, original).damage.length) return false;
  if (!isObject(copy.files) || !isObject(original.files)) return false;
  // the files byte-match, both ways
  if (!same(copy.files, original.files)) return false;
  // every other thing the copy kept (companion, checkpoints, .gam name…) the original has as it is
  for (const [k, v] of Object.entries(copy)) {
    if (k === 'id' || k === 'name' || k === 'updated' || k === 'files' || v === undefined) continue;
    if (!same(v, original[k])) return false;
  }
  return true;
}

/** The ids of the kept copies among `records` that can go (see the header). */
export function redundantCopies(records: readonly { id: string }[]): string[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  return records
    .filter((r) => isDamagedCopy(r.id))
    .filter((r) => {
      const original = byId.get(originalOf(r.id));
      return original !== undefined && holdsNothingExtra(r, original, originalOf(r.id));
    })
    .map((r) => r.id);
}
