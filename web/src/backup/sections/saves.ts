// Saved games and high scores: every game's save record (its F5 slots game<n>.sav, their names
// in savnames.dat, its .his high-score table, recordings) and the Save backups taken of them.
// Imported games' saves stay out, as do the records that are sections of their own (the
// achievements, the score trophies) and the tin heart finds kept beside the saves (hearts.ts).
//
// Merge: a file only one side has is kept; the high-score tables become one table of the best
// ten; a slot or other file that differs keeps this browser's or the file's, as chosen, and the
// other is put in Save backups so nothing is lost. Slot names follow their slots.
import { same } from '../codec';
import { HEART_FILE, SITE_SAVE_IDS } from '../inventory';
import type { World } from '../world';
import { importedIds } from './projects';
import { parseSlotNames, serializeSlotNames, slotOfFile, SLOT_NAMES_FILE } from '../../project/saveData/saveGame';
import { parseHighScoreTable, serializeHighScoreTable, sortHighScores } from '../../project/saveData/highScores';
import { HIGH_SCORES } from '../../formats/highscore';
import { fileMap, isRecord, need, plural, type MergeContext, type Section } from './types';

type Files = Record<string, Uint8Array>;

interface SaveBackupRow {
  id: string;
  game: string;
  when: number;
  label: string;
  files: Files;
  [k: string]: unknown;
}

export interface SavesPayload {
  /** Save id ('game:<id>', 'project:<id>') -> its files. */
  saves: Record<string, Files>;
  backups: Record<string, SaveBackupRow>;
}

const siteIds = new Set<string>(Object.values(SITE_SAVE_IDS));

/** Whether a save id is a game's whose saves this section carries. */
function carried(w: World, id: string): boolean {
  if (siteIds.has(id)) return false;
  return !(id.startsWith('project:') && importedIds(w).has(id.slice('project:'.length)));
}

const withoutHeart = (files: Files): Files => Object.fromEntries(Object.entries(files).filter(([n]) => n !== HEART_FILE));

/** A save id with the file's project ids moved to the ones they were given here. */
const remap = (id: string, map: Record<string, string>): string => (id.startsWith('project:') && map[id.slice(8)] ? `project:${map[id.slice(8)]}` : id);

/** Two high-score tables as one: the best ten, an entry both hold counted once. */
export function mergeHighScores(a: Uint8Array, b: Uint8Array): Uint8Array {
  const seen = new Set<string>();
  const all = [...parseHighScoreTable(a).entries, ...parseHighScoreTable(b).entries].filter((e) => {
    const k = `${e.score}|${e.name}`;
    if (seen.has(k) || (e.score === 0 && !e.name)) return false;
    seen.add(k);
    return true;
  });
  const entries = sortHighScores(all).slice(0, HIGH_SCORES);
  while (entries.length < HIGH_SCORES) entries.push({ score: 0, name: '' });
  return serializeHighScoreTable({ entries });
}

interface Merged {
  files: Files;
  /** Files that lost (to keep in Save backups). */
  aside: Files;
  conflicts: number;
}

function mergeFiles(mine: Files, theirs: Files, keep: 'mine' | 'theirs'): Merged {
  const files: Files = { ...mine };
  const aside: Files = {};
  let conflicts = 0;
  const theirSlots = new Set<number>();
  for (const [name, bytes] of Object.entries(theirs)) {
    if (name === SLOT_NAMES_FILE) continue;
    const here = mine[name];
    if (!here) {
      files[name] = bytes;
      const s = slotOfFile(name);
      if (s !== undefined) theirSlots.add(s);
    } else if (same(here, bytes)) continue;
    else if (/\.his$/i.test(name)) files[name] = mergeHighScores(here, bytes);
    else {
      conflicts++;
      const s = slotOfFile(name);
      if (keep === 'theirs') {
        files[name] = bytes;
        aside[name] = here;
        if (s !== undefined) theirSlots.add(s);
      } else aside[name] = bytes;
    }
  }
  // the slot names: theirs for the slots now holding their saves
  if (theirs[SLOT_NAMES_FILE] && (theirSlots.size || !mine[SLOT_NAMES_FILE])) {
    if (!mine[SLOT_NAMES_FILE]) files[SLOT_NAMES_FILE] = theirs[SLOT_NAMES_FILE];
    else {
      const names = parseSlotNames(mine[SLOT_NAMES_FILE]);
      const other = parseSlotNames(theirs[SLOT_NAMES_FILE]);
      for (const s of theirSlots) names[s] = other[s];
      files[SLOT_NAMES_FILE] = serializeSlotNames(names, mine[SLOT_NAMES_FILE]);
    }
  }
  if (Object.keys(aside).length && mine[SLOT_NAMES_FILE])
    aside[SLOT_NAMES_FILE] = keep === 'theirs' ? mine[SLOT_NAMES_FILE] : (theirs[SLOT_NAMES_FILE] ?? mine[SLOT_NAMES_FILE]);
  return { files, aside, conflicts };
}

export const saves: Section<SavesPayload> = {
  id: 'saves',
  title: 'Saved games and high scores',
  short: 'Saves and high scores',
  description: 'Each game’s save slots, slot names and high-score table, and your Save backups.',
  unit: ['game', 'games'],
  extract(w) {
    const p: SavesPayload = { saves: {}, backups: {} };
    for (const [id, rec] of Object.entries(w.stores.saves)) {
      if (!carried(w, id) || !isRecord(rec)) continue;
      const files = withoutHeart(rec as Files);
      if (Object.keys(files).length) p.saves[id] = files;
    }
    for (const [id, b] of Object.entries(w.stores.saveBackups)) if (isRecord(b) && carried(w, String(b.game))) p.backups[id] = b as SaveBackupRow;
    return p;
  },
  count: (p) => new Set([...Object.keys(p.saves), ...Object.values(p.backups).map((b) => b.game)]).size,
  validate(raw) {
    need(isRecord(raw) && isRecord(raw.saves) && isRecord(raw.backups), 'saves');
    for (const f of Object.values(raw.saves)) fileMap(f, 'saves');
    for (const [id, b] of Object.entries(raw.backups)) {
      need(isRecord(b) && b.id === id && typeof b.game === 'string' && typeof b.when === 'number' && typeof b.label === 'string', 'save backups');
      fileMap(b.files, 'save backups');
    }
    return raw as unknown as SavesPayload;
  },
  merge(mine, theirs, ctx) {
    const next: SavesPayload = { saves: { ...mine.saves }, backups: { ...mine.backups } };
    for (const [fromId, files] of Object.entries(theirs.saves)) {
      const id = remap(fromId, ctx.idMap);
      const m = mergeFiles(mine.saves[id] ?? {}, files, ctx.slots);
      next.saves[id] = m.files;
      if (Object.keys(m.aside).length) {
        const b: SaveBackupRow = {
          id: ctx.newId(),
          game: id,
          when: ctx.now,
          label: ctx.slots === 'theirs' ? 'Before restoring a backup file' : 'From a backup file (not restored)',
          files: m.aside,
          auto: true,
          by: 'Restore',
        };
        next.backups[b.id] = b;
      }
    }
    for (const [id, b] of Object.entries(theirs.backups)) if (!(id in next.backups)) next.backups[id] = { ...b, game: remap(b.game, ctx.idMap) };
    return next;
  },
  replace(theirs, ctx: MergeContext) {
    const next: SavesPayload = { saves: {}, backups: {} };
    for (const [id, files] of Object.entries(theirs.saves)) next.saves[remap(id, ctx.idMap)] = files;
    for (const [id, b] of Object.entries(theirs.backups)) next.backups[id] = { ...b, game: remap(b.game, ctx.idMap) };
    return next;
  },
  inject(w, mine, next) {
    const ids = new Set([...Object.keys(mine.saves), ...Object.keys(next.saves)]);
    for (const id of ids) {
      const here = (w.stores.saves[id] as Files | undefined) ?? {};
      const kept = here[HEART_FILE] ? { [HEART_FILE]: here[HEART_FILE] } : {};
      const files = { ...(next.saves[id] ?? {}), ...kept };
      if (Object.keys(files).length) w.stores.saves[id] = files;
      else delete w.stores.saves[id];
    }
    for (const id of Object.keys(mine.backups)) delete w.stores.saveBackups[id];
    Object.assign(w.stores.saveBackups, next.backups);
  },
  describe(mine, next) {
    const out: string[] = [];
    const ids = Object.keys(next.saves);
    const added = ids.filter((id) => !(id in mine.saves)).length;
    const changed = ids.filter((id) => id in mine.saves && !same(mine.saves[id], next.saves[id])).length;
    const removed = Object.keys(mine.saves).filter((id) => !(id in next.saves)).length;
    if (added) out.push(`Adds saves for ${plural(added, this.unit)}`);
    if (changed) out.push(`Changes saves of ${plural(changed, this.unit)}`);
    if (removed) out.push(`Removes saves of ${plural(removed, this.unit)}`);
    const newBackups = Object.keys(next.backups).filter((id) => !(id in mine.backups)).length;
    const goneBackups = Object.keys(mine.backups).filter((id) => !(id in next.backups)).length;
    if (newBackups) out.push(`Adds ${plural(newBackups, ['save backup', 'save backups'])}`);
    if (goneBackups) out.push(`Removes ${plural(goneBackups, ['save backup', 'save backups'])}`);
    return out;
  },
};
