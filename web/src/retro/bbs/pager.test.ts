import { describe, expect, it } from 'vitest';
import { pageKeys, pageLabel, paginate } from './pager';

describe('paginate', () => {
  it('fills each page with as many entries as fit, in order', () => {
    expect(paginate([8, 8, 8, 8, 8], 19)).toEqual([[0, 1], [2, 3], [4]]);
    expect(paginate([2, 1, 2, 2, 1], 4)).toEqual([[0, 1], [2, 3], [4]]);
  });
  it('gives an entry taller than a page one of its own', () => {
    expect(paginate([3, 30, 3], 10)).toEqual([[0], [1], [2]]);
  });
  it('always has a page, even with nothing on it', () => {
    expect(paginate([], 19)).toEqual([[]]);
  });
  it('shows the first entries first, whatever the library grows to', () => {
    const pages = paginate(Array(40).fill(8), 19);
    expect(pages[0]).toEqual([0, 1]);
    expect(pages.flat()).toEqual([...Array(40).keys()]);
  });
});

describe('page prompt', () => {
  it('offers only the ways there are pages', () => {
    expect(pageKeys(0, 1)).toBe('');
    expect(pageKeys(0, 3)).toBe('|15N|07)ext, ');
    expect(pageKeys(1, 3)).toBe('|15N|07)ext |15P|07)rev, ');
    expect(pageKeys(2, 3)).toBe('|15P|07)rev, ');
    expect(pageLabel(0, 1)).toBe('');
    expect(pageLabel(1, 3)).toBe('Page 2 of 3');
  });
});
