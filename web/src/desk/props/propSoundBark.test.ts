// The desk's real dog barks: only once sound is unlocked, one dog's clips per dog, and never more than one
// call in BARK_GAP_MS.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const started: AudioBuffer[] = [];
let unlocked = true;

vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/context', () => {
  const node = () => ({ connect: (n: unknown) => n, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  const ctx = {
    currentTime: 0,
    sampleRate: 48000,
    decodeAudioData: async (b: ArrayBuffer) => ({ tag: new Uint8Array(b)[0] }) as unknown as AudioBuffer,
    createGain: node,
    // every started source records its buffer
    createBufferSource: () => {
      const s = {
        buffer: null as AudioBuffer | null,
        connect: (n: unknown) => n,
        start() {
          started.push(s.buffer!);
        },
      };
      return s;
    },
  };
  return { audioContext: () => ctx, soundUnlocked: () => unlocked, unlock: () => undefined };
});
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/output', () => ({ output: () => ({ connect: (n: unknown) => n }) }));

const fetched: string[] = [];

beforeEach(() => {
  started.length = 0;
  fetched.length = 0;
  unlocked = true;
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', async (url: string) => {
    fetched.push(url);
    return { ok: true, arrayBuffer: async () => new Uint8Array([fetched.length]).buffer };
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('roomSound.bark', () => {
  it('plays a clip of the right dog, once, and then waits out the gap', async () => {
    const { roomSound, BARK_GAP_MS } = await import('./propSound');
    expect(roomSound.bark('gwinn')).toBe(true);
    await vi.advanceTimersByTimeAsync(10);
    expect(fetched).toHaveLength(1);
    expect(fetched[0]).toMatch(/gwinn-bark-[12]\.ogg$/);
    expect(started).toHaveLength(1);
    // too soon: nothing, and nothing fetched
    expect(roomSound.bark('teddy')).toBe(false);
    // after the gap, the next one plays
    vi.setSystemTime(Date.now() + BARK_GAP_MS + 1);
    vi.advanceTimersByTime(BARK_GAP_MS + 1);
    expect(roomSound.bark('teddy')).toBe(true);
  });

  it('keeps Teddy and Gwinn apart when both bark in one call', async () => {
    const { roomSound } = await import('./propSound');
    expect(roomSound.bark('gwinn', 'teddy')).toBe(true);
    await vi.advanceTimersByTimeAsync(10);
    expect(fetched).toHaveLength(2);
    expect(fetched[0]).toMatch(/gwinn-bark-/);
    expect(fetched[1]).toMatch(/teddy-bark-[1-6]\.ogg$/);
    expect(started).toHaveLength(2);
  });

  it('stays silent until sound has been unlocked by a tap', async () => {
    unlocked = false;
    const { roomSound } = await import('./propSound');
    expect(roomSound.bark('teddy')).toBe(false);
    await vi.advanceTimersByTimeAsync(10);
    expect(fetched).toHaveLength(0);
    expect(started).toHaveLength(0);
  });
});
