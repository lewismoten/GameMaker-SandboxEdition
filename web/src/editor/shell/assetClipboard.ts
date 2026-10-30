// A native file and its editor-only extras, copied between projects in this browser tab.
import { decode, encode } from '../../backup/codec';
import type { Project } from '../core/project';
import { kindOf, validDosName, type FileKind } from '../core/project';
import { normalize } from '../../project/files';

interface CopiedAsset {
  name: string;
  bytes: Uint8Array;
  extras: Record<string, unknown>;
}

const KEY = 'gm-file-clip';
const CHANGED = 'gamemaker-file-clipboard';
let cached: CopiedAsset | undefined;

export function copyAsset(project: Project, name: string): void {
  const bytes = project.files.get(name);
  if (!bytes) return;
  cached = { name: normalize(name), bytes: bytes.slice(), extras: structuredClone(project.companion?.files[normalize(name)] ?? {}) };
  try {
    sessionStorage.setItem(KEY, encode(cached));
  } catch {
    // A large file still works in memory; never leave an older stored clipboard behind.
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED));
}

/** Independent snapshots keep paste or an editor from modifying what was copied. */
export function copiedAsset(kind?: FileKind): CopiedAsset | undefined {
  if (!cached) {
    try {
      const value = decode(sessionStorage.getItem(KEY) ?? 'null') as Partial<CopiedAsset> | null;
      if (
        value &&
        typeof value.name === 'string' &&
        validDosName(value.name) &&
        value.bytes instanceof Uint8Array &&
        value.extras &&
        typeof value.extras === 'object' &&
        !Array.isArray(value.extras)
      )
        cached = { name: normalize(value.name), bytes: value.bytes, extras: value.extras };
    } catch {
      /* no valid clipboard */
    }
  }
  return cached && (!kind || kindOf(cached.name) === kind) ? structuredClone(cached) : undefined;
}

export function onAssetCopy(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGED, fn);
  return () => window.removeEventListener(CHANGED, fn);
}
