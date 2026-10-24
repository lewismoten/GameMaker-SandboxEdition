// A view to look around a big printed piece on screen (the World Map, a Level Map): drag it,
// zoom with the buttons, ctrl+scroll or the + and - keys, and the arrow keys scroll it.
import { h } from '../../editor/core/ui';

interface PanZoom {
  /** The scrolling view, holding `content`. */
  view: HTMLElement;
  /** Zoom out, zoom in, Fit and Actual size. */
  buttons: HTMLElement[];
  /** Sets the width of `content` in CSS pixels (kept between `min` and `max`). */
  setZoom(px: number): void;
  fit(): void;
}

/** `content` is `inches` wide at actual size; the most it zooms to is `maxPerInch` pixels an inch. */
export function panZoom(content: HTMLElement, inches: number, label: string, maxPerInch = 260): PanZoom {
  const view = h('div', { class: 'wm-view', tabindex: 0, role: 'region', 'aria-label': label }, content);
  let zoom = 0;
  const setZoom = (px: number) => {
    zoom = Math.max(240, Math.min(inches * maxPerInch, px));
    content.style.width = `${zoom}px`;
  };
  const fit = () => {
    const byH = view.clientHeight > 80 && content.offsetHeight ? ((view.clientHeight - 24) * content.offsetWidth) / content.offsetHeight : Infinity;
    setZoom(Math.min(view.clientWidth - 24, byH));
  };
  const by = (k: number) => {
    const cx = (view.scrollLeft + view.clientWidth / 2) / content.offsetWidth;
    const cy = (view.scrollTop + view.clientHeight / 2) / content.offsetHeight;
    setZoom(zoom * k);
    view.scrollLeft = cx * content.offsetWidth - view.clientWidth / 2;
    view.scrollTop = cy * content.offsetHeight - view.clientHeight / 2;
  };
  view.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      by(Math.exp(-e.deltaY / 300));
    },
    { passive: false },
  );
  view.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') (by(1.3), e.preventDefault());
    else if (e.key === '-') (by(1 / 1.3), e.preventDefault());
  });
  let drag: { x: number; y: number; l: number; t: number } | undefined;
  view.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop };
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag) return;
    view.scrollLeft = drag.l - (e.clientX - drag.x);
    view.scrollTop = drag.t - (e.clientY - drag.y);
  });
  const end = () => (drag = undefined);
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
  const buttons = [
    h('button', { type: 'button', onclick: () => by(1 / 1.3), 'aria-label': 'Zoom out' }, '−'),
    h('button', { type: 'button', onclick: () => by(1.3), 'aria-label': 'Zoom in' }, '+'),
    h('button', { type: 'button', onclick: fit }, 'Fit'),
    h('button', { type: 'button', onclick: () => setZoom(inches * 96) }, 'Actual size'),
  ];
  return { view, buttons, setZoom, fit };
}
