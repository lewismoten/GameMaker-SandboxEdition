// Tests: Red reveal inks for the hint book (manual/printables/redFilm.ts).
import { describe, expect, it } from 'vitest';
import { CYAN_INK, DECOY_INKS, FIELD_INK, LINE_INKS, PRINT_CYAN_INK, luma, throughRedFilm, throughRedView } from '../src/manual/printables/redFilm';
import { fnv1a, mulberry32 } from '../src/seededRandom';

const WHITE = 'rgb(255,255,255)';

describe('red reveal inks', () => {
  it('everything but the answer vanishes under red film like white paper: full red', () => {
    for (const c of [...LINE_INKS, ...DECOY_INKS, FIELD_INK]) expect(throughRedFilm(c)).toBe(throughRedFilm(WHITE));
  });
  it('the on-screen film shows the answer dark and the noise as bright as the paper', () => {
    expect(throughRedView(CYAN_INK)).toBeLessThan(64);
    for (const c of [...LINE_INKS, ...DECOY_INKS, FIELD_INK]) expect(throughRedView(c)).toBe(255);
  });
  it('the printed answer is darker through real cellophane than on screen', () => {
    expect(throughRedFilm(PRINT_CYAN_INK)).toBeLessThan(throughRedFilm(CYAN_INK));
    expect(throughRedFilm(PRINT_CYAN_INK)).toBeLessThan(170);
  });
  it('without the film the answer is as light as its decoy strokes, so its lightness does not give it away', () => {
    const decoy = DECOY_INKS.reduce((s, c) => s + luma(c), 0) / DECOY_INKS.length;
    expect(Math.abs(decoy - luma(CYAN_INK))).toBeLessThan(25);
    // and only faintly tinted: little red missing
    expect(255 - throughRedFilm(CYAN_INK)).toBeLessThan(60);
  });
  it('the noise is the same for the same answer', () => {
    const a = mulberry32(fnv1a('Use the gold key'));
    const b = mulberry32(fnv1a('Use the gold key'));
    const xs = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(xs);
    for (const x of xs) (expect(x).toBeGreaterThanOrEqual(0), expect(x).toBeLessThan(1));
    expect(fnv1a('a')).not.toBe(fnv1a('b'));
  });
});
