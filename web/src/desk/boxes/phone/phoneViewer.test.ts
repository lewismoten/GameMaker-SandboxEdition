// Keyboard panning moves the model in screen space without turning it.
import { afterEach, expect, it, vi } from 'vitest';
import { createPhoneViewer } from './phoneViewer';

const view = vi.hoisted(() => ({ yaw: 0, pitch: 0, panX: 0, panY: 0 }));
vi.mock('./phoneGl', () => ({ createPhoneView: () => view }));
vi.mock('./phoneData', () => ({ VARIANTS: ['cheap', 'deluxe'], loadPhone: () => ({ parts: [] }) }));
vi.mock('../../../editor/core/ui', () => ({
  h: () => Object.assign(new EventTarget(), { setAttribute: vi.fn(), classList: { add: vi.fn(), remove: vi.fn() } }),
}));

afterEach(() => vi.unstubAllGlobals());

it('pans right and up with Shift+arrows and leaves rotation alone', async () => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', () => 1);
  const viewer = createPhoneViewer();
  await viewer.open();
  for (const key of ['ArrowRight', 'ArrowUp']) {
    viewer.canvas.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key, shiftKey: true }));
  }
  expect(view.panX).toBeGreaterThan(0);
  expect(view.panY).toBeLessThan(0);
  expect([view.yaw, view.pitch]).toEqual([0, 0]);
});
