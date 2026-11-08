// Explains the fixed DOS block-set capacities without trimming imported extended files.
import { BLOCK_COUNTS, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

export function blockCapacityText(kind: BlockKind, count: number): string {
  const name = { bbl: 'background', mbl: 'monster', cbl: 'hero' }[kind];
  const max = BLOCK_COUNTS[kind];
  const note = `DOS ${name} sets hold ${max} blocks; block files use one 64K piece of memory.`;
  return count > max ? `${note} This file has ${count} blocks; extra records are preserved, but DOS uses only the first ${max}.` : note;
}
