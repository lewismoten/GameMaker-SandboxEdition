// Mirroring a hero: orientation composition checked pixel by pixel, both blocks flipped, x
// negated, linked mirror blocks, and the key and joystick swaps.
import { describe, expect, it } from 'vitest';
import { BLEN, CHARBL, MONBL, TRANSPARENT, newBlockSet } from '../../../formats/blocks';
import { MAXFRAME, emptyFrame, type Frame, type Sequence } from '../../../formats/character';
import { composeOrient, flipHOrient } from './characterLogic';
import {
  MIRROR,
  bakeOrient,
  blocksShown,
  freeBlocks,
  mirrorFrames,
  mirrorJoy,
  mirrorKey,
  mirrorOf,
  planMirrorBlocks,
  sameFrames,
  solveOrient,
} from './characterMirror';

/** A block whose every pixel is different, so any turn shows. */
const ramp = () => Uint8Array.from({ length: BLEN * BLEN }, (_, i) => i % 250);
const same = (a: Uint8Array, b: Uint8Array) => a.every((v, i) => v === b[i]);

const frame = (o: Partial<Frame>): Frame => ({ ...emptyFrame(), pic1: 0, pic2: 1, pause: 2, ...o });
function seqOf(list: Frame[]): Sequence {
  const frames = Array.from({ length: MAXFRAME }, (_, i) => list[i] ?? emptyFrame(i === list.length));
  return { frames, key: 0, sound: 30, on: 0, bloc: 150, ground: 0, jstkBut: 0, jstkMov: 0, norepeat: 0, momentum: 0, xtra: new Uint8Array(0) };
}

describe('orientation composition', () => {
  it('composeOrient(o, t) draws o, then t on top', () => {
    const px = ramp();
    for (let o = 0; o < 8; o++) for (let t = 0; t < 8; t++) expect(same(bakeOrient(px, composeOrient(o, t)), bakeOrient(bakeOrient(px, o), t))).toBe(true);
  });
  it('a mirror twice is no mirror', () => {
    for (let o = 0; o < 8; o++) expect(flipHOrient(flipHOrient(o))).toBe(o);
  });
  it('orientation 4 mirrors left to right', () => {
    const px = ramp();
    const m = bakeOrient(px, MIRROR);
    expect(m[0]).toBe(px[BLEN - 1]);
    expect(m[BLEN * 3 + 2]).toBe(px[BLEN * 3 + BLEN - 3]);
  });
  it('solveOrient finds the turn from one orientation to another', () => {
    for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) expect(composeOrient(a, solveOrient(a, b))).toBe(b);
  });
});

describe('mirrorFrames', () => {
  it('negates x and mirrors both blocks (0x00 becomes 0x44)', () => {
    const out = mirrorFrames(seqOf([frame({ x: 3, y: -1, orient: 0 }), frame({ x: 2, orient: 0x21 })]));
    expect(out[0]).toMatchObject({ x: -3, y: -1, orient: 0x44, pic1: 0, pic2: 1, pause: 2 });
    expect(out[1].orient).toBe((composeOrient(2, 4) << 4) | composeOrient(1, 4));
  });
  it('mirrored twice is the walk it started as', () => {
    const src = seqOf([frame({ x: 3, orient: 0x13 }), frame({ x: -1, orient: 0x60 })]);
    expect(sameFrames(mirrorFrames(seqOf(mirrorFrames(src))), src.frames.slice(0, 2))).toBe(true);
  });
  it('copies firing frames as they are', () => {
    const fire = frame({ pic1: 7, pic2: MONBL, x: 4 });
    expect(mirrorFrames(seqOf([fire]))[0]).toMatchObject({ pic1: 7, pic2: MONBL, x: 4 });
  });
  it('shows linked mirror blocks drawn the same as a turned original', () => {
    const blocks = newBlockSet('cbl');
    blocks[0].pixels.set(ramp());
    blocks[1].pixels.set(ramp().reverse());
    const links: [number, number][] = [
      [0, 10],
      [11, 1],
    ];
    for (const [a, b] of links) blocks[b].pixels.set(bakeOrient(blocks[a].pixels, MIRROR));
    for (let o = 0; o < 8; o++) {
      const f = frame({ orient: (o << 4) | o });
      const turned = mirrorFrames(seqOf([f]))[0];
      const linked = mirrorFrames(seqOf([f]), links)[0];
      expect([linked.pic1, linked.pic2]).toEqual([10, 11]);
      const show = (g: Frame, top: boolean) => bakeOrient(blocks[top ? g.pic1 : g.pic2].pixels, top ? g.orient & 15 : g.orient >> 4);
      expect(same(show(linked, true), show(turned, true))).toBe(true);
      expect(same(show(linked, false), show(turned, false))).toBe(true);
    }
  });
});

describe('mirror blocks', () => {
  it('finds links either way round', () => {
    expect(mirrorOf([[3, 9]], 9)).toBe(3);
    expect(mirrorOf([[3, 9]], 4)).toBeUndefined();
  });
  it('plans new blocks only in empty, unused slots', () => {
    const blocks = newBlockSet('cbl');
    blocks[0].pixels.set(ramp());
    blocks[1].pixels.set(ramp());
    blocks[2].pixels[5] = 1; // drawn on: not free
    const src = seqOf([frame({ pic1: 0, pic2: 1 })]);
    const used = blocksShown([src, seqOf([frame({ pic1: 3, pic2: CHARBL })])]);
    expect(freeBlocks(blocks, used).slice(0, 2)).toEqual([4, 5]);
    const plan = planMirrorBlocks(src, blocks, [[1, 20]], used);
    if ('short' in plan) throw new Error('no room');
    expect(plan.links).toEqual([[0, 4]]);
    expect(same(plan.pictures.get(4)!, bakeOrient(blocks[0].pixels, MIRROR))).toBe(true);
    expect(blocks[4].pixels[0]).toBe(TRANSPARENT);
  });
  it('says how many slots are missing', () => {
    const blocks = newBlockSet('cbl').map((b, i) => ({ ...b, pixels: b.pixels.map((_, k) => (k + i) % 9) }));
    expect(planMirrorBlocks(seqOf([frame({})]), blocks, [], new Set([0, 1]))).toEqual({ short: 2 });
  });
});

describe('controls facing the other way', () => {
  it('swaps joystick directions', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(mirrorJoy)).toEqual([0, 1, 8, 7, 6, 5, 4, 3, 2, 9]);
  });
  it('swaps the left and right keys', () => {
    expect(mirrorKey(77 << 8)).toBe(75 << 8);
    expect(mirrorKey((30 << 8) | 97)).toBe((32 << 8) | 100);
    expect(mirrorKey(57 << 8)).toBeUndefined();
  });
});
