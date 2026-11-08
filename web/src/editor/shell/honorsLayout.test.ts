import { describe, expect, it } from 'vitest';
import { honorsLayout } from './honorsLayout';

describe('honorsLayout', () => {
  it('keeps the plain order before the diploma', () => {
    expect(honorsLayout(7, false).map((s) => s.place)).toEqual(Array(7).fill('plain'));
  });
  it('puts the diploma first, three honors left and three right in stage order', () => {
    const l = honorsLayout(7, true);
    expect(l[0]).toEqual({ index: 6, place: 'diploma' });
    expect(l.slice(1).map((s) => [s.index, s.place, s.row])).toEqual([
      [0, 'left', 1],
      [1, 'left', 2],
      [2, 'left', 3],
      [3, 'right', 1],
      [4, 'right', 2],
      [5, 'right', 3],
    ]);
  });
});
