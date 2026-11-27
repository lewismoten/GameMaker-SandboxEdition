// Stored imports repair on a library listing/open, without rewriting files or renamed projects.
import { expect, it, vi } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

it.each(['commit', 'abort', 'throw'])('handles a Library title repair when the write outcome is %s', async (outcome) => {
  vi.resetModules();
  const game = newGame();
  game.scenes[0].desc = '\xb3 JET DRIVER \xb3';
  const raw = { id: 'a', name: '³ JET DRIVER ³', gam: 'jet.gam', files: { 'jet.gam': serializeGame(game) }, updated: 123, extra: 'keep' };
  const rows = new Map([['a', raw]]);
  let puts = 0;
  const request = <T>(run: () => T) => {
    const r: { result?: T; onsuccess?: () => void } = {};
    queueMicrotask(() => {
      r.result = run();
      r.onsuccess?.();
    });
    return r;
  };
  const store = {
    get: (id: string) => request(() => rows.get(id)),
    getAll: () => request(() => [...rows.values()]),
    put: (v: typeof raw) => {
      if (outcome === 'throw') throw new Error('put failed');
      return request(() => {
        puts++;
        if (outcome === 'commit') rows.set(v.id, v);
        return v.id;
      });
    },
  };
  const transaction = () => {
    const tx = { objectStore: () => store, oncomplete: () => {}, onabort: () => {}, abort: vi.fn(), error: new Error('write aborted') };
    setTimeout(() => (outcome === 'abort' || tx.abort.mock.calls.length ? tx.onabort() : tx.oncomplete()), 0);
    return tx;
  };
  vi.stubGlobal('indexedDB', { open: () => request(() => ({ transaction })) });
  try {
    const { listProjects, loadProject, loadRecord } = await import('./storage');
    if (outcome !== 'commit') {
      await expect(listProjects()).rejects.toThrow(outcome === 'abort' ? 'write aborted' : 'put failed');
      expect(rows.get('a')).toEqual(raw);
      return;
    }
    expect((await listProjects())[0].name).toBe('JET DRIVER');
    expect((await loadProject('a'))?.record.name).toBe('JET DRIVER');
    expect((await loadRecord('a'))?.name).toBe('JET DRIVER');
    expect(puts).toBe(1);
    expect(rows.get('a')).toEqual({ ...raw, name: 'JET DRIVER' });
    expect(raw.name).toBe('³ JET DRIVER ³');
  } finally {
    vi.unstubAllGlobals();
  }
});
