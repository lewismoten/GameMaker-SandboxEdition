// The Starters are Sandbox Software's own games, but they are not "Sandbox games" in any count.
import { describe, expect, it } from 'vitest';
import { isSandboxGame } from './files';
import { byStarterOrder, isStarterGame } from './starter';

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

  it('are listed in learning order, First Steps first, then any others A to Z', () => {
    const g = (id: string, title: string) => ({ id, title });
    const list = [g('room-to-room', 'Room to Room'), g('zzz', 'A New One'), g('first-steps', 'First Steps'), g('keys-and-doors', 'Keys and Doors')];
    expect(byStarterOrder(list).map((x) => x.id)).toEqual(['first-steps', 'keys-and-doors', 'room-to-room', 'zzz']);
  });
});
