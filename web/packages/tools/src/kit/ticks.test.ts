// Clock conversion and countdown boundaries, including the games' legacy timing policies.
import { describe, expect, it } from 'vitest';
import { TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';
import { segmentedBar, ticks, TICKS_PER_SECOND } from './ticks';

describe('ticks', () => {
  it('uses one game tick per eight engine timer interrupts', () => {
    expect(TICKS_PER_SECOND).toBe(TICK_RATE / 8);
    expect(ticks(1000)).toBe(18209);
    expect(ticks(1, { round: 'none' })).toBe(TICK_RATE / 8);
  });
  it('preserves deliberate rates and rounding, including fractional ticks', () => {
    expect(ticks(99, { rate: 18 })).toBe(1782);
    expect(ticks(99, { rate: 18.2, round: 'none' })).toBe(99 * 18.2);
    expect(ticks(1, { rate: 18.2, round: 'floor' })).toBe(18);
    expect(ticks(1, { rate: 18.2, round: 'ceil' })).toBe(19);
    expect(ticks(0)).toBe(0);
  });
});

describe('segmentedBar', () => {
  it('lays out equal segments in drain order without adding an off frame', () => {
    expect(segmentedBar({ segments: 2, ticksPerSegment: 45 })).toEqual([
      { index: 0, remaining: 2, start: 0, end: 45, duration: 45 },
      { index: 1, remaining: 1, start: 45, end: 90, duration: 45 },
    ]);
  });
  it('distributes whole ticks by cumulative boundaries and ends at the original total', () => {
    const bar = segmentedBar({ segments: 5, totalTicks: 103, round: 'floor' });
    expect(bar.map((s) => s.duration)).toEqual([20, 21, 20, 21, 21]);
    expect(bar.at(-1)?.end).toBe(103);
    expect(bar.reduce((sum, s) => sum + s.duration, 0)).toBe(103);
  });
  it('retains fractional boundaries for independent bells and toe frames', () => {
    const bar = segmentedBar({ segments: 7, totalTicks: 100 });
    expect(bar.map((s) => s.end)).toEqual(Array.from({ length: 7 }, (_, i) => (100 * (i + 1)) / 7));
    expect(segmentedBar({ segments: 10, ticksPerSegment: 10.5 })[0].duration).toBe(10.5);
    expect(segmentedBar({ segments: 7, ticksPerSegment: 100 / 7 }).map((s) => s.duration)).toEqual(Array(7).fill(100 / 7));
  });
  it('supports nearest and upward boundary rounding', () => {
    expect(segmentedBar({ segments: 2, totalTicks: 5, round: 'round' }).map((s) => s.duration)).toEqual([3, 2]);
    expect(segmentedBar({ segments: 2, totalTicks: 5, round: 'ceil' }).map((s) => s.duration)).toEqual([3, 2]);
    expect(segmentedBar({ segments: 1, totalTicks: 0 })[0].duration).toBe(0);
  });
  it('rejects missing, fractional or negative segment counts', () => {
    for (const segments of [0, -1, 1.5, NaN]) expect(() => segmentedBar({ segments, totalTicks: 10 })).toThrow(RangeError);
  });
});
