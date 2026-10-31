// The text-screen thumbnail picks a readable ink on dark palettes, and keeps the DOS purple otherwise.
import { describe, expect, it } from 'vitest';
import { textInk } from './textPicture';

describe('textInk', () => {
  it('keeps the stock purple when it shows against the background', () => {
    const pal = new Uint8Array(768);
    pal.set([50, 10, 50], 3 * 5);
    expect(textInk(pal)).toBe(5);
  });
  it('switches to the lightest ink when the nearest purple is as dark as the background', () => {
    const pal = new Uint8Array(768);
    pal.set([0, 0, 5], 3 * 9);
    pal.set([63, 63, 63], 3 * 8);
    expect(textInk(pal)).toBe(8);
  });
});
