// MAPMAKER.EXE's screen layout, tables and small helpers (the #defines and arrays at the top
// of code/GM/MAPMAKER.C), shared by the Map Maker's layers.
import { type RGBdata } from '../shared/vga';
import { BLEN } from '../shared/facelift';
import { emptyBlock, type Block } from '../../formats/blocks';

export const BACKBLK = 0; // Background block number
export const LMLEN = 8;
export const LMX = 283; // Where the vert. monster list is on the scrn.
export const LMY = 20;

export const MENUX = LMX - 39;
export const MENUY = 165;
export const BLOCY = MENUY - 48;
export const MONSTY = MENUY - 36;
export const ERASEY = MENUY - 24;
export const HELPY = MENUY - 12;
export const TOOL2Y = 23;
export const TOOLX = MENUX;
export const TOOLY = TOOL2Y - 1;

export const MX = 0; // Upper left coords of map on screen (different from lowercase mx!)
export const MY = 0;
export const MX1 = MX + 16 * BLEN;
export const MY1 = MY + 10 * BLEN;

export const BUTX = LMX - 34;
export const BUTY = 38;
export const BUTY1 = BUTY + (11 * 8) / 2;
export const ZOOMX = BUTX + 8;
export const ZOOMY = BUTY1 + 4 + 11;
export const POINTFN = 0;
export const LINEFN = 1;
export const BOXFN = 2;
export const BOXFILLFN = 3;
export const CIRCLEFN = 4;
export const CIRCLEFILLFN = 5;
export const FILLFN = 6;
export const COPYFN = 7;
export const ZOOMFN = 8;

export const BLOCACTIVE = 1;
export const MONACTIVE = 2;
export const NOTOOLS = 4;

export const HELPFILE = 'map.hlp';

// The 2-bit pictures (draw4dat) from MAPMAKER.C, byte for byte.
/** DrawFnBut: the nine 10x10 tool buttons. */
export const FNBUT = [
  [0, 0, 0, 85, 80, 21, 85, 65, 85, 84, 21, 165, 65, 90, 84, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 85, 65, 165, 84, 21, 165, 65, 85, 164, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 26, 170, 65, 149, 100, 25, 86, 65, 149, 100, 25, 86, 65, 170, 164, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 26, 170, 65, 170, 164, 26, 170, 65, 170, 164, 26, 170, 65, 170, 164, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 85, 65, 90, 84, 22, 89, 65, 101, 148, 21, 165, 65, 85, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 85, 65, 90, 84, 22, 169, 65, 106, 148, 21, 165, 65, 85, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 170, 160, 42, 170, 130, 170, 168, 42, 170, 130, 170, 168, 42, 170, 130, 170, 168, 58, 170, 192, 255, 240],
  [0, 0, 0, 85, 80, 22, 102, 65, 153, 148, 22, 102, 65, 153, 148, 22, 102, 65, 153, 148, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 26, 170, 65, 86, 148, 21, 165, 65, 90, 84, 22, 149, 65, 170, 164, 53, 85, 192, 255, 240],
];
export const LIGHTAR = [5, 64, 26, 144, 106, 228, 107, 228, 106, 164, 26, 144, 5, 64];
export const MONSTAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 23, 87, 93, 117, 215, 223, 223, 223, 84, 87, 223, 119, 125,
  221, 87, 93, 93, 213, 87, 255, 119, 127, 215, 87, 95, 95, 85, 87, 119, 119, 119, 213, 215, 93, 93, 213, 151, 87, 93, 117, 223, 87, 95, 221, 214, 21, 85, 85,
  85, 85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
export const BLOCAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 95, 215, 85, 125, 95, 93, 117, 84, 85, 93, 119, 85, 215,
  117, 221, 213, 85, 85, 95, 215, 85, 215, 117, 95, 85, 85, 85, 93, 119, 85, 215, 117, 221, 213, 85, 149, 95, 215, 253, 125, 95, 93, 117, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
export const ERASEAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 95, 247, 245, 125, 95, 95, 245, 84, 85, 93, 87, 93, 215,
  117, 93, 85, 85, 85, 95, 215, 245, 255, 95, 95, 213, 85, 85, 93, 87, 93, 215, 85, 221, 85, 85, 149, 95, 247, 93, 215, 127, 95, 245, 86, 21, 85, 85, 85, 85,
  85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
export const TOOLAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 127, 245, 245, 125, 117, 95, 85, 84, 85, 87, 87, 93,
  215, 117, 117, 85, 85, 85, 87, 87, 93, 215, 117, 95, 85, 85, 85, 87, 87, 93, 215, 117, 85, 213, 85, 149, 87, 85, 245, 125, 127, 127, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
export const RIGHTAR = [0, 0, 64, 0, 80, 0, 84, 0, 85, 0, 85, 64, 85, 64, 85, 192, 87, 0, 92, 0, 112, 0, 192, 0];
export const DOWNAR = [0, 0, 0, 85, 85, 80, 213, 85, 112, 53, 85, 192, 13, 87, 0, 3, 92, 0, 0, 240, 0];
export const LEFTAR = [0, 0, 0, 1, 0, 5, 0, 21, 0, 85, 1, 85, 1, 85, 3, 85, 0, 213, 0, 53, 0, 13, 0, 3];
export const UPAR = [0, 0, 0, 0, 80, 0, 1, 84, 0, 5, 85, 0, 21, 85, 64, 85, 85, 80, 255, 255, 240];

/** Blocks past the end of a set (or never loaded) are all color 0, as the zeroed buffers were. */
export const BLANK = new Uint8Array(BLEN * BLEN);

export const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
export const div = (a: number, b: number) => Math.trunc(a / b);

/** sqrt: MAPMAKER.C's own integer square root, rounded to the nearest whole number. */
export function isqrt(x: number): number {
  x = Math.abs(x);
  if (x === 0) return 0;
  if (x === 1) return 1;
  let squ = 0;
  let oldsqu = 0;
  let guess = 0;
  while (squ < x) {
    oldsqu = squ;
    guess++;
    squ = guess * guess;
  }
  return Math.abs(squ - x) <= Math.abs(oldsqu - x) ? guess : guess - 1;
}

export const pal2colors = (b: Uint8Array): RGBdata[] =>
  Array.from({ length: 256 }, (_, i) => ({ red: (b[i * 3] ?? 0) & 63, green: (b[i * 3 + 1] ?? 0) & 63, blue: (b[i * 3 + 2] ?? 0) & 63 }));

/** blks[0] / blks[1]: a set plus one spare zeroed block (BACKBL+1, MONBL+1). */
export const zeroBlocks = (n: number): Block[] => Array.from({ length: n + 1 }, (_, i) => emptyBlock(i));

export type Point = (x: number, y: number) => void;
