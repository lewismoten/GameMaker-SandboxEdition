// .chr files: two chrstruct records (MAXPLAY = 2) of 3784 bytes each (see code/GM/CHAR.H).
// Playgame only uses the first one; the second is preserved as raw bytes.
import { Reader, Writer } from './binary';

export const MAXSEQ = 20;
export const MAXFRAME = 10;
export const MAXINV = 10;
export const METERS = MAXSEQ + 10;
export const INF_REPEAT = 32767;
export const CHR_RECORD_SIZE = 3784;

export const IDLESEQ = 0;
export const DIESEQ = 1;
export const HURTSEQ = 2;
export const PICKUPSEQ = 3;
export const DROPSEQ = 4;

export const SEQUENCE_NAMES = ['Idle', 'Die', 'Hurt', 'Pick up', 'Drop'];

export interface Frame {
  /** Pixel offset from the previous frame. */
  x: number;
  y: number;
  /** Low nibble: orientation of top block. High nibble: orientation of bottom block. */
  orient: number;
  /** Top block number (CHARBL = none). When pic2 == MONBL, pic1 is the monster to give birth to. */
  pic1: number;
  /** Bottom block number. CHARBL+1 marks the end of the sequence. */
  pic2: number;
  /** Clock ticks (1/18.2 s) to wait before the next frame. */
  pause: number;
  extra: Uint8Array;
}

export interface Sequence {
  frames: Frame[];
  /** Activation key: high byte = PC scan code, low byte = ASCII. */
  key: number;
  /** Sound effect number (>= 30 means none). */
  sound: number;
  on: number;
  /** Background block required in inventory to use this sequence (150 = none). */
  bloc: number;
  /** Non-zero: sequence cannot be interrupted. */
  ground: number;
  /** Joystick button (0 any, 1/2 button, 4 none). */
  jstkBut: number;
  /** Joystick direction (0 none, 1-8 directions, 9 any). */
  jstkMov: number;
  /** Non-zero: one run per key press. */
  norepeat: number;
  /** Non-zero: motion adds to momentum instead of moving directly. */
  momentum: number;
  xtra: Uint8Array;
}

export interface Character {
  sequences: Sequence[];
  x: number[];
  y: number[];
  cframe: number;
  cseq: number;
  inv: Uint8Array;
  /** Repetition counters: 0 hit points, 1 lives, 3 money, 5..19 sequence counters, 20..29 extra. */
  meter: number[];
  /** Raw bytes of the unused second player record. */
  rest: Uint8Array;
}

function readFrame(r: Reader): Frame {
  return { x: r.i16(), y: r.i16(), orient: r.u16(), pic1: r.u16(), pic2: r.u16(), pause: r.u16(), extra: r.bytesOf(5) };
}

function writeFrame(w: Writer, f: Frame): void {
  w.i16(f.x).i16(f.y).u16(f.orient).u16(f.pic1).u16(f.pic2).u16(f.pause).bytes(f.extra, 5);
}

function readSequence(r: Reader): Sequence {
  const frames: Frame[] = [];
  for (let i = 0; i < MAXFRAME; i++) frames.push(readFrame(r));
  return {
    frames,
    key: r.u16(),
    sound: r.i8(),
    on: r.i8(),
    bloc: r.u8(),
    ground: r.i8(),
    jstkBut: r.i8(),
    jstkMov: r.i8(),
    norepeat: r.i8(),
    momentum: r.i8(),
    xtra: r.bytesOf(5),
  };
}

function writeSequence(w: Writer, s: Sequence): void {
  for (const f of s.frames) writeFrame(w, f);
  w.u16(s.key).i8(s.sound).i8(s.on).u8(s.bloc).i8(s.ground).i8(s.jstkBut).i8(s.jstkMov).i8(s.norepeat).i8(s.momentum).bytes(s.xtra, 5);
}

export function parseCharacter(bytes: Uint8Array): Character {
  const r = new Reader(bytes);
  const sequences: Sequence[] = [];
  for (let i = 0; i < MAXSEQ; i++) sequences.push(readSequence(r));
  const x = [r.i16(), r.i16(), r.i16()];
  const y = [r.i16(), r.i16(), r.i16()];
  const cframe = r.i8();
  const cseq = r.i8();
  const inv = r.bytesOf(MAXINV);
  const meter: number[] = [];
  for (let i = 0; i < METERS; i++) meter.push(r.i16());
  const rest = r.bytesOf(CHR_RECORD_SIZE);
  return { sequences, x, y, cframe, cseq, inv, meter, rest };
}

export function serializeCharacter(c: Character): Uint8Array {
  const w = new Writer(CHR_RECORD_SIZE * 2);
  for (const s of c.sequences) writeSequence(w, s);
  for (const v of c.x) w.i16(v);
  for (const v of c.y) w.i16(v);
  w.i8(c.cframe).i8(c.cseq).bytes(c.inv, MAXINV);
  for (const m of c.meter) w.i16(m);
  w.bytes(c.rest, CHR_RECORD_SIZE);
  return w.toBytes();
}

export function emptyFrame(end = false): Frame {
  // CHARBL (50) = no picture; CHARBL+1 (51) in pic2 = end of sequence.
  return { x: 0, y: 0, orient: 0, pic1: 50, pic2: end ? 51 : 50, pause: 1, extra: new Uint8Array(5) };
}

export function newCharacter(): Character {
  const sequences: Sequence[] = [];
  for (let i = 0; i < MAXSEQ; i++) {
    const frames = Array.from({ length: MAXFRAME }, () => emptyFrame(true));
    if (i === IDLESEQ) frames[0] = { ...emptyFrame(), pic1: 0, pic2: 1, pause: 2 };
    sequences.push({ frames, key: 0, sound: 30, on: 0, bloc: 150, ground: 0, jstkBut: 0, jstkMov: 0, norepeat: 0, momentum: 0, xtra: new Uint8Array(5) });
  }
  const meter = new Array(METERS).fill(INF_REPEAT);
  meter[0] = 100; // hit points
  meter[1] = 3; // lives
  // the ten special counters start at 0 (stored +1), as in every character on the CD;
  // left at INF_REPEAT the game would never count them
  for (let i = MAXSEQ; i < METERS; i++) meter[i] = 1;
  return { sequences, x: [0, 0, 0], y: [0, 0, 0], cframe: 0, cseq: 0, inv: new Uint8Array(MAXINV).fill(150), meter, rest: new Uint8Array(CHR_RECORD_SIZE) };
}

/** Number of frames before the end marker. */
export function frameCount(s: Sequence): number {
  const i = s.frames.findIndex((f) => f.pic2 === 51);
  return i < 0 ? MAXFRAME : i;
}
