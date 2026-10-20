import { describe, expect, it } from 'vitest';
import { layoutText, pageOfLine, wrapLongLines } from '../src/editor/editors/textLayout';
import { textLines } from '../src/formats/graphicScripts';
import { textBytes } from '../src/formats/binary';

const screenLinesOf = (t: string) => textLines(textBytes(t.replace(/\n/g, '\r\n'))).length;

describe('text screen layout', () => {
  const cases = [
    'Hello\nWorld',
    'Hello\nWorld\n',
    '',
    '\n\n\n',
    'x'.repeat(31) + '\nnext',
    'x'.repeat(31),
    'x'.repeat(62) + '\n',
    'x'.repeat(40) + '\n' + 'y'.repeat(5),
    Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n'),
  ];
  it.each(cases)('agrees with the game on how many screen lines %#', (t) => {
    expect(layoutText(t).screenLines).toBe(screenLinesOf(t));
  });

  it('flags a line of exactly 31 characters', () => {
    const l = layoutText('x'.repeat(31) + '\nnext');
    expect(l.lines[0]).toMatchObject({ count: 2, extraBlank: true, wraps: false });
    expect(layoutText('x'.repeat(31)).lines[0].extraBlank).toBe(false);
    expect(layoutText('x'.repeat(32) + '\n').lines[0]).toMatchObject({ count: 2, wraps: true, extraBlank: false });
  });

  it('finds where pages start', () => {
    const text = Array.from({ length: 15 }, () => 'a').join('\n') + '\n' + 'b'.repeat(40) + '\nc';
    const l = layoutText(text);
    expect(l.pages).toBe(2);
    expect(l.lines[15].pageStarts).toEqual([1]);
    expect(pageOfLine(l, 16)).toBe(1);
    expect(pageOfLine(l, 0)).toBe(0);
  });
});

describe('wrapping long lines', () => {
  it('breaks at words, at most 30 characters, so no line gets an extra blank', () => {
    const out = wrapLongLines('The quick brown fox jumps over the lazy dog again and again\nshort');
    expect(out.split('\n').every((l) => l.length <= 30)).toBe(true);
    expect(out.endsWith('\nshort')).toBe(true);
    expect(wrapLongLines('x'.repeat(31))).toBe('x'.repeat(30) + '\nx');
    expect(layoutText(wrapLongLines('y'.repeat(31) + '\nz')).lines.some((l) => l.extraBlank)).toBe(false);
  });
});
