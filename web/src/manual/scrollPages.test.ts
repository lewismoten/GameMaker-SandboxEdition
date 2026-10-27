// scrollPages.ts: the page told as being read is the one showing the most of itself.
import { describe, expect, it } from 'vitest';
import { pageInView } from './scrollPages';

const seen = (...rows: [number, number][]) => new Map(rows);

describe('pageInView', () => {
  it('is nothing when no page is on screen', () => {
    expect(pageInView(seen())).toBeUndefined();
    expect(pageInView(seen([3, 0]))).toBeUndefined();
  });

  it('is the page filling most of the screen', () => {
    expect(pageInView(seen([4, 120], [5, 600]))).toBe(5);
    expect(pageInView(seen([4, 500], [5, 220]))).toBe(4);
  });

  it('is the earlier page on a tie, whatever order they were seen in', () => {
    expect(pageInView(seen([8, 300], [7, 300]))).toBe(7);
    expect(pageInView(seen([7, 300], [8, 300]))).toBe(7);
  });

  it('is a short page shown whole between taller neighbors cut off', () => {
    expect(pageInView(seen([10, 90], [11, 400], [12, 150]))).toBe(11);
  });
});
