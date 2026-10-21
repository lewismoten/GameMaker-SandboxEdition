// GRATOR.EXE's screen layout, tables and small helpers (the #defines at the top of
// code/GM/GRATOR.C and GAMECLAS.H), shared by the Integrator's layers.
import { attr } from '../../retro/text/textScreen';
import { type Vga } from '../shared/vga';

export const NOTUSED = 0xffff; // Number in a scene variable when scene not used
export const NOLINK = 0xff;
export const EXTRASCENEBUFFER = 30;

export const BACKLINK = 20;
export const MENUX = 10;
export const MENUY = 3;
export const HELPX = 50;
export const HELPY = 3;
export const SELECTX = MENUX;
export const SELECTY = 15;
export const DELETEX = HELPX;
export const DELETEY = 15;
export const WORLDTOP = 29;
export const WX = 5;
export const WLEN = 310;
export const WWID = 165;
export const SELDESCY = 5;
export const NORMDESCY = SELDESCY + 12;
export const TEXTX = 200;
export const HELPFILE = 'grat.hlp';

// The text windows: openmenu's attribute is blue (0x10); GRATOR adds a foreground color.
export const TATTR = (fg: number) => attr(fg, 1);
export const TITLECOL = 12;

export const GRAPHIC_EXTS = ['gif', 'fli', 'txt', 'lst', 'bkd'];

// DELETE and SELECT, 36 x 11 two-bit pictures from GRATOR.C.
export const DELAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 23, 245, 255, 117, 95, 247, 255, 127, 212, 87, 93, 213, 117,
  93, 85, 117, 117, 85, 87, 93, 253, 117, 95, 213, 117, 127, 85, 87, 93, 213, 117, 93, 85, 117, 117, 85, 151, 245, 255, 127, 223, 245, 117, 127, 214, 21, 85,
  85, 85, 85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
export const SELAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 245, 255, 117, 95, 245, 245, 255, 212, 87, 85, 213, 117,
  93, 87, 93, 93, 85, 85, 245, 253, 117, 95, 215, 85, 93, 85, 85, 93, 213, 117, 93, 87, 93, 93, 85, 151, 245, 255, 127, 223, 245, 245, 93, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];

/** IN(): true if the mouse is in the box (exclusive). */
export const IN = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => x > x1 && x < x2 && y > y1 && y < y2;
export const pad14 = (s: string) => s.padEnd(14).slice(0, 14);
export const noExt = (name: string) => name.replace(/\.[^.\\]*$/, '');

export type Folder = { drive: string; parts: string[] };
export const sameFolder = (a: Folder, b: Folder) => a.drive === b.drive && a.parts.join('\\') === b.parts.join('\\');
export const isGameFolder = (f: Folder) => f.drive !== 'C' || f.parts.length >= 2;
export const pathText = (f: Folder) => `${f.drive}:\\${f.parts.map((p) => `${p}\\`).join('')}`;

/** Line() with xor=1: each point is XORed onto the screen, so drawing it twice erases it. */
export function xorLine(v: Vga, x1: number, y1: number, x2: number, y2: number, col: number): void {
  const plot = (x: number, y: number) => v.point(x, y, v.getCol(x, y) ^ col);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const sdx = Math.sign(dx);
  const sdy = Math.sign(dy);
  const absdx = sdx * dx;
  const absdy = sdy * dy;
  let x = 0;
  let y = 0;
  plot(x1, y1);
  if (absdx >= absdy) {
    for (let l = 0; l < absdx; l++) {
      y += absdy;
      if (y >= absdx) {
        y -= absdx;
        y1 += sdy;
      }
      x1 += sdx;
      plot(x1, y1);
    }
  } else {
    for (let l = 0; l < absdy; l++) {
      x += absdx;
      if (x >= absdy) {
        x -= absdy;
        x1 += sdx;
      }
      y1 += sdy;
      plot(x1, y1);
    }
  }
}
