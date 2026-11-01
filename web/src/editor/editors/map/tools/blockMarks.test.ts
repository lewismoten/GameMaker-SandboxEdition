import { describe, expect, it } from 'vitest';
import { emptyBlock, SOLBOT, SOLTOP } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { barrierEdges, behaviorOf, behaviors, CLOSED, describeBehavior, Edge } from './blockMarks';

// blocks: 0 open, 1 solid all round, 2 solid on top only (a ledge you jump up through), 3 solid top and bottom
const set = () => {
  const b = [0, 1, 2, 3].map((i) => emptyBlock(i));
  b[1].solid = CLOSED;
  b[2].solid = SOLTOP;
  b[3].solid = SOLTOP | SOLBOT;
  return behaviors(b);
};
const W = 4,
  H = 3;
const grid = (rows: number[][]) => Uint8Array.from(rows.flat());

describe('barrierEdges', () => {
  it('outlines two closed blocks side by side as one, with no line where they join', () => {
    const { top, left } = barrierEdges(
      grid([
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ]),
      set(),
      W,
      H,
    );
    expect(left[1 * W + 2]).toBe(Edge.None); // the join
    expect(left[1 * W + 1]).toBe(Edge.Wall); // outer left
    expect(left[1 * W + 3]).toBe(Edge.Wall); // outer right
    for (const x of [1, 2]) {
      expect(top[1 * W + x]).toBe(Edge.Wall);
      expect(top[2 * W + x]).toBe(Edge.Wall);
    }
    // nothing else on the map
    const count = [...top, ...left].filter(Boolean).length;
    expect(count).toBe(6);
  });

  it('marks a top-only ledge as one-way: it stops the hero coming down into it, not going up', () => {
    const { top, left } = barrierEdges(
      grid([
        [0, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 0, 0],
      ]),
      set(),
      W,
      H,
    );
    expect(top[1 * W + 1]).toBe(Edge.IntoSecond); // above the ledge: blocks entering the ledge (second cell)
    expect(top[2 * W + 1]).toBe(Edge.None); // below: open
    expect(left[1 * W + 1]).toBe(Edge.None);
  });

  it('makes a wall where both facing sides are solid, and wraps around the map edges', () => {
    const { top } = barrierEdges(
      grid([
        [0, 3, 0, 0],
        [0, 3, 0, 0],
        [0, 2, 0, 0],
      ]),
      set(),
      W,
      H,
    );
    expect(top[1 * W + 1]).toBe(Edge.Wall); // bottom of row 0 meets top of row 1
    expect(top[2 * W + 1]).toBe(Edge.Wall); // row 1's bottom and the ledge's top both solid
    expect(top[0 * W + 1]).toBe(Edge.IntoSecond); // wraps: the ledge (row 2) meets row 0, whose top is solid; the ledge's bottom is open
  });
});

describe('behaviorOf', () => {
  it('reads gravity bits, cancelling opposite pulls like MoveCharGrav', () => {
    const b = emptyBlock(5);
    b.grav = 4 | 2;
    expect(behaviorOf(b, 5).pull).toEqual({ x: 1, y: 1 });
    b.grav = 1 | 4 | 8;
    const k = behaviorOf(b, 5);
    expect(k.pull).toEqual({ x: -1, y: 0 });
    expect(k.cancels).toEqual(['y']);
  });

  it('tells touch, pickup and timed blocks apart', () => {
    const b = emptyBlock(7);
    expect(behaviorOf(b, 7)).toMatchObject({ touch: false, pickup: false, timed: false });
    b.scorePts = 10;
    expect(behaviorOf(b, 7).touch).toBe(true);
    b.obj = 1;
    expect(behaviorOf(b, 7)).toMatchObject({ touch: false, pickup: true });
    const t = emptyBlock(8);
    t.nextBl = 9;
    expect(behaviorOf(t, 8).timed).toBe(false); // ntime 0 never changes
    t.ntime = 30;
    expect(behaviorOf(t, 8).timed).toBe(true);
    expect(describeBehavior(t, 8)).toBe('becomes block 9 after 30 ticks');
  });
});
