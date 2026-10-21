import { describe, expect, it } from 'vitest';
import { CYAN_INK, LINE_INKS, luma, overprint, redField, redLines, throughRedFilm } from '../src/manual/printables/redFilm';

describe('red reveal inks', () => {
  it('the red lines vanish under red film like white paper: every one has full red', () => {
    for (const c of LINE_INKS) expect(throughRedFilm(c)).toBe(throughRedFilm('rgb(255,255,255)'));
  });
  it('the cyan answer turns dark under red film', () => {
    expect(throughRedFilm(CYAN_INK)).toBeLessThan(30);
  });
  it('where a red line crosses a letter the overprint stays dark under the film', () => {
    for (const c of LINE_INKS) expect(throughRedFilm(overprint(c, CYAN_INK))).toBeLessThan(30);
  });
  it('without the film the lines are about as dark as the letters, so they hide them', () => {
    const avg = LINE_INKS.reduce((s, c) => s + luma(c), 0) / LINE_INKS.length;
    expect(Math.abs(avg - luma(CYAN_INK))).toBeLessThan(40);
  });
  it('the CSS uses only the line inks', () => {
    const inks = (redField() + redLines()).match(/rgb\([^)]*\)/g)!;
    for (const c of inks) expect(LINE_INKS).toContain(c);
  });
});
