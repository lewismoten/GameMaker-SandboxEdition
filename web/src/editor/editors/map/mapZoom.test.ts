// Zoom limits, wheel steps, the URL's zoom and pointer anchoring without browser or timer waits.
import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM, clampZoom, pictureScale, wheelZoom, zoomFromUrl, zoomScroll, zoomToUrl } from './mapZoom';

describe('map zoom', () => {
  it('runs from one pixel per block to 400%', () => {
    expect(MIN_ZOOM).toBeCloseTo(0.05);
    expect(MAX_ZOOM).toBe(4);
    expect(clampZoom(0.001)).toBe(MIN_ZOOM);
    expect(clampZoom(40)).toBe(4);
    expect(clampZoom(NaN)).toBe(1);
  });
  it('zooms continuously: any wheel delta moves it a little, in or out', () => {
    expect(wheelZoom(1, -10)).toBeGreaterThan(1);
    expect(wheelZoom(1, -10)).toBeLessThan(1.05);
    expect(wheelZoom(1, 10)).toBeLessThan(1);
    expect(wheelZoom(1, 0)).toBe(1);
    expect(wheelZoom(4, -500)).toBe(4);
    expect(wheelZoom(MIN_ZOOM, 500)).toBe(MIN_ZOOM);
    // a pinch of the same size zooms faster than a wheel
    expect(wheelZoom(1, -5, true)).toBeGreaterThan(wheelZoom(1, -5));
  });
  it('opposite deltas undo each other', () => {
    expect(wheelZoom(wheelZoom(1.7, -60), 60)).toBeCloseTo(1.7);
  });
  it('reads old preset values and new continuous ones from the URL', () => {
    expect(zoomFromUrl('0.5')).toBe(0.5);
    expect(zoomFromUrl('2')).toBe(2);
    expect(zoomFromUrl('0.3333')).toBeCloseTo(0.3333);
    expect(zoomFromUrl('9')).toBe(4);
    expect(zoomFromUrl('0.01')).toBe(MIN_ZOOM);
    expect(zoomFromUrl(null)).toBe(1);
    expect(zoomFromUrl('abc')).toBe(1);
    expect(zoomFromUrl('-2')).toBe(1);
  });
  it('writes the zoom to the URL briefly, and nothing at 100%', () => {
    expect(zoomToUrl(1)).toBeUndefined();
    expect(zoomToUrl(1 / 3)).toBe('0.333');
    expect(zoomToUrl(3.14159)).toBe('3.142');
  });
  it('draws the picture at a power of two no more than 2x from the zoom', () => {
    for (let z = MIN_ZOOM; z <= MAX_ZOOM; z *= 1.07) {
      const s = pictureScale(z);
      expect(s / z).toBeGreaterThanOrEqual(z > 2 ? 0.5 : 1 - 1e-9);
      expect(s / z).toBeLessThanOrEqual(2 + 1e-9);
    }
    expect(pictureScale(1)).toBe(1);
    expect(pictureScale(0.05)).toBe(1 / 16);
    expect(pictureScale(1.01)).toBe(2);
    expect(pictureScale(4)).toBe(2);
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
