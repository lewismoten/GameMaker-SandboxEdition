// Tests: The desk mug's picture on its wrap (desk/mug/mugSizes.ts); the print page is mugLayout.test.ts.
import { describe, expect, it } from 'vitest';
import { MUG_SIZES, printPlacement } from '../src/desk/mug/mugSizes';

const size = (id: string) => MUG_SIZES.find((s) => s.id === id)!;

describe('pictures on a wrap', () => {
  it('puts the picture front and back, inside the wrap, a quarter turn from the front', () => {
    for (const s of MUG_SIZES) {
      for (const aspect of [640 / 288, 320 / 248]) {
        const p = printPlacement(s, aspect);
        expect(p.w / p.h).toBeCloseTo(aspect);
        expect(p.h).toBeLessThanOrEqual(s.wrapH);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.centers[0] - p.w / 2).toBeGreaterThan(0);
        expect(p.centers[1] + p.w / 2).toBeLessThan(s.wrapW);
        expect(p.centers[1] - p.w / 2).toBeGreaterThan(p.centers[0] + p.w / 2); // they don't overlap
        expect(p.centers[0] + p.centers[1]).toBeCloseTo(s.wrapW); // symmetric about the front
        expect(p.w).toBeGreaterThan(2.5); // big enough to read
      }
    }
    const tumbler = printPlacement(size('20oz'), 2);
    expect(tumbler.centers[1] - tumbler.centers[0]).toBeCloseTo((Math.PI * 2.96) / 2); // exactly front and back
  });
});
