// The voxel mesher and the pixel-figure builder: closed, one piece, a bounded triangle count, and a 3MF that reads back with at most 4 bodies.
import { describe, expect, it } from 'vitest';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { inspectMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import { pixelFigure } from '@lewismoten/gamemaker-sandbox-tools/mesh/pixelFigure';
import { read3mf, write3mf } from '@lewismoten/gamemaker-sandbox-tools/mesh/threeMf';
import { voxelMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/voxel';

describe('voxelMesh', () => {
  it('merges a box into 12 triangles', () => {
    const m = voxelMesh({ nx: 4, ny: 4, nz: 4, has: () => true });
    const r = inspectMesh(m);
    expect(r.badEdges + r.flippedEdges).toBe(0);
    expect(r.pieces).toBe(1);
    expect(r.triangles).toBeLessThanOrEqual(6 * 2 * 2 * 4);
    expect(r.volume).toBeCloseTo(64);
  });
  it('stays watertight for an L with a big and a small face', () => {
    const m = voxelMesh({ nx: 6, ny: 3, nz: 6, has: (x, _y, z) => x < 2 || z < 2 });
    const r = inspectMesh(m);
    expect(r.badEdges + r.flippedEdges).toBe(0);
    expect(r.volume).toBeCloseTo(3 * (12 + 12 - 4));
  });
});

describe('pixelFigure', () => {
  // a 10x12 figure in 6 colors with a floating speck and a corner-only touch
  const w = 10;
  const h = 12;
  const cells = new Uint8Array(w * h).fill(255);
  for (let y = 2; y < 10; y++) for (let x = 2; x < 8; x++) cells[y * w + x] = 1 + ((x + y) % 5);
  cells[0] = 3;
  cells[1 * w + 9] = 4;
  const palette = new Uint8Array(768);
  [
    [0, 0, 0],
    [63, 0, 0],
    [0, 63, 0],
    [0, 0, 63],
    [63, 63, 0],
    [30, 30, 30],
  ].forEach((c, i) => palette.set(c, i * 3));
  for (const colors of [4, 3]) {
    it(`is one closed piece with at most ${colors} colors`, () => {
      const f = pixelFigure({ w, h, cells, palette }, { colors });
      const whole = inspectMesh(f.solid);
      expect(whole.badEdges + whole.flippedEdges + whole.degenerate).toBe(0);
      expect(whole.pieces).toBe(1);
      expect(f.bodies.length).toBeLessThanOrEqual(colors);
      for (const b of f.bodies) expect(inspectMesh(b.mesh).badEdges).toBe(0);
      // no more than two triangles per unit face of the voxel surface (14 x 18 x 8 blocks at most)
      expect(whole.triangles).toBeLessThan(2 * (2 * 14 * 18 + 2 * 8 * 18 + 2 * 14 * 8));
      const mf = read3mf(
        write3mf(
          f.bodies.map((b, i) => ({ name: `c${i}`, ...b })),
          't',
          { deflate: (d) => deflateRawSync(d) },
        ),
        { inflate: (d) => inflateRawSync(d) },
      );
      expect(mf.length).toBe(f.bodies.length);
      expect(mf.length).toBeLessThanOrEqual(4);
    });
  }
});
