// Dex Dynamo's science report (dexReport.ts): the game's count of pages, the content rules for anything that
// ships, and the numbers that must match the Phone of the Future's real design (games/year2000/phone).
import { describe, expect, it } from 'vitest';
import { pagesA } from './dexReportPagesA';
import { pagesB } from './dexReportPagesB';
import { pagesC } from './dexReportPagesC';

const PAGES = [...pagesA, ...pagesB, ...pagesC];
const text = (html: string): string =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ');
const ALL = PAGES.map((p) => text(p.body)).join('\n');

describe("Dex's report", () => {
  it('is a cover and twenty pages, as the game counts them', () => {
    expect(PAGES).toHaveLength(21);
    expect(PAGES[0].paper).toBe('cover');
    expect(PAGES.slice(1).every((p) => p.paper !== 'cover')).toBe(true);
  });

  it('keeps to the content rules: US English, no money, no trademarks', () => {
    expect(ALL).not.toMatch(/colour|centre|grey\b|\$\d|dollar|\bcost\b|price/i);
    expect(ALL).not.toMatch(/Dr\.\s*Leo|Klown/i);
    expect(ALL).not.toMatch(/Lego|Arduino Uno|Raspberry/i);
  });

  it('has the real frequencies and the real configuration words', () => {
    for (const f of ['350', '440', '697', '770', '852', '941', '1209', '1336', '1477', '1633', '3.579545']) expect(ALL).toContain(f);
    expect(ALL).toContain(':02400E00213F50'); // 0x3F21, checked bit by bit in the phone's README
    expect(ALL).toContain(':02400E00FF3F10'); // 0x3FFF
    expect(ALL).toContain(':02400E00303F41'); // 0x3F30
    expect(ALL).toContain(':02400E00A13FD0'); // 0x3FA1
  });

  it('adds up the hand programmer the way the firmware needs', () => {
    // 337 words programmed over 800 addresses: 34 clock presses a word, 6 to skip an empty address
    expect(337 * 34).toBe(11458);
    expect((800 - 337) * 6).toBe(2778);
    expect(337 * 34 + (800 - 337) * 6).toBe(14236);
    expect(41 * 34).toBe(1394);
    expect(ALL).toContain('14,236');
    expect(ALL).toContain('11,458');
    expect(ALL).toContain('2,778');
  });

  it('adds up the tone numbers: the 24-cycle loop and each 16-bit step', () => {
    const fs = 894886 / 24;
    for (const [f, inc] of [
      [697, 1225],
      [770, 1353],
      [852, 1498],
      [941, 1654],
      [1209, 2125],
      [1336, 2348],
      [1477, 2596],
      [1633, 2870],
    ]) {
      expect(Math.floor((f * 65536 + 18643) / 37286)).toBe(inc); // the firmware's own integer rounding (FS = 37286)
      expect(Math.abs(((inc * fs) / 65536 - f) / f)).toBeLessThan(0.0005);
    }
    // the built-in 4 MHz clock instead of the crystal: every tone comes out 11.75% fast
    expect((1_000_000 / 24 / fs).toFixed(4)).toBe('1.1175');
    expect(Math.round(697 * 1.1175)).toBe(779);
  });
});
