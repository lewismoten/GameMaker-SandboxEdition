// Tests for the voice pause check (pauses.ts).
import { describe, expect, it } from 'vitest';
import { innerSilences, pausesCalledFor, tooFewPauses } from './pauses';

const RATE = 16000;
/** Speech-like noise (loud) and quiet stretches, lengths in seconds. */
function clip(parts: [boolean, number][]): Float32Array {
  const out: number[] = [];
  for (const [loud, s] of parts) for (let i = 0; i < s * RATE; i++) out.push(loud ? (i % 2 ? 0.3 : -0.3) : i % 2 ? 0.001 : -0.001);
  return Float32Array.from(out);
}

describe('pausesCalledFor', () => {
  it('counts stops with words after them, not the last one', () => {
    expect(pausesCalledFor('Pictures that move, shows that play. That is fun.')).toBe(2);
    expect(pausesCalledFor('One; two: three! Four?')).toBe(3);
    expect(pausesCalledFor('No stops')).toBe(0);
  });
});

describe('innerSilences', () => {
  it('finds quiet between sounds and ignores the ends', () => {
    const s = innerSilences(
      clip([
        [false, 0.5],
        [true, 0.4],
        [false, 0.12],
        [true, 0.4],
        [false, 0.5],
        [true, 0.3],
        [false, 0.7],
      ]),
      RATE,
    );
    expect(s).toHaveLength(2);
    expect(s[0]).toBeCloseTo(0.12, 1);
    expect(s[1]).toBeCloseTo(0.5, 1);
  });
});

describe('tooFewPauses', () => {
  it('flags a missing pause in a short line', () => expect(tooFewPauses(3, [0.12, 0.5, 0.6])).toBe(true));
  it('passes a line with all its pauses', () => expect(tooFewPauses(3, [0.4, 0.5, 0.6, 0.1])).toBe(false));
  it('allows one missing in a long line', () => expect(tooFewPauses(5, [0.4, 0.5, 0.6, 0.5])).toBe(false));
  it('flags two missing in a long line', () => expect(tooFewPauses(5, [0.4, 0.5, 0.6])).toBe(true));
  it('has no opinion about a line without stops', () => expect(tooFewPauses(0, [])).toBe(false));
});
