// BLOCEDIT.EXE's screen layout and tables (the #defines and button arrays at the top of
// code/GM/BLOCEDIT.C), plus the small helpers the Block Designer's layers share.
import { BLEN, type Block } from '../../formats/blocks';
import { LASTMON } from '../../formats/monster';
import { type RGBdata, SIZEX } from '../shared/vga';

export const TRANSCOL = 255; // The value that is transparent in _pic fns
export const GLEN = 6; // Number of blocks in len in width of the grid
export const BX = 5;
export const BX1 = BX + BLEN * 5;
export const BY = 50;
export const BY1 = BY + BLEN * 5;
export const GX = 196;
export const GY = 34;
export const GX1 = GX + BLEN * GLEN;
export const GY1 = GY + BLEN * GLEN;
export const LLEN = 14;
export const LY = 175;
export const LX = 20;
export const LX1 = LX + LLEN * BLEN;
export const LY1 = LY + BLEN;
export const HELPX = 130;
export const HELPY = 110;
export const MENUX = HELPX;
export const MENUY = HELPY + 12;
export const INFOX = HELPX;
export const INFOY = MENUY + 12;
export const ANIX = HELPX;
export const ANIY = INFOY + 12;

export const HELPFILE = 'bloc.hlp';

export const LASTEDITFN = 7; // the edit fn buttons
export const EBLEN = 11;
export const EBX = BX + 12;
export const EBY = BY - 24;
export const EBX1 = EBX + EBLEN * LASTEDITFN - 1;
export const EBY1 = EBY + 10;
export const LASTKEYBUT = 9; // the key tool buttons
export const KBLEN = 11;
export const KBX = BX + 1;
export const KBY = EBY + 10;
export const KBX1 = KBX + KBLEN * LASTKEYBUT - 1;
export const KBY1 = KBY + 10;

export const SELX = 123; // Birthmon
export const SELY = 90;
export const MOLEN = 13;
export const MOX = 32;
export const MOY2 = 40;
export const TBOXX = 75;
export const TBOXY = 145;
export const MX3 = SELX + 40;
export const MY3 = SELY - 3;

export const COLX = 30; // Position of palette
export const COLY = 5;
export const MAXCOL = 255;
export const COLPX1 = 120; // Position of selected color
export const COLPLEN = 29;
export const COLPX2 = COLPX1 + COLPLEN + 3;
export const COLPY = 33;
export const COLPWID = 20;

export const FADETIME = 10;

// The info screen.
export const BLOCX = 50;
export const BLOCY = 71;
export const TITLEX = BLOCX - 25;
export const TITLEY = BLOCY - 55;
export const DISTAWAY = 10;
export const TMENUX = 115;
export const TMENUY = 15;
export const TMENULEN = SIZEX - TMENUX - 5;
export const TMENUWID = 80;
export const TIMEX = TMENUX + 18;
export const TIMEY = TMENUY + TMENUWID + 20;
export const MONX = TIMEX + 70;
export const MONY = TIMEY;
export const TOUCHX = TMENUX + 130;
export const TOUCHY = TMENUY + 25;
export const SCOREY = TMENUY + 10 * 5;
export const HITPTSY = TMENUY + 10 * 6;
export const EFFECTY = TMENUY + 10 * 7;
export const OBJECTX = 20;
export const OBJECTY = LY - 2 * 10 - 13;
export const TRASHX = SIZEX - 50;
export const TRASHY = LY - 43;
export const TTOPX = TRASHX - 1;
export const TTOPY = TRASHY - 10;
export const INFODONEX = TRASHX - 12;
export const INFODONEY = TMENUY + TMENUWID + 11;

export const TIMEBLOCK = 1;
export const SCORE = 2;
export const HITPTS = 3;
export const EFFECT = 4;
export const EAMOUNT = 5;
export const MONBIRTH = 6;
export const MONTIME = 7;
export const OBJECT = 8;
export const TRASHCAN = 9;

export const RIGHTKEY = 77;
export const LEFTKEY = 75;
export const UPKEY = 72;
export const DOWNKEY = 80;

// The tool buttons, 10 x 10 two-bit pictures: point, line, box, filled box, circle,
// filled circle, fill (DrawFnBut).
export const FNAR = [
  [0, 0, 0, 85, 80, 21, 85, 65, 85, 84, 21, 165, 65, 90, 84, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 85, 65, 165, 84, 21, 165, 65, 85, 164, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 26, 170, 65, 149, 100, 25, 86, 65, 149, 100, 25, 86, 65, 170, 164, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 26, 170, 65, 170, 164, 26, 170, 65, 170, 164, 26, 170, 65, 170, 164, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 85, 65, 90, 84, 22, 89, 65, 101, 148, 21, 165, 65, 85, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 85, 65, 90, 84, 22, 169, 65, 106, 148, 21, 165, 65, 85, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 170, 160, 42, 170, 130, 170, 168, 42, 170, 130, 170, 168, 42, 170, 130, 170, 168, 58, 170, 192, 255, 240, 0],
];
// up, down, right, left, rotate, h swap, v swap, +, - (DrawKeyBut).
export const KEYAR = [
  [0, 0, 0, 85, 80, 21, 165, 65, 106, 148, 26, 170, 65, 90, 84, 21, 165, 65, 90, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 165, 65, 90, 84, 21, 165, 65, 170, 164, 22, 169, 65, 90, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 101, 65, 86, 148, 26, 170, 65, 170, 164, 21, 105, 65, 86, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 149, 65, 105, 84, 26, 170, 65, 170, 164, 22, 149, 65, 89, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 149, 65, 105, 84, 26, 170, 65, 105, 100, 21, 150, 65, 85, 100, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 101, 65, 170, 148, 21, 101, 65, 89, 84, 22, 170, 65, 89, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 22, 85, 65, 101, 148, 22, 106, 65, 169, 148, 22, 89, 65, 85, 148, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 165, 65, 90, 84, 26, 170, 65, 170, 164, 21, 165, 65, 90, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 85, 65, 85, 84, 26, 170, 65, 170, 164, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240, 0],
];
// The INFO and ANIM buttons, 36 x 11.
export const INFOAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 93, 215, 127, 215, 213, 85, 84, 85, 85, 93, 247,
  117, 93, 117, 85, 85, 85, 85, 93, 255, 127, 93, 117, 85, 85, 85, 85, 93, 223, 117, 93, 117, 85, 85, 149, 85, 93, 215, 117, 87, 213, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128, 0,
];
export const ANIMAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 245, 215, 119, 87, 95, 95, 223, 212, 87, 93, 247, 119,
  223, 117, 215, 93, 85, 87, 253, 255, 119, 255, 127, 215, 95, 85, 87, 93, 223, 119, 119, 117, 215, 93, 85, 151, 93, 215, 119, 87, 117, 215, 95, 214, 21, 85,
  85, 85, 85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128, 0,
];
// "Clear", 25 x 9, shown for the transparent color.
export const CLEARAR = [
  85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 84, 4, 84, 5, 20, 21, 85, 21, 21, 21, 17, 17, 85, 69, 69, 65, 64, 65, 85, 81, 81, 81, 81, 29, 21, 84, 4, 4, 4,
  68, 69, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 64, 0,
];
// A gravity arrow, 16 x 16, drawn rotated for each side.
export const GRAVAR = [
  0, 2, 128, 0, 0, 10, 160, 0, 0, 41, 104, 0, 0, 149, 86, 0, 2, 85, 85, 128, 9, 85, 85, 96, 37, 85, 85, 88, 169, 85, 85, 106, 42, 165, 90, 168, 0, 41, 104, 0,
  0, 9, 96, 0, 0, 9, 96, 0, 0, 9, 96, 0, 0, 9, 96, 0, 0, 9, 96, 0, 0, 2, 128, 0,
];
// The trash can (26 x 35) and its lid (28 x 16).
export const TRASHAR = [
  0, 0, 255, 250, 160, 0, 0, 63, 255, 255, 170, 86, 128, 63, 3, 255, 254, 169, 86, 139, 192, 3, 255, 250, 149, 90, 91, 0, 15, 255, 234, 90, 246, 85, 108, 63,
  250, 170, 243, 105, 85, 85, 86, 170, 172, 54, 151, 213, 85, 90, 178, 195, 105, 127, 85, 181, 172, 44, 54, 151, 229, 108, 218, 14, 195, 105, 126, 86, 9, 160,
  236, 54, 151, 229, 114, 154, 14, 195, 105, 122, 87, 41, 160, 236, 54, 151, 165, 126, 154, 14, 195, 105, 122, 87, 233, 160, 236, 54, 151, 165, 126, 154, 14,
  195, 105, 122, 87, 233, 160, 236, 54, 151, 165, 126, 154, 14, 195, 105, 106, 87, 233, 160, 236, 54, 150, 165, 126, 154, 14, 195, 105, 106, 87, 169, 160, 236,
  54, 150, 165, 122, 154, 14, 195, 105, 106, 87, 169, 160, 236, 54, 150, 165, 122, 154, 62, 195, 105, 106, 87, 169, 163, 236, 54, 150, 165, 122, 154, 62, 195,
  105, 106, 87, 169, 163, 236, 54, 150, 165, 122, 154, 62, 195, 105, 106, 87, 169, 163, 236, 54, 150, 165, 122, 154, 62, 195, 105, 106, 87, 169, 163, 236, 249,
  150, 165, 106, 154, 62, 255, 229, 90, 86, 169, 162, 175, 192, 229, 85, 90, 90, 171, 192, 0, 3, 149, 86, 172, 0, 0,
];
export const CANTOPAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 107, 0, 0, 0, 0, 0, 0, 175, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0,
  0, 28, 0, 0, 0, 0, 0, 58, 90, 191, 0, 0, 3, 255, 213, 106, 171, 255, 0, 63, 165, 170, 106, 191, 255, 240, 106, 85, 106, 170, 255, 255, 235, 85, 170, 170, 170,
  175, 234, 191, 37, 85, 106, 170, 170, 170, 252, 2, 85, 85, 86, 170, 170, 192, 0, 0, 37, 85, 171, 0, 0,
];

/** InBox: inclusive on every side. */
export const inBox = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
export const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
export const d = (n: number, w: number) => String(n).padStart(w);
export const trunc = Math.trunc;

/** The program's own sqrt: the nearest whole root. */
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
  if (Math.abs(squ - x) <= Math.abs(oldsqu - x)) return guess;
  return guess - 1;
}

export const bytes2pal = (b: Uint8Array): RGBdata[] =>
  Array.from({ length: 256 }, (_, i) => ({ red: (b[i * 3] ?? 0) & 63, green: (b[i * 3 + 1] ?? 0) & 63, blue: (b[i * 3 + 2] ?? 0) & 63 }));

/** A block as initalldata leaves it. */
export function newBlock(l1: number): Block {
  return {
    pixels: new Uint8Array(BLEN * BLEN),
    birthMon: LASTMON,
    birthTime: 1,
    xtra: new Uint8Array(2),
    solid: 15,
    hitpt: 0,
    scorePts: 0,
    chHitPt: 0,
    nextBl: l1,
    ntime: 0,
    touchBl: l1,
    grav: 15,
    obj: 0,
    effect: 1,
    eamt: 0,
  };
}

export const copyBlock = (b: Block): Block => ({ ...b, pixels: b.pixels.slice(), xtra: b.xtra.slice() });
