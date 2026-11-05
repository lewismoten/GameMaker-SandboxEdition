import { describe, expect, it } from 'vitest';
import { noteNewestMonster, takeNewestMonster } from './newestMonster';

describe('newest monster', () => {
  it('is handed over once, per project', () => {
    const a = {};
    const b = {};
    noteNewestMonster(a, 38);
    expect(takeNewestMonster(b)).toBeUndefined();
    expect(takeNewestMonster(a)).toBe(38);
    expect(takeNewestMonster(a)).toBeUndefined();
  });
});
