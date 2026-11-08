// kit/shading gradient(): the row-dithered blend (each row one color) and what it saves in a GIF.
import { describe, expect, it } from 'vitest';
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';

const ramp = [10, 11, 12, 13, 14, 15];

describe('gradient rows', () => {
  it('draws each row in one color, from the low step to the high one', () => {
    const p = gradient(new Pixels(320, 160), 0, 0, 320, 160, ramp, 1, 4, true);
    for (let y = 0; y < 160; y++) expect(new Set(p.px.subarray(y * 320, y * 320 + 320)).size).toBe(1);
    expect(p.px[0]).toBe(11);
    expect(p.px[159 * 320]).toBe(14);
    // every step between shows up
    expect(new Set(p.px)).toEqual(new Set([11, 12, 13, 14]));
  });

  it('keeps the 4x4 pattern unless asked', () => {
    const p = gradient(new Pixels(320, 160), 0, 0, 320, 160, ramp, 1, 4);
    const row = new Set(p.px.subarray(41 * 320, 42 * 320));
    expect(row.size).toBeGreaterThan(1);
  });

  it('makes a far smaller GIF than the 4x4 pattern', () => {
    const palette = new Uint8Array(768).fill(32);
    const size = (rows: boolean) =>
      encodeGif({ width: 320, height: 160, pixels: gradient(new Pixels(320, 160), 0, 0, 320, 160, ramp, 1, 4, rows).px, palette }).length;
    expect(size(true)).toBeLessThan(size(false) * 0.7);
  });
});
