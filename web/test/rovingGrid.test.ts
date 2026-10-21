import { describe, expect, it } from 'vitest';
import { gridMove } from '../src/editor/rovingGrid';

describe('gridMove', () => {
  it('moves by one across and by a row up and down', () => {
    expect(gridMove('ArrowRight', 3, 32, 16)).toBe(4);
    expect(gridMove('ArrowLeft', 3, 32, 16)).toBe(2);
    expect(gridMove('ArrowDown', 3, 32, 16)).toBe(19);
    expect(gridMove('ArrowUp', 19, 32, 16)).toBe(3);
  });
  it('stops at the ends', () => {
    expect(gridMove('ArrowLeft', 0, 32, 16)).toBe(0);
    expect(gridMove('ArrowUp', 5, 32, 16)).toBe(0);
    expect(gridMove('ArrowDown', 20, 32, 16)).toBe(31);
    expect(gridMove('ArrowRight', 31, 32, 16)).toBe(31);
  });
  it('jumps with Home and End and ignores other keys', () => {
    expect(gridMove('Home', 9, 32, 16)).toBe(0);
    expect(gridMove('End', 9, 32, 16)).toBe(31);
    expect(gridMove('a', 9, 32, 16)).toBe(-1);
    expect(gridMove('Enter', 9, 32, 16)).toBe(-1);
  });
});
