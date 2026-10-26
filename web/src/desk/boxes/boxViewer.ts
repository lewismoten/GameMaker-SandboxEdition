// The box viewer: a box's six faces folded into a 3D box (boxModel) that comes forward and
// turns slowly; drag to turn it, scroll or pinch to zoom, shift-drag (or two fingers) to pan,
// double-click to reset, and step along the shelf to the other boxes. With the desk's black
// light on, the box in hand shows its glowing lettering too (actions.uv, boxUv.ts).
import './boxViewer.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { type BoxFaces } from './gameBox';

/** The box as six faces, sized by the --u custom property (pixels per inch). */
export function boxModel(faces: BoxFaces): HTMLElement {
  const face = (name: keyof BoxFaces) => h('div', { class: `bface ${name}` }, h('img', { src: faces[name], alt: '', draggable: false }));
  return h('div', { class: 'box3d' }, face('front'), face('back'), face('left'), face('right'), face('top'), face('bottom'));
}

interface BoxViewerActions {
  manual?: () => void;
  insert?: () => void;
  /** What the insert button says (the disk by default). */
  insertLabel?: string;
  /** Things that came in the box, shown beside it. */
  extras?: HTMLElement;
  /** Lays the box's black-light print over its model (boxUv.ts dressUv). */
  uv?: (model: HTMLElement) => void;
  /** The previous (-1) or next (1) box on the shelf, to look at without closing the viewer. */
  step?: (dir: 1 | -1) => Promise<BoxViewerPage | undefined>;
}

export interface BoxViewerPage {
  entry: Pick<CatalogEntry, 'title'>;
  faces: BoxFaces;
  actions: BoxViewerActions;
}

/**
 * Brings a box to the middle of the screen to turn, zoom and read. With actions.step,
 * ◀ ▶ (or PageUp/PageDown, [ and ]) go along the shelf to the other boxes.
 */
export function openBoxViewer(entry: Pick<CatalogEntry, 'title'>, faces: BoxFaces, actions: BoxViewerActions): Promise<void> {
  return new Promise((resolve) => {
    let model = boxModel(faces);
    let current: BoxViewerPage = { entry, faces, actions };
    // the desk's black light: on (by day only dimly), and the box's glowing print laid over it
    const desk = document.querySelector('.desk.bl-uv');
    const uv = desk ? (desk.classList.contains('bl-night') ? 'uv night' : 'uv') : '';
    if (uv) actions.uv?.(model);
    const stage = h('div', { class: 'box-stage' }, model);
    let rx = -12;
    let ry = 32;
    let zoom = 1;
    let px = 0;
    let py = 0;
    let auto = true;
    let raf = 0;
    let stepping = false;
    const apply = () => {
      model.style.transform = `translate(${px}px, ${py}px) scale(${zoom}) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    // with reduced motion asked for, the box holds still until it is turned by hand or key
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spin = () => {
      if (auto && !still) {
        ry += 0.25;
        apply();
      }
      raf = requestAnimationFrame(spin);
    };
    const close = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      opener?.focus({ preventScroll: true });
      resolve();
    };
    /** Puts the shelf's next or previous box in place of this one. */
    const step = async (dir: 1 | -1) => {
      if (stepping || !current.actions.step) return;
      stepping = true;
      const page = await current.actions.step(dir).catch(() => undefined);
      stepping = false;
      if (!page || !overlay.isConnected) return;
      current = page;
      const next = boxModel(page.faces);
      next.classList.add(dir > 0 ? 'from-right' : 'from-left');
      model.replaceWith(next);
      model = next;
      if (uv) page.actions.uv?.(model);
      rx = -12;
      ry = 32;
      zoom = 1;
      px = py = 0;
      auto = true;
      apply();
      fill();
    };
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      if (e.key === 'Escape') close();
      else if (e.key === 'PageDown' || e.key === ']') void step(1);
      else if (e.key === 'PageUp' || e.key === '[') void step(-1);
      else if (e.key === 'ArrowLeft') ry -= 15;
      else if (e.key === 'ArrowRight') ry += 15;
      else if (e.key === 'ArrowUp') rx += 10;
      else if (e.key === 'ArrowDown') rx -= 10;
      else if (e.key === '+' || e.key === '=') zoom = Math.min(4, zoom * 1.2);
      else if (e.key === '-') zoom = Math.max(0.4, zoom / 1.2);
      else return;
      e.preventDefault();
      if (['PageDown', 'PageUp', '[', ']', 'Escape'].includes(e.key)) return;
      auto = false;
      apply();
    };
    window.addEventListener('keydown', onKey, true);

    // drag to turn; shift-drag or a second finger to pan; wheel or pinch to zoom
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    stage.addEventListener('pointerdown', (e) => {
      e.preventDefault(); // turn the box, don't drag its picture away
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      auto = false;
    });
    stage.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) zoom = Math.max(0.4, Math.min(4, zoom * (dist / pinch)));
        pinch = dist;
        px += dx / 2;
        py += dy / 2;
      } else if (e.shiftKey || e.buttons === 4 || zoom > 1.6) {
        px += dx;
        py += dy;
      } else {
        ry += dx * 0.4;
        rx = Math.max(-80, Math.min(80, rx - dy * 0.4));
      }
      apply();
    });
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        auto = false;
        zoom = Math.max(0.4, Math.min(4, zoom * Math.exp(-e.deltaY / 400)));
        apply();
      },
      { passive: false },
    );
    stage.addEventListener('dblclick', () => {
      rx = -12;
      ry = 32;
      zoom = 1;
      px = py = 0;
      auto = true;
      apply();
    });

    const arrow = (dir: 1 | -1) =>
      h(
        'button',
        {
          class: `box-nav ${dir > 0 ? 'next' : 'prev'}`,
          title: dir > 0 ? 'Next box on the shelf (PageDown or ])' : 'Previous box on the shelf (PageUp or [)',
          'aria-label': dir > 0 ? 'Next box' : 'Previous box',
          onclick: () => void step(dir),
        },
        dir > 0 ? '▶' : '◀',
      );
    const extrasSlot = h('div', { class: 'box-extras-slot' });
    const bar = h('div', { class: 'box-viewer-bar' });
    // keyboard: focus moves into the viewer (Tab reaches what came in the box first) and back on close
    const opener = document.activeElement as HTMLElement | null;
    const overlay = h('div', { class: `box-viewer ${uv}`, role: 'dialog', tabindex: -1 }, stage, extrasSlot, bar);
    /** The title, buttons and extras for the box being shown. */
    const fill = () => {
      const { entry: e, actions: a } = current;
      overlay.setAttribute('aria-label', `${e.title} box`);
      extrasSlot.replaceChildren(...(a.extras ? [a.extras] : []));
      bar.replaceChildren(
        h('strong', null, e.title),
        h(
          'span',
          { class: 'hint' },
          `Drag to turn · scroll to zoom · shift-drag to pan · double-click to reset${a.step ? ' · PageUp/PageDown for other boxes' : ''}`,
        ),
        ...[
          a.insert ? h('button', { class: 'primary', onclick: () => (close(), a.insert!()) }, a.insertLabel ?? 'Put the disk in drive A:') : null,
          a.manual ? h('button', { onclick: () => (close(), a.manual!()) }, 'Read the manual') : null,
          h('button', { onclick: close }, 'Close (Esc)'),
        ].filter((x): x is HTMLButtonElement => !!x),
      );
      overlay.querySelectorAll('.box-nav').forEach((n) => n.remove());
      if (a.step) overlay.append(arrow(-1), arrow(1));
    };
    fill();
    document.body.append(overlay);
    overlay.focus({ preventScroll: true });
    apply();
    raf = requestAnimationFrame(spin);
  });
}
