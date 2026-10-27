// The game "Continue where you left off" shows: the one played or opened last, never one an
// import of several saved last.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetUsed, lastUsed, markUsed } from './projectUse';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe('lastUsed', () => {
  // an import of several saved shorty first and advtest last; nothing was played yet
  const projects = [
    { id: 'advtest', updated: 300 },
    { id: 'shorty', updated: 200 },
    { id: 'mine', updated: 100 },
  ];
  const batched = (id: string) => id !== 'mine';

  it('passes over games an import of several saved, which nobody has used', () => {
    expect(lastUsed(projects, batched)?.id).toBe('mine');
    expect(lastUsed(projects.slice(0, 2), batched)).toBeUndefined();
  });

  it('shows the game played last, though another was saved later', () => {
    markUsed('shorty', 400);
    expect(lastUsed(projects, batched)?.id).toBe('shorty');
    markUsed('mine', 500);
    expect(lastUsed(projects, batched)?.id).toBe('mine');
    forgetUsed('mine');
    expect(lastUsed(projects, batched)?.id).toBe('shorty');
  });

  it('counts a game imported on its own (and opened then) from its last save', () => {
    expect(lastUsed(projects, () => false)?.id).toBe('advtest');
  });
});
