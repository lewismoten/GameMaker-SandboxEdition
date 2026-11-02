// Per background block set: the blocks that look the same under every palette its scenes show
// (they can become one, with the maps renumbered), and blocks of one shape in other colors (a
// scene has one palette, so those stay). Reads only; lookAlikeFold.ts turns a group into a Step.
import { BACKBL, parseBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { findLookAlikes, type LookGroup, type LookResult } from '@lewismoten/gamemaker-sandbox-tools/look-alike';
import type { GameFiles } from '../../project/files';
import { shownPalettes } from './palettes';
import { filesIn, sceneUses, usersOf, type SceneUse } from './refs';
import { drawn } from './blockUse';

export interface LookSet extends LookResult {
  bbl: string;
  blocks: Block[];
  /** The palettes the set's scenes show, first one for previews. */
  palettes: Uint8Array[];
  /** The set's maps and how many cells draw each folded block. */
  maps: string[];
  cells: Map<number, number>;
  /** Why the set can't be looked at (an empty list of groups otherwise means nothing to fold). */
  skipped?: string;
}

/** Block numbers a character or inventory holds across scenes: they keep their number in every set. */
export function carriedBlocks(files: GameFiles, uses: SceneUse[]): Set<number> {
  const out = new Set<number>();
  for (const name of filesIn(uses, 'chr')) {
    try {
      const c = parseCharacter(files.get(name)!);
      for (const s of c.sequences) if (s.bloc < BACKBL) out.add(s.bloc);
      for (const n of c.inv) if (n < BACKBL) out.add(n);
    } catch {
      // an unreadable character file pins nothing; the Health check reports it
    }
  }
  return out;
}

export function lookAlikeSets(files: GameFiles, gam: string): LookSet[] {
  const uses = sceneUses(files, parseGame(files.get(gam)!));
  const carry = carriedBlocks(files, uses);
  return filesIn(uses, 'bbl').map((bbl): LookSet => {
    const mine = usersOf(uses, 'bbl', bbl);
    const blocks = parseBlocks(files.get(bbl)!, BACKBL);
    const maps = filesIn(mine, 'map');
    const none = (skipped: string): LookSet => ({
      bbl,
      blocks,
      palettes: [],
      maps,
      cells: new Map(),
      groups: [],
      pinnedGroups: [],
      colorVariants: [],
      skipped,
    });
    const palettes = shownPalettes(files, mine);
    if (!palettes) return none('a scene has no palette');
    const shared = maps.find((m) => usersOf(uses, 'map', m).some((u) => u.bbl !== bbl));
    if (shared) return none(`${shared} is also used with another block set`);
    if (!palettes.length) return none('every scene shows a one-color palette, so there are no colors to compare');
    const pinned = new Set<number>([0, ...carry, ...blocks.flatMap((b, i) => (b.obj ? [i] : []))]);
    const used = drawn(files, uses, bbl, blocks);
    const r = findLookAlikes({ blocks, palettes, used, pinned });
    const cells = new Map<number, number>();
    for (const m of maps) for (const v of parseMap(files.get(m)!).blocks) cells.set(v, (cells.get(v) ?? 0) + 1);
    return { bbl, blocks, palettes, maps, cells, ...r };
  });
}

export const foldedCount = (groups: LookGroup[]): number => groups.reduce((a, g) => a + g.fold.length, 0);
