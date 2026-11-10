// Browser-free timing checks: the demo's file reads share the same gate as its player.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deferHomeDemo, mayStartHomeDemo } from './homeDemoStart';

let intersect: (entries: { isIntersecting: boolean }[]) => void;
let idle: (() => void) | undefined;
let frames: FrameRequestCallback[];
let screen: EventTarget & { isConnected: boolean };
let page: EventTarget & { hidden: boolean; documentElement: { classList: { contains: () => boolean } } };
const disconnect = vi.fn();
const cancelIdle = vi.fn(() => (idle = undefined));
const start = vi.fn();
const requestIdle = vi.fn((cb: () => void) => {
  idle = cb;
  return 1;
});
const paint = () => {
  const callbacks = frames.splice(0);
  for (const cb of callbacks) cb(0);
};
const seen = (yes = true) => intersect([{ isIntersecting: yes }]);

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  idle = undefined;
  frames = [];
  screen = Object.assign(new EventTarget(), { isConnected: true });
  page = Object.assign(new EventTarget(), { hidden: false, documentElement: { classList: { contains: () => false } } });
  vi.stubGlobal('document', page);
  vi.stubGlobal('navigator', { connection: { saveData: false } });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('window', {
    setTimeout,
    requestIdleCallback: requestIdle,
    cancelIdleCallback: cancelIdle,
  });
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: typeof intersect) {
        intersect = cb;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const defer = (picture = Promise.resolve()) => deferHomeDemo(screen as unknown as Element, picture, mayStartHomeDemo, start);
const settlePicture = async () => {
  await Promise.resolve();
  await Promise.resolve();
  paint();
  paint();
};

describe('deferred home demo', () => {
  it('does not read demo files until the real picture paints, is visible, and the browser is idle', async () => {
    let ready!: () => void;
    const cleanup = defer(new Promise<void>((resolve) => (ready = resolve)));
    seen();
    await vi.advanceTimersByTimeAsync(10000);
    expect(start).not.toHaveBeenCalled();
    ready();
    await settlePicture();
    await vi.advanceTimersByTimeAsync(2500);
    expect(start).not.toHaveBeenCalled();
    expect(requestIdle).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });
    idle?.();
    expect(start).toHaveBeenCalledOnce();
    screen.dispatchEvent(new Event('pointerenter'));
    idle?.();
    expect(start).toHaveBeenCalledOnce();
    cleanup();
  });

  it('waits while off screen, and cancels queued work if scrolled away', async () => {
    const cleanup = defer();
    await settlePicture();
    await vi.advanceTimersByTimeAsync(5000);
    expect(idle).toBeUndefined();
    seen();
    await vi.advanceTimersByTimeAsync(2500);
    const staleIdle = idle;
    seen(false);
    staleIdle?.();
    expect(start).not.toHaveBeenCalled();
    seen();
    await vi.advanceTimersByTimeAsync(2500);
    idle?.();
    expect(start).toHaveBeenCalledOnce();
    cleanup();
  });

  it.each(['pointerenter', 'pointerdown', 'focusin'])('starts once on %s without waiting for idle', (event) => {
    defer();
    screen.dispatchEvent(new Event(event));
    screen.dispatchEvent(new Event(event));
    expect(start).toHaveBeenCalledOnce();
  });

  it.each(['saveData', 'reduced-data', 'reduced-motion', 'tour'])('leaves %s visitors waiting for the explicit Watch demo click', async (preference) => {
    if (preference === 'saveData') vi.stubGlobal('navigator', { connection: { saveData: true } });
    if (preference.startsWith('reduced')) vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes(preference) }));
    if (preference === 'tour') page.documentElement.classList.contains = () => true;
    const cleanup = defer();
    seen();
    await settlePicture();
    await vi.advanceTimersByTimeAsync(10000);
    for (const event of ['pointerenter', 'pointerdown', 'focusin']) screen.dispatchEvent(new Event(event));
    expect(idle).toBeUndefined();
    expect(start).not.toHaveBeenCalled();
    cleanup();
  });

  it('rechecks a data preference changed while idle work was pending', async () => {
    const cleanup = defer();
    seen();
    await settlePicture();
    await vi.advanceTimersByTimeAsync(2500);
    vi.stubGlobal('navigator', { connection: { saveData: true } });
    idle?.();
    expect(start).not.toHaveBeenCalled();
    cleanup();
  });

  it('does not start on a hidden tab; returning schedules idle work again', async () => {
    const cleanup = defer();
    seen();
    await settlePicture();
    page.hidden = true;
    page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(5000);
    expect(start).not.toHaveBeenCalled();
    page.hidden = false;
    page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(2500);
    idle?.();
    expect(start).toHaveBeenCalledOnce();
    cleanup();
  });

  it.each(['replaced', 'detached'])('does not start after the game is %s', async (state) => {
    const cleanup = defer();
    seen();
    await settlePicture();
    await vi.advanceTimersByTimeAsync(2500);
    const staleIdle = idle;
    if (state === 'replaced') cleanup();
    else screen.isConnected = false;
    staleIdle?.();
    screen.dispatchEvent(new Event('pointerdown'));
    expect(start).not.toHaveBeenCalled();
    cleanup();
    expect(disconnect).toHaveBeenCalled();
  });

  it('falls back to the quiet timer when requestIdleCallback is unavailable', async () => {
    vi.stubGlobal('window', { setTimeout });
    const cleanup = defer();
    seen();
    await settlePicture();
    await vi.advanceTimersByTimeAsync(2499);
    expect(start).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(start).toHaveBeenCalledOnce();
    cleanup();
  });
});
