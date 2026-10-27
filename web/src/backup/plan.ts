// An import worked out before anything is written: each chosen section of the file merged with
// (or put in place of) this browser's, into a copy of the world, with what each one changes.
// Sections not chosen, or not in the file, are never extracted or injected, so they stay as they
// are. No DOM.
import { same } from './codec';
import type { SectionId } from './inventory';
import type { ReadBackup } from './file';
import { SECTIONS } from './sections';
import type { ProjectsPayload } from './sections/projects';
import type { MergeContext, ProjectChoice } from './sections/types';
import { copyWorld, type World } from './world';

export type Mode = 'merge' | 'replace';

export interface ImportChoices {
  /** The sections to bring back and how; a section left out is not touched. */
  sections: Partial<Record<SectionId, Mode>>;
  projects: Record<string, ProjectChoice>;
  slots: 'mine' | 'theirs';
}

export interface SectionChange {
  id: SectionId;
  title: string;
  mode: Mode;
  lines: string[];
}

export interface Plan {
  next: World;
  changes: SectionChange[];
}

const nameOf = (r: unknown): string | undefined => (r && typeof r === 'object' && 'name' in r && typeof r.name === 'string' ? r.name : undefined);

/** The file's games whose ids are used here by a different game (they need a choice). */
export function projectClashes(world: World, backup: ReadBackup): { id: string; name: string; here: string }[] {
  const p = backup.payloads.projects as ProjectsPayload | undefined;
  if (!p) return [];
  return Object.entries(p.projects)
    .filter(([id, r]) => world.stores.projects[id] && !same(world.stores.projects[id], r))
    .map(([id, r]) => ({ id, name: r.name, here: nameOf(world.stores.projects[id]) ?? r.name }));
}

export async function planImport(world: World, backup: ReadBackup, choices: ImportChoices, opts: { now?: number; newId?: () => string } = {}): Promise<Plan> {
  const next = copyWorld(world);
  const ctx: MergeContext = {
    world,
    projects: choices.projects,
    slots: choices.slots,
    idMap: {},
    now: opts.now ?? Date.now(),
    newId: opts.newId ?? (() => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
  };
  const changes: SectionChange[] = [];
  for (const s of SECTIONS) {
    const mode = choices.sections[s.id];
    const theirs = backup.payloads[s.id];
    if (!mode || theirs === undefined) continue;
    const mine = await s.extract(next);
    const result = mode === 'replace' ? (s.replace ? s.replace(theirs, ctx, mine) : theirs) : s.merge(mine, theirs, ctx);
    s.inject(next, mine, result);
    changes.push({ id: s.id, title: s.title, mode, lines: s.describe(mine, result) });
  }
  return { next, changes };
}
