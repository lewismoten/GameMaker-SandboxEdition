// The score trophies: each game's best final score, the total of every play's points and the
// count of plays (scoreTrophies/scores.ts, a file in the saves store), and EGG.EXE's trophy
// overrides. Merge keeps the higher of each score and count; an override set here stays.
import { localOf, SITE_SAVE_IDS } from '../inventory';
import { FILE, parseScores, type ScoreRecord } from '../../scoreTrophies/scores';
import { describeKeys, fileMap, fillGaps, injectLocal, isRecord, need, plural, stringMap, type Section } from './types';

export interface TrophiesPayload {
  files: Record<string, Uint8Array>;
  local: Record<string, string>;
}

function higher(a: ScoreRecord, b: ScoreRecord): ScoreRecord {
  const best = { ...a.best };
  for (const [g, s] of Object.entries(b.best)) if (s > (best[g] ?? -1)) best[g] = s;
  return { best, total: Math.max(a.total, b.total), plays: Math.max(a.plays, b.plays) };
}

export const trophies: Section<TrophiesPayload> = {
  id: 'trophies',
  title: 'Score trophies',
  short: 'Score trophies',
  description: 'Your best score in each game and the total of all your points, for the desk’s two trophies.',
  unit: ['best score', 'best scores'],
  extract: (w) => ({
    files: { ...((w.stores.saves[SITE_SAVE_IDS.scores] as Record<string, Uint8Array> | undefined) ?? {}) },
    local: localOf('trophies', w.local),
  }),
  count: (p) => Object.keys(parseScores(p.files[FILE]).best).length,
  validate(raw) {
    need(isRecord(raw), 'score trophies');
    return { files: fileMap(raw.files, 'score trophies'), local: stringMap(raw.local ?? {}, 'score trophies') };
  },
  merge(mine, theirs, ctx) {
    const local = fillGaps(mine.local, theirs.local, ctx.prefer);
    if (!theirs.files[FILE]) return { files: mine.files, local };
    const a = parseScores(mine.files[FILE]);
    const r = higher(a, parseScores(theirs.files[FILE]));
    const changed = JSON.stringify(r) !== JSON.stringify(a) || !mine.files[FILE];
    return { files: changed ? { ...mine.files, [FILE]: new TextEncoder().encode(JSON.stringify(r)) } : mine.files, local };
  },
  inject(w, mine, next) {
    if (Object.keys(next.files).length) w.stores.saves[SITE_SAVE_IDS.scores] = { ...next.files };
    else delete w.stores.saves[SITE_SAVE_IDS.scores];
    injectLocal(w, mine.local, next.local);
  },
  describe(mine, next) {
    const a = parseScores(mine.files[FILE]);
    const b = parseScores(next.files[FILE]);
    const raised = Object.keys(b.best).filter((g) => b.best[g] !== a.best[g]).length;
    const dropped = Object.keys(a.best).filter((g) => !(g in b.best)).length;
    const out: string[] = [];
    if (raised) out.push(`Sets ${plural(raised, this.unit)}`);
    if (dropped) out.push(`Removes ${plural(dropped, this.unit)}`);
    if (b.total !== a.total) out.push(`Total points ${a.total.toLocaleString('en-US')} → ${b.total.toLocaleString('en-US')}`);
    return [...out, ...describeKeys(mine.local, next.local, ['trophy override', 'trophy overrides'])];
  },
};
