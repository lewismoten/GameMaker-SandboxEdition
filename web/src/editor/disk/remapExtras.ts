// When blocks fold or merge, the names and groups the designer gave them (editor-only, in the
// companion) follow: a name moves with its block (the kept block's own name wins), a group's cells
// are renumbered, and a dropped file's names and groups move to the file that took its blocks.
// A snapshot lets Undo and Redo put them back with the files.
import { BLOCK_NAMES, readBlockNames, type BlockNames } from '../editors/blocks/blockNames';
import { readGroups, writeGroups, type BlockGroup } from '../editors/blocks/blockGroups';
import { remapBrushes } from './remapBrushes';
import type { BlockMove } from './types';

interface Store {
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
}
const COUNT = 256;
const GROUPS = 'groups';

/** The names and groups of these files, as plain data. */
export type ExtrasSnapshot = Map<string, { names: unknown; groups: unknown }>;

export function snapshotExtras(store: Store, files: Iterable<string>): ExtrasSnapshot {
  const out: ExtrasSnapshot = new Map();
  for (const f of files)
    out.set(f, {
      names: structuredClone(store.extras<unknown>(f, BLOCK_NAMES, undefined)),
      groups: structuredClone(store.extras<unknown>(f, GROUPS, undefined)),
    });
  return out;
}

export function restoreExtras(store: Store, snap: ExtrasSnapshot): void {
  for (const [f, s] of snap) {
    store.setExtras(f, BLOCK_NAMES, structuredClone(s.names));
    store.setExtras(f, GROUPS, structuredClone(s.groups));
  }
}

/** The files a list of moves can change the extras of. */
export const movedFiles = (moves: readonly BlockMove[]): string[] => [...new Set(moves.flatMap((m) => [m.file, m.into]))];

/** Follows one step's moves; returns how many names and groups changed (for the dialog to say so). */
export function remapExtras(store: Store, moves: readonly BlockMove[]): { names: number; groups: number } {
  let names = 0;
  let groups = 0;
  for (const m of moves) {
    const mine = readBlockNames(store.extras<unknown>(m.file, BLOCK_NAMES, undefined), COUNT);
    const theirs: BlockNames = m.file === m.into ? mine : readBlockNames(store.extras<unknown>(m.into, BLOCK_NAMES, undefined), COUNT);
    const next: BlockNames = m.file === m.into ? { ...mine } : { ...theirs };
    for (const [k, name] of Object.entries(mine)) {
      const i = Number(k);
      const t = m.at.get(i);
      if (t === undefined) {
        if (m.file !== m.into) names++; // a name on a block nothing drew is dropped with its file
        continue;
      }
      if (m.file === m.into) delete next[i];
      if (!next[t]) next[t] = name;
      names++;
    }
    if (names || Object.keys(mine).length) {
      store.setExtras(m.into, BLOCK_NAMES, Object.keys(next).length ? next : undefined);
      if (m.file !== m.into) store.setExtras(m.file, BLOCK_NAMES, undefined);
    }
    const gs = readGroups(store, m.file, COUNT);
    if (gs.length) {
      const follow = (g: BlockGroup): BlockGroup => ({ ...g, cells: g.cells.map((c) => (c < 0 ? -1 : (m.at.get(c) ?? (m.file === m.into ? c : -1)))) });
      const moved = gs.map(follow).filter((g) => g.cells.some((c) => c >= 0));
      groups += moved.length;
      const keep = m.file === m.into ? [] : readGroups(store, m.into, COUNT);
      writeGroups(store, m.into, [...keep, ...moved]);
      if (m.file !== m.into) writeGroups(store, m.file, []);
    }
  }
  remapBrushes(store, moves);
  return { names, groups };
}
