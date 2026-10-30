// Text thumbnails follow Display_File's first-page layout and leave the source bytes alone.
import { describe, expect, it } from 'vitest';
import { textPicture } from '../src/editor/widgets/textPicture';
import { defaultPalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { STOCK_LOOK } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';

const bytes = (text: string) => Uint8Array.from(text, (char) => char.charCodeAt(0));

describe('text screen thumbnails', () => {
  it('places text at column five, row five and wraps a long line after 31 characters', () => {
    const palette = defaultPalette();
    const ink = STOCK_LOOK.color(palette, 'color.select.textPages');
    const source = bytes('A'.repeat(32));
    const pixels = textPicture(source, palette);
    const at = (x: number, y: number) => pixels[y * 320 + x];
    // The A's first row has ink at x=2 and x=3 within its eight-pixel cell.
    expect(at(42, 40)).toBe(ink);
    expect(at(42, 48)).toBe(ink);
    expect(at(290, 40)).toBe(0);
    expect(pixels.slice(0, 40 * 320).some(Boolean)).toBe(false);
    expect(source).toEqual(bytes('A'.repeat(32)));
  });
  it('stops at the first page and follows the engine when an extended character cannot be drawn', () => {
    const palette = defaultPalette();
    expect(textPicture(bytes('A\r\n'.repeat(16) + 'B'), palette)).toEqual(textPicture(bytes('A\r\n'.repeat(16)), palette));
    expect(textPicture(bytes('\x80'), palette).some(Boolean)).toBe(false);
  });
});
