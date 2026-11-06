// Fake elapsed time for the existing disk cutoff; native execFile timeout for error provenance.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { afterEach, expect, it, vi } from 'vitest';
import { retrySignal } from '../../scripts/child-signal-retry.mjs';

afterEach(() => vi.restoreAllMocks());

it.each([230_000, 230_001, 240_000])('preserves the disk early-signal cutoff at %i ms', async (elapsed) => {
  let now = 0;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const error = Object.assign(new Error('interrupted'), { signal: 'SIGKILL', code: null, killed: elapsed === 240_000 });
  let attempts = 0;
  const run = async () => {
    attempts++;
    now += elapsed;
    if (attempts === 1) throw error;
    return 'complete';
  };
  if (elapsed <= 230_000) {
    expect(await retrySignal(run, 'disk', 230_000)).toBe('complete');
    expect(attempts).toBe(2);
    expect(log).toHaveBeenCalledTimes(1);
  } else {
    await expect(retrySignal(run, 'disk', 230_000)).rejects.toBe(error);
    expect(attempts).toBe(1);
    expect(log).not.toHaveBeenCalled();
  }
});

it('retries a timeout-shaped extra-stage error once, and preserves a second failure', async () => {
  let now = 0;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const error = Object.assign(new Error('timeout'), { signal: 'SIGTERM', code: null, killed: true });
  let attempts = 0;
  await expect(
    retrySignal(async () => {
      attempts++;
      now += 240_000;
      throw error;
    }, 'extra'),
  ).rejects.toBe(error);
  expect(attempts).toBe(2);
  expect(log).toHaveBeenCalledExactlyOnceWith('Retrying extra: signal SIGTERM, killed true, after 240.0 s; attempt 2/2.');
});

it('does not mistake killed=true without a signal for a retryable interruption', async () => {
  const error = Object.assign(new Error('buffer limit'), { code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER', killed: true });
  const run = vi.fn().mockRejectedValue(error);
  await expect(retrySignal(run, 'extra')).rejects.toBe(error);
  expect(run).toHaveBeenCalledTimes(1);
});

it('keeps shared renders non-retrying and preserves a numeric failure after a signal retry', async () => {
  const signal = Object.assign(new Error('interrupted'), { signal: 'SIGTERM' });
  const render = vi.fn().mockRejectedValue(signal);
  await expect(retrySignal(render, 'render', -1)).rejects.toBe(signal);
  expect(render).toHaveBeenCalledTimes(1);
  const numeric = Object.assign(new Error('real failure'), { code: 7 });
  const run = vi.fn().mockRejectedValueOnce(signal).mockRejectedValueOnce(numeric);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await expect(retrySignal(run, 'extra')).rejects.toBe(numeric);
  expect(run).toHaveBeenCalledTimes(2);
});

it('recovers from a real execFile SIGTERM timeout and records its metadata', async () => {
  const run = promisify(execFile);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  let attempts = 0;
  let interrupted;
  const result = await retrySignal(async () => {
    attempts++;
    try {
      return await run(process.execPath, ['-e', attempts === 1 ? "console.log('ready'); setInterval(() => {}, 1000)" : "console.log('complete')"], {
        timeout: 1000,
      });
    } catch (error) {
      interrupted = error;
      throw error;
    }
  }, 'extra');
  expect(attempts).toBe(2);
  expect(interrupted).toMatchObject({ code: null, signal: 'SIGTERM', killed: true });
  expect(interrupted.stdout).toContain('ready');
  expect(result.stdout).toContain('complete');
  expect(log.mock.calls[0][0]).toMatch(/signal SIGTERM, killed true/);
});
