// Input while the browser is waiting for idle postpones thumbnail work.
import { afterEach, expect, it, vi } from 'vitest';
import { whenQuiet } from './yieldNow';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('waits for another quiet interval and idle callback after a key during the idle wait', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('window', new EventTarget());
  const idle = vi.fn<() => void>();
  const callbacks: (() => void)[] = [];
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => callbacks.push(callback));
  const done = whenQuiet(30).then(idle);
  await vi.advanceTimersByTimeAsync(30);
  window.dispatchEvent(new Event('keydown'));
  callbacks.shift()!();
  await vi.advanceTimersByTimeAsync(29);
  expect(idle).not.toHaveBeenCalled();
  expect(callbacks).toHaveLength(0);
  await vi.advanceTimersByTimeAsync(1);
  callbacks.shift()!();
  await done;
});
