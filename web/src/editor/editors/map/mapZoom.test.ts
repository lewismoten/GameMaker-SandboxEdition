// Wheel direction, zoom limits and pointer anchoring without browser or timer waits.
import { describe, expect, it } from 'vitest';
import { nextZoom, zoomScroll } from './mapZoom';

describe('map zoom', () => {
  it('steps through available magnifications and stays within their bounds', () => {
    const choices = [0.1, 0.25, 0.5, 1, 2];
    expect(nextZoom(choices, 1, -120)).toBe(2);
    expect(nextZoom(choices, 1, 120)).toBe(0.5);
    expect(nextZoom(choices, 2, -120)).toBe(2);
    expect(nextZoom(choices, 0.1, 120)).toBe(0.1);
    expect(nextZoom(choices, 1, 0)).toBe(1);
  });
  it('keeps the map coordinate underneath a pointer fixed across zoom changes', () => {
    const scroll = 400,
      pointer = 123;
    for (const after of [0.5, 2]) {
      const next = zoomScroll(scroll, pointer, 1, after);
      expect((next + pointer) / after).toBeCloseTo(scroll + pointer);
    }
  });
});
