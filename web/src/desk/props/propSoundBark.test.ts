// The desk's real dog barks: only once sound is unlocked, one dog's clips per dog, and never more than one
// call in BARK_GAP_MS.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const started: { buffer: AudioBuffer | null; at: number }[] = [];
let unlocked = true;

vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/context', () => {
  const node = () => ({ connect: (n: unknown) => n, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  const ctx = {
    get currentTime() {
      return performance.now() / 1000;
    },
    sampleRate: 48000,
    decodeAudioData: async (b: ArrayBuffer) => ({ tag: new Uint8Array(b)[0] }) as unknown as AudioBuffer,
    createGain: node,
    // every started source records its buffer
    createBufferSource: () => {
      const s = {
        buffer: null as AudioBuffer | null,
        connect: (n: unknown) => n,
        start(at: number) {
          started.push({ buffer: s.buffer, at });
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
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('roomSound.bark', () => {
  it('retries the same recording after a failed request and caches the successful retry', async () => {
    const { roomSound, BARK_GAP_MS } = await import('./propSound');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const request = vi.fn(fetch).mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', request);
    const woof = vi.spyOn(roomSound, 'woof').mockImplementation(() => {});

    roomSound.bark('gwinn');
    await vi.advanceTimersByTimeAsync(BARK_GAP_MS);
    expect(woof).toHaveBeenCalledExactlyOnceWith(1, expect.objectContaining({ t: 0 }));

    roomSound.bark('gwinn');
    await vi.advanceTimersByTimeAsync(BARK_GAP_MS);
    roomSound.bark('gwinn');
    await vi.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1]).toEqual(request.mock.calls[0]);
    expect(started).toHaveLength(2);
    expect(woof).toHaveBeenCalledTimes(1);
  });

  it('keeps repeated presses on the outside dogs quiet until the gap ends', async () => {
    const { roomSound, BARK_GAP_MS } = await import('./propSound');
    const { dogs } = await import('./outside/dogs');
    const woof = vi.spyOn(roomSound, 'woof').mockImplementation(() => {});

    dogs.start!();
    dogs.press();
    await vi.advanceTimersByTimeAsync(BARK_GAP_MS - 1);
    dogs.press();
    expect(woof).not.toHaveBeenCalled();
    expect(started).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(1);
    dogs.press();
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toHaveLength(3);
    expect(woof).not.toHaveBeenCalled();
  });

  it('uses the outside dogs’ synthesized sounds when recording playback is unavailable', async () => {
    unlocked = false;
    const { roomSound } = await import('./propSound');
    const { dogs } = await import('./outside/dogs');
    const woof = vi.spyOn(roomSound, 'woof').mockImplementation(() => {});
    dogs.start!();
    dogs.press();
    expect(woof.mock.calls).toEqual([[3], [2]]);
  });

  it('plays a clip of the right dog, once, and then waits out the gap', async () => {
    const { roomSound, BARK_GAP_MS } = await import('./propSound');
    expect(roomSound.bark('gwinn')).toBe('accepted');
    await vi.advanceTimersByTimeAsync(10);
    expect(fetched).toHaveLength(1);
    expect(fetched[0]).toMatch(/gwinn-bark-[12]\.ogg$/);
    expect(started).toHaveLength(1);
    // too soon: nothing, and nothing fetched
    expect(roomSound.bark('teddy')).toBe('cooldown');
    // after the gap, the next one plays
    vi.setSystemTime(Date.now() + BARK_GAP_MS + 1);
    vi.advanceTimersByTime(BARK_GAP_MS + 1);
    expect(roomSound.bark('teddy')).toBe('accepted');
  });

  it('schedules Gwinn before Teddy even when her clip loads a second later', async () => {
    const { roomSound } = await import('./propSound');
    vi.stubGlobal('fetch', async (url: string) => {
      const gwinn = url.includes('gwinn-bark');
      if (gwinn) await new Promise((resolve) => setTimeout(resolve, 1000));
      return { ok: true, arrayBuffer: async () => new Uint8Array([gwinn ? 1 : 2]).buffer };
    });
    roomSound.bark('gwinn', 'teddy');
    await vi.advanceTimersByTimeAsync(1000);
    expect(started).toEqual([
      { buffer: { tag: 1 }, at: 1 },
      { buffer: { tag: 2 }, at: 1.7 },
    ]);
  });

  it('schedules a missing second clip’s woof in its place', async () => {
    const { roomSound } = await import('./propSound');
    const woof = vi.spyOn(roomSound, 'woof').mockImplementation(() => {});
    const request = fetch;
    vi.stubGlobal('fetch', (url: string) => (url.includes('teddy-bark') ? Promise.reject(new Error('offline')) : request(url)));
    roomSound.bark('gwinn', 'teddy');
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toEqual([{ buffer: { tag: 1 }, at: 0 }]);
    expect(woof).toHaveBeenCalledExactlyOnceWith(1, expect.objectContaining({ t: 0.7 }));
  });

  it('keeps Teddy and Gwinn apart when both bark in one call', async () => {
    const { roomSound } = await import('./propSound');
    expect(roomSound.bark('gwinn', 'teddy')).toBe('accepted');
    await vi.advanceTimersByTimeAsync(10);
    expect(fetched).toHaveLength(2);
    expect(fetched[0]).toMatch(/gwinn-bark-/);
    expect(fetched[1]).toMatch(/teddy-bark-[1-6]\.ogg$/);
    expect(started).toHaveLength(2);
  });

  it('stays silent until sound has been unlocked by a tap', async () => {
    unlocked = false;
    const { roomSound } = await import('./propSound');
    expect(roomSound.bark('teddy')).toBe('unavailable');
    await vi.advanceTimersByTimeAsync(10);
    expect(fetched).toHaveLength(0);
    expect(started).toHaveLength(0);
  });
});
