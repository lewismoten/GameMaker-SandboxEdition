// What Reset remembers so that achievements counted from the saves don't come straight back.
// Tin hearts, felt eggs and score trophies are read from saves that Reset leaves alone, so at
// the moment of a reset we note what the saves already held: those finds and scores are "before"
// and only ones made afterwards count. Hearts carry a find date, so a heart found again after the
// reset (its save cleared and played anew) counts; eggs and scores have none, so an egg already
// held stays ignored and scores count only their growth beyond the totals at the reset.
import type { ScoreRecord } from '../scoreTrophies/scores';

export interface ResetMark {
  /** Date.now() of the reset. */
  at: number;
  /** ids of the tin hearts the saves held. */
  hearts: string[];
  /** games whose felt egg the saves held. */
  eggs: string[];
  /** the best scores added up, and the total of points scored, at the reset. */
  best: number;
  total: number;
  /** Qualifying tables at reset, keyed by save id and DOS filename; unchanged tables stay forgotten. */
  highScores?: Record<string, string>;
}

/** The mark kept in a record file, or undefined when it is missing or malformed. */
export function parseMark(o: unknown): ResetMark | undefined {
  const m = o as Partial<ResetMark> | null | undefined;
  if (!m || typeof m.at !== 'number') return undefined;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const num = (v: unknown) => (typeof v === 'number' && v >= 0 ? v : 0);
  const highScores =
    m.highScores && typeof m.highScores === 'object' && !Array.isArray(m.highScores)
      ? Object.fromEntries(Object.entries(m.highScores).filter(([, v]) => typeof v === 'string'))
      : undefined;
  return { at: m.at, hearts: list(m.hearts), eggs: list(m.eggs), best: num(m.best), total: num(m.total), ...(highScores ? { highScores } : {}) };
}

/** Of two marks (this tab's and a restored backup's or another tab's) the later reset wins. */
export const laterMark = (a?: ResetMark, b?: ResetMark): ResetMark | undefined => (a && b ? (b.at > a.at ? b : a) : (a ?? b));

/** Hearts that count: found in a save, and not already held at the last reset unless found again since. */
export function heartsAfter<T extends { id: string; inSave: boolean; when?: string }>(states: readonly T[], mark?: ResetMark): T[] {
  return states.filter((s) => {
    if (!s.inSave) return false;
    if (!mark || !mark.hearts.includes(s.id)) return true;
    return !!s.when && Date.parse(s.when) > mark.at;
  });
}

/** Eggs that count: found in a save and not held at the last reset. */
export const eggsAfter = <T extends { inSave: boolean; egg: { game: string } }>(states: readonly T[], mark?: ResetMark): T[] =>
  states.filter((s) => s.inSave && !mark?.eggs.includes(s.egg.game));

/** The scores' two sums less what they were at the last reset. */
export const scoresAfter = (sums: { best: number; total: number }, mark?: ResetMark): { best: number; total: number } => ({
  best: Math.max(0, sums.best - (mark?.best ?? 0)),
  total: Math.max(0, sums.total - (mark?.total ?? 0)),
});

/** What the saves hold now (read when Reset is confirmed). Whatever can't be read counts as nothing. */
export async function snapshotSaves(at = Date.now()): Promise<ResetMark> {
  const [{ huntStates }, { eggStates }, { loadScores, bestSum }, { allMineTables }] = await Promise.all([
    import('../tinHearts/tinHearts'),
    import('../eggs/eggState'),
    import('../scoreTrophies/scores'),
    import('./highScores'),
  ]);
  const hearts = (await huntStates().catch(() => [])).filter((s) => s.inSave).map((s) => s.id);
  const eggs = (await eggStates().catch(() => [])).filter((s) => s.inSave).map((s) => s.egg.game);
  const scores: ScoreRecord = await loadScores().catch(() => ({ best: {}, total: 0, plays: 0 }));
  const highScores = await allMineTables().catch(() => ({}));
  return { at, hearts, eggs, best: bestSum(scores), total: scores.total, highScores };
}
