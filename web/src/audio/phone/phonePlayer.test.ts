// Optional recordings keep timed captions offline and never substitute browser speech.
import { afterEach, expect, it, vi } from 'vitest';
import { speakLine } from './phonePlayer';
import { speak } from '../voices';
vi.mock('../voices', () => ({ speak: vi.fn() }));
vi.mock('./phoneClips', () => ({ castOf: () => undefined, clipGroupsFor: () => [['one']] }));
vi.mock('../../offline/availability', () => ({ availableOffline: async () => false }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it('keeps a missing clip caption on screen without fetching audio or invoking speech', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('navigator', { onLine: false });
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const missing = vi.fn();
  const run = speakLine('Hello.', 'Hello.', {} as Parameters<typeof speakLine>[2], new AbortController().signal, missing);
  await vi.runAllTimersAsync();
  await run;
  expect(missing).toHaveBeenCalledOnce();
  expect(fetcher).not.toHaveBeenCalled();
  expect(speak).not.toHaveBeenCalled();
});
