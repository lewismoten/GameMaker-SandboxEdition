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

describe('overhangs and supports', () => {
  // a table: a slab on a post, with a flat underside over air
  const table = (x: number, y: number, z: number) => Math.min(Math.max(Math.hypot(x, y) - 2, -z, z - 12), Math.max(Math.hypot(x, y) - 8, Math.abs(z - 12) - 1));
  const box = { min: [-10, -10, 0] as [number, number, number], max: [10, 10, 14] as [number, number, number], cell: 0.5 };
  it('measures a flat underside, and the underside of a ball on the bed', async () => {
    const { overhang } = await import('@lewismoten/gamemaker-sandbox-tools/mesh/overhang');
    expect(overhang(tetra(table, box)).area).toBeGreaterThan(100);
    const ballOnBed = (x: number, y: number, z: number) => Math.hypot(x, y, z - 8) - 8;
    expect(overhang(tetra(ballOnBed, { ...box, max: [10, 10, 17] }), 45, 0.1).share).toBeCloseTo(0.146, 1); // a sphere on the bed: its underside within 45 degrees of straight down
  });
  it('builds a separate closed support body under the slab and none for a post alone', async () => {
    const { supportBody } = await import('@lewismoten/gamemaker-sandbox-tools/mesh/overhang');
    const s = supportBody(table, { min: box.min, max: box.max, cell: 0.8, gap: 0.4 })!;
    expect(s).toBeTruthy();
    expect(inspectMesh(s).badEdges).toBe(0);
    expect(inspectMesh(s).volume).toBeGreaterThan(50);
    const post = (x: number, y: number, z: number) => Math.max(Math.hypot(x, y) - 3, -z, z - 10);
    expect(supportBody(post, { min: box.min, max: box.max, cell: 0.8, gap: 0.4 })).toBeUndefined();
  });
});
const tetra = surfaceNets;

describe('3MF and color bodies', () => {
  // a ball, red above z = 0 and blue below, with a yellow cap on one side
  const field = (x: number, y: number, z: number) => Math.hypot(x, y, z) - 10;
  const box = { min: [-10, -10, -10] as [number, number, number], max: [10, 10, 10] as [number, number, number], cell: 0.8 };
  const colored = () => {
    const m = surfaceNets(field, box);
    const colors = new Uint8Array((m.indices.length / 3) * 3);
    for (let t = 0; t < m.indices.length / 3; t++) {
      const v = m.indices[t * 3] * 3;
      const c = m.positions[v + 2] > 0 ? (m.positions[v] > 6 ? [250, 210, 40] : [220, 40, 40]) : [40, 60, 220];
      colors.set(c, t * 3);
    }
    return { ...m, colors };
  };
  it('picks a few colors and splits the solid into closed bodies that fill it', async () => {
    const { pickPalette, colorBodies } = await import('@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies');
    const { tetraMesh } = await import('@lewismoten/gamemaker-sandbox-tools/mesh/tetraMesh');
    const mesh = colored();
    const palette = pickPalette(mesh, 4);
    expect(palette.length).toBe(3);
    const bodies = colorBodies(mesh, palette, field, box);
    expect(bodies.length).toBe(3);
    for (const b of bodies) {
      const r = inspectMesh(b.mesh);
      expect(r.badEdges).toBe(0);
      expect(r.flippedEdges).toBe(0);
    }
    const whole = inspectMesh(tetraMesh(field, box)).volume;
    const sum = bodies.reduce((n, b) => n + inspectMesh(b.mesh).volume, 0);
    expect(sum / whole).toBeGreaterThan(0.985);
    expect(sum / whole).toBeLessThan(1.015);
  });
  it('writes a 3MF and reads the bodies and colors back', async () => {
    const { write3mf, read3mf } = await import('@lewismoten/gamemaker-sandbox-tools/mesh/threeMf');
    const { deflateRawSync, inflateRawSync } = await import('node:zlib');
    const parts = [
      { name: 'Red', mesh: surfaceNets(field, box), color: [220, 40, 40] as [number, number, number] },
      { name: 'Blue & <green>', mesh: surfaceNets((x, y, z) => field(x - 4, y, z) + 4, box), color: [10, 20, 250] as [number, number, number] },
    ];
    const file = write3mf(parts, 'Test', { deflate: (d) => deflateRawSync(d) });
    expect(new TextDecoder().decode(file.slice(0, 2))).toBe('PK');
    const back = read3mf(file, { inflate: (d) => inflateRawSync(d) });
    expect(back.map((p) => p.name)).toEqual(['Red', 'Blue &amp; &lt;green&gt;']); // names come back as written in the XML
    expect(back[1].color).toEqual([10, 20, 250]);
    expect(back[0].mesh.indices.length).toBe(parts[0].mesh.indices.length);
    expect(inspectMesh(back[0].mesh).badEdges).toBe(0);
    expect(inspectMesh(back[0].mesh).volume).toBeCloseTo(inspectMesh(parts[0].mesh).volume, 0);
    // stored (not deflated) reads back too
    expect(read3mf(write3mf(parts, 'Test')).length).toBe(2);
  });
});
