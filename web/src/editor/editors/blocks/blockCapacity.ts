// Explains the fixed DOS block-set capacities without trimming imported extended files.
import { BLOCK_COUNTS, BLOCK_SIZE, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

export function blockCapacityText(kind: BlockKind, byteLength: number): string {
  const name = { bbl: 'background', mbl: 'monster', cbl: 'hero' }[kind];
  const max = BLOCK_COUNTS[kind];
  const note = `DOS ${name} sets hold ${max} blocks; block files use one 64K piece of memory.`;
  const count = Math.floor(byteLength / BLOCK_SIZE);
  const remainder = byteLength % BLOCK_SIZE;
  if (remainder) {
    const detail = `This file has ${count} complete ${count === 1 ? 'block' : 'blocks'} and ${remainder} trailing ${remainder === 1 ? 'byte' : 'bytes'}.`;
    return count > max ? `${note} ${detail} Extra records are preserved, but DOS uses only the first ${max}.` : `${note} ${detail}`;
  }
  return count > max ? `${note} This file has ${count} blocks; extra records are preserved, but DOS uses only the first ${max}.` : note;
}
