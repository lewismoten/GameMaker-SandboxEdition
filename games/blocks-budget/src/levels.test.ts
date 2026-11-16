// The shared signs count their own allocated background blocks, including the count board.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BACKBL, BLOCK_SIZE, emptyBlock, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { buildLevels } from './levels';

describe('150 Blocks tiled signs', () => {
  it('shares centered posts and both halves across both levels', () => {
    const { book } = buildLevels();
    expect([...book.index.keys()].filter((name) => name.startsWith('microPlaque.post')).sort()).toEqual([
      'microPlaque.post',
      'microPlaque.post-left',
      'microPlaque.post-right',
    ]);
    expect([...book.index.keys()].some((name) => name.endsWith('.legL') || name.endsWith('.legR'))).toBe(false);
  });

  it('counts the final allocated block set, itself included', () => {
    const { book, counts } = buildLevels();
    expect(counts.used).toBe(book.index.size);
  });

  it('matches the count sign to the populated slots of the built disk', () => {
    const { book, counts } = buildLevels();
    const disk = readFileSync(new URL('../disk/blocks.bbl', import.meta.url));
    expect(disk.byteLength).toBe(BACKBL * BLOCK_SIZE);
    let populated = 0;
    for (let i = 0; i < BACKBL; i++) {
      const slot = disk.subarray(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE);
      if (!slot.equals(Buffer.from(serializeBlocks([emptyBlock(i)])))) populated++;
    }
    expect(populated).toBe(counts.used);
    expect(disk.equals(Buffer.from(serializeBlocks(book.finish())))).toBe(true);
  });
});
