// A game box under black light: its lettering glows, its unlettered art sinks to a dim violet.
import { describe, expect, it } from 'vitest';
import { uvColor } from '../room/posterUv';
import { uvLettering } from './boxUv';

/** One pixel of a box side, and whether it is lettered there. */
const side = (rgb: [number, number, number], lettered: boolean) => {
  const px = new Uint8ClampedArray([...rgb, 255]);
  uvLettering(px, new Uint8ClampedArray([0, 0, 0, lettered ? 255 : 0]));
  return [...px.slice(0, 3)];
};
const lum = (c: number[]) => c[0] + c[1] + c[2];

describe('a game box under black light', () => {
  it('lets lettered pixels glow as a poster would', () => {
    expect(side([255, 212, 0], true)).toEqual(uvColor(255, 212, 0));
    expect(side([255, 255, 255], true)).toEqual(uvColor(255, 255, 255));
  });

  it('dims the same color where nothing is lettered', () => {
    expect(lum(side([255, 212, 0], false))).toBeLessThan(lum(side([255, 212, 0], true)) / 2.5);
    expect(lum(side([255, 255, 255], false))).toBeLessThan(lum(side([255, 255, 255], true)) / 2.5);
  });

  it('keeps the pixels’ alpha', () => {
    const px = new Uint8ClampedArray([10, 200, 30, 128]);
    uvLettering(px, new Uint8ClampedArray(4));
    expect(px[3]).toBe(128);
  });
});
