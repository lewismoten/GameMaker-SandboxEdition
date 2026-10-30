// Names explain native meter numbers in the editor; only the companion file stores them.
import type { Project } from '../../core/project';

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

/** Returns a fresh metadata object; a blank name clears the label. */
export function withCounterName(value: unknown, meter: number, name: string): CounterNames {
  if (!Number.isInteger(meter) || meter < 5 || meter > 24) throw new RangeError('Only repetition and hidden-tally counters can be named');
  const names = readCounterNames(value);
  const clean = name.trim().slice(0, 80);
  if (clean) names[meter] = clean;
  else delete names[meter];
  return names;
}

export function counterName(project: Pick<Project, 'extras'>, file: string, meter: number): string {
  return readCounterNames(project.extras<unknown>(file, COUNTER_NAMES, undefined))[meter] ?? '';
}
