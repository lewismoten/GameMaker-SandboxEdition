// Quantized colors reflect used pixels and their frequency, not unused palette entries.
import { describe, expect, it } from 'vitest';
import { medianCutRgba } from '@lewismoten/gamemaker-sandbox-tools/images';

describe('portable RGBA quantization', () => {
  const image = { width: 4, height: 1, data: Uint8Array.of(255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255) };
  it('reduces to a requested budget with population-weighted colors', () => {
    expect(medianCutRgba([image], 1)).toEqual([[191, 0, 64]]);
    expect(medianCutRgba([image], 2)).toEqual([
      [255, 0, 0],
      [0, 0, 255],
    ]);
    const first = medianCutRgba([image], 2);
    expect(medianCutRgba([image], 2)).toEqual(first);
    expect(image.data[0]).toBe(255);
  });
  it('shares colors across frames and returns no filler for an empty input', () => {
    expect(medianCutRgba([], 16)).toEqual([]);
    expect(medianCutRgba([{ width: 1, height: 1, data: Uint8Array.of(10, 20, 30, 255) }], 16)).toEqual([[10, 20, 30]]);
    expect(medianCutRgba([image, { width: 1, height: 1, data: Uint8Array.of(0, 255, 0, 255) }], 3)).toHaveLength(3);
  });
  it('rejects invalid budgets and incomplete image buffers', () => {
    for (const colors of [0, 257, 1.5, NaN]) expect(() => medianCutRgba([image], colors)).toThrow(RangeError);
    expect(() => medianCutRgba([{ width: 2, height: 1, data: Uint8Array.of(1, 2, 3, 255) }], 2)).toThrow(RangeError);
  });
});
