// A serialized in-memory IDB double exercises separate tab modules, without a browser.
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { emptyCompanion } from './companion';
import type { DownloadGame } from '../editor/shell/download';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
function database(abort = false) {
  const rows = new Map<string, object>();
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
        put: (v: { id?: string }, id = v.id!) => request(() => rows.set(id, structuredClone(v))),
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

it.each(['edited', 'deleted'])('keeps a project %s after the home download chooser opened', async (change) => {
  database();
  const { GameFiles } = await import('./files');
  const { saveProject, loadRecord, deleteProject } = await import('./storage');
  const files = new GameFiles([['test.gam', serializeGame(newGame('Test'))]]);
  await saveProject('test', 'Test', 'test.gam', files);
  vi.doMock('../editor/core/ui', () => ({ h: (_tag: string, attrs: object) => attrs }));
  const { projectDownloadItem } = await import('../editor/shell/projectExport');
  const game = await new Promise<DownloadGame>((resolve) => {
    vi.doMock('../editor/shell/download', () => ({ chooseDownload: resolve }));
    projectDownloadItem('test').onclick!({} as PointerEvent);
  });
  if (change === 'edited') {
    files.set('level.map', Uint8Array.of(7));
    await saveProject('test', 'Edited', 'test.gam', files, { ...emptyCompanion(), gameVersion: '2.0' });
  } else await deleteProject('test');
  const current = await loadRecord('test');
  game.setPreviews!(false);
  const row = await loadRecord('test');
  if (current) expect(row).toEqual({ ...current, companion: { ...current.companion, exportPreviews: false } });
  else expect(row).toBeUndefined();
});
