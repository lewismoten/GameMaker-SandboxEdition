// Block sets: .bbl (150 background blocks), .mbl (100 monster blocks), .cbl (50 character blocks).
// Each block is a 420 byte blkstruct (see code/GM/BLOC.H).
import { Reader, Writer } from './binary';

export const BLEN = 20;
export const BLOCK_PIXELS = BLEN * BLEN;
export const BLOCK_SIZE = 420;
export const BACKBL = 150;
export const MONBL = 100;
export const CHARBL = 50;
export const TRANSPARENT = 255;

export const SOLTOP = 1;
export const SOLRIG = 2;
export const SOLBOT = 4;
export const SOLLEF = 8;

export type BlockKind = 'bbl' | 'mbl' | 'cbl';
export const BLOCK_COUNTS: Record<BlockKind, number> = { bbl: BACKBL, mbl: MONBL, cbl: CHARBL };

export interface Block {
  /** 20x20 palette indices, row major (y * 20 + x). 255 is transparent for sprites. */
  pixels: Uint8Array;
  /** Monster number to give birth to (background blocks). */
  birthMon: number;
  /** Clock ticks between monster births; 0 = never. */
  birthTime: number;
  xtra: Uint8Array;
  /** Solid sides: SOLTOP | SOLRIG | SOLBOT | SOLLEF. */
  solid: number;
  /** Sides that hurt (unused by playgame, kept for fidelity). */
  hitpt: number;
  /** Score points when touched. */
  scorePts: number;
  /** Hit points added (negative hurts) when touched. */
  chHitPt: number;
  /** Block this one animates into after ntime ticks (== self means never). */
  nextBl: number;
  ntime: number;
  /** Block this one becomes when touched (== self means unchanged). */
  touchBl: number;
  /** Gravity direction bits: 1 up, 2 right, 4 down, 8 left. */
  grav: number;
  /** Non-zero if the character can pick this block up. */
  obj: number;
  /** Which counter is affected: 1 lives, 3 money, 5..19 sequence counters, 20..29 extra counters. */
  effect: number;
  /** Amount the effect counter changes. */
  eamt: number;
}

export function emptyBlock(index: number, transparent = false): Block {
  return {
    pixels: new Uint8Array(BLOCK_PIXELS).fill(transparent ? TRANSPARENT : 0),
    birthMon: 0,
    birthTime: 0,
    xtra: new Uint8Array(2),
    solid: 0,
    hitpt: 0,
    scorePts: 0,
    chHitPt: 0,
    nextBl: index,
    ntime: 0,
    touchBl: index,
    grav: 0,
    obj: 0,
    effect: 0,
    eamt: 0,
  };
}

export function readBlock(r: Reader): Block {
  return {
    pixels: r.bytesOf(BLOCK_PIXELS),
    birthMon: r.u8(),
    birthTime: r.i16(),
    xtra: r.bytesOf(2),
    solid: r.u8(),
    hitpt: r.u8(),
    scorePts: r.i16(),
    chHitPt: r.i16(),
    nextBl: r.u8(),
    ntime: r.i16(),
    touchBl: r.u8(),
    grav: r.i8(),
    obj: r.u8(),
    effect: r.u8(),
    eamt: r.i16(),
  };
}

export function writeBlock(w: Writer, b: Block): void {
  w.bytes(b.pixels, BLOCK_PIXELS)
    .u8(b.birthMon)
    .i16(b.birthTime)
    .bytes(b.xtra, 2)
    .u8(b.solid)
    .u8(b.hitpt)
    .i16(b.scorePts)
    .i16(b.chHitPt)
    .u8(b.nextBl)
    .i16(b.ntime)
    .u8(b.touchBl)
    .i8(b.grav)
    .u8(b.obj)
    .u8(b.effect)
    .i16(b.eamt);
}

export function parseBlocks(bytes: Uint8Array, count: number): Block[] {
  const r = new Reader(bytes);
  const blocks: Block[] = [];
  for (let i = 0; i < count; i++) blocks.push(readBlock(r));
  return blocks;
}

export function serializeBlocks(blocks: Block[]): Uint8Array {
  const w = new Writer(blocks.length * BLOCK_SIZE);
  for (const b of blocks) writeBlock(w, b);
  return w.toBytes();
}

export function newBlockSet(kind: BlockKind): Block[] {
  const transparent = kind !== 'bbl';
  return Array.from({ length: BLOCK_COUNTS[kind] }, (_, i) => emptyBlock(i, transparent));
}

/**
 * Pixel lookup for a block drawn with one of the 8 orientations used by playgame
 * (rotations/mirrors; see Sdrawspbloc in PLAYGAME.C). Returns the source index for
 * destination (x, y).
 */
export function orientIndex(orient: number, x: number, y: number): number {
  const L = BLEN - 1;
  // MEMBLOCA.ASM only looks at the low byte and treats anything above 7 as 7.
  const o = orient & 0xff;
  switch (o > 7 ? 7 : o) {
    case 1:
      return (L - x) * BLEN + y; // p[L-j][k]
    case 2:
      return (L - y) * BLEN + (L - x); // p[L-k][L-j]
    case 3:
      return x * BLEN + (L - y); // p[j][L-k]
    case 4:
      return y * BLEN + (L - x); // p[k][L-j]
    case 5:
      return x * BLEN + y; // p[j][k]
    case 6:
      return (L - y) * BLEN + x; // p[L-k][j]
    case 7:
      return (L - x) * BLEN + (L - y); // p[L-j][L-k]
    default:
      return y * BLEN + x; // p[k][j]
  }
}
