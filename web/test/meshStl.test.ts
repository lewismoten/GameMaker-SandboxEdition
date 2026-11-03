// Tests: the tools package's mesh code (mesh/): surface nets give closed, outward-facing
// surfaces of the right size, and an STL written and read back is the same mesh.
import { describe, expect, it } from 'vitest';
import { surfaceNets } from '@lewismoten/gamemaker-sandbox-tools/mesh/surfaceNets';
import { inspectMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import { readStl, writeStl } from '@lewismoten/gamemaker-sandbox-tools/mesh/stl';

const ball = (x: number, y: number, z: number) => Math.hypot(x, y, z) - 10;
const box = { min: [-10, -10, -10] as [number, number, number], max: [10, 10, 10] as [number, number, number], cell: 1 };

describe('surface nets', () => {
  it('make a closed, outward surface with about the right volume', () => {
    const r = inspectMesh(surfaceNets(ball, box));
    expect(r.badEdges).toBe(0);
    expect(r.flippedEdges).toBe(0);
    expect(r.pieces).toBe(1);
    expect(r.volume).toBeGreaterThan((4 / 3) * Math.PI * 1000 * 0.97);
    expect(r.volume).toBeLessThan((4 / 3) * Math.PI * 1000 * 1.03);
    expect(r.max[0]).toBeCloseTo(10, 0);
  });
  it('keep two separate solids separate, and a torus closed', () => {
    const two = (x: number, y: number, z: number) => Math.min(Math.hypot(x - 5, y, z) - 3, Math.hypot(x + 5, y, z) - 3);
    const a = inspectMesh(surfaceNets(two, { ...box, cell: 0.7 }));
    expect(a.pieces).toBe(2);
    expect(a.badEdges).toBe(0);
    const torus = (x: number, y: number, z: number) => Math.hypot(Math.hypot(x, y) - 6, z) - 2.5;
    const t = inspectMesh(surfaceNets(torus, { ...box, cell: 0.7 }));
    expect(t.badEdges).toBe(0);
    expect(t.pieces).toBe(1);
  });
  it('flag an open mesh', () => {
    const m = surfaceNets(ball, box);
    const open = { positions: m.positions, indices: m.indices.slice(3) };
    expect(inspectMesh(open).badEdges).toBeGreaterThan(0);
  });
});

describe('binary STL', () => {
  it('reads back what it wrote, colors included', () => {
    const m = surfaceNets(ball, { ...box, cell: 2 });
    const tris = m.indices.length / 3;
    m.colors = new Uint8Array(tris * 3).map((_, i) => (i % 3 === 0 ? 248 : 16));
    const file = writeStl(m, { name: 'ball' });
    expect(file.length).toBe(84 + tris * 50);
    expect(new TextDecoder().decode(file.slice(0, 4))).toBe('ball');
    const back = readStl(file);
    expect(back.indices.length).toBe(m.indices.length);
    expect(inspectMesh(back).badEdges).toBe(0);
    expect(back.positions.length).toBe(m.positions.length);
    expect(back.colors?.[0]).toBeGreaterThanOrEqual(248);
    expect(back.colors?.[1]).toBeLessThan(24);
  });
  it('refuses a file that is not a binary STL', () => {
    expect(() => readStl(new Uint8Array(100))).toThrow(/binary STL/);
  });
});
