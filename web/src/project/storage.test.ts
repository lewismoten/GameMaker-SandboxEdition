// Save writes made by Node tests have no browser database and must not warn about one.
import { expect, it, vi } from 'vitest';
import { writeSaveFile } from './storage';

it('leaves save writes quiet when no browser storage exists', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    await writeSaveFile('test', 'score.his', new Uint8Array([1]));
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
