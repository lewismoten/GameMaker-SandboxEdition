// Tap zoom requires a primary press and release on the map.
import { expect, it, vi } from 'vitest';
import { bindMapPointer } from './mapPointer';

function setup() {
  const canvas = new EventTarget();
  const outside = new EventTarget();
  const setZoom = vi.fn();
  bindMapPointer({
    canvas,
    mode: 'zoom',
    zoom: 1,
    setZoom,
    viewport: { gestureCell: () => ({ x: 0, y: 0 }) },
    scroller: { getBoundingClientRect: () => ({ left: 0, top: 0 }), clientLeft: 0, clientTop: 0 },
  } as unknown as Parameters<typeof bindMapPointer>[0]);
  function send(type: string, button: number, target = canvas, pointerId = 1) {
    target.dispatchEvent(Object.assign(new Event(type), { button, pointerId, isPrimary: true, clientX: 2, clientY: 3 }));
  }
  return { send, setZoom, outside, canvas };
}

it('ignores a secondary release', () => {
  const { send, setZoom } = setup();
  send('pointerdown', 2);
  send('pointerup', 2);
  expect(setZoom).not.toHaveBeenCalled();
});

it('ignores a primary release after pressing outside the map', () => {
  const { send, setZoom, outside } = setup();
  send('pointerdown', 0, outside);
  send('pointerup', 0);
  expect(setZoom).not.toHaveBeenCalled();
});

it('zooms at the release position only for the matching pointer', () => {
  const { send, setZoom, canvas } = setup();
  send('pointerdown', 0);
  send('pointerup', 0, canvas, 2);
  send('pointerup', 0);
  expect(setZoom).toHaveBeenCalledTimes(1);
  expect(setZoom).toHaveBeenCalledWith(1.5, { x: 2, y: 3 });
});
