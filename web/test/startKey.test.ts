// Tests: The start-of-scene keydn[CHRSEQ.key] = 1 (engine/scene.ts setStartKey, PLAYGAME.C):
// the C indexed the 128 byte keydn array with the whole 16 bit key, so only a key without a
// scan code touched keydn; a real key wrote past the array and left every keydn entry alone.
import { describe, expect, it } from 'vitest';
import { setStartKey } from '../src/engine/scene';

describe('start key', () => {
  it('key 0 (no key) sets keydn[0], so the idle sequence reads its key as held', () => {
    const keydn = new Uint8Array(128);
    setStartKey(keydn, 0);
    expect(keydn[0]).toBe(1);
    expect(keydn.reduce((a, b) => a + b)).toBe(1);
  });

  it('a real key (scan code in the high byte) changes no keydn entry', () => {
    for (const key of [0x3920, 0x4800, 0x4d00, 0x011b, 0x1c0d, 0x0534]) {
      const keydn = new Uint8Array(128);
      setStartKey(keydn, key);
      expect(
        keydn.every((v) => v === 0),
        key.toString(16),
      ).toBe(true);
    }
  });
});
