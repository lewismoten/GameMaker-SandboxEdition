// The Starters are Sandbox Software's own games, but they are not "Sandbox games" in any count.
import { describe, expect, it } from 'vitest';
import { isSandboxGame } from './files';
import { byStarterGroup, byStarterOrder, isStarterGame, starterGroupOf, STARTER_GROUPS, STARTER_ORDER } from './starter';

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

  it('are filed in groups, The Basics first, with no id twice and STARTER_ORDER following the groups', () => {
    const ids = STARTER_GROUPS.flatMap((g) => g.games);
    expect(new Set(ids).size).toBe(ids.length);
    expect(STARTER_ORDER).toEqual(ids);
    expect(STARTER_GROUPS[0].name).toBe('The Basics');
    expect(STARTER_ORDER.slice(0, 2)).toEqual(['first-steps', 'keys-and-doors']);
    expect(STARTER_GROUPS.every((g) => g.name && g.tag)).toBe(true);
    expect(starterGroupOf('power-up')).toBe('Moving and Pushing');
    expect(starterGroupOf('nope')).toBeUndefined();
  });

  it('are sorted into their groups, hiding groups with no game and putting an unfiled one last', () => {
    const g = (id: string) => ({ id, title: id });
    const got = byStarterGroup([g('zzz'), g('power-up'), g('keys-and-doors'), g('first-steps')]);
    expect(got.map((x) => [x.name, x.games.map((y) => y.id)])).toEqual([
      ['The Basics', ['first-steps', 'keys-and-doors']],
      ['Moving and Pushing', ['power-up']],
      ['More Starters', ['zzz']],
    ]);
    expect(byStarterGroup([g('first-steps')]).map((x) => x.name)).toEqual(['The Basics']);
  });
});
