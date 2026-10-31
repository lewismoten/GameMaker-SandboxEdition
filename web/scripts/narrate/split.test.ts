import { describe, expect, it } from 'vitest';
import { COMMA_GAP, SENTENCE_GAP, joinPieces, splitMode, splitStops, stopGaps, stretchPauses, trimSilence } from './split';

describe('splitStops', () => {
  const line = 'Hi, there! Case closed. Go on; now.';
  it('leaves the line whole by default', () => {
    expect(splitStops(line, 'none')).toEqual([{ text: line, gap: 0 }]);
  });
  const long = 'That is the tour, folks. Now go play something fun, friends. Bye now!';
  it('splits sentences only', () => {
    expect(splitStops(long, 'sentences').map((p) => p.text)).toEqual(['That is the tour, folks.', 'Now go play something fun, friends. Bye now!']);
    expect(splitStops(long, 'sentences').map((p) => p.gap)).toEqual([SENTENCE_GAP, 0]);
  });
  it('splits clauses with a shorter gap at commas', () => {
    const p = splitStops('Play a game or two, look inside it today. Then edit a copy.', 'clauses');
    expect(p.map((x) => x.text)).toEqual(['Play a game or two,', 'look inside it today.', 'Then edit a copy.']);
    expect(p[0].gap).toBe(COMMA_GAP);
    expect(p[1].gap).toBe(SENTENCE_GAP);
  });
  it('voices a piece under three words with its neighbor', () => {
    expect(splitStops(line, 'sentences').map((p) => p.text)).toEqual(['Hi, there! Case closed.', 'Go on; now.']);
    expect(splitStops('Case closed. Every scene is where it should be.', 'clauses')).toHaveLength(1);
    expect(splitStops('That is fine. Bye now!', 'sentences').map((p) => p.text)).toEqual(['That is fine. Bye now!']);
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

describe('stretching', () => {
  it('gives the gaps the stops call for', () => {
    expect(stopGaps('A b, c d. E f')).toEqual([COMMA_GAP, SENTENCE_GAP]);
  });
  it('lengthens a short pause and leaves a take without one alone', () => {
    const tone = new Float32Array(1000).fill(0.5);
    const take = new Float32Array(2200);
    take.set(tone, 100);
    take.set(tone, 1200);
    expect(stretchPauses(take, 1000, [0.5]).length).toBeGreaterThan(2500);
    expect(stretchPauses(tone, 1000, [0.5])).toBe(tone);
  });
});
