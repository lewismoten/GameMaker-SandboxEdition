// The slim Kit is clearly taller than wide in every facing, and the far sizes keep him recognizable.
import { describe, expect, it } from 'vitest';
import { atSize } from './kitSizes';
import { SLIM_FACINGS, slimPose } from './kitSlim';
import { sidePoses, wholePose } from './kitPoses';
import { buildStarterPalette } from './palette';

const bounds = (p: { w: number; h: number; get(x: number, y: number): number }) => {
  let x0 = 99,
    x1 = -1,
    y0 = 99,
    y1 = -1;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) if (p.get(x, y) !== 255) [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
  return { w: x1 - x0 + 1, h: y1 - y0 + 1 };
};

describe('slim Kit', () => {
  const pal = buildStarterPalette();
  it('is taller than wide in all eight facings and steps', () => {
    for (const f of SLIM_FACINGS)
      for (const s of [0, 1, 2] as const) {
        const b = bounds(slimPose(pal, f, s));
        expect(b.h).toBeGreaterThanOrEqual(b.w * 1.3);
      }
  });
  it('leaves the top block empty when crouching, and keeps something at very far', () => {
    const poses = sidePoses(pal);
    expect(poses.find((p) => p.name === 'duck0')!.top).toBeNull();
    expect(bounds(atSize(wholePose(poses[0]), 'veryFar', pal.c('ink', 0))).h).toBeGreaterThanOrEqual(6);
  });
});
