// HSV conversions are shared by browser color picking and game builders.
import { describe, expect, it } from 'vitest';
import { hsvToRgb, rgbToHsv, type RGB } from '@lewismoten/gamemaker-sandbox-tools/colors';

describe('RGB and HSV', () => {
  it('handles hue sectors, grayscale and wrapped hue', () => {
    expect(hsvToRgb([0, 1, 1])).toEqual([255, 0, 0]);
    expect(hsvToRgb([120, 1, 1])).toEqual([0, 255, 0]);
    expect(hsvToRgb([-120, 1, 1])).toEqual([0, 0, 255]);
    expect(hsvToRgb([360, 0, 0.5])).toEqual([128, 128, 128]);
    expect(rgbToHsv([0, 0, 0])).toEqual([0, 0, 0]);
    expect(rgbToHsv([255, 255, 255])).toEqual([0, 0, 1]);
  });
  it('round-trips colors without mutating inputs', () => {
    for (const r of [0, 33, 128, 255])
      for (const g of [0, 55, 128, 255])
        for (const b of [0, 79, 128, 255]) {
          const color: RGB = Object.freeze([r, g, b]);
          expect(hsvToRgb(rgbToHsv(color))).toEqual(color);
        }
  });
  it('rejects invalid component ranges and non-finite values', () => {
    expect(() => rgbToHsv([-1, 0, 0])).toThrow(RangeError);
    expect(() => hsvToRgb([NaN, 0, 0])).toThrow(RangeError);
    expect(() => hsvToRgb([0, 1.1, 0])).toThrow(RangeError);
  });
});
