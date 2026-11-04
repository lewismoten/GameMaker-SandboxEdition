import { describe, expect, it } from 'vitest';
import { firstUnusedSlot } from './freeSlot';

describe('firstUnusedSlot', () => {
  it('finds the first unused slot', () => {
    expect(firstUnusedSlot([{ used: 1 }, { used: 0 }, { used: 0 }], 0)).toBe(1);
  });
  it('skips the picked slot even if unused', () => {
    expect(firstUnusedSlot([{ used: 1 }, { used: 0 }, { used: 0 }], 1)).toBe(2);
  });
  it('returns -1 when every slot is used', () => {
    expect(firstUnusedSlot([{ used: 1 }, { used: 1 }], 0)).toBe(-1);
  });
});
