// The Starters are Sandbox Software's own games, but they are not "Sandbox games" in any count.
import { describe, expect, it } from 'vitest';
import { isSandboxGame } from './files';
import { isStarterGame } from './starter';

const starter = { original: {}, company: 'Sandbox Software', series: 'starter' };
const sandbox = { original: {}, company: 'Sandbox Software' };

describe('the Starters', () => {
  it('are marked by their series', () => {
    expect(isStarterGame(starter)).toBe(true);
    expect(isStarterGame(sandbox)).toBe(false);
    expect(isStarterGame({ series: 'starter' })).toBe(false);
  });

  it('do not count as Sandbox games', () => {
    expect(isSandboxGame(starter)).toBe(false);
    expect(isSandboxGame(sandbox)).toBe(true);
  });
});
