// Two background block sets (.bbl, 150 blocks) whose scenes share a palette and whose drawn blocks
// fit in one file: the dropped file's blocks move into the kept file's blank slots (an identical
// block already there is reused; tools/block-merge), the dropped file's maps get the new block
// numbers, and its scenes open the kept file. The kept file is not renumbered. Blocks carried
// between scenes (pickups, required and starting items, block 0) must land on the same number.
import { BACKBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { mergeBackgroundSets } from '@lewismoten/gamemaker-sandbox-tools/block-merge';
import type { GameFiles } from '../../project/files';
import { shownPalettes, sharePalette } from './palettes';
import { carriedBlocks } from './lookAlikes';
import { commit, readFor, type Writes } from './commit';
import { filesIn, readGame, repoint, usersOf, type SceneUse } from './refs';
import { drawn } from './blockUse';
import type { Step } from './types';

/** Why two block sets can't merge, or the step that merges them. */
export function planBackgrounds(files: GameFiles, gam: string, uses: SceneUse[], keep: string, drop: string): Step | string {
  const before: Writes['before'] = new Map();
  const dBytes = readFor(files, before, drop);
  const K = parseBlocks(readFor(files, before, keep), BACKBL);
  const D = parseBlocks(dBytes, BACKBL);
  const kUsers = usersOf(uses, 'bbl', keep);
  const dUsers = usersOf(uses, 'bbl', drop);
  const kPals = shownPalettes(files, kUsers);
  const dPals = shownPalettes(files, dUsers);
  if (!kPals || !dPals) return 'a scene that uses one of them has no palette file';
  if (!sharePalette(kPals, dPals)) return 'their scenes have no palette in common';
  const dMaps = filesIn(dUsers, 'map');
  const shared = dMaps.find((m) => usersOf(uses, 'map', m).some((u) => u.bbl !== drop));
  if (shared) return `${shared} is also used with another block set`;
  const carry = carriedBlocks(files, uses);
  const pinOf = (blocks: typeof K) => new Set<number>([0, ...carry, ...blocks.flatMap((b, i) => (b.obj ? [i] : []))]);
  const kUsed = drawn(files, uses, keep, K);
  for (const i of pinOf(K)) kUsed.add(i);
  const dUsed = drawn(files, uses, drop, D);
  const dPinned = pinOf(D);
  const merged = mergeBackgroundSets({
    keep: K,
    drop: D,
    dropMaps: dMaps.map((m) => parseMap(readFor(files, before, m))),
    dropUsed: dUsed,
    dropPinned: new Set([...dPinned].filter((i) => dUsed.has(i))),
    keepUsed: kUsed,
  });
  if (typeof merged === 'string') return merged;
  const writes: Writes = { files: new Map(), before, game: readGame(files, gam) };
  writes.files.set(keep, serializeBlocks(merged.blocks));
  writes.files.set(drop, null);
  dMaps.forEach((m, i) => writes.files.set(m, serializeMap(merged.maps[i])));
  repoint(writes.game, files, 'bbl', drop, keep);
  const n = merged.fresh.length;
  return {
    kind: 'bbl',
    keep,
    drop,
    saves: dBytes.length,
    title: `Merge background blocks ${drop} into ${keep}`,
    changes: [
      `${n} block${n === 1 ? '' : 's'} move from ${drop} to ${keep}; ${dUsed.size - n} match one already there`,
      ...dMaps.map((m) => `${m}: block numbers follow`),
      `${dUsers.length} scene${dUsers.length === 1 ? '' : 's'} open ${keep} instead of ${drop}`,
    ],
    touches: [...writes.files.keys(), gam],
    moves: [{ file: drop, into: keep, at: merged.at }],
    apply: (f, g) => commit(f, g, writes),
  };
}
