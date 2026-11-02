// CMF playheads follow PlayIt's first pass and its delayed repeats without real timers.
import { describe, expect, it } from 'vitest';
import { musicPreviewTick } from '../src/editor/widgets/musicTimeline';

describe('music preview position', () => {
  it('skips the lead-in once, then holds at the start during each repeat lead-in', () => {
    const song = { end: { tick: 100, bytes: [] }, leadIn: 20 };
    expect([0, 50, 99, 100, 110, 120, 170, 219, 220, 240].map((tick) => musicPreviewTick(song, tick))).toEqual([0, 50, 99, 0, 0, 0, 50, 99, 0, 0]);
  });
  it('handles immediate repeats, empty songs and negative elapsed time', () => {
    expect(musicPreviewTick({ end: { tick: 100, bytes: [] }, leadIn: 0 }, 150)).toBe(50);
    expect(musicPreviewTick({ end: { tick: 0, bytes: [] }, leadIn: 0 }, 150)).toBe(0);
    expect(musicPreviewTick({ end: { tick: 100, bytes: [] }, leadIn: 20 }, -1)).toBe(0);
  });
});
