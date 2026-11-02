// Not PLAYGAME's: the points a play scored itself, for the desk's cumulative score trophy.
// F6 puts the saved game's score in place, and those points were scored by the play that made
// the save (already counted when it ended, or still to count in this play's earlier stretch).
// So each load closes a stretch: its gain (never below 0) is banked, and the loaded score is
// the next stretch's start. The final score itself is untouched, as the high score table sees it.

export interface PlayGain {
  /** Points from the stretches F6 closed. */
  banked: number;
  /** The score the current stretch started from (0, or the score a load put in place). */
  base: number;
}

export const newPlayGain = (): PlayGain => ({ banked: 0, base: 0 });

/** F6 loaded a save: the score went from `before` to the save's `after`. */
export function gainAtLoad(g: PlayGain, before: number, after: number): void {
  g.banked += Math.max(0, before - g.base);
  g.base = after;
}

/** The points this play scored, ending on `score`. */
export const gainAtEnd = (g: PlayGain, score: number): number => g.banked + Math.max(0, score - g.base);
