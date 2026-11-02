// Achievement hooks use actual Session events, preserving other observers and excluding demos.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
const calls = vi.hoisted(() => ({ outcome: vi.fn(), played: vi.fn(), finished: vi.fn(), unlocked: vi.fn() }));
vi.mock('./goals', () => ({ noteOutcome: calls.outcome, notePlayed: calls.played, noteFinished: calls.finished, noteWatched: vi.fn() }));
vi.mock('./store', () => ({ unlockAchievement: calls.unlocked, tally: vi.fn() }));
import { playAchievements } from './index';

beforeEach(() => vi.clearAllMocks());
const session = (playing = false) => ({ rec: { playing }, game: { scenes: [{}, {}, { desc: 'a level' }] } }) as unknown as Session;

describe('play achievement hooks', () => {
  it('connects the live scene listener and preserves an existing observer', () => {
    const s = session();
    const previous = vi.fn();
    s.onScene = previous;
    const hooks = playAchievements('game:test', 'web');
    hooks.onSession!(s);
    s.onScene(2);
    s.onScene(1);
    expect(previous.mock.calls).toEqual([[2], [1]]);
    expect(calls.played).toHaveBeenCalledWith('game:test');
    expect(calls.finished).toHaveBeenCalledWith('game:test');
  });

  it('counts actual losses and wins, excluding quits and recorded playback', () => {
    const s = session();
    const hooks = playAchievements('game:test', 'web');
    hooks.onSession!(s);
    hooks.onLifeLost!();
    hooks.onPlayEnd!(0, 'lost', 0);
    hooks.onPlayEnd!(0, 'quit', 0);
    hooks.onPlayEnd!(10, 'won', 10);
    expect(calls.outcome.mock.calls).toEqual([
      ['game:test', 'life'],
      ['game:test', 'lost'],
      ['game:test', 'won'],
    ]);
    s.rec = { playing: true } as Session['rec'];
    hooks.onLifeLost!();
    hooks.onPlayEnd!(10, 'won', 10);
    s.onScene!(1);
    expect(calls.outcome).toHaveBeenCalledTimes(3);
    expect(calls.finished).not.toHaveBeenCalled();
    expect(playAchievements('bundle:test', 'web')).toEqual({});
  });
});
