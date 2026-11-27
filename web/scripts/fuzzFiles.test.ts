// Exercise the malformed-file CLI with a simulated worker that is ready but receives no cases.
import { EventEmitter } from 'node:events';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('node:child_process', async (original) => ({
  ...(await original<typeof import('node:child_process')>()),
  spawn: () => {
    const worker = Object.assign(new EventEmitter(), { send: vi.fn() });
    queueMicrotask(() => worker.emit('message', { ready: true }));
    return worker;
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it.each([
  [['--rounds', 'typo'], /rounds.*positive integer/i],
  [[], /no cases/i],
] as const)('rejects an empty run with arguments %j', async (args, diagnostic) => {
  vi.resetModules();
  vi.stubEnv('FUZZ_CD', '/missing-fuzz-corpus');
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const previous = process.exitCode;
  const previousArgs = process.argv;
  try {
    process.argv = ['node', 'fuzzFiles.ts', '--type', 'gam', ...args];
    await import('./fuzzFiles');
    await vi.waitFor(() => expect(error.mock.calls.length + exit.mock.calls.length).toBeGreaterThan(0));
    expect(error).toHaveBeenCalledWith(expect.stringMatching(diagnostic));
    expect(process.exitCode).toBe(1);
    expect(log.mock.calls.flat().join(' ')).not.toContain('No problems.');
  } finally {
    process.argv = previousArgs;
    process.exitCode = previous;
  }
});
