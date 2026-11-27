// The host check owns its scratch files, while requested snapshot directories belong to the caller.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({ execFileSync: vi.fn(), spawnSync: vi.fn() }));
vi.mock('./pocketRepo', () => ({ pocketRepoDir: 'pocket/', pocketOutDir: 'data/', requirePocketRepo: vi.fn() }));
vi.mock('node:os', () => ({ tmpdir: vi.fn() }));
vi.mock('node:crypto', async (original) => ({
  ...(await original<typeof import('node:crypto')>()),
  createHash: () => ({ update: (name: string) => ({ digest: () => (name === 'playshots480' ? '181f8d5b7e1c2adb' : 'b923b2a0a397e912') }) }),
}));

const scratch = fileURLToPath(new URL('../../.tmp/', import.meta.url));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(['success', 'failure'] as const)('cleans automatic output on %s and keeps requested snapshots', async (mode) => {
  mkdirSync(scratch, { recursive: true });
  const root = mkdtempSync(join(scratch, 'controls-'));
  try {
    const requested = join(root, 'requested');
    mkdirSync(requested);
    vi.stubEnv('GM_PLAYSHOTS_OUT', mode === 'failure' ? requested : undefined);
    vi.mocked(tmpdir).mockReturnValue(root);
    vi.mocked(execFileSync).mockImplementation((file, args) => {
      if (file === 'c++' && Array.isArray(args)) writeFileSync(String(args[args.indexOf('-o') + 1]), '');
      if (basename(file).startsWith('playshots') && Array.isArray(args)) {
        writeFileSync(join(String(args[1]), 'snapshot.png'), '');
        if (mode === 'failure') throw new Error('snapshot failed');
        return Buffer.from(basename(file));
      }
      return Buffer.alloc(0);
    });
    vi.mocked(spawnSync).mockReturnValue({ status: 0, signal: null, output: [], stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), pid: 1 });
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error('exit ' + String(code));
    });
    await expect(import('./pocketControlsCheck')).rejects.toThrow(mode === 'failure' ? 'snapshot failed' : 'exit 0');
    expect(readdirSync(root)).toEqual(['requested']);
    expect(readdirSync(requested)).toEqual(mode === 'failure' ? ['snapshot.png'] : []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
