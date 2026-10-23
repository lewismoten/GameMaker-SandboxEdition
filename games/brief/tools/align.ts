// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the numbered
// parts of signs, banners, tables and props (read off the maps: wherever part n stands with
// part n+1 beside or under it, every n and n+1 must), the water cooler, the stamp-desk sign,
// and that their art joins up across the block edges. Run by tools/check.ts.
import { alignGame, autoParts, diskScenes, pair, shape, type PartRule } from '../../kit/align';
import { MLEN } from '../../../web/src/formats/map';
import { compileAll } from '../src/compile';

/** Joins drawn as edges on purpose (looked at): the water cooler's counter over its panel, the
 * cloning machine's halves, a banner's lettering. */
const SEAM_OK = ['wc10099/wc11', 'wc20099/wc21', 'wc11|wc21', 'clone0|clone1', 'clone2|clone3', 'ranger1|ranger2'];

export function align(): number {
  const { hub, wings } = compileAll();
  const names = new Map([hub.area, ...wings.map((w) => w.area)].map((a) => [`${a.file}.map`, a.tiles.names]));
  const maps = diskScenes(new URL('../disk', import.meta.url).pathname).filter((s) => names.has(s.map.toLowerCase()));
  const ats = maps.map((s) => (x: number, y: number) => names.get(s.map.toLowerCase())![s.blocks[y * MLEN + x]]);
  const RULES: PartRule[] = [
    // (the street's buildings and the crowd's kids are patterns, not objects)
    ...autoParts(ats, [...names.values()].flat().filter(Boolean), /^(bldg|kids)$/),
    ...pair('table', 'tableL', 'tableR', 1, 0),
    ...pair('couch', 'couchL', 'couchR', 1, 0),
    ...pair('Bob', 'bobTop', 'bobBot', 0, 1),
    ...shape('water cooler', [[/^wc00/, /^wc10/, /^wc20/, 'wc30'], ['wc01', 'wc11', 'wc21', 'wc31']]),
  ];
  return alignGame('brief', (m) => names.get(m), RULES, { seamOk: SEAM_OK });
}
