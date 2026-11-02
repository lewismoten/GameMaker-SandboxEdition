// Repeated-play tiers and progress: each listed game must reach the chosen event count.
export const REPEAT_TIERS = [1, 3, 10] as const;
export type PlayOutcome = 'life' | 'lost' | 'won';
export type RepeatGoal = 'everyLife' | 'everyLoss' | 'everyWin';
export const REPEAT_SETS: Record<RepeatGoal, PlayOutcome> = { everyLife: 'life', everyLoss: 'lost', everyWin: 'won' };

export function repeatProgress(targets: readonly string[], sets: Record<string, string[]>, event: PlayOutcome, times: number): { n: number; of: number } {
  return { n: targets.filter((id) => new Set(sets[`${event}:${id}`] ?? []).size >= times).length, of: targets.length };
}
