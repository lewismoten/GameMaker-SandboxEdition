import { describe, expect, it } from 'vitest';
import { mouseDriverLine } from './mouseDriver';

/** A fixed run of "random" numbers. */
const seq =
  (...n: number[]) =>
  () =>
    n.shift() ?? 0;

describe('mouseDriverLine', () => {
  it('is the plain line on most boots', () => {
    expect(mouseDriverLine(seq(0.5))).toBe('Mouse driver installed\n');
  });
  it('now and then has a quirk, and sometimes a pit report', () => {
    expect(mouseDriverLine(seq(0, 0.9, 0))).toBe('Mouse designated driver installed\n');
    expect(mouseDriverLine(seq(0, 0, 0))).toBe(
      'Mouse driver pitstopping: PS/2 Port\nTelemetry: 4-Wheel Alignment OK\nMax Speed: 120 DPI (Restricted under caution)\n',
    );
  });
  it('keeps every line inside 80 columns and in plain ASCII', () => {
    for (let a = 0; a < 1; a += 0.01)
      for (const r of [0, 0.9])
        for (const line of mouseDriverLine(seq(0, r, a)).split('\n')) {
          expect(line.length).toBeLessThan(80);
          expect(line).toMatch(/^[\x20-\x7e]*$/);
        }
  });
});
