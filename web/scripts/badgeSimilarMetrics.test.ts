// Tests for the badge similarity metrics.
import { describe, expect, it } from 'vitest';
import { chroma, colorDiff, edges, grayDistance, maskDistance, resize, simulate, unearned, viewDistance, view, type Raster } from './badgeSimilarMetrics';

const solid = (r: number, g: number, b: number, w = 8): Raster => ({ w, h: w, data: Uint8Array.from({ length: w * w * 4 }, (_, i) => [r, g, b, 255][i % 4]) });
/** A white block on the left half over `bg`. */
const half = (bg: [number, number, number]): Raster => {
  const p = solid(...bg);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) p.data.set([255, 255, 255, 255], (y * 8 + x) * 4);
  return p;
};

describe('badge similarity metrics', () => {
  it('sees identical pictures as the same and different shapes as apart', () => {
    expect(grayDistance(half([0, 0, 0]), half([0, 0, 0]))).toBe(0);
    expect(grayDistance(half([0, 0, 0]), solid(0, 0, 0))).toBeGreaterThan(0.4);
  });
  it('flags two pictures that differ only in hue', () => {
    const red = solid(200, 60, 60),
      green = solid(60, 140, 60);
    expect(grayDistance(red, green)).toBeLessThan(0.1);
    expect(colorDiff(red, green)).toBeGreaterThan(0.1);
  });
  it('makes red and green alike under protanopia and deuteranopia, not achromatopsia-distinct blue', () => {
    const red = solid(220, 40, 40),
      green = solid(40, 160, 40);
    const d = (f: string): number => viewDistance(view(red, f), view(green, f));
    expect(d('none')).toBeGreaterThan(d('deuteranopia'));
    expect(simulate(solid(255, 255, 255), 'protanopia').data[0]).toBeGreaterThan(250);
  });
  it('measures edges, chroma and the unearned look', () => {
    expect(maskDistance(edges(half([0, 0, 0])), edges(half([0, 0, 0])))).toBe(0);
    expect(edges(solid(9, 9, 9)).some(Boolean)).toBe(false);
    expect(chroma(solid(90, 90, 90))).toBe(0);
    expect(chroma(solid(255, 0, 0))).toBeGreaterThan(0.2);
    const u = unearned(solid(255, 0, 0));
    expect(u.data[0]).toBe(u.data[1]);
    expect(resize(solid(1, 2, 3, 2), 4, 4).data.length).toBe(64);
  });
});
