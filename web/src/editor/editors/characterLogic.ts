// Pure helpers for the character editor: turning a block's orientation with rotate/flip
// buttons, and editing a sequence's list of frames without breaking its end marker.
import { BLEN, CHARBL, MONBL, orientIndex } from '../../formats/blocks';
import { MAXFRAME, emptyFrame, frameCount, type Frame, type Sequence } from '../../formats/character';

/** The orientation playgame actually draws (MEMBLOCA.ASM treats anything above 7 as 7). */
export const normalOrient = (o: number): number => Math.min(o & 15, 7);

/** The orientation that shows `o` with transform `t` applied on top of it. */
export function composeOrient(o: number, t: number): number {
  const base = normalOrient(o);
  for (let r = 0; r < 8; r++) {
    let same = true;
    for (let y = 0; y < BLEN && same; y++)
      for (let x = 0; x < BLEN && same; x++) {
        const ti = orientIndex(t, x, y);
        same = orientIndex(r, x, y) === orientIndex(base, ti % BLEN, Math.floor(ti / BLEN));
      }
    if (same) return r;
  }
  return base;
}

/** Turn a quarter clockwise. */
export const rotateOrient = (o: number): number => composeOrient(o, 1);
/** Mirror left-to-right. */
export const flipHOrient = (o: number): number => composeOrient(o, 4);
/** Mirror top-to-bottom. */
export const flipVOrient = (o: number): number => composeOrient(o, 6);

/** Plain description of each orientation value 0..7. */
export const ORIENT_NAMES = [
  'Upright',
  'Turned ↻ 90°',
  'Turned 180°',
  'Turned ↺ 90°',
  'Mirrored ↔',
  'Turned ↻ 90°, mirrored ↔',
  'Mirrored ↕',
  'Turned ↻ 90°, mirrored ↕',
];

/** Top block's orientation (low nibble) and bottom's (high nibble). */
export const topOrient = (f: Frame): number => f.orient & 15;
export const bottomOrient = (f: Frame): number => (f.orient >> 4) & 15;
export const withTopOrient = (f: Frame, o: number): number => (f.orient & ~15) | (o & 15);
export const withBottomOrient = (f: Frame, o: number): number => (f.orient & ~0xf0) | ((o & 15) << 4);

/** Replaces the sequence's frames with `list` and an end marker; slots past the marker keep their bytes. */
export function setFrames(seq: Sequence, list: Frame[]): void {
  const n = Math.min(list.length, MAXFRAME);
  const old = seq.frames;
  seq.frames = old.map((f, i) => (i < n ? list[i] : i === n ? { ...emptyFrame(true), extra: f.extra } : f));
}

const activeFrames = (seq: Sequence): Frame[] => seq.frames.slice(0, frameCount(seq));
const copyFrame = (f: Frame): Frame => ({ ...f, extra: f.extra.slice() });

/** Adds a frame after `at` (a copy of it, or a standing pose when the sequence is empty). */
export function insertFrame(seq: Sequence, at: number): boolean {
  const list = activeFrames(seq);
  if (list.length >= MAXFRAME) return false;
  const src = list[at];
  const fresh = src ? { ...copyFrame(src), extra: new Uint8Array(5) } : { ...emptyFrame(), pic1: 0, pic2: 1, pause: 2 };
  list.splice(src ? at + 1 : list.length, 0, fresh);
  setFrames(seq, list);
  return true;
}

export function deleteFrame(seq: Sequence, at: number): void {
  const list = activeFrames(seq);
  if (at < 0 || at >= list.length) return;
  list.splice(at, 1);
  setFrames(seq, list);
}

/** Swaps frame `at` with its neighbour `at + dir`. */
export function moveFrame(seq: Sequence, at: number, dir: -1 | 1): boolean {
  const list = activeFrames(seq);
  const to = at + dir;
  if (at < 0 || to < 0 || at >= list.length || to >= list.length) return false;
  [list[at], list[to]] = [list[to], list[at]];
  setFrames(seq, list);
  return true;
}

/** True when the frame shoots a monster instead of showing pictures. */
export const firesMonster = (f: Frame): boolean => f.pic2 === MONBL;

/** Where the hero ends up after one pass of the sequence (sum of the frame moves). */
export function travel(seq: Sequence): { x: number; y: number } {
  return activeFrames(seq).reduce((a, f) => (firesMonster(f) ? a : { x: a.x + f.x, y: a.y + f.y }), { x: 0, y: 0 });
}

export const hasPicture = (n: number): boolean => n < CHARBL;
