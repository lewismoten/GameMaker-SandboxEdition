import { describe, expect, it } from 'vitest';
import { pickVertical, searchMove, type Box } from './searchNav';

const box = (col: number, top: number, w = 100): Box => ({ left: col * w, right: col * w + w, top });

describe('search result arrow keys', () => {
  // group A: 4 columns at top 0; group B (heading between): 2 columns of wider cards at top 300
  const boxes = [box(0, 0), box(1, 0), box(2, 0), box(3, 0), box(0, 300, 200), box(1, 300, 200)];
  it('goes down to the card nearest in x across groups with different column counts', () => {
    expect(pickVertical(boxes, 0, 1)).toBe(4);
    expect(pickVertical(boxes, 3, 1)).toBe(5);
    expect(pickVertical(boxes, 2, 1)).toBe(5);
  });
  it('goes up the same way', () => {
    expect(pickVertical(boxes, 4, -1)).toBe(0);
    expect(pickVertical(boxes, 5, -1)).toBe(2); // ties go left
  });
  it('stays put on the first and last rows', () => {
    expect(searchMove('ArrowUp', boxes, 1)).toBe(-1);
    expect(searchMove('ArrowDown', boxes, 5)).toBe(-1);
  });
  it('steps sideways and to the ends in list order', () => {
    expect(searchMove('ArrowRight', boxes, 3)).toBe(4);
    expect(searchMove('ArrowLeft', boxes, 0)).toBe(0);
    expect(searchMove('End', boxes, 0)).toBe(5);
  });
});
