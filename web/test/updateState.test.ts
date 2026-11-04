// The update notice: held on play pages, fades after about 15 s, and the pending update stays for Settings.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fadeOutLater, isPlayPage, NOTICE_FADE_MS, setPendingUpdate, watchPendingUpdate } from '../src/offline/updateState';

// no DOM here: a plain object stands in for the notice, and window is the timers
let focused = false;
let removed = false;
const fake = () => {
  removed = false;
  return {
    style: {} as Record<string, string>,
    get isConnected() {
      return !removed;
    },
    contains: () => focused,
    matches: () => false,
    remove: () => (removed = true),
  } as unknown as HTMLElement;
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  focused = false;
  setPendingUpdate(undefined);
});

const stub = () => {
  vi.useFakeTimers();
  vi.stubGlobal('window', { setTimeout, clearTimeout });
  vi.stubGlobal('document', { activeElement: {} });
};

describe('update notice', () => {
  it('knows the play pages', () => {
    for (const p of ['/play.html', '/x/play-snowbound.html', '/dos.html']) expect(isPlayPage(p)).toBe(true);
    for (const p of ['/', '/index.html', '/downloads.html', '/play.html.txt']) expect(isPlayPage(p)).toBe(false);
  });

  it('keeps the pending update for Settings, and tells a late watcher', () => {
    const reload = vi.fn();
    setPendingUpdate(reload);
    const seen = vi.fn();
    watchPendingUpdate(seen);
    expect(seen).toHaveBeenCalledWith(reload);
  });

  it('fades out and goes after about 15 s', () => {
    stub();
    const el = fake();
    fadeOutLater(el);
    vi.advanceTimersByTime(NOTICE_FADE_MS - 1);
    expect(el.style.opacity).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(el.style.opacity).toBe('0');
    vi.advanceTimersByTime(700);
    expect(removed).toBe(true);
  });

  it('waits while a button in it has focus', () => {
    stub();
    const el = fake();
    focused = true;
    fadeOutLater(el);
    vi.advanceTimersByTime(NOTICE_FADE_MS + 1000);
    expect(removed).toBe(false);
    expect(el.style.opacity).toBeUndefined();
    focused = false;
    vi.advanceTimersByTime(3000);
    expect(el.style.opacity).toBe('0');
  });
});
