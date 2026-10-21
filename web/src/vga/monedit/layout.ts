// MONEDIT.EXE's screen layout, tables and small helpers (the #defines and arrays at the top
// of code/GM/MONEDIT.C), shared by the Monster Maker's layers.
import { type RGBdata } from '../shared/vga';
import { BLEN } from '../shared/facelift';
import { LASTMON, LASTSL, emptyMonster, type Monster } from '../../formats/monster';
import { MONBL } from '../../formats/blocks';

export const BLLEN = 14; // information on location of the graphical list of blocks
export const BLX = 20;
export const BLY = 150;
export const BLX1 = BLX + BLLEN * BLEN;
export const BLY1 = BLY + BLEN;

export const MOLEN = 13; // graphical list of monsters
export const MOX = 32;
export const MOY = 18;
export const MOX1 = MOX + MOLEN * BLEN;
export const MOY1 = MOY + BLEN;

export const SLLEN = 10; // of frames for each monster
export const SLX = 70;
export const SLY = 67;
export const SLX1 = SLX + SLLEN * BLEN;
export const SLY1 = SLY + BLEN;

/**
 * TIME was 200 trips round the edit loop before a held click on a monster became a
 * drag; here the loop runs once a frame, so it counts frames (about 0.4 s).
 */
export const TIME = 24;
export const MX = 90; // coords for buttons
export const MY = 119;
export const HX = MX + 40;
export const HY = MY;
export const IX = MX + 80;
export const IY = MY;
// Make-Path Screen Defines
export const LS = 191; // Box Left Side
export const TS = 46; // Box Top Side
export const PATHHELPFILE = 'pathedit.hlp';
export const OX = 64; // Picture coordinates
export const OY = 107;
export const PHX = 5;
export const PHY = 104;
export const PMX = PHX; // coords for buttons
export const PMY = PHY + 12;
export const TX = 4;
export const TY = 59;
export const TTX = TX + 98;

export const SELX = 123; // Pickmon defines
export const SELY = 90;
export const MOY2 = 40;
export const TBOXX = 37;
export const TBOXY = 145;
export const MX3 = SELX + 40;
export const MY3 = SELY - 3;

export const MONHELPFILE = 'monedit.hlp';

// 2-bit pictures (draw4dat) from MONEDIT.C: DrawFnButs' rotate / flip buttons (10 x 10),
// lightb's lamp under each monster (8 x 7) and infob's Info button (36 x 11).
export const FUNAR = [
  [0, 0, 0, 85, 80, 21, 101, 65, 86, 148, 26, 170, 65, 150, 148, 25, 101, 65, 149, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 101, 65, 170, 148, 21, 101, 65, 89, 84, 22, 170, 65, 89, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 22, 85, 65, 101, 148, 22, 106, 65, 169, 148, 22, 89, 65, 85, 148, 53, 85, 192, 255, 240],
];
export const LIGHTAR = [5, 64, 26, 144, 106, 228, 107, 228, 106, 164, 26, 144, 5, 64];
export const INFOAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 93, 215, 127, 215, 213, 85, 84, 85, 85, 93, 247,
  117, 93, 117, 85, 85, 85, 85, 93, 255, 127, 93, 117, 85, 85, 85, 85, 93, 223, 117, 93, 117, 85, 85, 149, 85, 93, 215, 117, 87, 213, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];

/** An int the C code passed by address (&curmon, &cursel, ...). */
export type Ref = { v: number };

export const pad = (n: number, w: number) => String(n).padStart(w);
export const idiv = (a: number, b: number) => Math.trunc(a / b);

export const bytes2pal = (b: Uint8Array): RGBdata[] =>
  Array.from({ length: 256 }, (_, i) => ({ red: (b[i * 3] ?? 0) & 63, green: (b[i * 3 + 1] ?? 0) & 63, blue: (b[i * 3 + 2] ?? 0) & 63 }));

/** fread of a whole file into a fixed-size buffer: short files leave the rest as it was (zeros here). */
export function padTo(bytes: Uint8Array, size: number): Uint8Array {
  if (bytes.length >= size) return bytes;
  const out = new Uint8Array(size);
  out.set(bytes);
  return out;
}

/** initalldata's monster: all zeros, no frames (each a 5 tick pause), born-monster none. */
export function blankMonster(): Monster {
  const m = emptyMonster();
  m.power = 0;
  m.thru = 0;
  m.pic = Array.from({ length: LASTSL + 1 }, () => [MONBL, 5] as [number, number]);
  m.close = [8, 5];
  m.newmon = LASTMON;
  return m;
}
