// Models content growing after Back while the reader is using the keyboard.
import { afterEach, expect, it, vi } from 'vitest';
import { restoreScroll } from './scrollMemory';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('keeps the keyboard scroll position when more content arrives', () => {
  vi.useFakeTimers();
  const win = Object.assign(new EventTarget(), { scrollY: 0, scrollTo: vi.fn() });
  vi.stubGlobal('window', win);
  vi.stubGlobal('location', { hash: '#map' });
  let resize: (() => void) | undefined;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {
        resize = undefined;
      }
    },
  );
  let limit = 50;
  let position = 0;
  class Pane extends EventTarget {
    children = [];
    get scrollTop() {
      return position;
    }
    set scrollTop(value: number) {
      position = Math.min(limit, value);
    }
  }
  const main = new Pane();
  restoreScroll(main as unknown as HTMLElement, { top: 300, win: 0 });
  expect(main.scrollTop).toBe(50);
  win.dispatchEvent(Object.assign(new Event('keydown'), { key: 'ArrowUp' }));
  main.scrollTop = 20;
  limit = 500;
  resize?.();
  expect(main.scrollTop).toBe(20);
});
