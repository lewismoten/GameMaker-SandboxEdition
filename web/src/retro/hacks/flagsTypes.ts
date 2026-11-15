// What a FLAGS item is, and the plain error a mistake in its words becomes. Shared by flagsItems.ts
// and flagsDesk.ts, kept apart so neither imports the other.
export class FlagError extends Error {}

export interface FlagItem {
  id: string;
  /** What it is, in a few words (the help's list). */
  label: string;
  /** The current value in a few words; undefined hides the row until it applies. */
  show: () => Promise<string | undefined>;
  /** SET <id> <words...>; omitted when the state can only come from play. */
  set?: (words: string[]) => Promise<string>;
  /** CLEAR <id> <words...>. */
  clear?: (words: string[]) => Promise<string>;
  /** RESET <id>: back to the way a new visitor has it. */
  reset?: () => Promise<string>;
  /** Plain words for what to use instead when an action isn't offered. */
  elsewhere?: string;
}
