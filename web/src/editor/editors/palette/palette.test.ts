// Palette helpers: ramps (find, shade, spread, shade ramp) and re-lit variants.
import { describe, expect, it } from 'vitest';
import { rampOf, shade, spread, shadeRamp, luma } from './ramps';
import { VARIANTS, relight, range } from './variants';
import { defaultPalette } from '../../../formats/palette';

/** A palette with a 5-shade green ramp at 10..14 and a lone red at 40. */
function planned(): Uint8Array {
  const p = new Uint8Array(768);
  for (let k = 0; k < 5; k++) p.set([2 + k * 3, 10 + k * 12, 2 + k * 3], (10 + k) * 3);
  p.set([0, 0, 63], 9 * 3); // a blue that is no shade of the greens
  p.set([60, 5, 5], 40 * 3);
  p.set([63, 63, 63], 41 * 3);
  p.set([20, 2, 2], 39 * 3 - 3); // 38: dark red, not next to 40
  return p;
}

describe('ramps', () => {
  it('finds the ramp a color sits in, dark to light', () => {
    const p = planned();
    expect(rampOf(p, 12)).toEqual([10, 11, 12, 13, 14]);
    expect(rampOf(p, 10)).toEqual([10, 11, 12, 13, 14]);
  });

  it('lists a ramp that runs light to dark by index dark first', () => {
    const p = planned();
    const q = p.slice();
    for (let k = 0; k < 5; k++) q.set(p.subarray((14 - k) * 3, (15 - k) * 3), (10 + k) * 3);
    q.set([0, 0, 63], 15 * 3); // and no black after the darkest
    expect(rampOf(q, 11)).toEqual([14, 13, 12, 11, 10]);
  });

  it('shades along the ramp and stops at its ends', () => {
    const p = planned();
    expect(shade(p, 12, 1)).toBe(13);
    expect(shade(p, 12, -1)).toBe(11);
    expect(shade(p, 14, 1)).toBe(14);
    expect(shade(p, 10, -1)).toBe(10);
  });

  it('shades a lone color to the nearest brighter or darker one', () => {
    const p = planned();
    expect(luma(p, shade(p, 40, 1))).toBeGreaterThan(luma(p, 40));
    expect(shade(p, 40, -1)).toBe(38);
  });

  it('spreads between two colors and lays out a shade ramp', () => {
    const p = new Uint8Array(768);
    p.set([0, 0, 0], 0);
    p.set([60, 30, 0], 4 * 3);
    spread(p, 4, 0);
    expect([...p.subarray(6, 9)]).toEqual([30, 15, 0]);
    shadeRamp(p, [30, 30, 60 / 2], 100, 106);
    expect([...p.subarray(104 * 3, 105 * 3)]).toEqual([30, 30, 30]);
    expect(luma(p, 100)).toBeLessThan(luma(p, 103));
    expect(luma(p, 106)).toBeGreaterThan(luma(p, 104));
  });
});

describe('variants', () => {
  it('re-lights every color by scale and lift, clamped', () => {
    const p = defaultPalette();
    const night = relight(p, VARIANTS.find((v) => v.id === 'night')!);
    expect(night[15 * 3]).toBe(Math.round(63 * 0.48 + 1.5));
    expect(night[15 * 3 + 2]).toBe(Math.min(63, Math.round(63 * 0.8 + 6.5)));
    expect(night.length).toBe(768);
    expect(p[15 * 3]).toBe(63); // the original is untouched
  });

  it('keeps glowing colors exactly', () => {
    const p = defaultPalette();
    const v = relight(p, VARIANTS[0], range(20, 18));
    expect([...v.subarray(18 * 3, 21 * 3)]).toEqual([...p.subarray(18 * 3, 21 * 3)]);
    expect([...v.subarray(15 * 3, 16 * 3)]).not.toEqual([...p.subarray(15 * 3, 16 * 3)]);
  });

  it('pulls the brightest colors down underwater', () => {
    const p = new Uint8Array(768).fill(63);
    const w = relight(p, VARIANTS.find((v) => v.id === 'underwater')!);
    expect(w[0]).toBeLessThan(63);
    expect(w[2]).toBeLessThan(63);
    expect(w[1]).toBeLessThan(63);
  });
});
