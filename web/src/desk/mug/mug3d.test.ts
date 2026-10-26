// The 3D mug's handle stays one finite loop beside the body at every turn, for every size with a handle.
import { describe, expect, it } from 'vitest';
import { handlePoints } from './mug3d';
import { MUG_SIZES } from './mugSizes';

describe('handlePoints', () => {
  const cx = 300;
  const top = 100;
  const radius = 120;
  for (const size of MUG_SIZES.filter((s) => s.handle))
    it(`${size.id}: finite, near the body and never turning back on itself across, at every degree`, () => {
      const H = (radius * 2 * size.height) / size.diameter;
      for (let deg = 0; deg < 360; deg += 1) {
        const pts = handlePoints({ size, rot: (deg * Math.PI) / 180, cx, top, radius });
        expect(pts.length).toBeGreaterThan(8);
        for (const p of pts) {
          expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
          // no further out than the handle reaches, and within the body's height (and the rim's tilt)
          expect(Math.abs(p.x - cx)).toBeLessThanOrEqual(radius * 1.6);
          expect(p.y).toBeGreaterThanOrEqual(top);
          expect(p.y).toBeLessThanOrEqual(top + H + radius * 0.2);
        }
        // the loop goes out and back once: its distance from the axis rises, then falls
        const d = pts.map((p) => Math.abs(p.x - cx));
        const peak = d.indexOf(Math.max(...d));
        for (let i = 1; i < d.length; i++) expect(i <= peak ? d[i] >= d[i - 1] - 1e-9 : d[i] <= d[i - 1] + 1e-9).toBe(true);
      }
    });

  it('seen straight on (handle toward us) it is a single upright line down the middle', () => {
    const pts = handlePoints({ size: MUG_SIZES[0], rot: Math.PI, cx, top, radius });
    for (const p of pts) expect(p.x).toBeCloseTo(cx, 6);
  });
});
