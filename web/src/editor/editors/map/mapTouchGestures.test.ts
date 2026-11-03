// Touch gestures: pinch and pan, the 150 ms take-back, long-press, and the Hand tool.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LONG_PRESS_MS, pinchOf, touchGestures, type TouchHost } from './mapTouchGestures';

function setup(over: Partial<TouchHost> = {}) {
  const el = new EventTarget() as unknown as HTMLElement;
  const scroller = { scrollLeft: 100, scrollTop: 100, clientLeft: 0, clientTop: 0, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
  let zoom = 1;
  const seen: string[] = [];
  const setZoom = vi.fn((v: number) => void (zoom = v));
  const abort = vi.fn();
  const host: TouchHost = {
    el,
    scroller: scroller as unknown as HTMLElement,
    zoom: () => zoom,
    setZoom,
    begin: () => void seen.push('begin'),
    abort,
    ...over,
  };
  const off = touchGestures(host);
  el.addEventListener('pointerdown', () => seen.push('tool-down'));
  el.addEventListener('pointermove', () => seen.push('tool-move'));
  const fire = (type: string, id: number, x: number, y: number, pointerType = 'touch') => {
    const e = Object.assign(new Event(type, { cancelable: true }), { pointerId: id, clientX: x, clientY: y, pointerType });
    el.dispatchEvent(e);
  };
  return { host, scroller, fire, seen, setZoom, abort, off };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('pinchOf', () => {
  it('gives the distance and midpoint', () => {
    expect(pinchOf({ x: 0, y: 0 }, { x: 6, y: 8 })).toEqual({ distance: 10, mid: { x: 3, y: 4 } });
  });
});

describe('two fingers', () => {
  it('zoom by the spread and keep the second finger from the tool', () => {
    const t = setup();
    t.fire('pointerdown', 1, 100, 100);
    t.fire('pointerdown', 2, 200, 100);
    t.fire('pointermove', 2, 300, 100);
    expect(t.setZoom).toHaveBeenLastCalledWith(2, { x: 200, y: 100 });
    expect(t.seen).toEqual(['begin', 'tool-down']);
  });

  it('pans by the midpoint', () => {
    const t = setup();
    t.fire('pointerdown', 1, 100, 100);
    t.fire('pointerdown', 2, 200, 100);
    t.fire('pointermove', 1, 90, 90);
    t.fire('pointermove', 2, 190, 90);
    expect(t.scroller.scrollLeft).toBe(110);
    expect(t.scroller.scrollTop).toBe(110);
  });

  it('take back a first finger younger than 150 ms, and keep an older one', () => {
    const quick = setup();
    quick.fire('pointerdown', 1, 0, 0);
    vi.advanceTimersByTime(100);
    quick.fire('pointerdown', 2, 50, 0);
    expect(quick.abort).toHaveBeenCalledWith(true);
    const slow = setup();
    slow.fire('pointerdown', 1, 0, 0);
    vi.advanceTimersByTime(200);
    slow.fire('pointerdown', 2, 50, 0);
    expect(slow.abort).toHaveBeenCalledWith(false);
  });

  it('send nothing more to the tool until every finger is up', () => {
    const t = setup();
    t.fire('pointerdown', 1, 0, 0);
    t.fire('pointerdown', 2, 50, 0);
    t.fire('pointerup', 2, 50, 0);
    t.fire('pointermove', 1, 5, 5);
    expect(t.seen).toEqual(['begin', 'tool-down']);
    t.fire('pointerup', 1, 5, 5);
    t.fire('pointerdown', 3, 0, 0);
    expect(t.seen).toEqual(['begin', 'tool-down', 'begin', 'tool-down']);
  });

  it('ignore the mouse', () => {
    const t = setup();
    t.fire('pointerdown', 1, 0, 0, 'mouse');
    t.fire('pointerdown', 2, 5, 0, 'mouse');
    expect(t.seen).toEqual(['tool-down', 'tool-down']);
  });
});

describe('long press', () => {
  it('opens after 500 ms and takes the stroke back', () => {
    const longPress = vi.fn(() => true);
    const t = setup({ longPress });
    t.fire('pointerdown', 1, 40, 50);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(longPress).toHaveBeenCalledWith({ x: 40, y: 50 });
    expect(t.abort).toHaveBeenCalledWith(true);
    t.fire('pointermove', 1, 41, 50);
    expect(t.seen).toEqual(['begin', 'tool-down']);
  });

  it('allows a small wobble but not a drag, and ends on lift', () => {
    const longPress = vi.fn(() => true);
    const t = setup({ longPress });
    t.fire('pointerdown', 1, 40, 50);
    t.fire('pointermove', 1, 44, 52);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(longPress).toHaveBeenCalledTimes(1);
    const u = setup({ longPress });
    u.fire('pointerdown', 1, 40, 50);
    u.fire('pointermove', 1, 80, 50);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(longPress).toHaveBeenCalledTimes(1);
    const v = setup({ longPress });
    v.fire('pointerdown', 1, 0, 0);
    v.fire('pointerup', 1, 0, 0);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(longPress).toHaveBeenCalledTimes(1);
  });

  it('leaves the stroke alone when nothing is there to open', () => {
    const t = setup({ longPress: () => false });
    t.fire('pointerdown', 1, 0, 0);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(t.abort).not.toHaveBeenCalled();
  });
});

describe('the Hand tool', () => {
  it('scrolls with one finger and never reaches the tool', () => {
    const t = setup({ hand: () => true });
    t.fire('pointerdown', 1, 100, 100);
    t.fire('pointermove', 1, 70, 90);
    expect(t.scroller.scrollLeft).toBe(130);
    expect(t.scroller.scrollTop).toBe(110);
    expect(t.seen).toEqual([]);
  });
});
