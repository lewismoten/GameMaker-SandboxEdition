// Hint-line phone tree, per-minute billing, timing and cancellation with fake time and a captioned phone line.
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
  const status = vi.fn();
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
    status,
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
  return { line, captions, controller, ended, status };
}
const billedMs = () => Number(stored.get('gm-hint-phone-bill') ?? 0);

describe('the Hint Giant’s fictional hint line', () => {
  it.each(['0', '', '9'])('does not charge when the free confirmation receives %j', async (key) => {
    const p = phone(key ? [key] : []);
    const call = hintLine(p.line);
    await vi.runAllTimersAsync();
    await call;
    expect(billedMs()).toBe(0);
    expect(p.ended).toHaveBeenCalledWith(expect.stringContaining('No charge'));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('says live counselors are away, then the rate, before it asks for 1', async () => {
    const p = phone(['0']);
    const call = hintLine(p.line);
    await vi.runAllTimersAsync();
    await call;
    expect(p.captions[0]).toMatch(/Hint Giant.*pretend phone bill.*not available at this time.*automated hint system.*1\.99 per minute/s);
  });

  it('charges one full minute the moment it connects, then walks the tree to a game’s hints', async () => {
    const p = phone(['1', '2', '1', '2', '0'], 100);
    const call = hintLine(p.line);
    await vi.runAllTimersAsync();
    await call;
    expect(billedMs()).toBe(60000);
    expect(p.status).toHaveBeenCalledWith('Pretend phone bill: $1.99');
    expect(p.captions.some((s) => s.startsWith('Hints for Final Curtain.'))).toBe(true);
    expect(p.captions.some((s) => s.includes('Victor’s office is locked'))).toBe(true);
    expect(p.captions.at(-1)).toMatch(/^Thank you for calling/);
    expect(p.ended).toHaveBeenCalledWith(expect.stringContaining('$1.99'));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bills the next minute in full the instant it begins, not by the second', async () => {
    const p = phone(['1', '1', '1', '1'], 30000);
    const call = hintLine(p.line);
    const amounts = () => [...new Set(p.status.mock.calls.map((c) => String(c[0])).filter((t) => t.startsWith('Pretend')))];
    await vi.advanceTimersByTimeAsync(2000 + 30000 + 29000); // the ring, the consent key, 29 s of the first minute
    expect(amounts()).toEqual(['Pretend phone bill: $1.99']);
    await vi.advanceTimersByTimeAsync(32000); // 61 s into the call: the second minute began at 60 s
    expect(amounts()).toEqual(['Pretend phone bill: $1.99', 'Pretend phone bill: $3.98']);
    expect(billedMs()).toBe(120000);
    await vi.runAllTimersAsync();
    await call;
    expect(new Set(amounts())).toEqual(new Set(['Pretend phone bill: $1.99', 'Pretend phone bill: $3.98', 'Pretend phone bill: $5.97']));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('answers a wrong key with the Giant’s retry line, reads the bill on #, and hangs up after a silence', async () => {
    const p = phone(['1', '7', '9', '#', '0'], 100);
    const call = hintLine(p.line);
    await vi.runAllTimersAsync();
    await call;
    expect(p.captions.some((s) => s.startsWith('Hints for Sandcastle Knight.'))).toBe(true); // 7: a game on page 1
    expect(p.captions.some((s) => s.startsWith('I do not know that button yet.'))).toBe(true); // 9 in a game's hints
    expect(p.captions.some((s) => s.startsWith("Your parents' pretend phone bill is $1.99."))).toBe(true);
    const silent = phone(['1']);
    const quiet = hintLine(silent.line);
    await vi.runAllTimersAsync();
    await quiet;
    expect(silent.captions.at(-1)).toMatch(/Are you still there/);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([1000, 2250, 3500, 40000])('settles hangup at %i ms and leaves no speech, key or billing timers', async (at) => {
    const p = phone(['1']);
    const call = hintLine(p.line);
    const rejected = expect(call).rejects.toThrow('hung up');
    await vi.advanceTimersByTimeAsync(at);
    p.controller.abort();
    await rejected;
    const settled = billedMs();
    expect(settled).toBe(at < 3000 ? 0 : 60000);
    await vi.advanceTimersByTimeAsync(120000);
    expect(billedMs()).toBe(settled);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports restored and newly earned achievement progress while retaining the full bill', async () => {
    stored.set('gm-hint-phone-bill', '300000'); // five minutes, $9.95, before this call
    const p = phone(['1', '#', '0'], 2000);
    const call = hintLine(p.line);
    await vi.runAllTimersAsync();
    await call;
    expect(progress).toHaveBeenCalledWith('hint-phone-bill', 995, 1000);
    expect(progress).toHaveBeenLastCalledWith('hint-phone-bill', 1000, 1000);
    expect(billedMs()).toBe(360000);
    expect(p.ended).toHaveBeenCalledWith(expect.stringContaining('$11.94'));
    expect(vi.getTimerCount()).toBe(0);
  });
});
