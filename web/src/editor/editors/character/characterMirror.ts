// Pure helpers for mirroring a hero: a sequence facing the other way (each move's x negated,
// both blocks mirrored), the same frames drawn on new mirrored blocks, and the links the
// editor keeps (in the companion file, never the .chr or .cbl) between a block and its
// mirror and between a sequence and its mirrored twin.
import { BLEN, CHARBL, orientIndex, type Block } from '../../../formats/blocks';
import { frameCount, type Frame, type Sequence } from '../../../formats/character';
import { bottomOrient, composeOrient, firesMonster, normalOrient, topOrient } from './characterLogic';

/** Orientation 4: mirrored left to right. */
export const MIRROR = 4;

/** Two blocks, each the other's picture mirrored left to right. */
export type BlockLink = [number, number];

/** Sequence `to` is `from` facing the other way; `blocks` when it shows new mirrored blocks. */
export interface SeqLink {
  from: number;
  to: number;
  blocks?: boolean;
}

/** The orientation `r` that shows `have` turned into `want`: composeOrient(have, r) === want. */
export function solveOrient(have: number, want: number): number {
  for (let r = 0; r < 8; r++) if (composeOrient(have, r) === normalOrient(want)) return r;
  return 0;
}

/** A block's pixels as orientation `o` shows them (what the game draws). */
export function bakeOrient(px: Uint8Array, o: number): Uint8Array {
  const out = new Uint8Array(px.length);
  for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) out[y * BLEN + x] = px[orientIndex(normalOrient(o), x, y)];
  return out;
}

/** The block linked to `n` as its mirror, if any. */
export function mirrorOf(links: BlockLink[], n: number): number | undefined {
  for (const [a, b] of links) {
    if (a === n) return b;
    if (b === n) return a;
  }
  return undefined;
}

/** One block of a mirrored frame: the same block turned, or its linked mirror block. */
function mirrorPicture(pic: number, o: number, links: BlockLink[] | undefined): [number, number] {
  const want = composeOrient(o, MIRROR);
  const twin = links && pic < CHARBL ? mirrorOf(links, pic) : undefined;
  // the twin is the block baked with orientation 4, so show it turned the rest of the way
  return twin === undefined ? [pic, want] : [twin, solveOrient(MIRROR, want)];
}

/** The frames of `src`, active ones only. */
const active = (src: Sequence): Frame[] => src.frames.slice(0, frameCount(src));

/**
 * The frames of `src` facing the other way: x negated, and both blocks mirrored (or swapped
 * for their linked mirror blocks when `links` is given). A mirror must flip both nibbles, or
 * the head keeps looking the old way. Firing frames are copied as they are.
 */
export function mirrorFrames(src: Sequence, links?: BlockLink[]): Frame[] {
  return active(src).map((f) => {
    const copy = { ...f, extra: f.extra.slice() };
    if (firesMonster(f)) return copy;
    const [pic1, top] = mirrorPicture(f.pic1, topOrient(f), links);
    const [pic2, bottom] = mirrorPicture(f.pic2, bottomOrient(f), links);
    return { ...copy, x: -f.x, pic1, pic2, orient: (bottom << 4) | top };
  });
}

/** True when two frame lists show the same thing (moves, pauses, pictures and turns). */
export function sameFrames(a: Frame[], b: Frame[]): boolean {
  return (
    a.length === b.length &&
    a.every((f, i) => {
      const g = b[i];
      if (f.x !== g.x || f.y !== g.y || f.pic1 !== g.pic1 || f.pic2 !== g.pic2 || f.pause !== g.pause) return false;
      if (firesMonster(f)) return true;
      return normalOrient(topOrient(f)) === normalOrient(topOrient(g)) && normalOrient(bottomOrient(f)) === normalOrient(bottomOrient(g));
    })
  );
}

/** Blocks that look empty (one color throughout) and no frame in `used` shows: free for new pictures. */
export function freeBlocks(blocks: Block[], used: Set<number>): number[] {
  return blocks.map((_, i) => i).filter((i) => i < CHARBL && !used.has(i) && blocks[i].pixels.every((v) => v === blocks[i].pixels[0]));
}

/** Every block a character's frames show. */
export function blocksShown(sequences: Sequence[]): Set<number> {
  const out = new Set<number>();
  for (const s of sequences)
    for (const f of active(s)) {
      if (firesMonster(f)) continue;
      if (f.pic1 < CHARBL) out.add(f.pic1);
      if (f.pic2 < CHARBL) out.add(f.pic2);
    }
  return out;
}

/**
 * New mirror blocks for the blocks `src` shows that have no mirror yet, in free slots:
 * each one is the picture mirrored left to right. Returns the new links and pictures, or
 * the number of free slots missing.
 */
export function planMirrorBlocks(
  src: Sequence,
  blocks: Block[],
  links: BlockLink[],
  used: Set<number>,
): { links: BlockLink[]; pictures: Map<number, Uint8Array> } | { short: number } {
  const need = [...blocksShown([src])].filter((n) => mirrorOf(links, n) === undefined);
  const free = freeBlocks(blocks, used);
  if (need.length > free.length) return { short: need.length - free.length };
  const made: BlockLink[] = [];
  const pictures = new Map<number, Uint8Array>();
  need.forEach((n, k) => {
    made.push([n, free[k]]);
    pictures.set(free[k], bakeOrient(blocks[n].pixels, MIRROR));
  });
  return { links: made, pictures };
}

/** The joystick direction (1 up … 8 up-left, 9 any) facing the other way. */
export const mirrorJoy = (d: number): number => (d >= 2 && d <= 8 ? 10 - d : d);

// scan codes that swap sides: Left/Right (pad 4/6), Home/PgUp (pad 7/9), End/PgDn (pad 1/3), A/D
const KEY_TWINS: [number, number][] = [
  [75, 77],
  [71, 73],
  [79, 81],
  [30, 32],
];

/** A sequence's key (scan << 8 | ascii) facing the other way, or undefined when it has no other side. */
export function mirrorKey(key: number): number | undefined {
  const scan = key >> 8;
  for (const [a, b] of KEY_TWINS) {
    const other = scan === a ? b : scan === b ? a : -1;
    if (other < 0) continue;
    const ascii = key & 0xff;
    // letters keep their ASCII ('a' <-> 'd'); the arrows and pad keys have none
    return (other << 8) | (ascii ? 'asdfghjkl'.charCodeAt(other - 30) : 0);
  }
  return undefined;
}

/** Copies a sequence's settings onto its mirror: sound, the finish/repeat/momentum flags, the object it needs, and the joystick (turned round). */
export function mirrorSettings(src: Sequence, dst: Sequence): void {
  dst.sound = src.sound;
  dst.ground = src.ground;
  dst.norepeat = src.norepeat;
  dst.momentum = src.momentum;
  dst.bloc = src.bloc;
  dst.jstkBut = src.jstkBut;
  dst.jstkMov = mirrorJoy(src.jstkMov);
}
