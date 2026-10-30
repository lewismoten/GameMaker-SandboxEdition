// Exact native file copies, with file-local companion sections kept out of DOS data.
import type { Project } from '../core/project';
import { kindOf } from '../core/project';
import { refuse } from '../core/readOnly';
import { validDosName } from '../../project/health';
import { normalize } from '../../project/files';

export interface AssetFile {
  name: string;
  bytes: Uint8Array;
  extras: Record<string, unknown>;
}

export function readAsset(project: Project, file: string): AssetFile | undefined {
  const bytes = project.files.get(file);
  return bytes ? { name: normalize(file), bytes: bytes.slice(), extras: structuredClone(project.companion?.files[normalize(file)] ?? {}) } : undefined;
}

/** Unknown formats must share an extension as well as their catch-all category. */
export function sameAssetType(a: string, b: string): boolean {
  const kind = kindOf(a);
  return (
    kind === kindOf(b) && (kind !== 'other' || (a.split('.').length > 1 ? a.split('.').pop() : '') === (b.split('.').length > 1 ? b.split('.').pop() : ''))
  );
}

export function writeAsset(project: Project, file: string, asset: AssetFile): void {
  const name = normalize(file);
  if (!validDosName(name) || !sameAssetType(asset.name, name)) throw new Error('Choose a DOS file name with the same file type.');
  if (project.readOnly) refuse(project, name);
  const sections = structuredClone(asset.extras);
  const keys = new Set([...Object.keys(project.companion?.files[name] ?? {}), ...Object.keys(sections)]);
  project.files.set(name, asset.bytes.slice());
  for (const section of keys) project.setExtras(name, section, sections[section]);
}
