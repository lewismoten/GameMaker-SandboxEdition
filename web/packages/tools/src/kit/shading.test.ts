import { describe, expect, it } from 'vitest';
import { Pixels } from './pixels';
import { rampShift } from './shading';

describe('rampShift', () => {
  it('steps ramp colors where the level is full and leaves other colors and unshaded spots alone', () => {
    const p = new Pixels(4, 1);
    p.px.set([2, 3, 9, 2]);
    rampShift(p, [[1, 2, 3]], -1, (x) => (x < 3 ? 1 : 0));
    expect([...p.px]).toEqual([1, 2, 9, 2]);
  });

  it('stops at the ends of a ramp', () => {
    const p = new Pixels(2, 1);
    p.px.set([1, 3]);
    rampShift(p, [[1, 2, 3]], 1, () => 1);
    expect([...p.px]).toEqual([2, 3]);
  });
});
