// Invalid sampling intervals must fail before the screenshot command touches its output.
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';

it.each(['0', 'oops', '-1', '1.5', '9007199254740992', ''])('rejects interval %j before creating the directory', async (interval) => {
  const scratch = fileURLToPath(new URL('../../../.tmp/', import.meta.url));
  mkdirSync(scratch, { recursive: true });
  const dir = mkdtempSync(join(scratch, 'graduation-'));
  const out = join(dir, 'shots');
  const argv = vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'graduationShots.ts', 'missing-game', out, '', interval]);
  try {
    vi.resetModules();
    await expect(import('./graduationShots')).rejects.toThrow('walkEvery must be a positive safe integer');
    expect(existsSync(out)).toBe(false);
  } finally {
    argv.mockRestore();
    rmSync(dir, { recursive: true, force: true });
  }
});
