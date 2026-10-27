// What every backup section does, and what an import's choices are. No DOM.
import type { SectionId } from '../inventory';
import type { World } from '../world';

/** What to do with a project in the file whose id is already used here. */
export type ProjectChoice = 'both' | 'replace' | 'skip';

export interface MergeContext {
  /** The world as it stands before the import (merges look up what's here). */
  world: World;
  /** Per clashing project id; 'both' when left out. */
  projects: Record<string, ProjectChoice>;
  /** Whose version wins where both have one and the rules don't settle it; undefined: the section's own rules. */
  prefer?: 'mine' | 'theirs';
  /** A save file (a slot, a recording) that differs here and in the file: whose is kept. The other goes to Save backups. */
  slots: 'mine' | 'theirs';
  /** Project ids the file's games were given here (kept both), so their saves follow them. Filled by the projects section. */
  idMap: Record<string, string>;
  now: number;
  newId: () => string;
}

export class BackupError extends Error {}

export interface Section<P = unknown> {
  id: SectionId;
  title: string;
  /** The title in a few words, for the dialogs' one-line rows. */
  short: string;
  /** One line for the dialog. */
  description: string;
  /** This section's part of the world. */
  extract(w: World): P | Promise<P>;
  /** How many things it holds (for the manifest and the dialog: "12 achievements"). */
  count(p: P): number;
  /** "achievement" / "achievements". */
  unit: [string, string];
  /** A file's payload checked and typed; throws BackupError when it isn't one. */
  validate(raw: unknown): P;
  /** This browser's and the file's as one, by the section's rules. */
  merge(mine: P, theirs: P, ctx: MergeContext): P;
  /** The file's in place of this browser's (when only taking it as it is would be wrong). */
  replace?(theirs: P, ctx: MergeContext, mine: P): P;
  /** Puts `next` into the world in place of `mine` (both of this section). */
  inject(w: World, mine: P, next: P): void;
  /** What changing `mine` to `next` does, in short lines ("Adds 3 achievements"). */
  describe(mine: P, next: P): string[];
}

// ------------------------------------------------------------------ shared helpers

export const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Uint8Array);

export function need(ok: unknown, what: string): asserts ok {
  if (!ok) throw new BackupError(`The backup's ${what} is damaged.`);
}

/** A map of string values (localStorage keys and their text). */
export function stringMap(v: unknown, what: string): Record<string, string> {
  need(isRecord(v), what);
  for (const x of Object.values(v)) need(typeof x === 'string', what);
  return v as Record<string, string>;
}

/** A map of file name -> bytes. */
export function fileMap(v: unknown, what: string): Record<string, Uint8Array> {
  need(isRecord(v), what);
  for (const x of Object.values(v)) need(x instanceof Uint8Array, what);
  return v as Record<string, Uint8Array>;
}

export const plural = (n: number, [one, many]: [string, string]) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** Sets the keys of `next` and removes those of `mine` it lacks. */
export function injectLocal(w: World, mine: Record<string, string>, next: Record<string, string>): void {
  for (const k of Object.keys(mine)) if (!(k in next)) delete w.local[k];
  Object.assign(w.local, next);
}

/** This browser's keys, plus the file's for keys not set here (or, preferring the file, the file's wherever it has one). */
export const fillGaps = (mine: Record<string, string>, theirs: Record<string, string>, prefer?: 'mine' | 'theirs'): Record<string, string> =>
  prefer === 'theirs' ? { ...mine, ...theirs } : { ...theirs, ...mine };

/** "Sets 2 settings, changes 1, removes 1" for two key maps. */
export function describeKeys(mine: Record<string, string>, next: Record<string, string>, unit: [string, string] = ['setting', 'settings']): string[] {
  const added = Object.keys(next).filter((k) => !(k in mine)).length;
  const changed = Object.keys(next).filter((k) => k in mine && mine[k] !== next[k]).length;
  const removed = Object.keys(mine).filter((k) => !(k in next)).length;
  const out: string[] = [];
  if (added) out.push(`Adds ${plural(added, unit)}`);
  if (changed) out.push(`Changes ${plural(changed, unit)}`);
  if (removed) out.push(`Removes ${plural(removed, unit)}`);
  return out;
}

/** Parses JSON kept as a localStorage value; undefined when it isn't. */
export function json<T>(text: string | undefined): T | undefined {
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}
