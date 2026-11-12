// Nesting: guests land in a hole with the wood gap kept, and nestProblems finds nothing in a placement nest() made.
import { describe, expect, it } from 'vitest';
import { nest, nestProblems, NEST_GAP, type Guest } from '@lewismoten/gamemaker-sandbox-tools/kit/laserNest';
import type { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';

const part = {} as Part;
describe('laserNest', () => {
  it('places small guests in a big hole and keeps the gap', () => {
    const holes = [{ cx: 0, cy: 0, r: 30 }];
    const guests: Guest[] = [10, 8, 6].map((rb, i) => ({ key: `g${i}`, part, rb }));
    const { placed, left } = nest(holes, guests, 0.2);
    expect(placed.length + left.length).toBe(3);
    expect(placed.length).toBeGreaterThan(0);
    expect(nestProblems(holes, placed, 0.2)).toEqual([]);
    expect(NEST_GAP).toBe(2);
  });
  it('leaves a guest that does not fit', () => {
    const { placed, left } = nest([{ cx: 0, cy: 0, r: 5 }], [{ key: 'big', part, rb: 20 }], 0.2);
    expect(placed).toEqual([]);
    expect(left).toHaveLength(1);
  });
});
