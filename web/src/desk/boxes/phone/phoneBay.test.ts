// The phone kit's battery bay: the 4 x AAA holder and the microphone capsule sit inside the one continuous case, past the board's
// bottom end, with a little slack all round (clearance.json is written by games/year2000/phone/tools/shell.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Clearance {
  bay: { min: number; holder: number[]; capsule: number[]; gaps: { id: string; gap: number | null }[] };
}

describe('the battery bay', () => {
  for (const [name, sub] of [
    ['Junior Lab', ''],
    ['Deluxe', 'deluxe/'],
  ] as const) {
    it(`${name}: the holder lies flat past the board, inside its width, and the capsule is past the holder`, () => {
      const dir = new URL(`../../../../../games/year2000/phone/${sub}`, import.meta.url);
      const c = JSON.parse(readFileSync(new URL('viewer/clearance.json', dir), 'utf8')) as Clearance;
      const mech = JSON.parse(readFileSync(new URL('mechanical/interface.json', dir), 'utf8')) as { board: { width: number; height: number } };
      expect(c.bay.holder[2]).toBeGreaterThan(mech.board.height);
      expect(c.bay.holder[0]).toBeGreaterThan(0);
      expect(c.bay.holder[3]).toBeLessThan(mech.board.width);
      expect(c.bay.capsule[2]).toBeGreaterThan(c.bay.holder[5]);
      expect(c.bay.gaps.length).toBeGreaterThan(0);
      for (const g of c.bay.gaps) if (g.gap !== null) expect(g.gap, `${g.id} to the holder or capsule`).toBeGreaterThanOrEqual(c.bay.min);
    });
  }
});
