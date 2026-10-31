// Where each counter is used in a game, for Overview › Controls: which characters count it
// (a repetition counter limits a sequence; a hidden counter has a start value) and how many
// blocks change it. Read from the game's files; a damaged file is skipped.
import { BLOCK_COUNTS, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, METERS, parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { Project } from '../core/project';

export interface CounterUse {
  /** Characters that count it: "HERO.CHR" for a hidden counter, "HERO.CHR (sequence 7)" for a repetition counter. */
  characters: string[];
  /** Block files with blocks that change it: "FOREST.BBL: 3 blocks". */
  blocks: string[];
}

export function counterUses(project: Pick<Project, 'files'>): Map<number, CounterUse> {
  const uses = new Map<number, CounterUse>();
  const at = (meter: number) => uses.get(meter) ?? (uses.set(meter, { characters: [], blocks: [] }), uses.get(meter)!);
  for (const file of project.files.names()) {
    const ext = file.slice(file.lastIndexOf('.') + 1).toLowerCase();
    const bytes = project.files.get(file);
    if (!bytes) continue;
    try {
      if (ext === 'chr') {
        const chr = parseCharacter(bytes);
        for (let m = 5; m < METERS; m++)
          if (chr.meter[m] !== INF_REPEAT) at(m).characters.push(m < 20 ? `${file.toUpperCase()} (sequence ${m})` : file.toUpperCase());
      } else if (ext === 'bbl' || ext === 'mbl' || ext === 'cbl') {
        const counts = new Map<number, number>();
        for (const b of parseBlocks(bytes, BLOCK_COUNTS[ext])) if (b.effect >= 5 && b.effect < METERS) counts.set(b.effect, (counts.get(b.effect) ?? 0) + 1);
        for (const [m, n] of counts) at(m).blocks.push(`${file.toUpperCase()}: ${n} block${n === 1 ? '' : 's'}`);
      }
    } catch {
      /* a damaged file has no uses to show */
    }
  }
  return uses;
}
