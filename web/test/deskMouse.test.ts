// Tests: The desk mouse (input/deskMouse.ts): rolls reported in screen pixels, fractions kept, buttons.
import { describe, expect, it } from 'vitest';
import { deskMouse, listenDeskMouse, Mickeys } from '../src/input/deskMouse';

describe('desk mouse', () => {
  it('keeps the fractions of a slow roll', () => {
    const m = new Mickeys();
    expect(m.take(0.4, -0.4)).toEqual([0, 0]);
    expect(m.take(0.4, -0.4)).toEqual([0, 0]);
    expect(m.take(0.4, -0.4)).toEqual([1, -1]);
  });

  it('tells listeners until they stop listening', () => {
    const got: number[][] = [];
    const off = listenDeskMouse((dx, dy, b) => got.push([dx, dy, b]));
    deskMouse(3, 4, 1);
    off();
    deskMouse(5, 6, 0);
    expect(got).toEqual([[3, 4, 1]]);
  });
});
