// "Energy Snore": a parody power-saving logo for the BIOS boot screen's top-right corner, like the
// 1990s POST screens had. A sleepy star with closed eyes, a snore of z's and a swoosh, with the
// name lettered under it. Like those BIOSes, it redefines character glyphs: the 136x80 picture
// (energySnoreArt.ts) is cut into 8x16 cells, each a custom glyph in one of two colors on black.
import { type TextScreen, attr } from './text/textScreen';
import { ART } from './energySnoreArt';

const CELLS_W = 17;
const CELLS_H = 5;
const FIRST_CODE = 0x80; // high CP437 codes, which the boot screen never prints
const COLORS: Record<string, number> = { W: 15, C: 11 };
/** The logo's column, from the top right corner. */
const X = 80 - CELLS_W - 1;

type Cell = { code: number; color: number };

/** Cuts the picture into cells: custom glyph rows (high bit left) and the color of each cell. */
export function logoCells(): { glyphs: Map<number, number[]>; cells: (Cell | null)[] } {
  const glyphs = new Map<number, number[]>();
  const byRows = new Map<string, number>();
  const cells: (Cell | null)[] = [];
  for (let cy = 0; cy < CELLS_H; cy++)
    for (let cx = 0; cx < CELLS_W; cx++) {
      const rows: number[] = [];
      const count: Record<string, number> = { W: 0, C: 0 };
      for (let line = 0; line < 16; line++) {
        let bits = 0;
        for (let b = 0; b < 8; b++) {
          const c = ART[cy * 16 + line][cx * 8 + b];
          if (c !== '.') {
            bits |= 0x80 >> b;
            count[c]++;
          }
        }
        rows.push(bits);
      }
      if (count.W + count.C === 0) {
        cells.push(null);
        continue;
      }
      const key = rows.join(',');
      let code = byRows.get(key);
      if (code === undefined) {
        code = FIRST_CODE + byRows.size;
        byRows.set(key, code);
        glyphs.set(code, rows);
      }
      cells.push({ code, color: COLORS[count.W >= count.C ? 'W' : 'C'] });
    }
  return { glyphs, cells };
}

/** Draws it; the BIOS lines above and left of it are shorter than the picture's column. */
export function drawEnergySnore(s: TextScreen): void {
  const { glyphs, cells } = logoCells();
  s.defineGlyphs(glyphs);
  cells.forEach((cell, i) => {
    if (cell) s.put(X + (i % CELLS_W), Math.floor(i / CELLS_W), cell.code, attr(cell.color, 0));
  });
}

/** Wipes it when the self test is over (the logo belongs to the BIOS screen, not to DOS). */
export function clearEnergySnore(s: TextScreen): void {
  s.fill(X, 0, X + CELLS_W - 1, CELLS_H - 1, attr(7, 0));
  s.resetGlyphs();
}
