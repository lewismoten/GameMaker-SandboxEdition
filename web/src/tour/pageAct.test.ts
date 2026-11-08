import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOLD_MS, askPage, type ActDetail } from './pageAct';

// node has no window: an EventTarget stands in
beforeEach(() => vi.stubGlobal('window', new EventTarget()));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('askPage', () => {
  it('resolves at once without hold', async () => {
    const seen: ActDetail[] = [];
    const on = (e: Event) => seen.push((e as CustomEvent<ActDetail>).detail);
    window.addEventListener('gm-tour-act', on);
    await askPage({ do: 'bbs-call' });
    window.removeEventListener('gm-tour-act', on);
    expect(seen).toHaveLength(1);
    expect(seen[0].ready).toBeUndefined();
  });

  it('a held act waits for the page to call ready', async () => {
    vi.useFakeTimers();
    let ready: (() => void) | undefined;
    const on = (e: Event) => (ready = (e as CustomEvent<ActDetail>).detail.ready);
    window.addEventListener('gm-tour-act', on);
    let done = false;
    void askPage({ do: 'bbs-type', wait: 'Enter your handle', hold: true }).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(20_000);
    expect(done).toBe(false);
    ready?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
    window.removeEventListener('gm-tour-act', on);
  });

  it('a held act gives up after the timeout so the tour cannot hang', async () => {
    vi.useFakeTimers();
    let done = false;
    void askPage({ do: 'bbs-type', hold: true }).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(HOLD_MS - 1);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toBe(true);
  });
});
