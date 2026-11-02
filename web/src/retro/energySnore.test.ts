// The ENERGY SNORE logo: its art fits 17x5 cells and its glyphs sit in unused high codes.
import { describe, expect, it } from 'vitest';
import { ART } from './energySnoreArt';
import { logoCells } from './energySnore';

describe('energySnore', () => {
  it('is 136x80 pixels of black, white and cyan', () => {
    expect(ART).toHaveLength(80);
    for (const row of ART) expect(row).toMatch(/^[.WC]{136}$/);
  });
  it('uses distinct high codes with 16 rows each', () => {
    const { glyphs, cells } = logoCells();
    expect(cells).toHaveLength(85);
    for (const [code, rows] of glyphs) {
      expect(code).toBeGreaterThanOrEqual(0x80);
      expect(code).toBeLessThan(0x100);
      expect(rows).toHaveLength(16);
    }
  });
});
