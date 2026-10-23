// Runtime state of a scene being played: a TypeScript rendering of playgame's globals
// (ci, chr, mi[], mm[], map[][], blks[], blkmap[], nxtchg[], BlkMon[], scroll…) and
// the cinfo, minfo and ScrollStruct types and #defines from code/GM/PLAYGAME.C.
// Field notes below are taken from the comments in those C declarations.
import { BACKBL, BLEN, CHARBL, MONBL, emptyBlock, type Block } from '../formats/blocks';
import type { Character } from '../formats/character';
import { INF_REPEAT, MAXINV, MAXSEQ, METERS } from '../formats/character';
import { LASTMON, type Monster } from '../formats/monster';
import { LASTMM, MLEN, MWID, type GameMap } from '../formats/map';
import { LASTSND } from '../formats/sound';

export { BLEN, BACKBL, MONBL, CHARBL, LASTMM, LASTMON, MLEN, MWID, MAXSEQ, MAXINV, INF_REPEAT, LASTSND };

export const SIZEX = 320;
export const SIZEY = 200;
export const MAXKEYS = 20;
export const MAXGRAV = 11;
// The view is SCRNBLEN x SCRNBWID blocks of BLEN (20) pixels: 320x200.
export const SCRNBLEN = 16;
export const SCRNBWID = 10;
export const GRAVSPEED = 1;
export const MONMOVESPEED = 1;
export const JSTICKKEY = 1;
export const ATTACKX = 8;
export const ATTACKY = 5;
// Screen coordinate meaning "not on screen" (nothing to draw or erase).
export const OFFSCRN = -100;
export const SCRSPDX = 40;
export const SCRSPDY = 40;
export const SCROLLPERMOVE = 6;
export const MAXMONSSHOWN = 50;
export const CHARPOWER = 100;
// The C's 0xFFFFFFFF ulong "infinite" time for nxtchg[] and BlkMon[].nexttime.
export const NEVER = 0xffffffff;

export interface Coord {
  x: number;
  y: number;
}

/** cinfo: the player's state that persists across scenes. */
export interface CharInfo {
  score: number;
  update: boolean;
  topthere: boolean;
  bottomthere: boolean;
  curtop: number;
  curbottom: number;
  /** Where the character will be on screen next; scrx/scry where it is drawn; oldx/oldy where it is erased. */
  nextx: number;
  nexty: number;
  scrx: number;
  scry: number;
  oldx: number;
  oldy: number;
  /** Delta of the character's last 2 moves. */
  netx: number;
  nety: number;
  /** Current velocity due to gravity. */
  gravx: number;
  gravy: number;
  hitpts: number;
  /** Lives left; -1 before the first scene sets it from the character's meter. */
  lives: number;
  /** Game clock tick at which the character next moves. */
  nextAni: number;
  /** Inventory block numbers (BACKBL+1 in inv[0] = not filled in yet). */
  inv: number[];
  /** Repetition counters, MAXSEQ + 10 of them; meter[0] is hit points, meter[1] lives. */
  meter: number[];
  seqon: boolean[];
}

/** minfo: one live monster. */
export interface MonInfo {
  /** Born from the character, so it can't hurt the character. */
  fromchar: number;
  /** Bresenham's algorithm: dx = (curpos - dest). */
  delta: Coord;
  /** [0] map block, [1] pixel position within the block. */
  curx: [number, number];
  cury: [number, number];
  /** Where the monster is going when on a path. */
  target: Coord;
  /** xy ratios in Bresenham's line algorithm. */
  offl: number;
  offs: number;
  /** 0 normal, 1 attack pattern. */
  curMarch: number;
  /** Index into mon[].pic. */
  curPic: number;
  /** How to flip and rotate the picture. */
  orient: number;
  picDrawn: boolean;
  scrPos: Coord;
  oldPos: Coord;
  /** Index of the next position in the monster's path. */
  dest: number;
  /** Game clock ticks of the next animation frame, next move, and when it was born. */
  nextAni: number;
  nextMove: number;
  birthTime: number;
}

/** mm[]: monster number per slot (LASTMON = empty). */
export interface MonSlot {
  monnum: number;
  curx: number;
  cury: number;
}

export interface KeyStackEntry {
  key: number;
  seq: number;
  frame: number;
}

export interface BresScroll {
  dscroll: number;
  ctr: number;
  iters: number;
}

export interface ScrollState {
  /** Pixel offset of the screen edge within the edge block (mx, my). */
  nx: number;
  ny: number;
  /** How far to move the screen this game tick; negative is up or left. */
  totalx: number;
  totaly: number;
  /** Character's offset from the screen center (pixels; the C comment says blocks). */
  distx: number;
  disty: number;
  /** SOLLEF/SOLRIG/SOLTOP/SOLBOT flags of the directions currently scrolling. */
  inMotion: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  leftStop: number;
  rightStop: number;
  upStop: number;
  downStop: number;
  /** Pixels waiting to be scrolled; whole 4 pixel steps are taken, 0..3 remain as the pan. */
  movx: number;
  movy: number;
  /** 0..3 pixel hardware pan (an absolute position, not a delta). */
  littleShiftx: number;
  littleShifty: number;
  /** 0xff where the scene allows scrolling that way (mirrored from the .gam file). */
  up: number;
  down: number;
  left: number;
  right: number;
  bx: BresScroll;
  by: BresScroll;
}

export interface TouchBlocks {
  blks: [number, number][];
  blknum: number[];
}

export interface SoundHooks {
  /** DoSound: returns true if a sound was started. */
  play(n: number): boolean;
}

export interface World {
  // Loaded scene data
  palette: Uint8Array;
  map: Uint8Array; // block per cell
  mapMon: Uint8Array; // monster slot per cell
  bg: Block[]; // BACKBL + 1
  mblk: Block[]; // MONBL + 1
  cblk: Block[]; // CHARBL + 1
  mon: Monster[];
  chr: Character;
  noMons: boolean;

  // Live state
  ci: CharInfo;
  mi: MonInfo[];
  mm: MonSlot[];
  firstEmptyMM: number;
  monsolid: number;
  mmSolid: number;
  blkMon: { blnum: number; nexttime: number }[];
  /** Per-block "birth this tick" flag (bit 0x4000 of Birthtime in the original). */
  birthFlag: Uint8Array;
  nxtchg: number[];
  blkmap: Uint8Array;
  mx: number;
  my: number;
  scroll: ScrollState;
  clock: number;

  // Keyboard sequencing
  keydn: Uint8Array;
  keystack: KeyStackEntry[];
  keystkptr: number;
  curkey: number;

  // Timers kept as statics in the original
  gclk: number;
  joyOldTime: number;
  joyOldBut: number;

  sound: SoundHooks;
  rand: () => number;
  /** GetJoyPos: position 0 (center) or 1..8 clockwise from up, buttons bit 0/1. */
  joystick?: () => { pos: number; buttons: number } | null;
  jstickOn: boolean;
  /**
   * Not PLAYGAME's: told when the character's touch did something to map cell (x, y), shown as
   * block `bnum` (it changed into its touch block, or was picked up). The web's tin heart
   * tracking listens here; nothing in play reads it.
   */
  onTouched?: (x: number, y: number, bnum: number) => void;
}

export function newCharInfo(): CharInfo {
  return {
    score: 0,
    update: false,
    topthere: false,
    bottomthere: false,
    curtop: CHARBL,
    curbottom: CHARBL,
    nextx: OFFSCRN,
    nexty: OFFSCRN,
    scrx: OFFSCRN,
    scry: OFFSCRN,
    oldx: OFFSCRN,
    oldy: OFFSCRN,
    netx: 5,
    nety: 0,
    gravx: 0,
    gravy: 0,
    hitpts: -1,
    lives: -1,
    nextAni: 0,
    inv: new Array(MAXINV).fill(BACKBL + 1),
    meter: new Array(METERS).fill(-1),
    seqon: new Array(MAXSEQ).fill(false),
  };
}

export function newMonInfo(): MonInfo {
  return {
    fromchar: 0,
    delta: { x: 0, y: 0 },
    curx: [0, 0],
    cury: [0, 0],
    target: { x: 0, y: 0 },
    offl: -1,
    offs: 0,
    curMarch: 0,
    curPic: -1,
    orient: 0,
    picDrawn: false,
    scrPos: { x: OFFSCRN, y: OFFSCRN },
    oldPos: { x: OFFSCRN, y: OFFSCRN },
    dest: 0,
    nextAni: 0,
    nextMove: 0,
    birthTime: 0,
  };
}

export function newScroll(): ScrollState {
  return {
    nx: 0,
    ny: 0,
    totalx: 0,
    totaly: 0,
    distx: 0,
    disty: 0,
    inMotion: 0,
    maxX: 0,
    maxY: 0,
    minX: 0,
    minY: 0,
    leftStop: 0,
    rightStop: 0,
    upStop: 0,
    downStop: 0,
    movx: 0,
    movy: 0,
    littleShiftx: 0,
    littleShifty: 0,
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    bx: { dscroll: 0, ctr: 0, iters: 0 },
    by: { dscroll: 0, ctr: 0, iters: 0 },
  };
}

/** Pads a block list with empty blocks so out-of-range numbers are harmless. */
export function padBlocks(list: Block[] | undefined, count: number): Block[] {
  const out = (list ?? []).slice(0, count);
  while (out.length < count + 1) out.push(emptyBlock(out.length, true));
  return out;
}

/**
 * map[y][x] with C's flat layout: x may run one past the row into the next row. Out
 * of range reads in the helpers below return 0 / LASTMM instead of stray memory.
 */
export function cellIndex(x: number, y: number): number {
  return y * MLEN + x;
}

export function mapBlock(w: World, x: number, y: number): number {
  return w.map[cellIndex(x, y)] ?? 0;
}

export function mapMonAt(w: World, x: number, y: number): number {
  const i = cellIndex(x, y);
  return i >= 0 && i < w.mapMon.length ? w.mapMon[i] : LASTMM;
}

export function setMapMon(w: World, x: number, y: number, v: number): void {
  const i = cellIndex(x, y);
  if (i >= 0 && i < w.mapMon.length) w.mapMon[i] = v;
}

/** blks[0][blkmap[n]]: the currently displayed variant of background block n. */
export function shownBlock(w: World, n: number): Block {
  return w.bg[w.blkmap[n] ?? n] ?? w.bg[BACKBL];
}

export function bgBlock(w: World, n: number): Block {
  return w.bg[n] ?? w.bg[BACKBL];
}

export function createWorld(map: GameMap, sound: SoundHooks, rand = Math.random): World {
  return {
    // 256 VGA colors x 3 (r, g, b), each 0..63.
    palette: new Uint8Array(768),
    map: map.blocks.slice(),
    mapMon: map.mons.slice(),
    bg: padBlocks(undefined, BACKBL),
    mblk: padBlocks(undefined, MONBL),
    cblk: padBlocks(undefined, CHARBL),
    mon: [],
    chr: undefined as unknown as Character,
    noMons: false,
    ci: newCharInfo(),
    mi: Array.from({ length: LASTMM }, newMonInfo),
    mm: map.monsters.map((p) => ({ monnum: p.monnum, curx: p.curx, cury: p.cury })),
    firstEmptyMM: 0,
    monsolid: 0,
    mmSolid: LASTMM,
    blkMon: [],
    birthFlag: new Uint8Array(BACKBL + 1),
    nxtchg: new Array(BACKBL).fill(0),
    blkmap: Uint8Array.from({ length: BACKBL }, (_, i) => i),
    mx: 0,
    my: 0,
    scroll: newScroll(),
    clock: 1,
    keydn: new Uint8Array(128),
    keystack: Array.from({ length: MAXKEYS + 1 }, () => ({ key: 0xff, seq: 0, frame: 0 })),
    keystkptr: 0,
    curkey: 0,
    gclk: 1,
    joyOldTime: 1,
    joyOldBut: 0,
    sound,
    rand,
    jstickOn: true,
  };
}

export const random = (w: World, n: number) => Math.floor(w.rand() * n);
export const sign = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
/** C int (16-bit) wrap. */
export const i16 = (v: number) => ((v << 16) >> 16);
/** C unsigned int (16-bit). */
export const u16 = (v: number) => v & 0xffff;
