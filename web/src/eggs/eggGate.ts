// How many felt eggs open what they unlock (the 13-egg bonus, the two eggs kept apart in bonus.ts):
// thirteen, however many games hide one. Every place that decides it asks here. No imports, so the
// catalog's secret check and the backup can use it without loading the eggs' lore.

/** Felt eggs needed: thirteen, though there may be more to find. */
export const EGGS_NEEDED = 13;

/** True once at least EGGS_NEEDED felt eggs count as found. */
export function eggsOpen(found: number): boolean {
  return found >= EGGS_NEEDED;
}

/** eggsOpen for a list of egg states (eggState.ts). */
export function eggsOpenFor(states: readonly { found: boolean }[]): boolean {
  return eggsOpen(states.filter((s) => s.found).length);
}
