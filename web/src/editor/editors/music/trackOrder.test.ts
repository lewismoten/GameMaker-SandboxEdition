import { describe, expect, it } from 'vitest';
import { moveTrackTo, orderTracks, sortByGroup } from './trackOrder';

describe('track order', () => {
  it('follows the saved order, then channel numbers for new tracks', () => {
    expect(orderTracks([0, 1, 2, 5], [5, 0])).toEqual([5, 0, 1, 2]);
    expect(orderTracks([0, 1], [7, 1, 1, 0])).toEqual([1, 0]);
    expect(orderTracks([3, 1, 2], [])).toEqual([1, 2, 3]);
  });
  it('moves one track, clamped to the ends', () => {
    expect(moveTrackTo([0, 1, 2], 2, 0)).toEqual([2, 0, 1]);
    expect(moveTrackTo([0, 1, 2], 0, 9)).toEqual([1, 2, 0]);
    expect(moveTrackTo([0, 1, 2], 4, 0)).toEqual([0, 1, 2]);
  });
  it('sorts by instrument group, keeping the order inside a group', () => {
    const g: Record<number, string> = { 0: 'brass', 1: 'keys', 2: 'brass', 3: 'strings' };
    expect(sortByGroup([0, 1, 2, 3, 4], (c) => g[c])).toEqual([1, 3, 0, 2, 4]);
  });
});
