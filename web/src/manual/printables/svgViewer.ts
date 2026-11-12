// A kit's drawings (cut sheets, assembly picture) opened large inside the page instead of downloading: a dialog with the picture fitted
// to the window, drag, one finger or the arrow keys to pan, wheel, pinch, + and - to zoom, Reset view, Previous and Next through the
// kit's drawings ("Sheet 2 of 4" with the sheet's real size), Close and a Download link. Escape and Close return to the list.
import './orbitCamera.css';
import './svgViewer.css';
import { h } from '../../editor/core/ui';
import { sizeWords } from './svgSize';

export interface Pan {
  x: number;
  y: number;
  zoom: number;
}
/** One drawing in the viewer: `file` is the downloaded file's name, `label` what it is. */
export interface ViewerItem {
  href: string;
  file: string;
  label: string;
}
/** Fitted to the window is the smallest view; twelve times is the largest. */
export const PAN_MIN = 1;
export const PAN_MAX = 12;
/** Zoom by `k` keeping the point (px, py), in the frame's own pixels from its center, where it is on screen. */
export function zoomAt(v: Pan, k: number, px = 0, py = 0): Pan {
  const zoom = Math.max(PAN_MIN, Math.min(PAN_MAX, v.zoom * k));
  const f = zoom / v.zoom;
  return zoom === PAN_MIN ? { x: 0, y: 0, zoom } : { x: px - (px - v.x) * f, y: py - (py - v.y) * f, zoom };
}
/** Move the picture by (dx, dy) pixels in a frame of w by h; it can't leave the frame, and at the fitted size it hardly moves. */
export function panBy(v: Pan, dx: number, dy: number, w: number, h: number): Pan {
  const room = (size: number) => ((v.zoom - 1) / 2 + 0.25) * size;
  const clamp = (n: number, size: number) => Math.max(-room(size), Math.min(room(size), n));
  return { ...v, x: clamp(v.x + dx, w), y: clamp(v.y + dy, h) };
}

/** Opens `items[start]` large. Focus returns to `from` on close. */
export function openSvgViewer(items: ViewerItem[], start = 0, from?: HTMLElement): void {
  let at = Math.max(0, Math.min(items.length - 1, start));
  let v: Pan = { x: 0, y: 0, zoom: 1 };
  const img = h('img', { class: 'sv-img', alt: '', draggable: false });
  const frame = h('div', { class: 'sv-frame', tabindex: 0, role: 'group' }, img);
  const apply = () => (img.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.zoom})`);
  const at0 = (e: { clientX: number; clientY: number }) => {
    const r = frame.getBoundingClientRect();
    return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2] as const;
  };
  const move = (dx: number, dy: number) => {
    const r = frame.getBoundingClientRect();
    v = panBy(v, dx, dy, r.width, r.height);
    apply();
  };
  const zoom = (k: number, px = 0, py = 0) => ((v = zoomAt(v, k, px, py)), apply());
  const reset = () => ((v = { x: 0, y: 0, zoom: 1 }), apply());
  const fingers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  const spread = () => {
    const [a, b] = [...fingers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  frame.addEventListener('pointerdown', (e) => {
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    frame.setPointerCapture?.(e.pointerId);
    pinch = fingers.size === 2 ? spread() : 0;
  });
  frame.addEventListener('pointermove', (e) => {
    const last = fingers.get(e.pointerId);
    if (!last) return;
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (fingers.size === 2) {
      const now = spread();
      if (pinch && now) zoom(now / pinch);
      pinch = now;
    } else move(e.clientX - last.x, e.clientY - last.y);
  });
  const up = (e: PointerEvent) => {
    fingers.delete(e.pointerId);
    pinch = 0;
  };
  frame.addEventListener('pointerup', up);
  frame.addEventListener('pointercancel', up);
  frame.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoom(Math.exp(-e.deltaY / 400), ...at0(e));
    },
    { passive: false },
  );

  const dialog = h('dialog', { class: 'sv' });
  const title = h('strong', { class: 'sv-title' });
  const meta = h('span', { class: 'sv-meta', 'aria-live': 'polite' });
  const dl = h('a', { class: 'oc-btn sv-dl' }, 'Download');
  const prev = h('button', { type: 'button', class: 'oc-btn', onclick: () => go(-1) }, 'Previous');
  const next = h('button', { type: 'button', class: 'oc-btn', onclick: () => go(1) }, 'Next');
  const sizes = new Map<string, string>();
  const show = () => {
    const it = items[at];
    reset();
    img.src = it.href;
    img.alt = it.label;
    title.textContent = it.label;
    dialog.setAttribute('aria-label', it.label);
    frame.setAttribute(
      'aria-label',
      `${it.label}. Drag or use the arrow keys to move, the wheel, pinch, plus and minus zoom, Home resets${items.length > 1 ? ', Page Up and Page Down or the left and right arrows when fitted change drawing' : ''}.`,
    );
    dl.href = it.href;
    dl.setAttribute('download', it.file);
    prev.disabled = at === 0;
    next.disabled = at === items.length - 1;
    const words = (size: string) => (meta.textContent = [items.length > 1 ? `Sheet ${at + 1} of ${items.length}` : '', size].filter(Boolean).join(' · '));
    words(sizes.get(it.href) ?? '');
    if (!sizes.has(it.href) && /\.svg(?:[?#].*)?$/i.test(it.href))
      void fetch(it.href)
        .then((r) => r.text())
        .then((t) => {
          sizes.set(it.href, sizeWords(t));
          if (items[at] === it) words(sizes.get(it.href)!);
        })
        .catch(() => undefined);
  };
  function go(d: number) {
    const n = at + d;
    if (n < 0 || n >= items.length) return;
    at = n;
    show();
  }
  const bar = h(
    'div',
    { class: 'sv-bar' },
    title,
    meta,
    ...(items.length > 1 ? [prev, next] : []),
    h('button', { type: 'button', class: 'oc-btn', 'aria-label': 'Zoom in', onclick: () => zoom(1.25) }, '+'),
    h('button', { type: 'button', class: 'oc-btn', 'aria-label': 'Zoom out', onclick: () => zoom(0.8) }, '−'),
    h('button', { type: 'button', class: 'oc-btn', onclick: reset }, 'Reset view'),
    dl,
    h('button', { type: 'button', class: 'oc-btn', onclick: () => dialog.close() }, 'Close'),
  );
  dialog.append(bar, frame);
  dialog.addEventListener('keydown', (e) => {
    // the box behind has its own Escape; this one belongs to the dialog
    if (e.key === 'Escape') return e.stopPropagation();
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const onButton = (e.target as HTMLElement).closest('button, a');
    const step = 60;
    const zoomed = v.zoom > PAN_MIN;
    if (e.key === 'PageUp') go(-1);
    else if (e.key === 'PageDown') go(1);
    else if (e.key === 'ArrowLeft') zoomed ? move(step, 0) : go(-1);
    else if (e.key === 'ArrowRight') zoomed ? move(-step, 0) : go(1);
    else if (e.key === 'ArrowUp') move(0, step);
    else if (e.key === 'ArrowDown') move(0, -step);
    else if (onButton && e.key !== 'Home') return;
    else if (e.key === '+' || e.key === '=') zoom(1.25);
    else if (e.key === '-') zoom(0.8);
    else if (e.key === 'Home') reset();
    else return;
    e.preventDefault();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    from?.focus({ preventScroll: true });
  });
  show();
  document.body.append(dialog);
  dialog.showModal();
  frame.focus({ preventScroll: true });
}
