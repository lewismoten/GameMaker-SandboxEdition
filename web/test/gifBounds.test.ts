// Reject malformed GIF work requests before dictionary setup or pixel allocation.
import { expect, it } from 'vitest';
import { decodeGif, lzwDecode } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';

it('rejects unsupported minimum code sizes at both GIF and LZW entry points', () => {
  for (const size of [0, 1, 9, 30, 255, NaN, 2.5]) {
    expect(() => lzwDecode(new Uint8Array(), size, 1)).toThrow(/minimum code size/);
  }
  const gif = new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 30, 0, 59]);
  expect(() => decodeGif(gif)).toThrow(/minimum code size/);
});

it('rejects undefined LZW dictionary codes', () => {
  // Three-bit codes: clear (4), then undefined code 7.
  expect(() => lzwDecode(new Uint8Array([4 | (7 << 3)]), 2, 1)).toThrow(/dictionary code/);
});
