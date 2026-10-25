// How tight a walkthrough's key changes are (pace.ts).
import { describe, expect, it } from 'vitest';
import { encodeKeys, keysAt } from '../../../walkthrough/format';
import { measurePace } from './pace';

const UP = 72;
const RIGHT = 77;
const up = (k: number) => k | 0x80;

describe('a walkthrough’s pace', () => {
  it('finds the shortest gap, keys held together and the shortest press', () => {
    const keys = keysAt([
      { tick: 10, key: RIGHT },
      { tick: 12, key: UP }, // two held together from tick 12
      { tick: 13, key: up(UP) }, // a press of one tick
      { tick: 20, key: up(RIGHT) },
      { tick: 20, key: UP }, // let go and press at the same tick
      { tick: 40, key: up(UP) },
    ]);
    const p = measurePace({ segments: [{ scene: 3, keys: encodeKeys(keys) }] });
    expect(p.events).toBe(6);
    expect(p.sameTick).toBe(1);
    expect(p.together).toBe(1);
    expect(p.longestTogether).toMatchObject({ scene: 3, tick: 12, ticks: 1 });
    expect(p.minHold).toMatchObject({ scene: 3, tick: 12, ticks: 1 });
    expect(p.minGap).toMatchObject({ scene: 3, tick: 13, ticks: 1 });
    // gaps of 2, 1 and 7 ticks are under 300 ms (5.5 ticks) but for the 7; the 20-tick one isn't
    expect(p.quick).toBe(2);
    expect(p.tightest.map((m) => m.ticks)).toEqual([1, 2, 7, 20]);
  });
});
