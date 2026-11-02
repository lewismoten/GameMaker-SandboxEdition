// Background block sets (.bbl, 150 blocks) whose maps draw few enough blocks, in colors that agree
// under every palette their scenes show, to share one file. Reported only: joining them
// renumbers every map cell, so the tool leaves that to the author (the notes say which).
import { BACKBL, parseBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { GameFiles } from '../../project/files';
import { sharePalette, shownPalettes } from './palettes';
import { filesIn, sceneUses, usersOf, type SceneUse } from './refs';
import type { Note } from './types';

/** The blocks a set's maps draw, and what they follow through "becomes" links. */
export function drawn(files: GameFiles, uses: SceneUse[], bbl: string, blocks: Block[]): Set<number> {
  const used = new Set<number>();
  for (const map of filesIn(usersOf(uses, 'bbl', bbl), 'map')) for (const cell of parseMap(files.get(map)!).blocks) used.add(cell);
  for (const i of [...used]) {
    for (let n = blocks[i]?.nextBl, guard = 0; n !== undefined && !used.has(n) && n < BACKBL && guard < BACKBL; guard++, n = blocks[n]?.nextBl) used.add(n);
    const t = blocks[i]?.touchBl;
    if (t !== undefined && t < BACKBL) used.add(t);
  }
  return used;
}

export function mergeBackgroundNotes(files: GameFiles, gam: string): Note[] {
  const uses = sceneUses(files, parseGame(files.get(gam)!));
  const sets = filesIn(uses, 'bbl').map((name) => {
    const blocks = parseBlocks(files.get(name)!, BACKBL);
    return { name, blocks, used: drawn(files, uses, name, blocks) };
  });
  const notes: Note[] = [];
  for (let a = 0; a < sets.length; a++)
    for (let b = a + 1; b < sets.length; b++) {
      const [x, y] = [sets[a], sets[b]];
      if (x.used.size + y.used.size > BACKBL) continue;
      const px = shownPalettes(files, usersOf(uses, 'bbl', x.name));
      const py = shownPalettes(files, usersOf(uses, 'bbl', y.name));
      if (px && py && sharePalette(px, py))
        notes.push({
          kind: 'bbl',
          title: `${x.name} and ${y.name} could share one file`,
          why: `their maps draw ${x.used.size} and ${y.used.size} of 150 blocks and share a palette; joining them renumbers the maps, so do it in the block editor if you want the space`,
        });
    }
  return notes;
}
