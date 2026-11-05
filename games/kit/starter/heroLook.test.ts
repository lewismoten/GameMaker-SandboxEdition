// The helpers: every name is spelled by the block set, a recolor changes only Kit's index ranges.
import { describe, expect, it } from 'vitest';
import { KIT_LOOK, NAME_BLOCK_IDS, helperPalettes, kitRamp, nameBlockIds, recolor } from './heroLook';
import { buildStarterPalette } from './palette';

describe('helpers', () => {
  it('spell every name from the shared two-letter blocks', () => {
    for (const h of helperPalettes) {
      expect(h.name).toMatch(/^[A-Z]{2,4}$/);
      for (const id of nameBlockIds(h.name)) expect(NAME_BLOCK_IDS).toContain(id);
    }
    expect(nameBlockIds('KIT')).toEqual(['KI', 'T·']);
    expect(NAME_BLOCK_IDS.length).toBeLessThanOrEqual(21);
    expect(helperPalettes.length).toBeGreaterThanOrEqual(8);
  });
  it('recolor leaves Kit alone and moves only his ranges', () => {
    const pal = buildStarterPalette();
    expect(recolor(pal, KIT_LOOK)).toEqual(pal.pal);
    const other = recolor(pal, helperPalettes[5].look);
    const mine = new Set(['skin', 'hair', 'hat', 'hood', 'pants'].flatMap((r) => kitRamp(pal, r as 'skin')));
    for (let i = 0; i < 256; i++) {
      const same = [0, 1, 2].every((k) => other[i * 3 + k] === pal.pal[i * 3 + k]);
      expect(same || mine.has(i)).toBe(true);
    }
  });
});
