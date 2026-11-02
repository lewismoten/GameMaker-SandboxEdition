// Group strokes share native tile pixels, skip holes, and preserve every behavior field.
import { describe, expect, it } from 'vitest';
import { emptyBlock, orientIndex } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
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

// Frame-oriented views still edit each native picture once, including mirrored aliases.
describe('oriented character painting surface', () => {
  it('round trips every PLAYGAME orientation and shares aliased pixels in differently turned halves', () => {
    const blocks = [emptyBlock(0), emptyBlock(1)];
    blocks[0].pixels.set(Uint8Array.from({ length: 400 }, (_, i) => i % 251));
    blocks[0].scorePts = 123;
    const original = blocks[0].pixels.slice();
    for (let top = 0; top < 8; top++)
      for (let bottom = 0; bottom < 8; bottom++) {
        blocks[0].pixels.set(original);
        const surface = new BlockSurface(blocks, 0, { name: 'Frame', cols: 1, rows: 2, cells: [0, 0] }, 255, [top, bottom]);
        const image = surface.read();
        expect(surface.write(image)).toEqual([]);
        surface.plot(image, 3, 22, 254);
        const address = surface.address(3, 22)!;
        const native = orientIndex(bottom, 3, 2);
        const topCell = orientIndex([0, 3, 2, 1, 4, 5, 6, 7][top], native % 20, Math.floor(native / 20));
        expect(image[topCell]).toBe(254);
        expect(image[22 * 20 + 3]).toBe(254);
        expect(address).toBe(native);
        const before = surface.parts(surface.read());
        expect(surface.write(image)).toEqual([0]);
        expect(blocks[0].pixels[address % 400]).toBe(254);
        expect(surface.read().every((value, i) => value === image[i])).toBe(true);
        expect(before.get(0)!.every((value, i) => value === original[i])).toBe(true);
      }
    expect(blocks[0].scorePts).toBe(123);
    expect(blocks[1].pixels.some(Boolean)).toBe(false);
  });
  it('masks missing halves and supports an oriented single-block view', () => {
    const blocks = [emptyBlock(0)];
    const surface = new BlockSurface(blocks, 0, { name: 'Shoes', cols: 1, rows: 2, cells: [-1, 0] }, 255, [0, 4]);
    const image = surface.read();
    surface.plot(image, 0, 20, 9);
    surface.plot(image, 0, 0, 7);
    expect(image[0]).toBe(255);
    expect(surface.address(0, 0)).toBeUndefined();
    expect(surface.address(0.5, 20)).toBeUndefined();
    surface.write(image);
    expect(blocks[0].pixels[19]).toBe(9);
    const single = new BlockSurface(blocks, 0, undefined, 255, [4]);
    expect(single.read()[0]).toBe(9);
    const px = single.read();
    single.plot(px, 1, 0, 8);
    single.write(px);
    expect(blocks[0].pixels[18]).toBe(8);
  });
});
