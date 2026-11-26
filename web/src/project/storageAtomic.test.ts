// A serialized in-memory IDB double exercises separate tab modules, without a browser.
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
function database(abort = false) {
  const rows = new Map<string, Record<string, unknown>>();
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
        put: (v: Record<string, unknown>, id = v.id) =>
          request(() => {
            if (typeof id !== 'string') throw new Error('Missing record key');
            return rows.set(id, structuredClone(v));
          }),
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

it('uses the latest project for a Pocket download after an intervening save', async () => {
  database();
  const { putRecord, loadRecord } = await import('./storage');
  const { projectGame } = await import('../editor/shell/projectExport');
  const { emptyCompanion } = await import('./companion');
  const record = { id: 'game', name: 'Game', gam: 'GAME.GAM', updated: 1, files: { 'GAME.GAM': new Uint8Array(330) }, companion: emptyCompanion() };
  await putRecord(record);
  const chooser = await projectGame('game');
  const uid = 'project:12345678-1234-1234-1234-123456789012';
  const edited = {
    ...record,
    name: 'Edited',
    updated: 2,
    files: { ...record.files, 'GAME.MAP': Uint8Array.of(2) },
    companion: { ...record.companion, pocketUid: uid },
  };
  await putRecord(edited);
  expect((await chooser!.pocketContext!()).uid).toBe(uid);
  expect(await loadRecord('game')).toEqual(edited);
});

it('assigns one Pocket identity to simultaneous first downloads', async () => {
  database();
  const { putRecord, loadRecord } = await import('./storage');
  const { projectGame } = await import('../editor/shell/projectExport');
  await putRecord({ id: 'game', name: 'Game', gam: 'GAME.GAM', updated: 1, files: { 'GAME.GAM': new Uint8Array(330) } });
  const [a, b] = await Promise.all([projectGame('game'), projectGame('game')]);
  const [first, second] = await Promise.all([a!.pocketContext!(), b!.pocketContext!()]);
  expect(first.uid).toBe(second.uid);
  expect((await loadRecord('game'))?.companion?.pocketUid).toBe(first.uid);
});
