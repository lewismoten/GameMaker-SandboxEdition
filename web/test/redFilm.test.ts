import { describe, expect, it } from 'vitest';
import { CYAN_INKS, DECOY_INKS, luma } from '../src/manual/printables/redFilm';

const red = (c: string) => Number(c.match(/\d+/)![0]);

describe('red reveal inks', () => {
  it('decoys vanish under red film: every one has full red', () => {
    for (const c of DECOY_INKS) expect(red(c)).toBe(255);
  });
  it('the answer turns dark under red film: half red at most', () => {
    for (const c of CYAN_INKS) expect(red(c)).toBeLessThanOrEqual(140);
  });
  it('without the film decoys and answer are about as light as each other', () => {
    const avg = (l: string[]) => l.reduce((s, c) => s + luma(c), 0) / l.length;
    expect(Math.abs(avg(DECOY_INKS) - avg(CYAN_INKS))).toBeLessThan(20);
  });
});
