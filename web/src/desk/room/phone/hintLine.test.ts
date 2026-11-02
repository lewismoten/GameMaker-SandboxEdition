// Hint-service choices, timing and cancellation with fake time and a captioned phone line.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CallLine } from './calls';
import { hintLine } from './hintLine';
import { progress } from '../../../achievements/store';

vi.mock('../../../achievements/store', () => ({ progress: vi.fn() }));
let stored: Map<string, string>;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] });
  vi.clearAllMocks();
  stored = new Map();
  vi.stubGlobal('localStorage', { getItem: (k: string) => stored.get(k) ?? null, setItem: (k: string, v: string) => stored.set(k, v) });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function phone(choices: string[], keyDelay = 1000) {
  const controller = new AbortController();
  const captions: string[] = [];
  const ended = vi.fn();
  let hush = () => {};
  const wait = <T>(ms: number, value: T): Promise<T> =>
    new Promise((resolve, reject) => {
      if (controller.signal.aborted) return reject(new Error('hung up'));
      const stop = () => {
        clearTimeout(timer);
        reject(new Error('hung up'));
      };
      const timer = setTimeout(() => {
        controller.signal.removeEventListener('abort', stop);
        resolve(value);
      }, ms);
      controller.signal.addEventListener('abort', stop, { once: true });
    });
  const line = {
    signal: controller.signal,
    sounds: { ringback: vi.fn(), stop: vi.fn() },
    status: vi.fn(),
    ended,
    wait: (seconds: number) => wait(seconds * 1000, undefined),
    nextKey: (seconds: number) => (choices.length ? wait(keyDelay, choices.shift()!) : wait(seconds * 1000, '')),
    say: (_voice: unknown, text: string) => {
      captions.push(text);
      return new Promise<void>((resolve, reject) => {
        if (controller.signal.aborted) return reject(new Error('hung up'));
        const done = () => {
          clearTimeout(timer);
          controller.signal.removeEventListener('abort', stop);
          resolve();
        };
        const stop = () => {
          clearTimeout(timer);
          reject(new Error('hung up'));
        };
        const timer = setTimeout(done, 500);
        controller.signal.addEventListener('abort', stop, { once: true });
        hush = done;
      });
    },
    hush: () => hush(),
  } as unknown as CallLine;
  return { line, captions, controller, ended };
}
const billedMs = () => Number(stored.get('gm-hint-phone-bill') ?? 0);

describe('Teddy’s fictional hint line', () => {
  it.each(['0', '', '9'])('does not charge when the free confirmation receives %j', async (key) => {
    const p = phone(key ? [key] : []);
    const call = hintLine(p.line);
    await vi.runAllTimersAsync();
    await call;
    expect(billedMs()).toBe(0);
    expect(p.ended).toHaveBeenCalledWith(expect.stringContaining('No charge'));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('accepts a key during speech, gives a map hint, and stops billing before goodbye', async () => {
    const p = phone(['1', '2', '0'], 100);
    const call = hintLine(p.line);
    await vi.runAllTimersAsync();
    await call;
    expect(p.captions.some((s) => s.includes('Level Maps'))).toBe(true);
    expect(billedMs()).toBe(700); // two 100ms menu waits and the 500ms hint
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(60000);
    expect(billedMs()).toBe(700);
  });

  it('limits a silent confirmed call and a caller who keeps selecting invalid keys', async () => {
    for (const choices of [['1'], ['1', '9', '9', '9', '9', '9', '9']]) {
      const p = phone([...choices]);
      const call = hintLine(p.line);
      await vi.runAllTimersAsync();
      await call;
      expect(p.ended).toHaveBeenCalledWith(expect.stringContaining('biscuit break'));
      expect(vi.getTimerCount()).toBe(0);
    }
  });

  it.each([1000, 2250, 3500])('settles hangup at %i ms and leaves no speech, key or billing timers', async (at) => {
    const p = phone(['1']);
    const call = hintLine(p.line);
    const rejected = expect(call).rejects.toThrow('hung up');
    await vi.advanceTimersByTimeAsync(at);
    p.controller.abort();
    await rejected;
    const settled = billedMs();
    expect(settled).toBe(Math.max(0, at - 3000));
    await vi.advanceTimersByTimeAsync(120000);
    expect(billedMs()).toBe(settled);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports restored and newly earned achievement progress while retaining the full bill', async () => {
    stored.set('gm-hint-phone-bill', '300000'); // $9.95 before this call
    const p = phone(['1', '5', '0'], 2000);
    const call = hintLine(p.line);
    await vi.runAllTimersAsync();
    await call;
    expect(progress).toHaveBeenCalledWith('hint-phone-bill', 995, 1000);
    expect(progress).toHaveBeenLastCalledWith('hint-phone-bill', 1000, 1000);
    expect(billedMs()).toBe(304500);
    expect(p.ended).toHaveBeenCalledWith(expect.stringContaining('$10.09'));
    expect(vi.getTimerCount()).toBe(0);
  });
});
