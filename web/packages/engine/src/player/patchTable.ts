// What the DOS player customizer offers: the safe and caution entries of the XFERPLAY.EXE patch
// map (Game-Maker 3.00's stand-alone player, cd/gm/xferplay.exe, MD5 fcaf47d5…), each with the
// file offsets it writes and the rules it must keep. Entries the map marks keep (RSD's credits,
// copyright notices) or unsafe (file names, the menu item count, the scan-code table) are left
// out, as are the setup screen and the text-mode start-up messages. Offsets were read from the
// file and checked against PLAYGAME.C (built with TRANSFER) and HISCOREL.C; applyPatches.test.ts
// checks every stock value against the .EXE again. The `play` group is experimental: PLAYGAME.C's
// gameplay #defines (MAXGRAV, GRAVSPEED, ATTACKX/Y, SCRSPDX/Y, SCROLLPERMOVE) and FadeTo's step
// count, each written into every immediate the compiler made of it, and nowhere else.

import { WORDS_PATCHES } from './patchTable.words.data';
import { COLORS_PATCHES } from './patchTable.colors.data';
import { FRAMES_PATCHES } from './patchTable.frames.data';
import { POSITIONS_PATCHES } from './patchTable.positions.data';
import { TIMES_PATCHES } from './patchTable.times.data';
import { KEYS_PATCHES } from './patchTable.keys.data';

/** The editor panel's groups. */
export type PatchGroup = 'words' | 'colors' | 'frames' | 'positions' | 'times' | 'keys' | 'play';

/** The screen a patch shows on, which the panel previews while it is edited ('gameplay': every scene, no preview). */
export type PatchScreen =
  'menu' | 'hiscores' | 'newHiscore' | 'status' | 'load' | 'save' | 'drop' | 'help' | 'text' | 'missing' | 'about' | 'play' | 'gameplay' | 'all';

/**
 * The color targets RGBdata::Match looks for, by name, with the DGROUP offset of each object
 * (what a color selector's push imm16 names).
 */
export const COLOR_TARGETS = { yellow: 0x26f, red: 0x272, blue: 0x275, purple: 0x278, hsRed: 0x15fa, hsBlue: 0x15fd, hsGreen: 0x1600 } as const;
export type ColorName = keyof typeof COLOR_TARGETS;

/** One immediate in the code: its file offset and size (1: imm8, sign-extended; 2: imm16). */
export interface ImmField {
  offset: number;
  size: number;
  /** It holds the value's negative (the -MAXGRAV of `if (tx < -MAXGRAV) tx = -MAXGRAV`). */
  negate?: true;
}

interface Base {
  id: string;
  group: PatchGroup;
  screen: PatchScreen;
  label: string;
  note?: string;
  /** experimental: changes how every scene plays (the `play` group); test it in DOSBox. */
  safety: 'safe' | 'caution' | 'experimental';
  /** The web player shows it too (false: DOS only). */
  web: boolean;
}

/** A NUL-ended string: never longer than `length`, characters 0x20-0x7E; a `format` keeps its % codes. */
export interface TextPatch extends Base {
  kind: 'text' | 'format';
  offset: number;
  length: number;
  stock: string;
}

/** A number in one immediate, or the same number in each of several (`fields`, patched together). */
export interface NumberPatch extends Base {
  kind: 'number';
  fields: ImmField[];
  /** A 1-byte field is a sign-extended push imm8. */
  signed: boolean;
  min: number;
  max: number;
  stock: number;
}

/** A color: red, green and blue (0-63), one byte each. */
interface RgbPatch extends Base {
  kind: 'rgb';
  offsets: [number, number, number];
  stock: [number, number, number];
}

/** Which color target a screen matches (the push imm16 before RGBdata::Match). */
interface SelectPatch extends Base {
  kind: 'select';
  offset: number;
  stock: ColorName;
}

/** A Box(x1, y1, x2, y2) frame. */
export interface FramePatch extends Base {
  kind: 'frame';
  fields: [ImmField, ImmField, ImmField, ImmField];
  stock: [number, number, number, number];
}

/** A function key's entry in DoFunKy's jump table: on (as shipped) or 'off'. */
interface FkeyPatch extends Base {
  kind: 'fkey';
  key: number;
  offset: number;
  stock: number;
}

export type PatchEntry = TextPatch | NumberPatch | RgbPatch | SelectPatch | FramePatch | FkeyPatch;

/** DoFunKy's "does nothing" target: an F-key whose entry jumps here is off. */
export const FKEY_OFF = 0x28f9;

export const PATCHES: PatchEntry[] = [
  ...WORDS_PATCHES,
  ...COLORS_PATCHES,
  ...FRAMES_PATCHES,
  ...POSITIONS_PATCHES,
  ...TIMES_PATCHES,
  ...KEYS_PATCHES,
  ...gameplay(),
];

/** The same-size immediates at `offsets`. */
function imm(size: 1 | 2, ...offsets: number[]): ImmField[] {
  return offsets.map((offset) => ({ offset, size }));
}

/** A clamp `if (v > N) v = N; if (v < -N) v = -N;` of two variables: cmp imm8 then mov imm16, +N then -N, twice. */
function clamp(...offsets: number[]): ImmField[] {
  return offsets.map((offset, i) => ({ offset, size: i % 2 ? 2 : 1, ...(i % 4 >= 2 ? { negate: true as const } : {}) }));
}

/**
 * The experimental gameplay constants: PLAYGAME.C's #defines (lines 65-79) and FadeTo's default
 * step count (PALETTE.H:65-66, 65 pushed at every call). Each lists every immediate the compiler
 * made of its constant; the guide's patching chapter has the same offsets for PLAYGAME.EXE.
 */
function gameplay(): NumberPatch[] {
  const base = { group: 'play', screen: 'gameplay', safety: 'experimental', web: true, kind: 'number' } as const;
  return [
    // MAXGRAV in MoveChar's speed limit (PLAYGAME.C:2484-2487); signed imm8 compares
    {
      ...base,
      id: 'play.maxSpeed',
      label: 'Character top speed',
      note: 'Pixels a move',
      fields: clamp(0xf507, 0xf50d, 0xf512, 0xf518, 0xf51d, 0xf523, 0xf528, 0xf52e),
      signed: true,
      min: 1,
      max: 19,
      stock: 11,
    },
    // MAXGRAV*4, folded to 44, in MoveCharGrav (PLAYGAME.C:3761-3764)
    {
      ...base,
      id: 'play.gravityCap',
      label: 'Gravity top pull',
      note: '0 turns gravity blocks off',
      fields: clamp(0x12651, 0x12658, 0x1265e, 0x12665, 0x1266b, 0x12672, 0x12678, 0x1267f),
      signed: true,
      min: 0,
      max: 127,
      stock: 44,
    },
    // GRAVSPEED: clock >= gclk + GRAVSPEED (PLAYGAME.C:3738), add ax, imm16
    {
      ...base,
      id: 'play.gravityTicks',
      label: 'Gravity step',
      note: 'Ticks between pulls, 18 a second',
      fields: imm(2, 0x124f5),
      signed: false,
      min: 1,
      max: 18,
      stock: 1,
    },
    // ATTACKX, ATTACKY: MonInRange (PLAYGAME.C:2608-2609), cmp ax, imm16
    {
      ...base,
      id: 'play.attackX',
      label: 'Monster attack reach across',
      note: 'Blocks; 0 never attacks',
      fields: imm(2, 0xf851),
      signed: false,
      min: 0,
      max: 100,
      stock: 8,
    },
    {
      ...base,
      id: 'play.attackY',
      label: 'Monster attack reach up and down',
      note: 'Blocks; 0 never attacks',
      fields: imm(2, 0xf866),
      signed: false,
      min: 0,
      max: 100,
      stock: 5,
    },
    // SCRSPDX, SCRSPDY: ChangeScroll's imul imm8 (PLAYGAME.C:3935-3953); past 100 the 16-bit product can overflow
    {
      ...base,
      id: 'play.scrollSpeedX',
      label: 'Scroll speed across',
      note: 'At the screen edge; a move still stops at 28 pixels',
      fields: imm(1, 0x12aaa, 0x12ad7),
      signed: true,
      min: 1,
      max: 100,
      stock: 40,
    },
    {
      ...base,
      id: 'play.scrollSpeedY',
      label: 'Scroll speed up and down',
      note: 'At the screen edge; a move still stops at 28 pixels',
      fields: imm(1, 0x12b08, 0x12b39),
      signed: true,
      min: 1,
      max: 100,
      stock: 40,
    },
    // SCROLLPERMOVE: Movx.Iters, Movy.Iters (PLAYGAME.C:3963, 3967); two ticks keep each draw within one tile carry
    {
      ...base,
      id: 'play.scrollSteps',
      label: 'Scroll smoothing',
      note: 'Timer ticks a scroll move is spread over',
      fields: imm(2, 0x12b8e, 0x12ba0),
      signed: false,
      min: 2,
      max: 60,
      stock: 6,
    },
    // FadeTo's tim at its five calls and FadeAllTo's at its one (push imm8); FadeTo's counters are
    // signed chars that reach tim + 62, so 65 is the most that works
    {
      ...base,
      id: 'play.fadeSteps',
      label: 'Fade length',
      note: 'Steps, 70 a second; 0 cuts at once',
      fields: imm(1, 0xbe71, 0xbf2b, 0xc614, 0xc92a, 0x155d7, 0x1a92c),
      signed: true,
      min: 0,
      max: 65,
      stock: 65,
    },
  ];
}
