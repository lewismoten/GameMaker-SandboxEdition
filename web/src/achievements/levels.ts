// Leveled achievements: one counter, several goals. Each level is its own achievement (so each counts in
// the totals and the tab counts), earned in order as the count rises; a level's image changes in shape
// (the plate and its pips) and lightness as well as color. The every-life, every-loss and every-win tiers
// (1, 3, 10 in each listed game) keep their stored ids as levels 1 to 3.
import type { Achievement } from './catalog';

/** Where a level sits in its family: `n` of `of`, counting from 1. */
export interface Level {
  family: string;
  n: number;
  of: number;
}

/** The counters that level up by a plain number of games: the record's set that is counted, and the goals. */
export const COUNT_LEVELS = {
  'games-played': { set: 'played', goals: [3, 10, 20] },
  'games-finished': { set: 'finished', goals: [3, 10, 20] },
  'walks-watched': { set: 'watched', goals: [3, 10, 20] },
} as const;

export type CountFamily = keyof typeof COUNT_LEVELS;

/** The levels of `a`'s family in order, or just `a` when it isn't leveled. */
export function levelsOf(a: Achievement, all: readonly Achievement[]): Achievement[] {
  if (!a.level) return [a];
  return all.filter((x) => x.level?.family === a.level!.family).sort((x, y) => x.level!.n - y.level!.n);
}

/** The highest level earned in a's family (0 when none), and the next level to earn (undefined at the top). */
export function levelStanding(a: Achievement, all: readonly Achievement[], unlocked: Record<string, number>): { current: number; next?: Achievement } {
  const fam = levelsOf(a, all);
  const earned = fam.filter((x) => unlocked[x.id]);
  return { current: earned.length ? Math.max(...earned.map((x) => x.level!.n)) : 0, next: fam.find((x) => !unlocked[x.id]) };
}
