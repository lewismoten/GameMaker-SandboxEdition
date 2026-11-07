// Optional Pocket library v1 metadata. Gameplay stays GMP 1 / GMS1.
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';
import type { Companion } from '../project/companion';
import { courseNumber, isCeremony } from '../project/ceremonies';

export interface PocketLibrary {
  schema: 'gmp-library';
  version: 1;
  uid: string;
  title: string;
  dosName: string;
  category: string[];
  course?: number;
  categoryLabel?: string;
  thumbnail?: 'thumb.pth';
  gamCrc32: string;
  /** Advisory route score; absent when no score file was supplied. */
  touchScore?: number;
}
export type PocketContext = Pick<PocketLibrary, 'uid' | 'category'> & Partial<Pick<PocketLibrary, 'course' | 'categoryLabel' | 'touchScore'>>;
const enc = new TextEncoder();
const byteLength = (s: string) => enc.encode(s).length;

/** Explicit site context, never guessed from gameplay assets. */
export function pocketCategory(id: string, series?: string, kind: 'gameware' | 'shareware' = 'gameware'): Pick<PocketLibrary, 'category' | 'course'> {
  if (series === 'starter') {
    const course = courseNumber(id);
    return { category: ['starter', course ? String(100 * Math.floor(course / 100)) : isCeremony(id) ? 'graduations' : 'other'], ...(course ? { course } : {}) };
  }
  return { category: series === 'bizarre' ? ['bizarre'] : series === 'sandbox' ? ['sandbox'] : ['cd', kind] };
}

/** CRC-32/ISO-HDLC of the selected source GAM, independent of packed assets. */
export function gamCrc32(b: Uint8Array): string {
  return (crc32(b) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/** Invalid or future metadata is optional: callers fall back to the legacy record. */
export function readLibrary(bytes: Uint8Array): PocketLibrary | undefined {
  if (bytes.length > 1024 || (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191)) return;
  try {
    const v = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as PocketLibrary;
    if (
      v.schema !== 'gmp-library' ||
      v.version !== 1 ||
      typeof v.uid !== 'string' ||
      !/^[\x21-\x7e]{1,96}$/.test(v.uid) ||
      typeof v.title !== 'string' ||
      !v.title ||
      byteLength(v.title) > 128 ||
      /[\x00-\x1f]/.test(v.title) ||
      typeof v.dosName !== 'string' ||
      !/^[A-Z0-9!#$%&'()@^_`{}~-]{1,8}$/.test(v.dosName) ||
      typeof v.gamCrc32 !== 'string' ||
      !/^[A-F0-9]{8}$/.test(v.gamCrc32) ||
      !Array.isArray(v.category) ||
      v.category.length < 1 ||
      v.category.length > 2 ||
      v.category.some((s) => typeof s !== 'string' || !/^[a-z0-9-]{1,32}$/.test(s)) ||
      (v.course !== undefined && !Number.isSafeInteger(v.course)) ||
      (v.categoryLabel !== undefined && (typeof v.categoryLabel !== 'string' || byteLength(v.categoryLabel) > 48 || /[\x00-\x1f]/.test(v.categoryLabel))) ||
      (v.thumbnail !== undefined && v.thumbnail !== 'thumb.pth') ||
      (v.touchScore !== undefined && (!Number.isInteger(v.touchScore) || v.touchScore < 0 || v.touchScore > 100))
    )
      return;
    return v;
  } catch {
    return;
  }
}
export function writeLibrary(v: PocketLibrary): Uint8Array {
  const bytes = enc.encode(JSON.stringify(v));
  if (!readLibrary(bytes)) throw new Error('Invalid Pocket library metadata');
  return bytes;
}

/** An 8.3 collision gets a deterministic suffix; never silently overwrite a different UID. */
export function uniqueGmpName(name: string, uid: string, used: Map<string, string>): string {
  let candidate = name;
  if (used.has(candidate) && used.get(candidate) !== uid) candidate = name.slice(0, 1) + gamCrc32(enc.encode(uid)).slice(0, 7) + '.GMP';
  if (used.has(candidate) && used.get(candidate) !== uid) throw new Error('Pocket filename hash collision');
  used.set(candidate, uid);
  return candidate;
}

/** Assigned once; the companion serializer/backup preserves this identity. */
export function pocketProjectUid(c: Companion): string {
  if (typeof c.pocketUid !== 'string' || !/^project:[0-9a-f-]{36}$/.test(c.pocketUid)) c.pocketUid = `project:${crypto.randomUUID()}`;
  return c.pocketUid as string;
}
