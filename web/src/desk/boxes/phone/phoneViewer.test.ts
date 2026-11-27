// Pinching the phone scales it from the spacing at the second contact; Shift+arrows pan it without turning it.
import { afterEach, expect, it, vi } from 'vitest';
import { createPhoneViewer } from './phoneViewer';

const view = vi.hoisted(() => ({ zoom: 1, yaw: 0, pitch: 0, panX: 0, panY: 0 }));
vi.mock('./phoneGl', () => ({ createPhoneView: () => view }));
vi.mock('./phoneData', () => ({ VARIANTS: ['cheap', 'deluxe'], loadPhone: () => ({ parts: [] }) }));
vi.mock('../../../editor/core/ui', () => ({
  h: () =>
    Object.assign(new EventTarget(), {
      classList: { add: vi.fn(), remove: vi.fn() },
      setAttribute: vi.fn(),
      focus: vi.fn(),
      setPointerCapture: vi.fn(),
    }),
}));

afterEach(() => vi.unstubAllGlobals());

function stubBrowser() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', () => 1);
}

it('pans right and up with Shift+arrows and leaves rotation alone', async () => {
  stubBrowser();
  const viewer = createPhoneViewer();
  await viewer.open();
  for (const key of ['ArrowRight', 'ArrowUp']) {
    viewer.canvas.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key, shiftKey: true }));
  }
  expect(view.panX).toBeGreaterThan(0);
  expect(view.panY).toBeLessThan(0);
  expect([view.yaw, view.pitch]).toEqual([0, 0]);
});

it('zooms on the first pinch move and keeps scaling on the next move', async () => {
  stubBrowser();
  const viewer = createPhoneViewer();
  await viewer.open();
  const pointer = (type: string, pointerId: number, clientX: number) =>
    viewer.canvas.dispatchEvent(Object.assign(new Event(type), { pointerId, clientX, clientY: 0 }));
  pointer('pointerdown', 1, 0);
  pointer('pointerdown', 2, 100);
  pointer('pointermove', 2, 150);
  expect.soft(view.zoom).toBe(1.5);
  pointer('pointermove', 2, 200);
  expect(view.zoom).toBe(2);
});
