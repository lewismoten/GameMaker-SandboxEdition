// Tests: Depth Perception's plastic trinkets (games/depth/src/trinkets): each model meshes to one closed
// solid standing on z = 0 at about its stated size.
import { describe, expect, it } from 'vitest';
import { makeTrinket } from '../../games/depth/src/trinkets/make';
import { TRINKETS } from '../../games/depth/src/trinkets/trinkets';

describe('Depth trinkets', () => {
  it.each(['ray', 'teapot'])('%s is one closed solid on the floor', (id) => {
    const def = TRINKETS.find((t) => t.id === id)!;
    const { report } = makeTrinket(def);
    expect(report.badEdges).toBe(0);
    expect(report.flippedEdges).toBe(0);
    expect(report.pieces).toBe(1);
    expect(report.min[2]).toBeGreaterThanOrEqual(-0.01);
    expect(report.min[2]).toBeLessThan(0.5);
    expect(report.max[2] - report.min[2]).toBeLessThanOrEqual(def.height + 2);
    expect(Math.max(report.max[0] - report.min[0], report.max[1] - report.min[1])).toBeLessThanOrEqual(def.maxWidth + 2);
    expect(report.volume).toBeGreaterThan(1000);
  });
  it('every trinket has a name, a line and an id', () => {
    for (const t of TRINKETS) expect(t.id && t.title && t.blurb).toBeTruthy();
    expect(new Set(TRINKETS.map((t) => t.id)).size).toBe(TRINKETS.length);
  });
});
