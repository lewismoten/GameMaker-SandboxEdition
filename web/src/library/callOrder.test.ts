import { describe, expect, it } from 'vitest';
import { compareCall } from './callOrder';

describe('compareCall', () => {
  it('orders by class number, then by author mark with numbers', () => {
    const calls = ['660-GAM TED2', '614-MAH ZZZ', '660-GAM TED', '023-EPH GMS', '660-GAM TED10', '660-GAM ABC'];
    expect(calls.sort(compareCall)).toEqual(['023-EPH GMS', '614-MAH ZZZ', '660-GAM ABC', '660-GAM TED', '660-GAM TED2', '660-GAM TED10']);
  });
});
