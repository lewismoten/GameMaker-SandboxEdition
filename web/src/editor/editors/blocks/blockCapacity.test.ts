import { describe, expect, it } from 'vitest';
import { BLOCK_COUNTS, BLOCK_SIZE, emptyBlock, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { blockCapacityText } from './blockCapacity';

describe('DOS block-set capacity explanation', () => {
  it('reports one trailing byte separately from complete background blocks', () => {
    const count = BLOCK_COUNTS.bbl;
    const bytes = new Uint8Array(count * BLOCK_SIZE + 1);
    const parsed = parseBlocks(bytes, Math.ceil(bytes.length / BLOCK_SIZE));
    const text = blockCapacityText('bbl', bytes.length);
    expect(text).toContain(`${count} complete blocks and 1 trailing byte.`);
    expect(text).not.toContain('extra records');
    expect(serializeBlocks(parsed)).toHaveLength((count + 1) * BLOCK_SIZE);
  });

  for (const [kind, name] of [
    ['bbl', 'background'],
    ['mbl', 'monster'],
    ['cbl', 'hero'],
  ] as const)
    for (const offset of [-1, 0, 1])
      it(`${kind}: explains capacity with ${offset < 0 ? 'below-limit' : offset ? 'over-limit' : 'exact-limit'} records without changing serialization`, () => {
        const max = BLOCK_COUNTS[kind];
        const blocks = Array.from({ length: max + offset }, (_, i) => {
          const block = emptyBlock(0, kind !== 'bbl');
          block.pixels[0] = i;
          return block;
        });
        const bytes = serializeBlocks(blocks);
        const parsed = parseBlocks(bytes, Math.max(max, Math.ceil(bytes.length / BLOCK_SIZE)));
        const before = serializeBlocks(parsed);
        const text = blockCapacityText(kind, bytes.length);
        const after = serializeBlocks(parsed);
        expect(text).toContain(`DOS ${name} sets hold ${max} blocks`);
        expect(text).toContain('one 64K piece of memory');
        if (offset > 0) {
          expect(text).toContain(`This file has ${max + 1} blocks`);
          expect(text).toContain(`DOS uses only the first ${max}`);
          expect(text).toContain('extra records are preserved');
          expect(Buffer.compare(after, bytes)).toBe(0);
        } else expect(text).not.toContain('extra records');
        expect(Buffer.compare(after, before)).toBe(0);
        expect(parsed).toHaveLength(Math.max(max, max + offset));
      });
});
