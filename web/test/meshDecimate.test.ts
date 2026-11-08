// Tests: thinning a mesh (mesh/decimate) and sampling a field once (mesh/sampledField).
import { describe, expect, it } from 'vitest';
import { decimate } from '@lewismoten/gamemaker-sandbox-tools/mesh/decimate';
import { inspectMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import { sampledField } from '@lewismoten/gamemaker-sandbox-tools/mesh/sampledField';
import { surfaceNets } from '@lewismoten/gamemaker-sandbox-tools/mesh/surfaceNets';

const ball = (x: number, y: number, z: number) => Math.hypot(x, y, z) - 10;
const box = { min: [-12, -12, -12] as [number, number, number], max: [12, 12, 12] as [number, number, number], cell: 0.7 };

describe('decimate', () => {
  it('takes most triangles out of a ball and keeps it closed, in one piece and the same size', () => {
    const fine = surfaceNets(ball, box);
    const thin = decimate(fine, { maxError: 0.05 });
    const a = inspectMesh(fine);
    const b = inspectMesh(thin);
    expect(b.triangles).toBeLessThan(a.triangles / 2);
    expect(b.badEdges + b.flippedEdges).toBe(0);
    expect(b.pieces).toBe(1);
    expect(b.volume / a.volume).toBeGreaterThan(0.97);
    expect(b.volume / a.volume).toBeLessThan(1.02);
  });

  it('keeps a color border: the two halves of a ball stay two colors split along the same line', () => {
    const fine = surfaceNets(ball, box);
    const colors = new Uint8Array((fine.indices.length / 3) * 3);
    for (let t = 0; t < fine.indices.length / 3; t++) {
      let z = 0;
      for (let c = 0; c < 3; c++) z += fine.positions[fine.indices[t * 3 + c] * 3 + 2] / 3;
      colors.set(z > 0 ? [250, 20, 20] : [20, 20, 250], t * 3);
    }
    const thin = decimate({ ...fine, colors }, { maxError: 0.1 });
    expect(thin.colors!.length / 3).toBe(thin.indices.length / 3);
    // no triangle of the red half dips below the equator by more than the thinning's tolerance and a cell
    for (let t = 0; t < thin.indices.length / 3; t++) {
      const red = thin.colors![t * 3] > 200;
      for (let c = 0; c < 3; c++) {
        const z = thin.positions[thin.indices[t * 3 + c] * 3 + 2];
        expect(red ? z : -z).toBeGreaterThan(-1.2);
      }
    }
  });
});

describe('sampledField', () => {
  it('reads back the field at a grid point and close to it between points', () => {
    const f = (x: number, y: number, z: number) => 2 * x - y + 0.5 * z;
    const g = sampledField(f, box);
    expect(g(0.7 * 3 - 12, 0.7 * 2 - 12, 0.7 * 5 - 12)).toBeCloseTo(f(0.7 * 3 - 12, 0.7 * 2 - 12, 0.7 * 5 - 12), 3);
    // a linear field is reproduced exactly by trilinear reading
    expect(g(1.234, -2.5, 3.3)).toBeCloseTo(f(1.234, -2.5, 3.3), 3);
  });
});
