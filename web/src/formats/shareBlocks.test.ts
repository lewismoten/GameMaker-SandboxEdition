// kit/shareBlocks: scenes' block sets as one, duplicates merged, unused blocks dropped, a
// pinned number kept, and every map still showing the same pictures.
import { describe, expect, it } from 'vitest';
import { shareBlocks } from '@lewismoten/gamemaker-sandbox-tools/kit/shareBlocks';
import { emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

const block = (i: number, color: number, next = i, touch = i): Block => ({
  ...emptyBlock(i),
  pixels: new Uint8Array(400).fill(color),
  nextBl: next,
  touchBl: touch,
});

function scene(blocks: Block[], cells: number[]) {
  const set = Array.from({ length: 150 }, (_, i) => blocks[i] ?? emptyBlock(i));
  const map = newMap();
  map.blocks.fill(0);
  cells.forEach((v, i) => (map.blocks[i] = v));
  return { blocks: set, map };
}

describe('shareBlocks', () => {
  it('merges matching blocks and rings, drops unused ones and keeps pinned numbers', () => {
    // scene A: sky 0, a two-frame ring 1<->2, unused 3, an egg at 149
    const a = scene([block(0, 9), block(1, 5, 2), block(2, 6, 1), block(3, 7)], [0, 1, 149]);
    a.blocks[149] = block(149, 4);
    // scene B: the same sky and ring at other numbers, plus a block of its own
    const b = scene([block(0, 9), block(1, 8), block(2, 5, 3), block(3, 6, 2)], [0, 1, 2]);
    const s = shareBlocks([a, b], [149]);
    const pics = (m: (typeof s.maps)[number], k: number) => s.blocks[m.blocks[k]].pixels[0];
    expect([0, 1, 2].map((k) => pics(s.maps[0], k))).toEqual([9, 5, 4]);
    expect([0, 1, 2].map((k) => pics(s.maps[1], k))).toEqual([9, 8, 5]);
    expect(s.numbers[0][149]).toBe(149);
    expect(s.numbers[0][3]).toBe(-1);
    // the ring is one ring in both scenes
    expect(s.numbers[1][2]).toBe(s.numbers[0][1]);
    expect(s.blocks[s.numbers[0][1]].nextBl).toBe(s.numbers[0][2]);
    expect(s.blocks[s.numbers[0][2]].nextBl).toBe(s.numbers[0][1]);
    // used: sky, ring of two, egg, B's own block
    expect(new Set([...s.numbers[0], ...s.numbers[1]].filter((n) => n >= 0)).size).toBe(5);
  });

  it('refuses more than 150 used blocks', () => {
    const many = (base: number) =>
      scene(
        Array.from({ length: 100 }, (_, i) => block(i, base + i)),
        Array.from({ length: 100 }, (_, i) => i),
      );
    expect(() => shareBlocks([many(0), many(100)])).toThrow(/more than 150/);
  });
});
