import { describe, expect, it } from 'vitest';
import { actionPages, MAX_ACTIONS } from './actionPages';

describe('actionPages', () => {
  it('keeps up to six keys on one page, with no More button', () => {
    expect(actionPages([])).toEqual([[]]);
    expect(actionPages([57, 34, 35, 36, 37, 38])).toEqual([[57, 34, 35, 36, 37, 38]]);
  });
  it('pages seven or more keys by five, each page getting a sixth button for More', () => {
    const keys = Array.from({ length: 13 }, (_, i) => 10 + i);
    const pages = actionPages(keys);
    expect(pages.map((p) => p.length)).toEqual([5, 5, 3]);
    expect(pages.flat()).toEqual(keys);
    expect(pages.every((p) => p.length + 1 <= MAX_ACTIONS)).toBe(true);
  });
  it('reaches every key whatever the count', () => {
    for (let n = 0; n < 30; n++) {
      const keys = Array.from({ length: n }, (_, i) => i + 1);
      expect(actionPages(keys).flat()).toEqual(keys);
    }
  });
});
