// The disk labels' level strips: drawn only once on screen, one at a time, a task apart.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { whenShown } from '../src/desk/disks/stripQueue';

const rendered: string[] = [];
type Callback = (entries: { isIntersecting: boolean }[]) => void;
const observers: Callback[] = [];

describe('whenShown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    rendered.length = 0;
    observers.length = 0;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        cb: Callback;
        constructor(cb: Callback) {
          this.cb = cb;
        }
        observe() {
          observers.push(this.cb);
        }
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('draws nothing off screen, then the shown strips one per task in the order shown', async () => {
    for (const id of ['a', 'b', 'c']) whenShown({ isConnected: true } as Element, async () => void rendered.push(id));
    await vi.advanceTimersByTimeAsync(50);
    expect(rendered).toEqual([]);
    observers[2]([{ isIntersecting: true }]); // c comes into view first, then a; b stays off screen
    observers[0]([{ isIntersecting: true }]);
    await Promise.resolve();
    expect(rendered).toEqual([]); // not inside the report's own task
    await vi.advanceTimersByTimeAsync(0);
    expect(rendered).toEqual(['c']);
    await vi.advanceTimersToNextTimerAsync();
    expect(rendered).toEqual(['c', 'a']);
    await vi.advanceTimersByTimeAsync(50);
    expect(rendered).toEqual(['c', 'a']);
  });

  it('skips a strip whose label was removed meanwhile', async () => {
    const gone = { isConnected: false } as Element;
    whenShown(gone, async () => void rendered.push('gone'));
    observers[0]([{ isIntersecting: true }]);
    await vi.advanceTimersByTimeAsync(50);
    expect(rendered).toEqual([]);
  });
});
