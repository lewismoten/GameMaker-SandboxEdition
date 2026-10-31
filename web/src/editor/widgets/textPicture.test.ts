// The text-screen thumbnail's ink: the player's preferred color if it reads against color 0, else the nearest that does, else white on black.
import { describe, expect, it } from 'vitest';
import { textColors } from './textPicture';

describe('textColors', () => {
  it('keeps the stock purple when it shows against the background', () => {
    const pal = new Uint8Array(768);
    pal.set([50, 10, 50], 3 * 5);
    expect(textColors(pal).ink).toBe(5);
  });
  it('picks the nearest readable color to the preferred one', () => {
    const pal = new Uint8Array(768);
    pal.set([0, 0, 5], 3 * 9);
    pal.set([63, 63, 63], 3 * 8);
    pal.set([40, 40, 0], 3 * 7);
    expect(textColors(pal, [63, 60, 63]).ink).toBe(8);
    expect(textColors(pal, [38, 38, 0]).ink).toBe(7);
  });
  it('draws white on black when nothing reads', () => {
    const c = textColors(new Uint8Array(768));
    expect(c.ink).toBe(1);
    expect(Array.from(c.palette.slice(3, 6))).toEqual([63, 63, 63]);
  });
});
