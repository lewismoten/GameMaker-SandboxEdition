import { describe, expect, it } from 'vitest';
import { search, type SearchEntry } from './searchIndex';

const entry = (group: SearchEntry['group'], id: string, ...texts: string[]): SearchEntry => ({
  group,
  id,
  title: id,
  parts: texts.map((text, i) => ({ label: `p${i}`, text })),
});

describe('search grouping', () => {
  const index = [
    entry('files', 'f:intro.txt', 'INTRO.TXT'),
    entry('text', 't:intro.txt', 'Welcome, brave hero', 'Press any key'),
    entry('controls', 'c:ctr20', 'Gold keys'),
    entry('player', 'p:str.menu.quit', 'Quit', 'Quit', 'Leave'),
  ];
  it('groups hits by kind and lists only the parts that matched', () => {
    const r = search(index, ['key']);
    expect(r.text.map((x) => x.hits.map((p) => p.text))).toEqual([['Press any key']]);
    expect(r.controls).toHaveLength(1);
    expect(r.files).toHaveLength(0);
  });
  it('finds a DOS player word by its value or its default', () => {
    expect(search(index, ['quit']).player).toHaveLength(1);
    expect(search(index, ['leave']).player[0].hits[0].label).toBe('p2');
  });
  it('finds nothing for an empty query', () => {
    expect(Object.values(search(index, [])).flat()).toEqual([]);
  });
});
