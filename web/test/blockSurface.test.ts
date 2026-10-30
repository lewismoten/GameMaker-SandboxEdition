// Group strokes share native tile pixels, skip holes, and preserve every behavior field.
import { describe, expect, it } from 'vitest';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels, floodFill, turn90 } from '@lewismoten/gamemaker-sandbox-tools/images';
import { BlockSurface } from '../src/editor/editors/blocks/blockSurface';

describe('native group painting surface', () => {
  it('paints a repeated tile from either cell and never paints through a hole', () => {
    const blocks = [emptyBlock(0), emptyBlock(1)];
    const s = new BlockSurface(blocks, 0, { name: 'Sign', cols: 3, rows: 1, cells: [0, -1, 0] });
    const pixels = s.read();
    s.plot(pixels, 43, 2, 9);
    expect(pixels[2 * 60 + 3]).toBe(9);
    expect(pixels[2 * 60 + 43]).toBe(9);
    expect(s.address(23, 2)).toBeUndefined();
    expect(s.address(3, 2)).toBe(s.address(43, 2));
    s.plot(pixels, 23, 2, 10);
    expect(pixels[2 * 60 + 23]).toBe(0);
    expect(s.write(pixels)).toEqual([0]);
    expect(blocks[0].pixels[43]).toBe(9);
    expect(blocks[1].pixels.some(Boolean)).toBe(false);
  });
  it('fills connected areas despite shared writes, with holes as real barriers', () => {
    const blocks = [emptyBlock(0), emptyBlock(1)];
    const s = new BlockSurface(blocks, 0, { name: 'Repeats', cols: 3, rows: 1, cells: [0, 0, 1] });
    const px = s.read();
    floodFill(
      px,
      s.width,
      s.height,
      0,
      0,
      7,
      (x, y) => s.address(x, y) !== undefined,
      (x, y, v) => s.plot(px, x, y, v),
    );
    s.write(px);
    expect(blocks.every((b) => b.pixels.every((v) => v === 7))).toBe(true);
    blocks.forEach((b) => b.pixels.fill(0));
    const holes = new BlockSurface(blocks, 0, { name: 'Gap', cols: 3, rows: 1, cells: [0, -1, 1] });
    const gap = holes.read();
    floodFill(
      gap,
      holes.width,
      holes.height,
      0,
      0,
      8,
      (x, y) => holes.address(x, y) !== undefined,
      (x, y, v) => holes.plot(gap, x, y, v),
    );
    holes.write(gap);
    expect(blocks[0].pixels.every((v) => v === 8)).toBe(true);
    expect(blocks[1].pixels.some(Boolean)).toBe(false);
  });
  it('turns a rectangular group including its holes without changing native block behavior', () => {
    const blocks = [emptyBlock(0), emptyBlock(1)];
    blocks[0].pixels[0] = 3;
    blocks[1].pixels[399] = 4;
    blocks[0].scorePts = 123;
    const s = new BlockSurface(blocks, 0, { name: 'Tall sign', cols: 2, rows: 1, cells: [0, 1] });
    const image = new Pixels(s.width, s.height);
    image.px.set(s.read());
    const group = s.turned(true)!;
    expect(group).toEqual({ name: 'Tall sign', cols: 1, rows: 2, cells: [0, 1] });
    const next = new BlockSurface(blocks, 0, group);
    next.write(turn90(image).px);
    expect(blocks[0].pixels[19]).toBe(3);
    expect(blocks[1].pixels[380]).toBe(4);
    expect(blocks[0].scorePts).toBe(123);
    expect(new BlockSurface(blocks, 0, { name: 'Hole', cols: 2, rows: 2, cells: [0, -1, 1, 0] }).turned(true)?.cells).toEqual([1, 0, 0, -1]);
  });
});
