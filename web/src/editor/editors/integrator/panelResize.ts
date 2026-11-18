// Integrator side-panel collapse, saved width and pointer/keyboard resizing.
import { h } from '../../core/ui';

interface PanelResizeContext {
  grator: HTMLElement;
  side: HTMLElement;
  store: { get(k: string): string | null; set(k: string, v: string): void };
  renderSide: () => void;
  fit: () => void;
  draw: () => void;
}

export function panelResize({ grator, side, store, renderSide, fit, draw }: PanelResizeContext) {
  /** The side panel folds away so the board gets the whole width (remembered; folded by default on phones). */
  const setCollapsed = (on: boolean, remember = true) => {
    grator.classList.toggle('side-collapsed', on);
    if (remember) store.set('gm-grator-side-collapsed', on ? '1' : '0');
    renderSide();
    requestAnimationFrame(fit);
  };
  const savedCollapsed = store.get('gm-grator-side-collapsed');
  grator.classList.toggle('side-collapsed', savedCollapsed ? savedCollapsed === '1' : window.matchMedia?.('(max-width: 820px)').matches);
  const savedWidth = Number(store.get('gm-grator-side-w'));
  if (savedWidth >= 160 && savedWidth <= 640) grator.style.setProperty('--grator-side-w', `${savedWidth}px`);
  // drag the bar between the board and the panel to make the panel wider or narrower
  const handle = h('div', {
    class: 'grator-resize',
    role: 'separator',
    'aria-orientation': 'vertical',
    'aria-label': 'Side panel width',
    title: 'Drag to resize the side panel (or focus it and use ← →, Page Up/Down, Home/End)',
    tabIndex: 0,
    'aria-valuemin': 160,
    'aria-valuemax': 640,
  });
  /** The handle reports the panel's real width (its default depends on the window), kept in step as it changes. */
  const syncHandle = () => {
    const w = Math.round(side.getBoundingClientRect().width);
    if (!w) return;
    handle.setAttribute('aria-valuenow', String(w));
    handle.setAttribute('aria-valuetext', `${w} pixels wide`);
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(syncHandle).observe(side);
  const setSideW = (w: number) => {
    grator.style.setProperty('--grator-side-w', `${w}px`);
    store.set('gm-grator-side-w', String(w));
    syncHandle();
    draw();
  };
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const x0 = e.clientX;
    const w0 = side.getBoundingClientRect().width;
    const move = (ev: PointerEvent) => {
      setSideW(Math.round(Math.max(160, Math.min(640, w0 - (ev.clientX - x0)))));
    };
    const up = () => (handle.removeEventListener('pointermove', move), handle.removeEventListener('pointerup', up));
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
  // ← widens the panel (the handle moves left), → narrows it; Page Up/Down take bigger steps, Home is narrowest and End widest
  handle.addEventListener('keydown', (e) => {
    const w = Math.round(side.getBoundingClientRect().width);
    const next: Record<string, number> = {
      ArrowLeft: w + 20,
      ArrowUp: w + 20,
      ArrowRight: w - 20,
      ArrowDown: w - 20,
      PageUp: w + 80,
      PageDown: w - 80,
      Home: 160,
      End: 640,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    setSideW(Math.max(160, Math.min(640, next[e.key])));
  });
  return { handle, setCollapsed };
}
