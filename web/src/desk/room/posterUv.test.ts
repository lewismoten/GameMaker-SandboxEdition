// A poster under black light: white glows lavender, neon inks glow in their hue, dull colors go dark.
import { describe, expect, it } from 'vitest';
import { uvColor } from './posterUv';

const lum = ([r, g, b]: number[]) => r + g + b;

describe('a poster under black light', () => {
  it('turns white paper a bright lavender, bluer than it is red or green', () => {
    const [r, g, b] = uvColor(255, 255, 255);
    expect(b).toBeGreaterThan(200);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it('keeps a hot pink ink hot pink, and brighter than a dull gray of the same lightness', () => {
    const pink = uvColor(255, 40, 200);
    expect(pink[0]).toBeGreaterThan(pink[1]);
    expect(pink[2]).toBeGreaterThan(pink[1]);
    expect(lum(pink)).toBeGreaterThan(lum(uvColor(150, 150, 150)));
  });

  it('sinks black and dark colors into a dim violet', () => {
    const black = uvColor(0, 0, 0);
    expect(lum(black)).toBeLessThan(90);
    expect(black[2]).toBeGreaterThan(black[1]);
    expect(lum(uvColor(60, 40, 30))).toBeLessThan(lum(uvColor(255, 255, 255)) / 3);
  });
});
