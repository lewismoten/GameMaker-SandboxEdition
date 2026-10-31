// Names explain native meter numbers in the editor; only the companion file stores them (game-wide: core/gameControls.ts).

/** The older per-character section, only read to move its names to the game-wide ones. */
export const COUNTER_NAMES = 'counterNames';
export type CounterNames = Record<string, string>;

/** Fifteen sequence-use meters (5–19) and five hidden tallies (20–24) have designer names. */
export function readCounterNames(value: unknown): CounterNames {
  const names: CounterNames = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return names;
  for (const [key, name] of Object.entries(value))
    if (/^(?:[5-9]|1[0-9]|2[0-4])$/.test(key) && typeof name === 'string' && name.trim()) names[key] = name.trim().slice(0, 80);
  return names;
}

/** Keep native option numbers, adding the game-wide name of each counter that has one. */
export function namedCounterOptions(options: readonly [number, string][], names: CounterNames): [number, string][] {
  return options.map(([meter, label]) => [meter, names[meter] ? `${label}: ${names[meter]}` : label]);
}
