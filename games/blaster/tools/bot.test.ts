// The Blaster pilot is deliberately limited to keys a player can use one-handed.
import { describe, expect, it } from 'vitest';
import { BASIC_MOVES, isBasicKey } from './bot';
import { SCAN } from '../src/ids';

describe('the Blaster pilot', () => {
  it('considers only cardinal arrow movement and idling', () => {
    expect(BASIC_MOVES).toEqual([undefined, SCAN.left, SCAN.right, SCAN.up, SCAN.down]);
  });

  it('accepts only arrow, Space and Enter press and release scan codes', () => {
    expect([SCAN.left, SCAN.right, SCAN.up, SCAN.down, SCAN.space, SCAN.enter].every(isBasicKey)).toBe(true);
    expect([SCAN.left, SCAN.right, SCAN.up, SCAN.down, SCAN.space, SCAN.enter].every((key) => isBasicKey(key | 0x80))).toBe(true);
    expect([SCAN.kp7, SCAN.kp9, SCAN.kp1, SCAN.kp3].some(isBasicKey)).toBe(false);
  });
});
