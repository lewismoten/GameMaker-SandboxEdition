// The home page's Download chooser for a stored game: its remembered choices (the previews box, the
// Pocket uid) change only the companion and never put back files another tab saved meanwhile.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { DownloadGame } from './download';

let chosen: DownloadGame | undefined;
vi.mock('./download', () => ({ chooseDownload: vi.fn((g: DownloadGame) => ((chosen = g), Promise.resolve())) }));
vi.mock('./downloadButton', () => ({ downloadButton: vi.fn() }));
vi.mock('./homeOrigin', () => ({ isImported: () => false }));
vi.mock('../core/ui', () => ({ toast: vi.fn(), h: (_tag: string, attrs: Record<string, unknown>) => attrs }));

// a serialized in-memory IDB double (keyPath "id" for the projects store)
function database(): Map<string, unknown> {
  const rows = new Map<string, unknown>();
  let queue = Promise.resolve();
  const db = {
    transaction() {
      const requests: { run: () => unknown; req: Record<string, unknown> }[] = [];
      const request = (run: () => unknown) => {
        const req: Record<string, unknown> = {};
        requests.push({ run, req });
        return req;
      };
      const store = {
        get: (id: string) => request(() => structuredClone(rows.get(id))),
        put: (v: { id: string }, key?: string) => request(() => rows.set(key ?? v.id, structuredClone(v))),
      };
      const tx = { objectStore: () => store, oncomplete: () => {}, onerror: () => {}, onabort: () => {}, error: null };
      queue = queue.then(async () => {
        // a request made in a success handler joins the same transaction
        for (let i = 0; i < requests.length; i++) {
          const { run, req } = requests[i];
          req.result = run();
          (req.onsuccess as (() => void) | undefined)?.();
        }
        await Promise.resolve();
        tx.oncomplete();
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
  return rows;
}

const ID = 'mine';
const files = (map: number) => ({ 'game.gam': serializeGame(newGame('Mine')), 'level.map': Uint8Array.of(map) });

async function openChooser(): Promise<{ storage: typeof import('../../project/storage'); game: DownloadGame }> {
  const storage = await import('../../project/storage');
  const { GameFiles } = await import('../../project/files');
  await storage.saveProject(ID, 'Mine', 'game.gam', new GameFiles(Object.entries(files(1))));
  const { projectDownloadItem } = await import('./projectExport');
  (projectDownloadItem(ID) as unknown as { onclick: () => void }).onclick();
  await vi.waitFor(() => expect(chosen).toBeDefined());
  // another tab saves an edit while the chooser is open
  await storage.saveProject(ID, 'Mine', 'game.gam', new GameFiles(Object.entries(files(9))));
  return { storage, game: chosen! };
}

let rows: Map<string, unknown>;
beforeEach(() => {
  chosen = undefined;
  vi.resetModules();
  rows = database();
});
afterEach(() => vi.unstubAllGlobals());

it('keeps the files another tab saved when the previews box is changed (Q455)', async () => {
  const { storage, game } = await openChooser();
  game.setPreviews!(false);
  await vi.waitFor(async () => expect((await storage.loadRecord(ID))?.companion?.exportPreviews).toBe(false));
  const rec = await storage.loadRecord(ID);
  expect([...rec!.files['level.map']]).toEqual([9]);
  expect(rows.size).toBe(1);
});

it('keeps the files another tab saved when the Pocket uid is stored (Q455)', async () => {
  const { storage, game } = await openChooser();
  const { uid } = await game.pocketContext!();
  const rec = await storage.loadRecord(ID);
  expect(rec?.companion?.pocketUid).toBe(uid);
  expect([...rec!.files['level.map']]).toEqual([9]);
});
