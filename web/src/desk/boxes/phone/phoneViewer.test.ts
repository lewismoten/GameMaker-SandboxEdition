// Exercise pinch zoom through the viewer's canvas listeners.
import { expect, it, vi } from 'vitest';
import { FakeDoc, type FakeEl } from '../../../../test/fakeDom';
import { createPhoneViewer } from './phoneViewer';

const view = vi.hoisted(() => ({ zoom: 1, dispose: vi.fn() }));
vi.mock('./phoneGl', () => ({ createPhoneView: () => view }));
vi.mock('./phoneData', async (original) => ({ ...(await original<typeof import('./phoneData')>()), loadPhone: () => Promise.resolve({ parts: [] }) }));

it('zooms from the span at second contact, including the first move', async () => {
  vi.stubGlobal('document', new FakeDoc());
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  try {
    const viewer = createPhoneViewer();
    const canvas = viewer.canvas as unknown as FakeEl;
    Object.assign(canvas, { classList: { add: vi.fn(), remove: vi.fn() }, setPointerCapture: vi.fn() });
    await viewer.open();
    canvas.fire('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 });
    canvas.fire('pointerdown', { pointerId: 2, clientX: 100, clientY: 0 });
    canvas.fire('pointermove', { pointerId: 2, clientX: 150, clientY: 0 });
    expect.soft(view.zoom).toBeCloseTo(1.5);
    canvas.fire('pointermove', { pointerId: 2, clientX: 200, clientY: 0 });
    expect(view.zoom).toBeCloseTo(2);
    viewer.close();
  } finally {
    vi.unstubAllGlobals();
  }
});
