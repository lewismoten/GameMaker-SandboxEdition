// Course grades for the Starters, like a school transcript: every Starter is a course, and the best way a
// player has ever done in it is its grade. A retake can only raise it. Pure rules, no DOM; ceremonies.ts
// numbers the courses and adds the stages and the GPA, and the site's recorder feeds `Run` from the player.
//
//   A   finished it (the Game Won scene)         C+  reached a middle level, nearer the start
//   B   reached the last level                   C   started and moved
//   B-  reached a middle level, nearer the end   C-  started, never moved
//   D+  lost a life and never got past level 1   (none)  never played

export type Grade = 'A' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+';

/** Best first. */
export const GRADES: readonly Grade[] = ['A', 'B', 'B-', 'C+', 'C', 'C-', 'D+'];

/** The usual 4.0 scale. */
export const POINTS: Record<Grade, number> = { A: 4, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3 };

/** One play of a Starter, as far as the player has got. */
export interface Run {
  /** The furthest level entered, from 1 (0: the game was opened but no level entered). */
  furthest: number;
  /** The hero moved at least once. */
  moved: boolean;
  /** Lives lost before leaving level 1. */
  deaths1: number;
  /** The Game Won scene was reached. */
  won: boolean;
}

/** The grade a run earns in a game of `levels` levels, or undefined when it was not played. */
export function gradeOfRun(run: Run, levels: number): Grade | undefined {
  if (run.won) return 'A';
  if (run.furthest < 1) return undefined;
  if (levels > 1 && run.furthest >= levels) return 'B';
  if (run.furthest > 1) return (run.furthest - 1) / (levels - 1) >= 0.5 ? 'B-' : 'C+';
  if (run.deaths1 > 0) return 'D+';
  return run.moved ? 'C' : 'C-';
}

/** The better of two grades (either may be missing). */
export function betterGrade(a: Grade | undefined, b: Grade | undefined): Grade | undefined {
  if (!a || !b) return a ?? b;
  return POINTS[a] >= POINTS[b] ? a : b;
}

/** The best grade of every Starter the player has earned one in, by game id. */
export type Grades = Record<string, Grade>;

/** A new record with `run` counted: the grade only ever goes up. */
export function recordRun(grades: Readonly<Grades>, id: string, run: Run, levels: number): Grades {
  const best = betterGrade(grades[id], gradeOfRun(run, levels));
  return best && best !== grades[id] ? { ...grades, [id]: best } : { ...grades };
}

/** The recorded grades with an A for every game in the finished set (a Done mark from before grades, or one the recorder missed). */
export function withFinished(grades: Readonly<Grades>, finished: ReadonlySet<string>): Grades {
  const out = { ...grades };
  for (const id of finished) out[id] = 'A';
  return out;
}

/** The grade point average of the graded courses (ungraded ones are left out), to two places, or undefined when none is graded. */
export function gpa(list: readonly (Grade | undefined)[]): number | undefined {
  const g = list.filter((x): x is Grade => !!x);
  if (!g.length) return undefined;
  return Math.round((g.reduce((s, x) => s + POINTS[x], 0) / g.length) * 100) / 100;
}

/** Whether a grade is a B or better. */
export const isB = (g: Grade | undefined): boolean => !!g && POINTS[g] >= POINTS.B;

/** Reads a saved record, dropping anything that is not a grade. */
export function parseGrades(raw: unknown): Grades {
  const out: Grades = {};
  if (raw && typeof raw === 'object')
    for (const [id, g] of Object.entries(raw as Record<string, unknown>)) if (GRADES.includes(g as Grade)) out[id] = g as Grade;
  return out;
}
