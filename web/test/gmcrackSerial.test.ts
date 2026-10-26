// GMCRACK's made-up serials: always one CHK.EXE would call good (a counter x 1029 + 4), never this PC's.
import { describe, expect, it } from 'vitest';
import { randomSerial } from '../src/retro/hacks/gmcrack';
import { SERIAL, validSerial } from '../src/retro/gmReg/registration';

describe('randomSerial', () => {
  it('makes valid serials that are not this copy’s', () => {
    for (let i = 0; i < 200; i++) {
      const s = randomSerial();
      expect(validSerial(s)).toBe(true);
      expect(s).not.toBe(SERIAL);
    }
  });

  it('skips this PC’s own serial', () => {
    const own = (SERIAL - 4) / 1029;
    const picks = [(own - 0.5) / 9999, 0];
    expect(randomSerial(() => picks.shift()!)).toBe(1 * 1029 + 4);
  });
});
