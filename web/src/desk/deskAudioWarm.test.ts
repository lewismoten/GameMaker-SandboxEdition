// Leaving the desk cancels warmup even after the initial timeout.
import { afterEach, expect, it, vi } from 'vitest';
import { warmDeskAudio } from './deskAudioWarm';

const audioContext = vi.hoisted(() => vi.fn());
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/context', () => ({ audioContext }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  audioContext.mockClear();
});

it.each([false, true])('disposes warmup when idle work has started: %s', async (started) => {
  vi.useFakeTimers();
  const request = vi.fn<(callback: () => void) => number>().mockReturnValue(7);
  const cancel = vi.fn();
  vi.stubGlobal('window', globalThis);
  vi.stubGlobal('requestIdleCallback', request);
  vi.stubGlobal('cancelIdleCallback', cancel);
  const leave = warmDeskAudio();
  vi.advanceTimersByTime(1500);
  const [[idle]] = request.mock.calls;
  if (started) idle();
  leave();
  if (!started) idle();
  await vi.dynamicImportSettled();
  expect(audioContext).not.toHaveBeenCalled();
  if (!started) expect(cancel).toHaveBeenCalledWith(7);
});
