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
      // the checks gather what breaks into one list: thousands of single expects cost more than the handle math
      const bad: string[] = [];
      for (let deg = 0; deg < 360; deg += 1) {
        const pts = handlePoints({ size, rot: (deg * Math.PI) / 180, cx, top, radius });
        if (pts.length <= 8) bad.push(`${deg}: ${pts.length} points`);
        for (const p of pts) {
          if (!(Number.isFinite(p.x) && Number.isFinite(p.y))) bad.push(`${deg}: not finite`);
          // no further out than the handle reaches, and within the body's height (and the rim's tilt)
          if (!(Math.abs(p.x - cx) <= radius * 1.6)) bad.push(`${deg}: too far out`);
          if (!(p.y >= top && p.y <= top + H + radius * 0.2)) bad.push(`${deg}: outside the body's height`);
        }
        // the loop goes out and back once: its distance from the axis rises, then falls
        const d = pts.map((p) => Math.abs(p.x - cx));
        const peak = d.indexOf(Math.max(...d));
        for (let i = 1; i < d.length; i++) if (!(i <= peak ? d[i] >= d[i - 1] - 1e-9 : d[i] <= d[i - 1] + 1e-9)) bad.push(`${deg}: turns back at ${i}`);
      }
      expect(bad).toEqual([]);
    });

  it('seen straight on (handle toward us) it is a single upright line down the middle', () => {
    const pts = handlePoints({ size: MUG_SIZES[0], rot: Math.PI, cx, top, radius });
    for (const p of pts) expect(p.x).toBeCloseTo(cx, 6);
  });
});
