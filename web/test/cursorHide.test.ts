// Tests: hiding the idle mouse pointer over the game (player/cursorHide.ts).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hideIdleCursor } from '../src/player/cursorHide';

function fakeElement() {
  const classes = new Set<string>();
  const el = Object.assign(new EventTarget(), {
    classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c) },
  });
  const move = (pointerType = 'mouse') => el.dispatchEvent(Object.assign(new Event('pointermove'), { pointerType }));
  return { el: el as unknown as HTMLElement, move, hidden: () => classes.has('gm-cursor-hidden'), target: el };
}

describe('idle cursor', () => {
  afterEach(() => vi.useRealTimers());

  it('hides after a second still and shows again on the next move', () => {
    vi.useFakeTimers();
    const f = fakeElement();
    const stop = hideIdleCursor(f.el);
    f.move();
    vi.advanceTimersByTime(900);
    expect(f.hidden()).toBe(false);
    vi.advanceTimersByTime(200);
    expect(f.hidden()).toBe(true);
    f.move();
    expect(f.hidden()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(f.hidden()).toBe(true);
    stop();
    expect(f.hidden()).toBe(false);
  });

  it('ignores touch, and shows the pointer when it leaves', () => {
    vi.useFakeTimers();
    const f = fakeElement();
    hideIdleCursor(f.el);
    f.move('touch');
    vi.advanceTimersByTime(2000);
    expect(f.hidden()).toBe(false);
    f.move();
    vi.advanceTimersByTime(1000);
    f.target.dispatchEvent(new Event('pointerleave'));
    expect(f.hidden()).toBe(false);
    vi.advanceTimersByTime(2000);
    expect(f.hidden()).toBe(false);
  });
});
