// Check monster placement and forest reachability across the full seed range.
import { describe, expect, it } from 'vitest';
import { proveResult } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { full, run } from './levelGenPropsFixture';
describe('monsters and forests', () => {
  describe.each([1, 11, 21, 31, 41, 51])('ten seeds starting at %i', (firstSeed) => {
    it('places monsters away from the entry, on open cells, only when asked', () => {
      for (let s = firstSeed; s < firstSeed + 10; s++) {
        const r = run('dungeon', full, s, [3, 4, 9]);
        expect(r.monsters.length).toBeGreaterThan(1);
        const seen = new Set<number>();
        for (const m of r.monsters) {
          expect([3, 4, 9]).toContain(m.monnum);
          expect(m.cell).not.toBe(r.entry);
          expect(r.kinds[m.cell]).toBe(1);
          expect(Math.abs((m.cell % 100) - (r.entry % 100)) + Math.abs(((m.cell / 100) | 0) - ((r.entry / 100) | 0))).toBeGreaterThanOrEqual(5);
          expect(seen.has(m.cell)).toBe(false);
          seen.add(m.cell);
        }
        expect(run('dungeon', full, s).monsters).toEqual([]);
      }
    });

    it('gives forests treasure and monsters, reachable, with no locks', () => {
      for (let s = firstSeed; s < firstSeed + 10; s++) {
        const r = run('forest', full, s, [3]);
        expect(r.locks).toEqual([]);
        expect(proveResult(r).collectable).toBe(true);
        expect(r.treasure.length).toBeGreaterThan(0);
        expect(r.monsters.length).toBeGreaterThan(0);
      }
    });
  });
});
