// A Beams disk without its required title recording must fail the replay audit.
import { basename } from 'node:path';
import { expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  readdirSync: () => ['beams'],
  existsSync: (path: string) => ['about.json', 'disk'].includes(basename(path)),
}));

it.each(['demo', 'all'])('reports the missing Beams recording in %s mode', async (mode) => {
  vi.resetModules();
  const argv = process.argv;
  const exitCode = process.exitCode;
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    process.argv = ['node', 'replayAudit.ts', mode, 'beams'];
    await import('./replayAudit');
    expect(process.exitCode).toBe(1);
    expect(error.mock.calls.flat().join(' ')).toMatch(/beams demo FAIL.*missing demo\.rec/i);
  } finally {
    process.argv = argv;
    process.exitCode = exitCode;
    error.mockRestore();
  }
});
