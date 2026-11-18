// Types for achievement categories, goals and badge entries.
import type { RepeatGoal } from './repeatGoals';
import type { Level } from './levels';

export type Category = 'making' | 'playing' | 'watching' | 'desk' | 'fun' | 'found';

/** What a derived total counts (goals.ts). */
export type Goal =
  | 'sandbox'
  | 'bizarre'
  | 'sandboxDone'
  | 'bizarreDone'
  | 'starters'
  | 'startersDone'
  | 'teddy'
  | 'walkthroughs'
  | 'hearts'
  | 'eggs'
  | 'playedCount'
  | 'finishedCount'
  | 'watchedCount'
  | RepeatGoal;

export interface Achievement {
  id: string;
  title: string;
  /** One line: what earned it. */
  desc: string;
  icon: string;
  category: Category;
  /** Shown as "???" with `hint` until unlocked. */
  hidden?: boolean;
  /** Said in place of `desc` once it is unlocked (a little more than it gives away before). */
  doneDesc?: string;
  /** For a hidden one: a vague nudge. */
  hint?: string;
  /** A fixed total (progress "n of `of`"). */
  of?: number;
  /** For a fixed total: the items that count (anything else kept is ignored). */
  items?: readonly string[];
  /** A total counted from the catalog. */
  from?: Goal;
  /** Repeat events required in each game for a catalog-wide goal. */
  times?: number;
  /** Where this sits in a leveled family (levels.ts); each level is an achievement of its own. */
  level?: Level;
  /** For a count goal (playedCount…): how many distinct games the record must hold. */
  count?: number;
  /** One of the genuinely difficult ones: once earned it gets a gold frame with a sheen. */
  hard?: boolean;
  /** The noun after the count: "3 of 8 editors". */
  unit?: string;
}
