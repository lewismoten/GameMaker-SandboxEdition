// The walks of the library's books, by block name: what games/brief/walkPaths.json lists
// (games/kit/walkPaths.ts) so the walkthrough's bot walks along them. Only the Backyard's book
// 15 (Mrs. Henderson's yard, KEEP OFF THE GRASS) has a street between lawns; every other page
// is one floor wall to wall, where every way is as good.
import type { Area } from './levels/area';

const WAYS: Record<string, string[]> = { yard: ['walk'] };

/** Block numbers of the walks, by .bbl name. */
export function walkPaths(wings: { spec: { wing: { id: string } }; area: Area }[]): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const w of wings) {
    const names = WAYS[w.spec.wing.id];
    if (names) out[`${w.area.file}.bbl`] = names.map((n) => w.area.tiles.id(n));
  }
  return out;
}
