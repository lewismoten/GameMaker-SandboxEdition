import { describe, expect, it } from 'vitest';
import { firstUnusedSlot, noFreeSlotText } from './freeSlot';

const slots = (used: number) => Array.from({ length: 64 }, (_, i) => ({ used: Number(i < used) }));

describe('DOS monster type capacity feedback', () => {
  it('allows a copy below the limit without a failure explanation', () => {
    const mons = slots(63);
    expect(firstUnusedSlot(mons, 0)).toBe(63);
    expect(noFreeSlotText(mons, 0)).toBe('');
  });
  it('explains a full 64-type DOS set without changing it', () => {
    const mons = slots(64);
    const before = structuredClone(mons);
    expect(firstUnusedSlot(mons, 0)).toBe(-1);
    expect(noFreeSlotText(mons, 0)).toBe('DOS Game-Maker holds 64 monster types per set; this set is full. Reuse an existing type or use another monster set.');
    expect(mons).toEqual(before);
  });
  it('explains repeated over-limit attempts without allocating a 65th type', () => {
    const mons = slots(63);
    mons[firstUnusedSlot(mons, 0)] = { ...mons[0] };
    for (let i = 0; i < 2; i++) {
      expect(firstUnusedSlot(mons, 0)).toBe(-1);
      expect(noFreeSlotText(mons, 0)).toContain('64 monster types per set; this set is full');
      expect(mons).toHaveLength(64);
    }
  });
  it('distinguishes the selected-only-unused source from a full set', () => {
    const mons = slots(63);
    expect(firstUnusedSlot(mons, 63)).toBe(-1);
    expect(noFreeSlotText(mons, 63)).toBe(
      'New monster needs an unused slot other than the selected type to hold the copy. DOS Game-Maker holds 64 monster types per set. Select a used type to copy into the remaining unused slot.',
    );
    expect(mons[63].used).toBe(0);
  });
});

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
