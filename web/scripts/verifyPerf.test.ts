// Exercise the verifier without launching a production build or touching the real baseline.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('node:child_process', async (original) => ({ ...(await original<typeof import('node:child_process')>()), spawnSync: vi.fn() }));
vi.mock('node:fs', async (original) => ({
  ...(await original<typeof import('node:fs')>()),
  mkdtempSync: () => 'scratch',
  readdirSync: () => ['trace-test.json'],
  readFileSync: () => '{"rows":[]}',
  rmSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.resetModules();
});

it('leaves the baseline alone when budget task collection fails during an update', async () => {
  vi.stubGlobal('process', { ...process, argv: [...process.argv, '--port', '5190', '--dist', 'dist', '--update'] });
  vi.mocked(spawnSync).mockImplementation((_command, args) => ({
    status: args?.includes('scripts/perfTasks.ts') ? 1 : 0,
    pid: 1,
    signal: null,
    output: [],
    stdout: Buffer.alloc(0),
    stderr: Buffer.alloc(0),
  }));
  await expect(import('./verifyPerf')).rejects.toThrow('scripts/perfTasks.ts');
  expect(writeFileSync).not.toHaveBeenCalled();
});

it('rejects --runs before measuring when checking existing budgets', async () => {
  vi.stubGlobal('process', { ...process, argv: [...process.argv, '--port', '5190', '--dist', 'dist', '--runs', '2'] });
  await expect(import('./verifyPerf')).rejects.toThrow('--runs requires --update');
  expect(spawnSync).not.toHaveBeenCalled();
});
