import { afterEach, describe, expect, it, vi } from 'vitest';
import { quietly, savedText } from './saveState';

afterEach(() => vi.useRealTimers());

describe('save indicator wording', () => {
  it('says Saved with a time', () => {
    expect(savedText(undefined, new Date(2026, 10, 4, 15, 42))).toMatch(/^✓ Saved .*42.* in this browser$/);
  });
  it('says why it failed, with what to do', () => {
    expect(savedText(new Error('storage full'), new Date())).toBe('Not saved (storage full). Download a .zip to keep your work.');
    expect(savedText(new Error(''), new Date())).toContain('the browser refused');
  });
});

describe('quietly', () => {
  it('announces only the last of a burst', () => {
    vi.useFakeTimers();
    const say = vi.fn();
    const q = quietly(say, 1500);
    q.tell('a');
    vi.advanceTimersByTime(1000);
    q.tell('b');
    vi.advanceTimersByTime(1499);
    expect(say).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(say).toHaveBeenCalledOnce();
    expect(say).toHaveBeenCalledWith('b');
  });
  it('cancel stops a pending announcement', () => {
    vi.useFakeTimers();
    const say = vi.fn();
    const q = quietly(say, 100);
    q.tell('x');
    q.cancel();
    vi.advanceTimersByTime(500);
    expect(say).not.toHaveBeenCalled();
  });
});
