// Tests for saves.ts: a write the browser refuses (quota, abort) must reject, not look saved.
import { afterEach, describe, expect, it, vi } from 'vitest';

/** A tiny IndexedDB: reads find nothing; a readwrite transaction aborts like a full disk. */
function stubFullStorage(): void {
  const fake = {
    open() {
      const req: Record<string, unknown> = {};
      queueMicrotask(() => {
        req.result = {
          transaction(_s: string, mode: string) {
            const tx: Record<string, unknown> = {
              error: new DOMException('full', 'QuotaExceededError'),
              objectStore: () => ({ get: () => ({ result: undefined }), put: () => ({}), delete: () => ({}) }),
            };
            queueMicrotask(() => (mode === 'readwrite' ? (tx.onabort as () => void)() : (tx.oncomplete as () => void)()));
            return tx;
          },
        };
        (req.onsuccess as () => void)();
      });
      return req;
    },
  };
  vi.stubGlobal('indexedDB', fake);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('writeSave', () => {
  it('rejects when the browser aborts the write, and later writes still run', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubFullStorage();
    const { writeSave } = await import('./saves');
    await expect(writeSave('nebula', 'game0.sav', new Uint8Array([1]))).rejects.toBeTruthy();
    await expect(writeSave('nebula', 'game1.sav', new Uint8Array([2]))).rejects.toBeTruthy(); // the queue did not jam
  });
});
