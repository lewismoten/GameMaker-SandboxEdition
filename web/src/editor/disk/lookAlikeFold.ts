// Blocks that look the same (lookAlikes.ts) as an applied step: in one background set, each group of
// blocks drawn alike under every palette the set is shown with, with the same rules, becomes its first
// block (a pickup or carried block keeps its number), the set's maps and "becomes" links follow, and the
// freed slots go blank. No scene draws differently. It saves no bytes itself (a .bbl is a fixed size);
// it frees slots so two block sets can join.
import { BACKBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { applyFold } from '@lewismoten/gamemaker-sandbox-tools/look-alike';
import type { GameFiles } from '../../project/files';
import { commit, readFor, type Writes } from './commit';
import { foldedCount, lookAlikeSets } from './lookAlikes';
import { readGame, type SceneUse } from './refs';
import type { Step } from './types';

/** The first block set with blocks to fold, as a step, or undefined. */
export function planLookAlikes(files: GameFiles, gam: string, _uses: SceneUse[]): Step | undefined {
  for (const set of lookAlikeSets(files, gam)) {
    if (!set.groups.length) continue;
    const before: Writes['before'] = new Map();
    const blocks = parseBlocks(readFor(files, before, set.bbl), BACKBL);
    const maps = set.maps.map((m) => parseMap(readFor(files, before, m)));
    const r = applyFold(blocks, maps, set.groups);
    const writes: Writes = { files: new Map(), before, game: readGame(files, gam) };
    writes.files.set(set.bbl, serializeBlocks(r.blocks));
    set.maps.forEach((m, i) => writes.files.set(m, serializeMap(r.maps[i])));
    const n = foldedCount(set.groups);
    const cells = set.groups.reduce((a, g) => a + g.fold.reduce((b, f) => b + (set.cells.get(f) ?? 0), 0), 0);
    return {
      kind: 'look',
      keep: set.bbl,
      drop: '',
      saves: 0,
      title: `Join ${n} block${n === 1 ? '' : 's'} in ${set.bbl} that look the same as another`,
      changes: [
        ...set.groups.map((g) => `Block${g.fold.length === 1 ? '' : 's'} ${g.fold.join(', ')} become${g.fold.length === 1 ? 's' : ''} block ${g.keep}`),
        `${cells} map cell${cells === 1 ? '' : 's'} in ${set.maps.join(', ')} follow`,
        `${n} slot${n === 1 ? '' : 's'} in ${set.bbl} become blank, so another block set can use them`,
      ],
      touches: [...writes.files.keys(), gam],
      moves: [{ file: set.bbl, into: set.bbl, at: new Map(r.to.flatMap((t, i) => (t === i ? [] : [[i, t] as [number, number]]))) }],
      apply: (f, g) => commit(f, g, writes),
    };
  }
  return undefined;
}
