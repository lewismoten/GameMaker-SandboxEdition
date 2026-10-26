// Swapping the disk in A: while a program runs: the utilities carry on, the rest quit first.
import { describe, expect, it } from 'vitest';
import { swapsDisks } from './diskSwap';

describe('swapsDisks', () => {
  it('lets the utilities with their own lists keep running', () => {
    for (const k of ['playhack', 'savehack', 'backup', 'gmcrack', 'vpic', 'egg', 'achieve', 'offline'] as const) expect(swapsDisks(k)).toBe(true);
  });
  it('quits games and Game-Maker first, and waits for anything part way through a disk', () => {
    for (const k of ['game', 'gm', 'playgame', 'terminal', 'hexedit', 'install', 'batch'] as const) expect(swapsDisks(k)).toBe(false);
  });
  it('has nothing to keep at the prompt', () => {
    expect(swapsDisks(undefined)).toBe(false);
  });
});
