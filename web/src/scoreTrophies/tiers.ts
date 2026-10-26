// The score trophies' tiers and what each needs, and EGG.EXE's overrides that show another tier
// than the one earned (kept in localStorage under OVERRIDES_KEY, never in the scores' record).
//
// Two trophies: 'best' from the games' best final scores added up, 'total' from every finished
// play's final score added up (scores.ts). Tier 0 is no trophy at all; 1 plastic, 2 bronze,
// 3 silver, 4 gold, 5 the gaudy tower. The thresholds come from the walkthroughs' final scores
// (the bot's clean run of each Sandbox and Bard of Bizarre game, October 2026): together about
// 516,000, the middle game near 10,500, the biggest two near 90,000 each.
//   best:  any points; about one whole game; a handful; most of them; and 450,000, about every
//          game finished near the bot's score (the CD's games count too, so there is slack).
//   total: the same steps longer, since every play counts (a lost life's game too): gaudy at
//          1,500,000 is about three clean passes through every game.

export type TrophyKind = 'best' | 'total';

export const TIER_NAMES = ['None', 'Plastic', 'Bronze', 'Silver', 'Gold', 'Gaudy'] as const;
export const TOP_TIER = TIER_NAMES.length - 1;

/** The least points for tiers 1 .. 5 of each trophy. */
export const THRESHOLDS: Record<TrophyKind, readonly number[]> = {
  best: [1, 10_000, 50_000, 200_000, 450_000],
  total: [1, 25_000, 150_000, 600_000, 1_500_000],
};

export const TROPHY_NAMES: Record<TrophyKind, string> = { best: 'best-scores trophy', total: 'total-score trophy' };

/** The tier `points` earn. */
export function tierOf(kind: TrophyKind, points: number): number {
  const t = THRESHOLDS[kind];
  let n = 0;
  while (n < t.length && points >= t[n]) n++;
  return n;
}

/** The next tier up and the points it needs (undefined at the top). */
export function nextTier(kind: TrophyKind, points: number): { tier: number; needs: number; at: number } | undefined {
  const tier = tierOf(kind, points);
  if (tier >= TOP_TIER) return undefined;
  const at = THRESHOLDS[kind][tier];
  return { tier: tier + 1, needs: at - points, at };
}

export const OVERRIDES_KEY = 'gm-score-trophies';
/** Fired on window when EGG.EXE changes an override. */
export const TROPHY_OVERRIDES_CHANGED = 'gm-score-trophies-changed';

export function readTrophyOverrides(): Partial<Record<TrophyKind, number>> {
  try {
    const o = JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? '{}');
    const r: Partial<Record<TrophyKind, number>> = {};
    for (const k of ['best', 'total'] as const) if (Number.isInteger(o?.[k]) && o[k] >= 0 && o[k] <= TOP_TIER) r[k] = o[k];
    return r;
  } catch {
    return {};
  }
}

/** Shows `tier` on a trophy whatever was earned, or (undefined) the earned tier again. */
export function setTrophyOverride(kind: TrophyKind, tier: number | undefined): void {
  const o = readTrophyOverrides();
  if (tier === undefined) delete o[kind];
  else o[kind] = Math.max(0, Math.min(TOP_TIER, Math.round(tier)));
  try {
    if (Object.keys(o).length) localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
    else localStorage.removeItem(OVERRIDES_KEY);
  } catch {
    /* private mode */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TROPHY_OVERRIDES_CHANGED));
}

/** EGG.EXE's X Reset all: both trophies back to the tier earned. */
export function resetTrophyOverrides(): void {
  try {
    localStorage.removeItem(OVERRIDES_KEY);
  } catch {
    /* private mode */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TROPHY_OVERRIDES_CHANGED));
}

/** The tier a trophy shows: EGG.EXE's choice, or the one earned. */
export const shownTier = (kind: TrophyKind, points: number, o = readTrophyOverrides()): number => o[kind] ?? tierOf(kind, points);
