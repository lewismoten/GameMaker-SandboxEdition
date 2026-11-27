// A serialized in-memory IDB double exercises separate tab modules, without a browser.
import { GameFiles } from './files';
import type { ProjectRecord } from './storage';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
function database(abort = false) {
  const rows = new Map<string, Record<string, Uint8Array> | ProjectRecord>();
  const modes: string[] = [];
  let queue = Promise.resolve();
  const db = {
    transaction(_store: string, mode: string) {
      modes.push(mode);
      const requests: { run: () => unknown; req: Record<string, unknown> }[] = [];
      const request = (run: () => unknown) => {
        const req: Record<string, unknown> = {};
        requests.push({ run, req });
        return req;
      };
      const store = {
        get: (id: string) => request(() => structuredClone(rows.get(id))),
        put: (v: Record<string, Uint8Array> | ProjectRecord, id?: string) => request(() => rows.set(id ?? (v as ProjectRecord).id, structuredClone(v))),
        delete: (id: string) => request(() => rows.delete(id)),
      };
      const tx = { objectStore: () => store, oncomplete: () => {}, onabort: () => {}, error: new Error('transaction aborted') };
      queue = queue.then(async () => {
        for (const { run, req } of requests) {
          req.result = run();
          (req.onsuccess as (() => void) | undefined)?.();
        }
        // Requests finish before the transaction commits (or aborts).
        await Promise.resolve();
        if (abort) tx.onabort();
        else tx.oncomplete();
      });
      return tx;
    },
  };
  vi.stubGlobal('indexedDB', {
    open: () => {
      const req = { result: db, onsuccess: () => {} };
      queueMicrotask(() => req.onsuccess());
      return req;
    },
  });
  return { rows, modes };
}

it('keeps unrelated save slots written by separate tab modules in atomic transactions', async () => {
  const { rows, modes } = database();
  vi.resetModules();
  const tabA = await import('./storage');
  vi.resetModules();
  const tabB = await import('./storage');
  await Promise.all([tabA.writeSaveFile('game', 'game0.sav', new Uint8Array([1])), tabB.writeSaveFile('game', 'game1.sav', new Uint8Array([2]))]);
  expect(Object.keys(rows.get('game')!).sort()).toEqual(['game0.sav', 'game1.sav']);
  expect(modes).toEqual(['readwrite', 'readwrite']);
  await tabA.replaceSaveData('game', {});
  await tabB.writeSaveFile('game', 'game2.sav', new Uint8Array([3]));
  expect(Object.keys(rows.get('game')!)).toEqual(['game2.sav']);
});

it('rejects a save replacement when its transaction aborts after request success', async () => {
  database(true);
  vi.resetModules();
  const { replaceSaveData } = await import('./storage');
  await expect(replaceSaveData('game', {})).rejects.toThrow('transaction aborted');
});

it('keeps both checkpoints when two tabs stamp the same project together', async () => {
  database();
  const files = new GameFiles([['room.bbl', Uint8Array.of(1)]]);
  const { saveProject } = await import('./storage');
  await saveProject('game', 'Game', 'game.gam', files);
  const tabA = await import('./checkpoint');
  vi.resetModules();
  const tabB = await import('./checkpoint');
  await Promise.all([tabA.makeCheckpoint('game', 'First', files), tabB.makeCheckpoint('game', 'Second', files)]);
  expect((await tabA.getCheckpoints('game')).map((cp) => cp.name).sort()).toEqual(['First', 'Second']);
});
