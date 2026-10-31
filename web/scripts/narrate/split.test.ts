import { describe, expect, it } from 'vitest';
import { COMMA_GAP, SENTENCE_GAP, joinPieces, splitMode, splitStops, trimSilence } from './split';

describe('splitStops', () => {
  const line = 'Hi, there! Case closed. Go on; now.';
  it('leaves the line whole by default', () => {
    expect(splitStops(line, 'none')).toEqual([{ text: line, gap: 0 }]);
  });
  it('splits sentences only', () => {
    expect(splitStops(line, 'sentences').map((p) => p.text)).toEqual(['Hi, there!', 'Case closed.', 'Go on; now.']);
    expect(splitStops(line, 'sentences').map((p) => p.gap)).toEqual([SENTENCE_GAP, SENTENCE_GAP, 0]);
  });
  it('splits clauses with a shorter gap at commas', () => {
    const p = splitStops(line, 'clauses');
    expect(p.map((x) => x.text)).toEqual(['Hi,', 'there!', 'Case closed.', 'Go on;', 'now.']);
    expect(p[0].gap).toBe(COMMA_GAP);
    expect(p[1].gap).toBe(SENTENCE_GAP);
  });
  it('agrees with the stops the pause check counts', () => {
    expect(splitStops('A, b. C!', 'clauses')).toHaveLength(3);
  });
  it('rejects an unknown mode', () => {
    expect(splitMode(undefined)).toBe('none');
    expect(() => splitMode('words')).toThrow();
  });
});

describe('joining', () => {
  const tone = (n: number, pad: number) => {
    const a = new Float32Array(n + 2 * pad);
    a.fill(0.5, pad, pad + n);
    return a;
  };
  it('trims quiet edges', () => {
    expect(trimSilence(tone(1000, 500), 1000).length).toBeLessThan(1100);
  });
  it('puts the gap between pieces, not after the last', () => {
    const out = joinPieces(
      [tone(1000, 300), tone(1000, 300)],
      [
        { text: 'a', gap: 0.5 },
        { text: 'b', gap: 0 },
      ],
      1000,
    );
    expect(out.length).toBeGreaterThan(2500);
    expect(out.length).toBeLessThan(2700);
  });
});
