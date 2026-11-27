// Worker startup must settle even when the child never sends its ready message.
import { ChildProcess } from 'node:child_process';
import { afterEach, expect, it, vi } from 'vitest';
import { waitForReady } from './fuzzWorker';

afterEach(() => vi.useRealTimers());

it.each(['exit', 'error', 'timeout'])('rejects and tears down a worker on startup %s', async (reason) => {
  vi.useFakeTimers();
  const worker = new ChildProcess();
  const kill = vi.spyOn(worker, 'kill').mockReturnValue(true);
  const ready = waitForReady(worker, 100);
  if (reason === 'exit') worker.emit('exit', 23, null);
  if (reason === 'error') worker.emit('error', new Error('spawn failed'));
  vi.advanceTimersByTime(100);
  await expect(ready).rejects.toThrow(/worker/i);
  expect(kill).toHaveBeenCalled();
});

it('cancels the startup deadline when ready', async () => {
  vi.useFakeTimers();
  const worker = new ChildProcess();
  const kill = vi.spyOn(worker, 'kill');
  const ready = waitForReady(worker, 100);
  worker.emit('message', { ready: true });
  await ready;
  vi.advanceTimersByTime(100);
  expect(kill).not.toHaveBeenCalled();
});
