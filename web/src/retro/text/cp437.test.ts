// toCp437 and fromCp437 cover the whole code page.
import { describe, expect, it } from 'vitest';
import { fromCp437, toCp437 } from './cp437';

const ALL = Array.from({ length: 256 }, (_, c) => String.fromCharCode(c)).join('');

describe('CP437 text', () => {
  it('round-trips every code 0-255', () => {
    const shown = fromCp437(ALL);
    expect([...shown]).toHaveLength(256);
    expect(toCp437(shown)).toBe(ALL);
  });

  it('maps the symbols a PC showed', () => {
    expect(toCp437('♫◘☺⌂ÇüÑ½α∞√ⁿ²■')).toBe(String.fromCharCode(14, 8, 1, 127, 128, 129, 165, 171, 224, 236, 251, 252, 253, 254));
    expect(fromCp437('\x0e\x08G A M E\x08\x0e')).toBe('♫◘G A M E◘♫');
  });

  it('keeps ASCII and newlines as they are, and plains typography', () => {
    expect(toCp437('Hi!\nOK')).toBe('Hi!\nOK');
    expect(toCp437('“A”—B…')).toBe('"A"--B...');
    expect(toCp437('βμΩ')).toBe(String.fromCharCode(225, 230, 234));
  });
});
