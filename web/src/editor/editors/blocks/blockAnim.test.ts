// Block animation chains, timed as PLAYGAME's changeblks.
import { describe, expect, it } from 'vitest';
import { blockAnim, describeAnim } from './blockAnim';

const set = (pairs: [number, number][]) => pairs.map(([nextBl, ntime]) => ({ nextBl, ntime }));

describe('blockAnim', () => {
  it('a still block does not change', () => {
    const a = blockAnim(
      set([
        [0, 0],
        [1, 5],
      ]),
      1,
    );
    expect(a).toEqual({ steps: [{ block: 1, ticks: Infinity }], loopTo: -1 });
    expect(describeAnim(a)).toMatch(/not change/);
    // no time: never starts, even with a next block
    expect(
      blockAnim(
        set([
          [1, 0],
          [0, 3],
        ]),
        0,
      ).steps,
    ).toHaveLength(1);
  });

  it('loops round a chain, each block for its own ticks', () => {
    const a = blockAnim(
      set([
        [1, 4],
        [2, 9],
        [0, 5],
      ]),
      0,
    );
    expect(a.steps).toEqual([
      { block: 0, ticks: 4 },
      { block: 1, ticks: 9 },
      { block: 2, ticks: 5 },
    ]);
    expect(a.loopTo).toBe(0);
    expect(describeAnim(a)).toBe('0 → 1 → 2, then back to 0; 1.0 s around.');
  });

  it('stops at a block that changes into itself', () => {
    const a = blockAnim(
      set([
        [1, 9],
        [1, 0],
      ]),
      0,
    );
    expect(a).toEqual({
      steps: [
        { block: 0, ticks: 9 },
        { block: 1, ticks: Infinity },
      ],
      loopTo: -1,
    });
  });

  it('after a block with no time, every change is one tick', () => {
    const a = blockAnim(
      set([
        [1, 6],
        [2, 0],
        [0, 7],
      ]),
      0,
    );
    expect(a.steps.map((s) => s.ticks)).toEqual([6, 1, 1, 1, 1]);
    expect(a.loopTo).toBe(2);
  });
});
