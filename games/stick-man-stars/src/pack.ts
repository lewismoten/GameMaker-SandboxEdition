// The four levels share one 100x100 world, WORLD.MAP: each in its own 25-row band (rows 25 i to 25 i + 24),
// stacked one over the next. A band is eight sky rows, the level's fifteen rows (a brick ceiling, the ground,
// the brick walls at both ends) and two dirt rows under it. The screen is 10 blocks high with his feet 6 down,
// so it never shows past the ceiling by more than the eight sky rows or under the ground by more than the dirt:
// a neighbor's band is never on screen. PLAYGAME wraps the map at its edges, so the top band's sky meets the
// bottom band's dirt; each level's ground and walls carry on to the side edges as before.
import { MLEN, reindexMonsters, newMap, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN } from '../../kit/starter/map';
import type { Level } from './levels';

export const BAND = 25;
/** The first row of a level's own 100x100 map that its band keeps (eight sky rows over its ceiling). */
const FIRST = ORIGIN - 8;

/** How far down level `i`'s blocks move from where its own map had them. */
export const shiftY = (i: number): number => i * BAND - FIRST;
/** The shared map's name on the disk. */
export const WORLD = 'world';

/** A level's block position in the shared world. */
export const inWorld = (i: number, p: [number, number]): [number, number] => [p[0], p[1] + shiftY(i)];

/** Every level's band in one map. */
export function packLevels(levels: Level[]): GameMap {
  const out = newMap();
  let n = 0;
  levels.forEach((l, i) => {
    const m = l.map.done();
    for (let y = 0; y < BAND; y++) {
      const from = (y + FIRST) * MLEN;
      out.blocks.set(m.blocks.subarray(from, from + MLEN), (i * BAND + y) * MLEN);
    }
    for (const p of m.monsters) {
      if (p.monnum >= 64) continue;
      if (n >= out.monsters.length) throw new Error('Too many monsters for one world');
      out.monsters[n++] = { ...p, cury: p.cury + shiftY(i) };
    }
  });
  reindexMonsters(out);
  return out;
}
