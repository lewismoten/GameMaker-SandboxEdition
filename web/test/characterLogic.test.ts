// Tests: The character editor's pure helpers (editors/character/characterLogic.ts): turning blocks and editing frame lists.
import { describe, expect, it } from 'vitest';
import {
  composeOrient,
  deleteFrame,
  flipHOrient,
  flipVOrient,
  insertFrame,
  mirroredFrames,
  moveFrame,
  normalOrient,
  rotateOrient,
  setFrames,
  travel,
  withBottomOrient,
  withTopOrient,
} from '../src/editor/editors/character/characterLogic';
import { MAXFRAME, emptyFrame, frameCount, newCharacter } from '../src/formats/character';

describe('orientation buttons', () => {
  it('rotates a quarter turn clockwise through all four turns', () => {
    expect([0, 1, 2, 3].map(rotateOrient)).toEqual([1, 2, 3, 0]);
  });
  it('flips match the playgame orientation numbers', () => {
    expect(flipHOrient(0)).toBe(4);
    expect(flipVOrient(0)).toBe(6);
    expect(flipHOrient(4)).toBe(0);
    expect(flipVOrient(6)).toBe(0);
    expect(flipVOrient(flipHOrient(0))).toBe(2);
    expect(composeOrient(1, 4)).toBe(5);
    expect(composeOrient(1, 6)).toBe(7);
  });
  it('every orientation reaches all eight by the three buttons', () => {
    for (let o = 0; o < 8; o++) {
      const seen = new Set<number>([o]);
      const queue = [o];
      while (queue.length) {
        const c = queue.pop()!;
        for (const n of [rotateOrient(c), flipHOrient(c), flipVOrient(c)]) if (!seen.has(n)) (seen.add(n), queue.push(n));
      }
      expect(seen.size).toBe(8);
    }
  });
  it('treats values above 7 as 7, like MEMBLOCA.ASM', () => {
    expect(normalOrient(12)).toBe(7);
  });
  it('sets one nibble without touching the other', () => {
    const f = { ...emptyFrame(), orient: 0x35 };
    expect(withTopOrient(f, 2)).toBe(0x32);
    expect(withBottomOrient(f, 6)).toBe(0x65);
  });
});

describe('frame list editing', () => {
  it('inserts, moves and deletes while keeping the end marker', () => {
    const seq = newCharacter().sequences[0];
    expect(frameCount(seq)).toBe(1);
    seq.frames[0].x = 3;
    expect(insertFrame(seq, 0)).toBe(true);
    seq.frames[1].x = 7;
    expect(frameCount(seq)).toBe(2);
    expect(travel(seq)).toEqual({ x: 10, y: 0 });
    expect(moveFrame(seq, 0, 1)).toBe(true);
    expect(seq.frames.map((f) => f.x).slice(0, 2)).toEqual([7, 3]);
    expect(moveFrame(seq, 1, 1)).toBe(false);
    deleteFrame(seq, 0);
    expect(frameCount(seq)).toBe(1);
    expect(seq.frames[0].x).toBe(3);
    expect(seq.frames).toHaveLength(MAXFRAME);
  });
  it('stops at ten frames and starts an empty sequence with a standing pose', () => {
    const seq = newCharacter().sequences[7];
    expect(frameCount(seq)).toBe(0);
    insertFrame(seq, 0);
    expect(seq.frames[0].pic1).toBe(0);
    expect(seq.frames[0].pic2).toBe(1);
    for (let i = 0; i < 20; i++) insertFrame(seq, 0);
    expect(frameCount(seq)).toBe(MAXFRAME);
    expect(insertFrame(seq, 0)).toBe(false);
  });
});

describe('mirroredFrames', () => {
  it('turns a walk right into a walk left', () => {
    const c = newCharacter();
    const right = c.sequences[5];
    const f = (x: number, orient: number) => ({ x, y: -2, orient, pic1: 0, pic2: 1, pause: 3, extra: new Uint8Array(5) });
    setFrames(right, [f(4, 0), f(4, 1 | (2 << 4))]);
    const left = mirroredFrames(right);
    expect(left.map((x) => x.x)).toEqual([-4, -4]);
    expect(left.map((x) => x.y)).toEqual([-2, -2]);
    expect(left[0].orient).toBe(4 | (4 << 4));
    expect(left[1].orient & 15).toBe(flipHOrient(1));
    expect(left[1].orient >> 4).toBe(flipHOrient(2));
    // the source is untouched
    expect(right.frames[0].x).toBe(4);
  });
});
