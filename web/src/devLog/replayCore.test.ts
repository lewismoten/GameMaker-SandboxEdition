import { describe, expect, it } from 'vitest';
import { decodeInput, hash32, heldRuns, pushInput, sceneRand, snapDiff, type InputStream } from './replayCore';

describe('input stream', () => {
  it('round-trips events across batches in order', () => {
    const a: InputStream = [];
    const b: InputStream = [];
    pushInput(a, 3, 75);
    pushInput(a, 9, 75 | 0x80);
    pushInput(b, 9, 77);
    expect(decodeInput([a, b])).toEqual([
      { clock: 3, scan: 75 },
      { clock: 9, scan: 203 },
      { clock: 9, scan: 77 },
    ]);
  });
  it('ignores a dangling half pair', () => {
    expect(decodeInput([[1, 2, 3]])).toEqual([{ clock: 1, scan: 2 }]);
  });
  it('turns events into held-key runs, one entry per clock', () => {
    const ev = decodeInput([[1, 75, 1, 72, 5, 75 | 0x80, 8, 72 | 0x80]]);
    expect(heldRuns(ev)).toEqual([
      [1, [72, 75]],
      [5, [72]],
      [8, []],
    ]);
  });
});

describe('random numbers and hashes', () => {
  it('gives the same numbers for the same seed and load, different for another load', () => {
    expect(sceneRand(5, 0)()).toBe(sceneRand(5, 0)());
    expect(sceneRand(5, 0)()).not.toBe(sceneRand(5, 1)());
  });
  it('hashes bytes and strings alike', () => {
    expect(hash32('abc')).toBe(hash32(Uint8Array.from([97, 98, 99])));
    expect(hash32('abc')).not.toBe(hash32('abd'));
  });
});

describe('snapshot matching', () => {
  const s = { clock: 40, scene: 2, mx: 10, my: 3, x: 100, y: 80, hp: 5, lives: 3, score: 20 };
  it('matches itself and ignores the clock', () => {
    expect(snapDiff(s, { ...s, clock: 41 })).toEqual([]);
  });
  it('names each field that differs', () => {
    expect(snapDiff(s, { ...s, x: 104, score: 30 })).toEqual(['x 100 -> 104', 'score 20 -> 30']);
  });
});
