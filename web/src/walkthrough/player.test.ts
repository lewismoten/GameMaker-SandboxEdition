// Closing the walkthrough releases both the sound picker and clipboard feedback.
import { afterEach, expect, it, vi } from 'vitest';
import { GameFiles } from '../project/files';
import { demoAudioPicker } from '../media/demoAudio';
import { watchWalkthrough } from './player';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
}

const modalClosed = deferred();
let copyButton: EventTarget & { textContent: string };

vi.mock('../editor/core/ui', () => ({
  h: (_tag: string, attrs: { class?: string } | null, label = '') => {
    const element = Object.assign(new EventTarget(), {
      textContent: label,
      style: {},
      classList: { toggle: vi.fn(), add: vi.fn(), remove: vi.fn() },
      setAttribute: vi.fn(),
      append: vi.fn(),
    });
    if (attrs?.class === 'wt-copy-btn') copyButton = element;
    return element;
  },
  modal: () => modalClosed.promise,
}));
vi.mock('../media/demoAudio', () => ({ demoAudio: () => 'none', demoAudioPicker: vi.fn(), onDemoAudio: () => () => {} }));
vi.mock('./runtime', () => ({
  WalkRun: class {
    start = () => Promise.resolve();
    step = vi.fn();
    stop = vi.fn();
  },
  WalkAudio: class {
    setMuted = vi.fn();
    dispose = vi.fn();
  },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('clears copy feedback on close and ignores a clipboard write that finishes afterward', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const pending = deferred();
  const writeText = vi.fn().mockResolvedValueOnce(undefined).mockReturnValueOnce(pending.promise);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const ready = deferred();
  const watching = watchWalkthrough(
    { id: 'test', title: 'Test', gam: 'TEST.GAM', kind: 'gameware', path: '' },
    () => Promise.resolve(new GameFiles()),
    ready.resolve,
    { version: 1, game: 'test', rand: { seed: 1, per: 'game' }, segments: [], chapters: [], timeline: { fps: 60, frames: 60, chapters: [] } },
    undefined,
    {},
  );
  await Promise.race([ready.promise, watching]);
  const signal = vi.mocked(demoAudioPicker).mock.calls[0][0]?.signal;
  expect(signal?.aborted).toBe(false);
  copyButton.dispatchEvent(new Event('click'));
  await vi.advanceTimersByTimeAsync(0);
  expect(copyButton.textContent).toBe('✓ Copied!');
  expect(vi.getTimerCount()).toBe(1);
  copyButton.dispatchEvent(new Event('click'));
  expect(writeText).toHaveBeenCalledTimes(2);
  modalClosed.resolve();
  await watching;
  expect(signal?.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  pending.resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(vi.getTimerCount()).toBe(0);
});
