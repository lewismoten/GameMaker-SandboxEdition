import { describe, expect, it } from 'vitest';
import { playSpot } from './playSpot';

describe('playSpot', () => {
  it('floors the middle of the view to a cell', () => {
    expect(playSpot({ x: 10.9, y: 4.2 }, 100, 50)).toEqual({ x: 10, y: 4 });
  });
  it('stays on the map', () => {
    expect(playSpot({ x: -3, y: 80 }, 100, 50)).toEqual({ x: 0, y: 49 });
    expect(playSpot({ x: 100.5, y: 0 }, 100, 50)).toEqual({ x: 99, y: 0 });
  });
});
