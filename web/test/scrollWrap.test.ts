// Tests: ChangeScroll's 16-bit int overflow (engine/scroll.ts dosSpeed), as in PLAYGAME.C.
import { describe, expect, it } from 'vitest';
import { dosSpeed } from '@lewismoten/gamemaker-sandbox-engine/engine/scroll';

describe('scroll speed 16-bit wrap', () => {
  it('is the plain linear speed while the product fits an int', () => {
    expect(dosSpeed(100, 40, 200)).toBe(20);
    expect(dosSpeed(100, 40, 200, true)).toBe(-20);
  });
  it('wraps once the character is past 819 pixels beyond the stop line', () => {
    expect(dosSpeed(819, 40, 100)).toBe(327); // 32760 still fits
    // 820*40 = 32800 wraps to -32736, then / 100 truncates toward zero
    expect(dosSpeed(820, 40, 100)).toBe(-327);
    expect(dosSpeed(820, 40, 100, true)).toBe(327);
  });
});
