// The Phone of the Future kit, turning on a canvas in the box viewer (trinketShelf.ts): the same feel as the
// trinkets (slow spin; drag to turn; arrow keys; Home puts it back) and the box viewer (wheel or pinch to
// zoom, shift-drag or two fingers to pan, double-click to reset), with four views (assembled, exploded,
// electronics, bare board) and a slider that spreads the parts apart along the stack. Reduced motion: no
// spin and an instant explosion. It stops drawing while out of sight. Loaded with the first look (it
// brings the 1.8 MB of parts with it).
import './phoneViewer.css';
import { h } from '../../../editor/core/ui';
import { loadPhone, type Part, type ViewFilter } from './phoneData';
import { createPhoneView, type PhoneView } from './phoneGl';

const REPO = 'https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/games/year2000/phone/';
const TURN = 0.3;
const FIRST = { yaw: 0.6, pitch: -0.25 };
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Mode = 'assembled' | 'exploded' | 'electronics' | 'bare';
const MODES: { mode: Mode; label: string; filter: ViewFilter; explode: number; what: string }[] = [
  { mode: 'assembled', label: 'Assembled', filter: 'all', explode: 0, what: 'the whole phone' },
  { mode: 'exploded', label: 'Exploded', filter: 'all', explode: 1, what: 'the parts spread apart' },
  { mode: 'electronics', label: 'Electronics', filter: 'electronics', explode: 0, what: 'the board and its parts, no shell' },
  { mode: 'bare', label: 'Bare board', filter: 'bare', explode: 0, what: 'just the circuit board, with its silkscreen art' },
];

export interface PhoneViewer {
  canvas: HTMLCanvasElement;
  /** Says 3D isn't available, in the canvas's place. */
  status: HTMLElement;
  /** The controls and words that go in the box viewer's panel. */
  info: HTMLElement;
  /** Loads the parts and starts drawing. */
  open(): Promise<void>;
  /** Stops drawing and lets the GPU buffers go. */
  close(): void;
}

export function createPhoneViewer(): PhoneViewer {
  let view: PhoneView | undefined;
  let parts: Part[] = [];
  let visible = true;
  let spinning = !reduced();
  let raf = 0;
  let last = 0;
  let opened = 0;
  let mode: Mode = 'assembled';
  let tween: { from: number; to: number; start: number } | undefined;

  const canvas = h('canvas', { class: 'trk-canvas phone-canvas', tabindex: 0, role: 'img' });
  const status = h('span', { class: 'trk-flat', hidden: '' }, '3D is not available here; the parts files still download from the repository.');
  const say = h('p', { class: 'phone-say', role: 'status' });
  const slider = h('input', { id: 'phone-explode', type: 'range', min: '0', max: '100', value: '0', class: 'phone-slider' });

  const buttons = MODES.map((m) =>
    h('button', { class: 'trk-btn', type: 'button', 'aria-pressed': String(m.mode === mode), onclick: () => choose(m.mode) }, m.label),
  );
  const info = h(
    'div',
    { class: 'trk-info phone-info', hidden: '' },
    h('strong', { class: 'trk-title' }, 'The Phone of the Future (kit)'),
    h(
      'span',
      { class: 'trk-blurb' },
      'An untested build-it-yourself design: a phone you solder and print, not one that has been built. ',
      h('a', { class: 'trk-dl', href: `${REPO}PARTS.md`, target: '_blank', rel: 'noopener' }, 'Parts list'),
      ' · ',
      h('a', { class: 'trk-dl', href: `${REPO}README.md#build-order-for-a-beginner`, target: '_blank', rel: 'noopener' }, 'Build steps'),
    ),
    h('div', { class: 'trk-mode', role: 'group', 'aria-label': 'Show the phone as' }, ...buttons),
    h('label', { class: 'phone-explode', for: 'phone-explode' }, h('span', null, 'Explode'), slider),
    say,
  );

  const draw = () => {
    if (!view) return;
    view.snap = reduced();
    if (tween) {
      const k = reduced() ? 1 : Math.min(1, (performance.now() - tween.start) / 700);
      view.explode = tween.from + (tween.to - tween.from) * k;
      slider.value = String(Math.round(view.explode * 100));
      if (k >= 1) tween = undefined;
    }
    return view.draw();
  };
  const frame = (t: number) => {
    raf = 0;
    if (spinning && visible && view) {
      view.yaw += Math.min(t - last, 50) * 0.0006;
      last = t;
    }
    const easing = draw();
    if (visible && (spinning || easing || tween)) raf = requestAnimationFrame(frame);
  };
  const wake = () => {
    if (!raf && view) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const stopSpin = () => {
    spinning = false;
  };

  function describe() {
    const m = MODES.find((x) => x.mode === mode)!;
    const groups = new Set(parts.map((p) => p.group)).size;
    say.textContent = `${m.label}: ${m.what}. ${parts.length} parts in ${groups} groups.`;
    canvas.setAttribute(
      'aria-label',
      `The Phone of the Future kit, a 3D model. ${m.label}: ${m.what}. Drag to turn, scroll to zoom, shift-drag to pan, arrow keys to turn, Home to put it back.`,
    );
  }
  function choose(next: Mode) {
    mode = next;
    const m = MODES.find((x) => x.mode === next)!;
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(MODES[i].mode === next)));
    if (view) {
      view.filter = m.filter;
      tween = { from: view.explode, to: m.explode, start: performance.now() };
    }
    describe();
    wake();
  }
  slider.addEventListener('input', () => {
    if (!view) return;
    tween = undefined;
    view.explode = Number(slider.value) / 100;
    // a slider that lands at an end says which view it is
    if (view.filter === 'all') {
      mode = view.explode > 0.5 ? 'exploded' : 'assembled';
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(MODES[i].mode === mode)));
      describe();
    }
    wake();
  });

  const reset = () => {
    if (!view) return;
    Object.assign(view, FIRST, { zoom: 1, panX: 0, panY: 0 });
    wake();
  };
  const turn = (dyaw: number, dpitch: number) => {
    if (!view) return;
    stopSpin();
    view.yaw += dyaw;
    view.pitch = Math.max(-1.2, Math.min(1.2, view.pitch + dpitch));
    wake();
  };
  const zoomBy = (k: number) => {
    if (!view) return;
    stopSpin();
    view.zoom = Math.max(0.4, Math.min(4, view.zoom * k));
    wake();
  };

  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') turn(-TURN, 0);
    else if (e.key === 'ArrowRight') turn(TURN, 0);
    else if (e.key === 'ArrowUp') turn(0, -0.2);
    else if (e.key === 'ArrowDown') turn(0, 0.2);
    else if (e.key === 'Home') {
      stopSpin();
      reset();
    } else if (e.key === '+' || e.key === '=') zoomBy(1.2);
    else if (e.key === '-') zoomBy(1 / 1.2);
    else return;
    e.preventDefault();
  });

  // drag to turn; shift-drag, middle button or a second finger to pan; wheel or pinch to zoom
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.classList.add('turning');
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev || !view) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stopSpin();
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) view.zoom = Math.max(0.4, Math.min(4, view.zoom * (dist / pinch)));
      pinch = dist;
      view.panX += dx / 2;
      view.panY += dy / 2;
      wake();
    } else if (e.shiftKey || e.buttons === 4 || view.zoom > 1.6) {
      view.panX += dx;
      view.panY += dy;
      wake();
    } else turn(dx * 0.012, dy * 0.008);
  });
  const release = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = 0;
    if (!pointers.size) canvas.classList.remove('turning');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY / 400));
    },
    { passive: false },
  );
  canvas.addEventListener('dblclick', () => {
    spinning = !reduced();
    reset();
  });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake();
  }).observe(canvas);

  return {
    canvas,
    status,
    info,
    async open() {
      const mine = ++opened;
      canvas.classList.add('loading');
      try {
        parts = await loadPhone();
        if (mine !== opened) return;
        view?.dispose();
        view = createPhoneView(canvas, parts);
        if (!view) throw new Error('no WebGL');
        const m = MODES.find((x) => x.mode === mode)!;
        view.filter = m.filter;
        view.explode = m.explode;
        slider.value = String(m.explode * 100);
        spinning = !reduced();
        status.hidden = true;
        canvas.hidden = false;
        canvas.classList.remove('loading');
        describe();
        wake();
      } catch {
        if (mine !== opened) return;
        canvas.hidden = true;
        status.hidden = false;
      }
    },
    close() {
      opened++;
      cancelAnimationFrame(raf);
      raf = 0;
      view?.dispose();
      view = undefined;
    },
  };
}
