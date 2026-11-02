// A native file and its editor-only extras, copied between projects in this browser tab.
import { decode, encode } from '../../backup/codec';
import type { Project } from '../core/project';
import { kindOf, type FileKind } from '../core/project';
import { validDosName } from '../../project/health';
import { readAsset, type AssetFile } from './assetFiles';
import { normalize } from '../../project/files';

const KEY = 'gm-file-clip';
const CHANGED = 'gamemaker-file-clipboard';
let cached: AssetFile | undefined;

export function copyAsset(project: Project, name: string): void {
  const asset = readAsset(project, name);
  if (!asset) return;
  cached = asset;
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
export function copiedAsset(kind?: FileKind): AssetFile | undefined {
  if (!cached) {
    try {
      const value = decode(sessionStorage.getItem(KEY) ?? 'null') as Partial<AssetFile> | null;
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
