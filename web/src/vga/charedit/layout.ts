// CHAREDIT.EXE's screen layout, tables and small helpers (the #defines and arrays at the top
// of code/GM/CHAREDIT.C, and its initplayer/initalldata), shared by the Character Maker's layers.
import type { Key } from '../../retro/text/textInput';
import { type RGBdata, SIZEX, SIZEY } from '../shared/vga';
import { BLEN } from '../shared/facelift';
import { BACKBL, CHARBL } from '../../formats/blocks';
import {
  CHR_RECORD_SIZE,
  INF_REPEAT,
  MAXFRAME,
  MAXINV,
  MAXSEQ,
  METERS,
  serializeCharacter,
  type Character,
  type Frame,
  type Sequence,
} from '../../formats/character';
import { LASTSND } from '../../formats/sound';
import { SCAN } from '../../input/scancodes';

export const GL = 6; // L-Left, T-Top, G-Grid
export const BLLIST = 14; // BL-Area to show blocks
export const BLX = 20; // LIST-number on screen
export const BLY = 36; // X-Left, Y-Top, X1-Bottom, etc
export const BLX1 = BLX + BLLIST * BLEN - 1;
export const BLY1 = BLY + BLEN;
export const GT = BLY1 + 39;
export const GRIDLEN = 4; // # of blocks on edge of grid
export const GRIDWID = 5; // # of blocks on side of grid
export const GXC = GL + (GRIDLEN * BLEN) / 2; // mouse position to center box in grid
export const GYC = GT + ((GRIDWID - 3) * BLEN) / 2;
export const BX = GL + (GRIDLEN * BLEN - 32) / 2; // x pos. of rotate buttons
export const SL = Math.trunc((SIZEX + GL + GRIDLEN * BLEN) / 2); // Animated Area initial coords
export const ST = Math.trunc((SIZEY + BLY1) / 2) - BLEN;
export const TX = 5;
export const T1 = 5;
export const T2 = T1 + 12;
export const MX = 180; // M- Menu Button
export const MY = T1 + 5;
export const HX = MX + 40; // H- Help Button
export const SX = MX + 80; // S- Shoot Button
export const INVX = (j: number) => 75 + j * (BLEN + 5); // Screen Pos for inventory items.
export const INVY = (k: number) => 79 + k * (BLEN + 5);
export const INVX1 = (j: number) => 74 + BLEN + j * (BLEN + 5);
export const INVY1 = (k: number) => 78 + BLEN + k * (BLEN + 5);
export const HELPFILE = 'charedit.hlp';
export const SELX = 123; // Birthmon defines
export const SELY = 91;
export const MOLEN = 13;
export const MOX = 32;
export const MOY2 = 40;
export const TBOX = (x: number) => 159 - x * 4; // X and Y position of text box (centers text)
export const TBOXY = 145;
export const MX3 = SELX + 40;
export const MY3 = SELY - 3;
export const MX4 = 223;
export const MY4 = 95;
/** delay(DELAY) between a sound's frequencies, in milliseconds (SOUND.H). */
export const DELAY = 7;
/** pic2 of the frame after a sequence's last one. */
export const ENDFR = CHARBL + 1;
/** openmenu's attribute: blue background. */
export const MATTR = 16;

// DrawFnButs' rotate, flip and mirror buttons (10 x 10, 2 bits a pixel) and the Shoot
// button (36 x 11), from the string literals in CHAREDIT.C.
export const FUNAR = [
  [0, 0, 0, 85, 80, 21, 101, 65, 86, 148, 26, 170, 65, 150, 148, 25, 101, 65, 149, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 101, 65, 170, 148, 21, 101, 65, 89, 84, 22, 170, 65, 89, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 22, 85, 65, 101, 148, 22, 106, 65, 169, 148, 22, 89, 65, 85, 148, 53, 85, 192, 255, 240],
];
export const SHOOTAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 87, 247, 93, 125, 95, 127, 245, 84, 85, 93, 87, 93, 215,
  117, 215, 85, 85, 85, 87, 215, 253, 215, 117, 215, 85, 85, 85, 85, 119, 93, 215, 117, 215, 85, 85, 149, 95, 215, 93, 125, 95, 87, 85, 86, 21, 85, 85, 85, 85,
  85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];

export const ZERO = new Uint8Array(BLEN * BLEN);
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const pad = (n: number, w: number) => String(n).padStart(w);
/** sscanf(str,"%d",&temp): the number at the start, or undefined. */
export const scan = (s: string): number | undefined => {
  const m = /^\s*([+-]?\d+)/.exec(s);
  return m ? Number.parseInt(m[1], 10) : undefined;
};

export const cloneFrame = (f: Frame): Frame => ({ ...f, extra: f.extra.slice() });
export const endFrame = (): Frame => ({ x: 0, y: 0, orient: 0, pic1: CHARBL, pic2: ENDFR, pause: 1, extra: new Uint8Array(5) });

/** One player as initalldata() sets it up. */
function initPlayer(): Character {
  const sequences: Sequence[] = Array.from({ length: MAXSEQ }, () => ({
    frames: Array.from({ length: MAXFRAME }, endFrame),
    key: 0,
    sound: LASTSND,
    on: 1,
    bloc: BACKBL,
    ground: 0,
    jstkBut: -1,
    jstkMov: -1,
    norepeat: 0,
    momentum: 0,
    xtra: new Uint8Array(5),
  }));
  const meter = new Array<number>(METERS).fill(0);
  for (let l = 2; l < MAXSEQ; l++) meter[l] = INF_REPEAT;
  for (let l = MAXSEQ; l < MAXSEQ + 10; l++) meter[l] = 1;
  meter[0] = 1;
  sequences[0].jstkMov = 0; // idle should be no button, jstick center.
  sequences[0].jstkBut = 0;
  sequences[1].ground = 2; // fixed: cannot interrupt die sequence.
  sequences[2].ground = 2; // default: cannot interrupt injure sequence.
  return { sequences, x: [0, 0, 0], y: [0, 0, 0], cframe: 0, cseq: 0, inv: new Uint8Array(MAXINV).fill(BACKBL), meter, rest: new Uint8Array(CHR_RECORD_SIZE) };
}

/** initalldata: both players (MAXPLAY = 2); the second is kept as raw bytes. */
export function initalldata(): Character {
  const p = initPlayer();
  p.rest = serializeCharacter(initPlayer()).slice(0, CHR_RECORD_SIZE);
  return p;
}

export const bytes2pal = (b: Uint8Array): RGBdata[] =>
  Array.from({ length: 256 }, (_, i) => ({ red: b[i * 3] ?? 0, green: b[i * 3 + 1] ?? 0, blue: b[i * 3 + 2] ?? 0 }));

/** bioskey(0) for a text-mode key: scan code in the high byte, ASCII in the low. */
export function biosKey(k: Key): number {
  const sc = SCAN[k.code] ?? 0;
  let ascii = 0;
  if (k.alt) ascii = 0;
  else if (k.key.length === 1) {
    const c = k.key.charCodeAt(0) & 0xff;
    ascii = k.ctrl && /[a-z]/i.test(k.key) ? c & 0x1f : c;
  } else ascii = ({ Enter: 13, Escape: 27, Backspace: 8, Tab: 9 } as Record<string, number>)[k.key] ?? 0;
  return (sc << 8) | ascii;
}

/** The name shown for a sequence's activation key (keystr in edit()). */
export function keyName(key: number): string {
  const temp = key & 0xff;
  if (temp !== 0) {
    if (temp === 13) return "'Enter'    ";
    if (temp === 9) return "'Tab'      ";
    if (temp <= 26) return `Control-${String.fromCharCode(temp + 64)}  `;
    return `'${String.fromCharCode(temp)}'        `;
  }
  switch (key) {
    case 0:
      return 'Undefined  ';
    case 18432:
      return 'Up Arrow   ';
    case 19200:
      return 'Left Arrow ';
    case 19712:
      return 'Right Arrow';
    case 20480:
      return 'Down Arrow ';
    case 18688:
      return 'Up-Right   ';
    case 18176:
      return 'Up-Left    ';
    case 20224:
      return 'Down-Left  ';
    case 20736:
      return 'Down-Right ';
    default:
      return `${pad(key > 32767 ? key - 65536 : key, 5)}      `;
  }
}
