// Recorded phone playback and its online and offline fallbacks.
import { afterEach, expect, it, vi } from 'vitest';
import { audioContext } from '@lewismoten/gamemaker-sandbox-engine/audio/context';
import { HINT_NEXT } from './phoneScript';
import { speakLine } from './phonePlayer';
import { speak } from '../voices';
vi.mock('../voices', () => ({ speak: vi.fn() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/context', () => ({ audioContext: vi.fn() }));
vi.mock('../../offline/availability', () => ({ availableOffline: async () => false }));
const voice = { who: 'Hint Giant', pitch: 1, rate: 1, prefer: [] };

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
  const run = speakLine(HINT_NEXT, HINT_NEXT, voice, new AbortController().signal, missing);
  await vi.runAllTimersAsync();
  await run;
  expect(missing).toHaveBeenCalledOnce();
  expect(fetcher).not.toHaveBeenCalled();
  expect(speak).not.toHaveBeenCalled();
});

function mockPhoneAudio() {
  const buffer = { duration: 1, sampleRate: 1, getChannelData: () => Float32Array.of(1) };
  const connect = (node: AudioNode) => node;
  const play = vi.fn();
  const ctx = {
    currentTime: 0,
    sampleRate: 1,
    decodeAudioData: vi.fn().mockResolvedValue(buffer),
    createBuffer: () => buffer,
    createBiquadFilter: () => ({ connect, frequency: { value: 0 } }),
    createGain: () => ({ connect, gain: { value: 0, setTargetAtTime: vi.fn() } }),
    createBufferSource: () => ({
      connect,
      onended: null as (() => void) | null,
      stop: vi.fn(),
      start(at?: number) {
        if (at !== undefined) {
          play();
          queueMicrotask(() => this.onended?.());
        }
      },
    }),
  };
  vi.mocked(audioContext).mockReturnValue(ctx as unknown as AudioContext);
  return { ctx, play };
}

it('retries a failed recording and shares the pending and decoded clip', async () => {
  vi.useFakeTimers();
  const { ctx, play } = mockPhoneAudio();
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new TypeError('Offline'))
    .mockResolvedValue(new Response(new Uint8Array(1)));
  vi.stubGlobal('fetch', fetcher);
  const call = () => speakLine(HINT_NEXT, HINT_NEXT, voice, new AbortController().signal);

  await call();
  expect(speak).toHaveBeenCalledOnce();

  const retries = Promise.all([call(), call()]);
  await vi.runAllTimersAsync();
  await retries;
  const cached = call();
  await vi.runAllTimersAsync();
  await cached;
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(ctx.decodeAudioData).toHaveBeenCalledOnce();
  expect(play).toHaveBeenCalledTimes(3);
  expect(speak).toHaveBeenCalledOnce();
});

it('finishes an empty caption without opening the phone line', async () => {
  mockPhoneAudio();
  await speakLine('', HINT_NEXT, voice, new AbortController().signal);
  expect(audioContext).not.toHaveBeenCalled();
  expect(speak).not.toHaveBeenCalled();
});
