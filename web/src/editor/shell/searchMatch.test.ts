import { describe, expect, it } from 'vitest';
import { matches, matchingParts, queryWords, snippet } from './searchMatch';

describe('search matching', () => {
  it('ignores case and needs every word', () => {
    const words = queryWords('  QUIT game ');
    expect(words).toEqual(['quit', 'game']);
    expect(matches('Quit the Game now', words)).toBe(true);
    expect(matches('Quit', words)).toBe(false);
    expect(matches('anything', [])).toBe(false);
  });
  it('keeps the parts that match', () => {
    const parts = [
      { label: 'a', text: 'Gold keys' },
      { label: 'b', text: 'Arrows' },
    ];
    expect(matchingParts(parts, ['gold'])).toEqual([parts[0]]);
  });
  it('marks every hit and keeps the original case', () => {
    expect(snippet('Quit or quit', ['quit'])).toEqual([
      { text: 'Quit', hit: true },
      { text: ' or ', hit: false },
      { text: 'quit', hit: true },
    ]);
  });
  it('cuts long text around the first hit', () => {
    const text = `${'x'.repeat(100)} needle ${'y'.repeat(100)}`;
    const pieces = snippet(text, ['needle'], 40);
    expect(pieces[0].text).toBe('…');
    expect(pieces.some((p) => p.hit && p.text === 'needle')).toBe(true);
    expect(pieces.map((p) => p.text).join('').length).toBeLessThanOrEqual(42);
  });
});
