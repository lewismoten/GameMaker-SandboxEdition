// The Optimize tool's checkpoints: named stamps of the whole game (every file and the editor-only
// companion) kept in the game's own stored record (storage.ts `checkpoints`), so they live with My games
// and travel in a backup (unless the person leaves them out), never in the game's files and never in
// a DOS, native or web export. Like commits, each is stored as what changed since the one before
// (tools/delta: byte-range patches for binary files, line patches for text), so a stamp of a game that
// changed one block costs a few bytes. Any can be deleted (the next one absorbs its changes) and any can
// carry a release tag. Restoring is worked out as plain file changes; the editor applies them through
// the file history so Undo takes a restore back.
import { applyDelta, diffVersions } from '@lewismoten/gamemaker-sandbox-tools/delta';
import type { GameFiles } from './files';
import type { Companion } from './companion';
import { loadRecord, saveCheckpoints, type LegacyCheckpoint, type ProjectRecord, type StoredCheckpoint } from './storage';

type Version = Map<string, Uint8Array>;

/** A record's checkpoints, oldest first; the single whole one an earlier version kept comes first as a delta from nothing. */
export function checkpointList(rec: Pick<ProjectRecord, 'checkpoints' | 'checkpoint'> | undefined): StoredCheckpoint[] {
  const list = rec?.checkpoints ?? [];
  const old: LegacyCheckpoint | undefined = rec?.checkpoint;
  if (!old) return list;
  const first: StoredCheckpoint = {
    id: `legacy-${old.made}`,
    name: old.name,
    made: old.made,
    delta: diffVersions(new Map(), new Map(Object.entries(old.files))),
    ...(old.companion ? { companion: old.companion } : {}),
  };
  // the later ones were made against nothing earlier, so they are re-based on this one
  return [first, ...rebase(list, new Map(Object.entries(old.files)))];
}

/** The game as it was at the checkpoint at `index`. */
export function versionAt(list: StoredCheckpoint[], index: number): Version {
  let v: Version = new Map();
  for (let i = 0; i <= index; i++) v = applyDelta(v, list[i].delta);
  return v;
}

/** The checkpoints with each delta recomputed against the version before it, starting from `base`. */
function rebase(list: StoredCheckpoint[], base: Version, versions?: Version[]): StoredCheckpoint[] {
  const vs = versions ?? list.map((_, i) => versionAt(list, i));
  let prev = base;
  return list.map((c, i) => {
    const out = { ...c, delta: diffVersions(prev, vs[i]) };
    prev = vs[i];
    return out;
  });
}

/** The list with a new stamp of `files` added at the end. */
export function withStamp(
  list: StoredCheckpoint[],
  info: { id: string; name: string; made: number; tag?: string },
  files: GameFiles,
  companion?: Companion,
): StoredCheckpoint[] {
  const prev = list.length ? versionAt(list, list.length - 1) : new Map<string, Uint8Array>();
  const cp: StoredCheckpoint = {
    ...info,
    delta: diffVersions(prev, new Map(files.entries())),
    ...(companion ? { companion: structuredClone(companion) } : {}),
  };
  return [...list, cp];
}

/** The list without one checkpoint; the next one keeps everything it had by absorbing that one's changes. */
export function withoutStamp(list: StoredCheckpoint[], id: string): StoredCheckpoint[] {
  const at = list.findIndex((c) => c.id === id);
  if (at < 0) return list;
  const versions = list.map((_, i) => versionAt(list, i));
  const rest = list.filter((_, i) => i !== at);
  return rebase(
    rest,
    new Map(),
    versions.filter((_, i) => i !== at),
  );
}

/** The list with a checkpoint's release tag set (empty text removes it). */
export const withTag = (list: StoredCheckpoint[], id: string, tag: string): StoredCheckpoint[] =>
  list.map((c) => {
    if (c.id !== id) return c;
    const { tag: _old, ...rest } = c;
    return tag.trim() ? { ...rest, tag: tag.trim() } : rest;
  });

export const newStampId = (): string => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function getCheckpoints(id: string): Promise<StoredCheckpoint[]> {
  return checkpointList(await loadRecord(id));
}

/** Stamps the game as it is now, after the checkpoints already there. */
export async function makeCheckpoint(id: string, name: string, files: GameFiles, companion?: Companion, tag?: string): Promise<StoredCheckpoint[]> {
  const list = withStamp(await getCheckpoints(id), { id: newStampId(), name, made: Date.now(), ...(tag ? { tag } : {}) }, files, companion);
  await saveCheckpoints(id, list);
  return list;
}

export async function deleteCheckpoint(id: string, stamp: string): Promise<StoredCheckpoint[]> {
  const list = withoutStamp(await getCheckpoints(id), stamp);
  await saveCheckpoints(id, list);
  return list;
}

export async function tagCheckpoint(id: string, stamp: string, tag: string): Promise<StoredCheckpoint[]> {
  const list = withTag(await getCheckpoints(id), stamp, tag);
  await saveCheckpoints(id, list);
  return list;
}

/** A version as a game directory, for looking at without touching the open game. */
export function versionFiles(v: Version, make: (entries: [string, Uint8Array][]) => GameFiles): GameFiles {
  return make([...v.entries()]);
}

/** What restoring changes: new bytes per file, null where the file did not exist at the checkpoint. Untouched files are left out. */
export function restoreChanges(current: GameFiles, version: Version): Map<string, Uint8Array | null> {
  const out = new Map<string, Uint8Array | null>();
  for (const [n, b] of version) {
    const now = current.get(n);
    if (!now || now.length !== b.length || now.some((v, i) => v !== b[i])) out.set(n, b);
  }
  for (const n of current.names()) if (!version.has(n)) out.set(n, null);
  return out;
}
