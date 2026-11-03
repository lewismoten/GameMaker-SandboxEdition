import { describe, expect, it } from 'vitest';
import { BASIC_KEYS, keysAllowed, withKeys } from './keyLimit';
import type { Move } from './inputs';

const move = (...keys: number[][]): Move => ({ name: 'm', steps: keys.map((k) => ({ keys: k, until: 'ticks' as const, max: 1 })) });

describe('keyLimit', () => {
  it('lets every move through unless a run limits the keys', async () => {
    const diagonal = move([0x47]);
    expect(keysAllowed(diagonal)).toBe(true);
    await withKeys(BASIC_KEYS, async () => {
      expect(keysAllowed(diagonal)).toBe(false);
      expect(keysAllowed(move([0x4d], [0x4d, 0x39]))).toBe(true);
      expect(keysAllowed(move([0x4d], [0x2c]))).toBe(false); // Z after a step right
    });
    expect(keysAllowed(diagonal)).toBe(true);
  });
  it('lifts the limit even when the run throws', async () => {
    await expect(withKeys(BASIC_KEYS, () => Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(keysAllowed(move([0x47]))).toBe(true);
  });
});
