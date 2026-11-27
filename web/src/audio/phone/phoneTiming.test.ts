// Check the clip start times the recorded phone line hands to Web Audio.
import { afterEach, expect, it, vi } from 'vitest';
import { audioContext } from '@lewismoten/gamemaker-sandbox-engine/audio/context';
import { VOICES } from '../voices';
import { speakLine } from './phonePlayer';
import { TIME_LEAD, timeSentence } from './phoneScript';

vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/context', () => ({ audioContext: vi.fn() }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('pauses between the clock greeting and the time, then uses short gaps inside the spliced time', async () => {
  vi.useFakeTimers();
  const starts: number[] = [];
  const connect = (next: AudioNode) => next;
  const ctx = {
    currentTime: 0,
    sampleRate: 100,
    createGain: () => ({ connect, gain: { setTargetAtTime: vi.fn() } }),
    createBiquadFilter: () => ({ connect, frequency: {} }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(200) }),
    decodeAudioData: async () => ({ duration: 1, sampleRate: 100, getChannelData: () => new Float32Array(100).fill(1) }),
    createBufferSource: () => ({
      connect,
      loop: false,
      start(at: number) {
        if (!this.loop) starts.push(at);
      },
      stop: vi.fn(),
    }),
  };
  vi.mocked(audioContext).mockReturnValue(ctx as unknown as AudioContext);
  vi.stubGlobal('fetch', async () => new Response(new ArrayBuffer(0)));

  const text = `${TIME_LEAD} ${timeSentence(4, 5, 20)}`;
  const call = new AbortController();
  const playing = speakLine(text, text, VOICES.timeLady, call.signal);
  await vi.advanceTimersByTimeAsync(0);
  call.abort();
  await playing;

  // One-second clips, with a 500 ms breath after the greeting and 120 ms between time parts.
  expect(starts.map((at) => Math.round((at - starts[0]) * 1000))).toEqual([0, 1500, 2620, 3740, 4860]);
});
