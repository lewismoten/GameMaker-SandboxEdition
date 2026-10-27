// Achievements: the site's record of what has been done (achievements/store.ts, kept as a file
// in the saves store under its own id). Merge is a union: the earliest unlock date, the
// furthest progress, every item counted toward one.
import { SITE_SAVE_IDS } from '../inventory';
import { mergeRecords, parseRecord, FILE } from '../../achievements/store';
import { fileMap, plural, type Section } from './types';

export interface AchievementsPayload {
  files: Record<string, Uint8Array>;
}

const unlocked = (p: AchievementsPayload) => Object.keys(parseRecord(p.files[FILE]).unlocked);

export const achievements: Section<AchievementsPayload> = {
  id: 'achievements',
  title: 'Achievements',
  description: 'What you have unlocked, and how far along the rest are.',
  unit: ['achievement', 'achievements'],
  extract: (w) => ({ files: { ...((w.stores.saves[SITE_SAVE_IDS.achievements] as Record<string, Uint8Array> | undefined) ?? {}) } }),
  count: (p) => unlocked(p).length,
  validate: (raw) => ({ files: fileMap((raw as { files?: unknown })?.files, 'achievements') }),
  merge(mine, theirs) {
    if (!theirs.files[FILE]) return mine;
    if (!mine.files[FILE]) return { files: { ...mine.files, [FILE]: theirs.files[FILE] } };
    const merged = mergeRecords(parseRecord(mine.files[FILE]), parseRecord(theirs.files[FILE]));
    const before = parseRecord(mine.files[FILE]);
    if (JSON.stringify(mergeRecords(before, before)) === JSON.stringify(merged)) return mine;
    return { files: { ...mine.files, [FILE]: new TextEncoder().encode(JSON.stringify(merged)) } };
  },
  inject(w, _mine, next) {
    if (Object.keys(next.files).length) w.stores.saves[SITE_SAVE_IDS.achievements] = { ...next.files };
    else delete w.stores.saves[SITE_SAVE_IDS.achievements];
  },
  describe(mine, next) {
    const had = new Set(unlocked(mine));
    const now = unlocked(next);
    const added = now.filter((id) => !had.has(id)).length;
    const lost = [...had].filter((id) => !now.includes(id)).length;
    const out: string[] = [];
    if (added) out.push(`Unlocks ${plural(added, this.unit)}`);
    if (lost) out.push(`Takes back ${plural(lost, this.unit)}`);
    if (!added && !lost && mine.files[FILE] !== next.files[FILE]) out.push('Updates progress');
    return out;
  },
};
