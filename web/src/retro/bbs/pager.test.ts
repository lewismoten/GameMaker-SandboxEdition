import { describe, expect, it } from 'vitest';
import { dizSummary, Pager, pageKeys, pageLabel, paginate, readNumber, uploadDate } from './pager';
import type { Term } from './term';

/** A terminal that only remembers the lines printed since the last clear. */
function fakeTerm() {
  const lines: string[] = [];
  const screenRef = { cursorX: 0, cursorY: 0, fill: () => lines.splice(0) };
  return { lines, t: { screenRef, line: (l = '') => lines.push(l) } as unknown as Term };
}

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

describe('compact mode', () => {
  const many = Array.from({ length: 26 }, (_, i) => `FILE${i + 1}`);
  const list = (n: number) => ({
    header: (p: number, pages: number, ext: boolean) => [`${ext ? 'EXT' : 'BRIEF'} ${pageLabel(p, pages)}`],
    entries: many.slice(0, n).map((f) => [f, 'line 2', 'line 3', 'line 4', 'line 5', 'line 6', 'line 7', 'line 8']),
    compact: many.slice(0, n).map((f) => f),
    footer: ['legend'],
  });

  it('opens a big area on one line a file, ~15+ to a page, the first files first', () => {
    const { lines, t } = fakeTerm();
    const pager = new Pager(t, list(26));
    expect(pager.extended).toBe(false);
    expect(pager.count).toBe(2);
    pager.show();
    expect(lines.slice(0, 3)).toEqual(['BRIEF Page 1 of 2', 'FILE1', 'FILE2']);
    expect(lines.length).toBeLessThanOrEqual(22);
    expect(pager.keys()).toContain('E|07)xtended');
  });

  it('E switches to the full FILE_ID.DIZ pages at the same file, and back', () => {
    const { lines, t } = fakeTerm();
    const pager = new Pager(t, list(26));
    pager.show();
    expect(pager.turn('N')).toBe(true);
    const first = lines[1];
    expect(pager.turn('E')).toBe(true);
    expect(pager.extended).toBe(true);
    expect(lines[0]).toMatch(/^EXT Page \d+ of 13$/);
    expect(lines).toContain(first);
    expect(pager.turn('E')).toBe(true);
    expect(pager.page).toBe(1);
  });

  it('keeps a small area on its extended pages', () => {
    const { t } = fakeTerm();
    expect(new Pager(t, list(5)).extended).toBe(true);
  });

  it('reads #, V# or R#, and summarizes a DIZ by its title', () => {
    expect([readNumber('3'), readNumber('V12'), readNumber('R1'), readNumber('D1'), readNumber('E')]).toEqual([3, 12, 1, NaN, NaN]);
    expect(dizSummary(['THIRD GOAT FROM THE LEFT              [1/1]', 'x'])).toBe('THIRD GOAT FROM THE LEFT');
    expect(uploadDate('goat', 1995)).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|1\d|2[0-8])-95$/);
    expect(uploadDate('goat', 1995)).toBe(uploadDate('goat', 1995));
  });
});
