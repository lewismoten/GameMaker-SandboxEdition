// A kit's SVG drawing (cut sheet, assembly picture) opened large inside the page instead of downloading: a dialog with the picture,
// drag to pan, wheel, pinch, + and - to zoom, Reset view, Close and a Download link. Escape and the Close button return to the list.
import './orbitCamera.css';
import './svgViewer.css';
import { h } from '../../editor/core/ui';

export interface Pan {
  x: number;
  y: number;
  zoom: number;
}
export const PAN_MIN = 1;
export const PAN_MAX = 12;
/** Zoom by `k` keeping the point (px, py), in the frame's own pixels from its center, where it is on screen. */
export function zoomAt(v: Pan, k: number, px = 0, py = 0): Pan {
  const zoom = Math.max(PAN_MIN, Math.min(PAN_MAX, v.zoom * k));
  const f = zoom / v.zoom;
  return zoom === PAN_MIN ? { x: 0, y: 0, zoom } : { x: px - (px - v.x) * f, y: py - (py - v.y) * f, zoom };
}

/** Opens `href` large; `name` is the downloaded file's name and the picture's label. Focus returns to `from` on close. */
export function openSvgViewer(href: string, name: string, label: string, from?: HTMLElement): void {
  let v: Pan = { x: 0, y: 0, zoom: 1 };
  const img = h('img', { class: 'sv-img', src: href, alt: label, draggable: false });
  const frame = h(
    'div',
    { class: 'sv-frame', tabindex: 0, role: 'group', 'aria-label': `${label}. Drag to move, the wheel, pinch, plus and minus zoom, Home resets.` },
    img,
  );
  const apply = () => (img.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.zoom})`);
  const at = (e: { clientX: number; clientY: number }) => {
    const r = frame.getBoundingClientRect();
    return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2] as const;
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
    if (fingers.size === 2) {
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const now = spread();
      if (pinch && now) zoom(now / pinch);
      pinch = now;
    } else if (v.zoom > PAN_MIN) {
      v = { ...v, x: v.x + e.clientX - last.x, y: v.y + e.clientY - last.y };
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      apply();
    }
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
      zoom(Math.exp(-e.deltaY / 400), ...at(e));
    },
    { passive: false },
  );
  frame.addEventListener('keydown', (e) => {
    const step = 40;
    if (e.key === '+' || e.key === '=') zoom(1.25);
    else if (e.key === '-') zoom(0.8);
    else if (e.key === 'Home') reset();
    else if (e.key.startsWith('Arrow') && v.zoom > PAN_MIN) {
      v = {
        ...v,
        x: v.x + (e.key === 'ArrowLeft' ? step : e.key === 'ArrowRight' ? -step : 0),
        y: v.y + (e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0),
      };
      apply();
    } else return;
    e.preventDefault();
  });

  const dialog = h('dialog', { class: 'sv', 'aria-label': label });
  const close = h('button', { type: 'button', class: 'oc-btn', onclick: () => dialog.close() }, 'Close');
  const bar = h(
    'div',
    { class: 'sv-bar' },
    h('strong', { class: 'sv-title' }, label),
    h('button', { type: 'button', class: 'oc-btn', 'aria-label': 'Zoom in', onclick: () => zoom(1.25) }, '+'),
    h('button', { type: 'button', class: 'oc-btn', 'aria-label': 'Zoom out', onclick: () => zoom(0.8) }, '−'),
    h('button', { type: 'button', class: 'oc-btn', onclick: reset }, 'Reset view'),
    h('a', { class: 'oc-btn sv-dl', href, download: name }, 'Download'),
    close,
  );
  dialog.append(bar, frame);
  // the box behind has its own Escape; this one belongs to the dialog
  dialog.addEventListener('keydown', (e) => e.key === 'Escape' && e.stopPropagation());
  dialog.addEventListener('close', () => {
    dialog.remove();
    from?.focus({ preventScroll: true });
  });
  document.body.append(dialog);
  dialog.showModal();
  frame.focus({ preventScroll: true });
}
