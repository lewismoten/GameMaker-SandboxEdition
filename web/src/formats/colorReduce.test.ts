import { describe, expect, it } from 'vitest';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { reduceBlocks } from '@lewismoten/gamemaker-sandbox-tools/color-reduce';

const pal = () => {
  const p = new Uint8Array(768);
  const set = (i: number, r: number, g: number, b: number) => p.set([r, g, b], i * 3);
  set(10, 63, 0, 0); // red, allowed
  set(11, 0, 63, 0); // green, allowed
  set(20, 60, 4, 4); // near red, not allowed
  set(21, 0, 0, 63); // blue, not allowed
  return p;
};

describe('color reduction', () => {
  it('moves disallowed colors to the nearest allowed one and scores the change', () => {
    const b = emptyBlock(0);
    b.pixels = new Uint8Array(400).fill(10);
    b.pixels[0] = 20;
    b.pixels[1] = 21;
    b.pixels[2] = 255;
    const r = reduceBlocks([b], [0], [pal()], new Set([10, 11]));
    const px = r.changed.get(0)!;
    expect(px[0]).toBe(10); // near red went to red
    expect(px[2]).toBe(255); // transparent stays
    expect(r.moves.get(21)).toBeDefined();
    expect(r.score.worst).toBeGreaterThan(20); // blue to red or green is a big jump
    expect(r.score.flagged).toEqual([0]);
  });
  it('leaves a block that already conforms alone', () => {
    const b = emptyBlock(0);
    b.pixels = new Uint8Array(400).fill(11);
    expect(reduceBlocks([b], [0], [pal()], new Set([10, 11])).changed.size).toBe(0);
  });
});
