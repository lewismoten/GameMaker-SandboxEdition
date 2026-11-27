// Check Pocket card mode validation at the CLI before it creates the destination.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('rejects a both-player card without DOS files before creating the card directory', () => {
  const root = mkdtempSync(join(tmpdir(), 'pocket-data-'));
  try {
    const card = join(root, 'card');
    const result = spawnSync(process.execPath, [require.resolve('vite-node/vite-node.mjs'), 'scripts/pocketData.ts', '--gmp', card, '--gmos', '--no-dos'], {
      encoding: 'utf8',
    });
    expect(existsSync(card)).toBe(false);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--gmos requires DOS files and cannot be used with --no-dos');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
