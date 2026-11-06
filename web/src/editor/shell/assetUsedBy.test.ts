import { describe, expect, it } from 'vitest';
import { scenesUsing, usedByShort, usedByText } from './assetUsedBy';

describe('Overview used-by line', () => {
  const uses: Record<string, { scene: number }[]> = {
    'a.bbl': [{ scene: 0 }, { scene: 1 }],
    'b.bbl': [{ scene: 1 }, { scene: 2 }, { scene: 2 }],
    'c.bbl': [],
  };
  const usesOf = (f: string) => uses[f] ?? [];
  it('counts each scene once across a category', () => {
    expect(scenesUsing(['a.bbl', 'b.bbl', 'c.bbl'], usesOf)).toBe(3);
    expect(scenesUsing(['c.bbl'], usesOf)).toBe(0);
    expect(scenesUsing([], usesOf)).toBe(0);
  });
  it('words it, and stays silent for none', () => {
    expect(usedByText(1)).toBe('used by 1 scene');
    expect(usedByText(3)).toBe('used by 3 scenes');
    expect(usedByText(0)).toBe('');
    expect(usedByShort(1)).toBe('1 scene');
    expect(usedByShort(12)).toBe('12 scenes');
    expect(usedByShort(0)).toBe('');
  });
});
