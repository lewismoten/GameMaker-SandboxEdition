// Tests: Depth Perception's plastic trinkets (games/depth/src/trinkets): each model meshes to one closed
// solid standing on z = 0 at about its stated size.
// Stays slow: each case meshes a real printable trinket.
import { describe, expect, it } from 'vitest';
import { inspectMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import { makeTrinket } from '../../games/depth/src/trinkets/make';
import { TRINKETS } from '../../games/depth/src/trinkets/trinkets';

describe('Depth trinkets', () => {
  it.each(['ray', 'teapot', 'teddy'])(
    '%s is one closed solid on the floor',
    (id) => {
      const def = TRINKETS.find((t) => t.id === id)!;
      const { report, erodedPieces, bodies, wholeVolume } = makeTrinket(def);
      expect(report.badEdges).toBe(0);
      expect(report.flippedEdges).toBe(0);
      expect(report.pieces).toBe(1);
      expect(report.min[2]).toBeGreaterThanOrEqual(-0.01);
      expect(report.min[2]).toBeLessThan(0.5);
      expect(report.max[2] - report.min[2]).toBeLessThanOrEqual(def.height + 2);
      expect(Math.max(report.max[0] - report.min[0], report.max[1] - report.min[1])).toBeLessThanOrEqual(def.maxWidth + 2);
      expect(report.volume).toBeGreaterThan(1000);
      expect(erodedPieces).toBe(1); // nothing is joined by less than a millimeter
      expect(bodies.length).toBeGreaterThan(1);
      expect(bodies.length).toBeLessThanOrEqual(4);
      let sum = 0;
      for (const b of bodies) {
        const r = inspectMesh(b.mesh);
        expect(r.badEdges + r.flippedEdges).toBe(0);
        sum += r.volume;
      }
      expect(sum / wholeVolume).toBeGreaterThan(0.98);
      expect(sum / wholeVolume).toBeLessThan(1.02);
    },
    60_000,
  );
  it('Doc Leo prints his navy jacket apart from the stand and the hat', () => {
    const { bodies } = makeTrinket(TRINKETS.find((t) => t.id === 'docleo')!);
    expect(bodies).toHaveLength(4);
    for (const a of bodies) for (const b of bodies) if (a !== b) expect(Math.hypot(...a.color.map((v, i) => v - b.color[i]))).toBeGreaterThan(40);
  }, 60_000);
  it('every trinket has a name, a line and an id', () => {
    for (const t of TRINKETS) expect(t.id && t.title && t.blurb).toBeTruthy();
    expect(new Set(TRINKETS.map((t) => t.id)).size).toBe(TRINKETS.length);
  });
});
