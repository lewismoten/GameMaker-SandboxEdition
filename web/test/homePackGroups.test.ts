// The makers' groups on the Gameware and Shareware tabs (src/editor/shell/homePack.ts packGroups):
// no empty slot before the last tile, the fewest rows, headings that never meet.
import { describe, expect, it } from 'vitest';
import { packGroups } from '../src/editor/shell/homePack';

// the real groups: Gameware (RSD, A-J Games, KD Software, GameLynk), Shareware (A-J Games, Mark Hadley, Josh Turcotte, Matt Bell)
const TABS = { gameware: [8, 7, 2, 1], shareware: [10, 2, 1, 1] };

describe('packGroups', () => {
  for (const [tab, sizes] of Object.entries(TABS))
    for (const cols of [6, 5, 4]) {
      it(`${tab} at ${cols} columns: no holes, fewest rows, clear headings`, () => {
        const placed = packGroups(sizes, cols);
        const total = sizes.reduce((a, b) => a + b, 0);
        expect(placed.map((p) => p.index).sort()).toEqual(sizes.map((_, i) => i));
        expect(placed[0].index).toBe(0); // the first group stays first
        // every slot from the first to the last tile is filled, once
        const slots = placed.flatMap((p) => p.tiles.map((t) => ((t.row - 2) / 2) * cols + t.col - 1)).sort((a, b) => a - b);
        expect(slots).toEqual(Array.from({ length: total }, (_, i) => i));
        expect(Math.max(...placed.flatMap((p) => p.tiles.map((t) => t.row))) / 2).toBe(Math.ceil(total / cols));
        // each heading sits over its group's first tiles, inside the grid, apart from the others
        for (const p of placed) {
          expect(p.head.row).toBe(p.tiles[0].row - 1);
          expect(p.head.col).toBe(p.tiles[0].col);
          expect(p.head.col + p.head.span - 1).toBeLessThanOrEqual(cols);
        }
        const cells = placed.flatMap((p) => Array.from({ length: p.head.span }, (_, i) => `${p.head.row}:${p.head.col + i}`));
        expect(new Set(cells).size).toBe(cells.length);
      });
    }

  it('keeps a small group in one row when an order allows', () => {
    // Gameware at 6: RSD's 8 leave 4 in row 2; A-J Games' 7 carry on, KD Software and GameLynk stay whole
    const placed = packGroups(TABS.gameware, 6);
    for (const p of placed.filter((x) => TABS.gameware[x.index] <= 2)) expect(new Set(p.tiles.map((t) => t.row)).size).toBe(1);
  });
});
