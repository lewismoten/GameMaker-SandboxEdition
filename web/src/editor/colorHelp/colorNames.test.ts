import { describe, expect, it } from 'vitest';
import { colorName, paletteColorName } from './colorNames';

describe('colorName', () => {
  it('names the basics', () => {
    expect(colorName(0, 0, 0)).toBe('black');
    expect(colorName(255, 255, 255)).toBe('white');
    expect(colorName(255, 0, 0)).toBe('red');
    expect(colorName(0, 200, 0)).toBe('green');
    expect(colorName(0, 0, 255)).toBe('blue');
    expect(colorName(255, 255, 0)).toBe('yellow');
  });
  it('says dark and light', () => {
    expect(colorName(110, 0, 0)).toBe('dark red');
    expect(colorName(150, 220, 255)).toBe('light blue');
    expect(colorName(120, 255, 235)).toBe('light blue-green');
  });
  it('uses brown, pink and grays', () => {
    expect(colorName(120, 70, 20)).toBe('brown');
    expect(colorName(255, 190, 200)).toBe('pink');
    expect(colorName(128, 128, 128)).toBe('gray');
    expect(colorName(60, 60, 60)).toBe('dark gray');
    expect(colorName(200, 200, 200)).toBe('light gray');
  });
  it('reads 6-bit palette colors', () => {
    const pal = new Uint8Array(768);
    pal.set([63, 0, 0], 3);
    expect(paletteColorName(pal, 0)).toBe('black');
    expect(paletteColorName(pal, 1)).toBe('red');
  });
});
