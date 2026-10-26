// The sidewalks of each block set, by block name: what games/year2000/walkPaths.json lists
// (games/kit/walkPaths.ts) so the walkthrough's bot walks along them: the dome's sidewalks and
// the skyway's decks. The roads and lanes carry traffic, so they are left off (Dex crosses
// them, as a person does). The mall, the exchange and the school are floored wall to wall,
// and the moon's walkways are conveyors, so those sets have none.
import type { BlockSet } from './blocks/book';

const WAYS: Record<string, RegExp> = {
  suburb: /^(sidewalk|deck|[a-z]+_(sidewalk|deck))$/,
};

/** Block numbers of the walks, by .bbl name. */
export function walkPaths(sets: Record<string, BlockSet>): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [k, re] of Object.entries(WAYS)) out[`${k}.bbl`] = sets[k].names.flatMap((n, i) => (n && re.test(n) ? [i] : []));
  return out;
}
