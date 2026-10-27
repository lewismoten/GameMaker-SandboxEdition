// My games: your own projects (every file, and the companion with its to-do list), with what
// the browser remembers about each (the game it was copied from, when it was last used, its
// folded file lists, its Play Level pick, hidden next steps). Imported games are never taken.
// Merge adds the file's games; one whose id is here already and differs is kept as a second
// game, replaces this one, or is skipped, as chosen.
import { same } from '../codec';
import { PROJECT_HIDDEN_PREFIX, PROJECT_MAPS } from '../inventory';
import type { World } from '../world';
import { isRecord, json, need, plural, stringMap, type MergeContext, type Section } from './types';

interface ProjectRow {
  id: string;
  name: string;
  [k: string]: unknown;
}

export interface ProjectsPayload {
  projects: Record<string, ProjectRow>;
  /** Each PROJECT_MAPS key's entries for these projects. */
  maps: Record<string, Record<string, unknown>>;
  /** Project ids -> their gm-next-hidden-<id> value. */
  hidden: Record<string, string>;
}

/** Project ids marked imported (editor/shell/homeOrigin.ts SOURCE_KEY). */
export function importedIds(w: World): Set<string> {
  const map = json<Record<string, string>>(w.local['gm-project-source']);
  return new Set(isRecord(map) ? Object.keys(map).filter((k) => map[k] === 'imported') : []);
}

/** Your own projects' ids (every project not imported). */
export const ownIds = (w: World): string[] => Object.keys(w.stores.projects).filter((id) => !importedIds(w).has(id));

const mapOf = (w: World, key: string): Record<string, unknown> => {
  const m = json<unknown>(w.local[key]);
  return isRecord(m) ? m : {};
};

export const projects: Section<ProjectsPayload> = {
  id: 'projects',
  title: 'My games',
  short: 'My games',
  description: 'Games you made or copied, with every file, their to-do lists and editor notes. Imported games stay out.',
  unit: ['game', 'games'],
  extract(w) {
    const ids = ownIds(w);
    const p: ProjectsPayload = { projects: {}, maps: {}, hidden: {} };
    for (const id of ids) p.projects[id] = w.stores.projects[id] as ProjectRow;
    for (const key of PROJECT_MAPS) {
      const m = mapOf(w, key);
      const mine = Object.fromEntries(ids.filter((id) => id in m).map((id) => [id, m[id]]));
      if (Object.keys(mine).length) p.maps[key] = mine;
    }
    for (const id of ids) if (w.local[PROJECT_HIDDEN_PREFIX + id] !== undefined) p.hidden[id] = w.local[PROJECT_HIDDEN_PREFIX + id];
    return p;
  },
  count: (p) => Object.keys(p.projects).length,
  validate(raw) {
    need(isRecord(raw) && isRecord(raw.projects) && isRecord(raw.maps), 'games');
    for (const [id, r] of Object.entries(raw.projects)) {
      need(isRecord(r) && r.id === id && typeof r.name === 'string' && typeof r.gam === 'string' && isRecord(r.files), 'games');
      for (const f of Object.values(r.files)) need(f instanceof Uint8Array, 'games');
    }
    for (const m of Object.values(raw.maps)) need(isRecord(m), 'games');
    return { projects: raw.projects as Record<string, ProjectRow>, maps: raw.maps as ProjectsPayload['maps'], hidden: stringMap(raw.hidden ?? {}, 'games') };
  },
  merge(mine, theirs, ctx) {
    const next: ProjectsPayload = { projects: { ...mine.projects }, maps: {}, hidden: { ...mine.hidden } };
    for (const key of PROJECT_MAPS) next.maps[key] = { ...mine.maps[key] };
    const takeMeta = (from: string, to: string, overwrite: boolean) => {
      for (const key of PROJECT_MAPS) {
        const v = theirs.maps[key]?.[from];
        if (v !== undefined && (overwrite || !(to in next.maps[key]))) next.maps[key][to] = v;
      }
      if (theirs.hidden[from] !== undefined && (overwrite || !(to in next.hidden))) next.hidden[to] = theirs.hidden[from];
    };
    for (const [id, r] of Object.entries(theirs.projects)) {
      const here = ctx.world.stores.projects[id];
      if (!here) {
        next.projects[id] = r;
        takeMeta(id, id, false);
        continue;
      }
      if (same(here, r)) {
        takeMeta(id, id, false);
        continue;
      }
      const choice = ctx.projects[id] ?? (ctx.prefer === 'theirs' ? 'replace' : ctx.prefer === 'mine' ? 'skip' : 'both');
      if (choice === 'skip') continue;
      if (choice === 'replace' && id in mine.projects) {
        next.projects[id] = r;
        takeMeta(id, id, true);
        continue;
      }
      const to = ctx.newId();
      ctx.idMap[id] = to;
      next.projects[to] = { ...r, id: to, name: `${r.name} (restored)` };
      takeMeta(id, to, true);
    }
    for (const key of PROJECT_MAPS) if (!Object.keys(next.maps[key]).length) delete next.maps[key];
    return next;
  },
  replace(theirs, ctx: MergeContext) {
    // a game of the file's whose id an imported game has here is kept beside it
    const next: ProjectsPayload = { projects: {}, maps: {}, hidden: {} };
    const imported = importedIds(ctx.world);
    for (const [id, r] of Object.entries(theirs.projects)) {
      const to = imported.has(id) ? (ctx.idMap[id] = ctx.newId()) : id;
      next.projects[to] = to === id ? r : { ...r, id: to };
      for (const [key, m] of Object.entries(theirs.maps)) if (m[id] !== undefined) (next.maps[key] ??= {})[to] = m[id];
      if (theirs.hidden[id] !== undefined) next.hidden[to] = theirs.hidden[id];
    }
    return next;
  },
  inject(w, mine, next) {
    for (const id of Object.keys(mine.projects)) delete w.stores.projects[id];
    Object.assign(w.stores.projects, next.projects);
    for (const key of PROJECT_MAPS) {
      const was = mapOf(w, key);
      const m = { ...was };
      for (const id of Object.keys(mine.maps[key] ?? {})) delete m[id];
      Object.assign(m, next.maps[key] ?? {});
      if (same(m, was)) continue;
      if (Object.keys(m).length) w.local[key] = JSON.stringify(m);
      else delete w.local[key];
    }
    for (const id of Object.keys(mine.hidden)) delete w.local[PROJECT_HIDDEN_PREFIX + id];
    for (const [id, v] of Object.entries(next.hidden)) w.local[PROJECT_HIDDEN_PREFIX + id] = v;
  },
  describe(mine, next) {
    const ids = Object.keys(next.projects);
    const added = ids.filter((id) => !(id in mine.projects)).length;
    const changed = ids.filter((id) => id in mine.projects && !same(mine.projects[id], next.projects[id])).length;
    const removed = Object.keys(mine.projects).filter((id) => !(id in next.projects)).length;
    const out: string[] = [];
    if (added) out.push(`Adds ${plural(added, this.unit)}`);
    if (changed) out.push(`Replaces ${plural(changed, this.unit)}`);
    if (removed) out.push(`Removes ${plural(removed, this.unit)}`);
    return out;
  },
};
