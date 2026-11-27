// An incomplete phone kit must fail before the download builder publishes its board ZIP.
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

it('rejects a missing Deluxe programmer image before writing the ZIP', async () => {
  const write = vi.fn();
  const missing = join('deluxe', 'firmware', 'phone.hex');
  vi.doMock('node:fs', () => ({
    existsSync: (path: string) => !path.endsWith(missing) && !path.endsWith('parts.json'),
    // text reads (the Gerber list) name one fabrication file, which statSync reports as present
    readFileSync: (path: string, encoding?: string) => {
      if (path.endsWith(missing)) throw new Error(path);
      return encoding ? 'phone.gbr' : new Uint8Array();
    },
    readdirSync: () => [],
    mkdirSync: vi.fn(),
    statSync: () => ({ isFile: () => true, isDirectory: () => false, size: 1 }),
    rmSync: vi.fn(),
    writeFileSync: write,
  }));
  try {
    await expect(import('../../games/kit/phoneDownloads')).rejects.toThrow(missing);
    expect(write.mock.calls.some(([path]) => String(path).endsWith('phone-circuit-board.zip'))).toBe(false);
  } finally {
    vi.doUnmock('node:fs');
  }
});
