// Lazy assembly controls: one step per physical cut part, with the feelie turntable's drag and keyboard camera.
import './kitAssemblyViewer.css';
import { h } from '../../editor/core/ui';
import { assemblyModel } from './kitAssemblyModel';
import { assemblyView } from './kitAssemblyDraw';
import { trinketTurntable } from './trinketTurntable';
import { cameraBar, zoomCam, type OrbitCam } from '../../manual/printables/orbitCamera';
import '../../manual/printables/orbitCamera.css';
import type { LaserKit } from './laserKits';

let serial = 0;
export function kitAssemblyViewer(kit: LaserKit): { root: HTMLElement; close(): void; focus(): void } {
  const model = assemblyModel(kit.assembly!);
  const home: OrbitCam = { yaw: 0.6, pitch: 0.6, zoom: 1 };
  const resetView = () => {
    Object.assign(view, home);
    view.draw();
  };
  // the turntable has the drag, arrows, wheel, pinch and + and -; Home puts back this view's own start
  const table = trinketTurntable((e) => e.key === 'Home' && (resetView(), true), { spin: false, zoom: true });
  const view = assemblyView(table.canvas, model);
  view.step = 0;
  const id = `kit-assembly-${serial++}`;
  const caption = h('p', { 'aria-live': 'polite', class: 'ka-caption' });
  const count = h('span');
  const slider = h('input', { id, type: 'range', min: '0', max: String(model.steps.length), step: '0.01', value: '0' });
  const back = h('button', { type: 'button' }, 'Back');
  const next = h('button', { type: 'button' }, 'Next');
  // places to jump to: each sub-assembly built apart, putting them together, setting your own code
  const jump = model.sections.length
    ? h('select', { 'aria-label': 'Jump to a part of the assembly' }, ...model.sections.map((s) => h('option', { value: String(s.step) }, s.title)))
    : undefined;
  const play = h('button', { type: 'button', 'aria-pressed': 'false' }, 'Play');
  let target = 0,
    raf = 0,
    timer = 0,
    closed = false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const render = (shown = target) => {
    const p = model.steps[shown - 1];
    count.textContent = shown ? `${shown} of ${model.steps.length}: ${p.label}` : '0: Exploded parts';
    caption.textContent =
      p?.caption ??
      'All parts are separated. Use Next to slide each part into place. Drag or use the arrow keys on the model to turn it; the wheel, pinch, + and - zoom. Escape returns to the box.';
    if (jump) jump.value = String(shown ? ([...model.sections].reverse().find((s) => s.step <= shown)?.step ?? 0) : 0);
    slider.setAttribute('aria-valuetext', count.textContent);
    table.canvas.setAttribute(
      'aria-label',
      `${kit.title}. ${count.textContent}. Drag or use arrow keys to turn; the wheel, pinch, plus and minus zoom; Home resets the view.`,
    );
    back.disabled = target === 0;
    next.disabled = target === model.steps.length;
    view.draw();
  };
  const go = (step: number) => {
    target = Math.max(0, Math.min(model.steps.length, step));
    cancelAnimationFrame(raf);
    const from = view.step,
      start = performance.now();
    render();
    if (reduced()) {
      view.step = target;
      slider.value = String(target);
      view.draw();
      return;
    }
    const tick = (now: number) => {
      if (closed || !root.isConnected) return stop();
      const t = reduced() ? 1 : Math.min(1, (now - start) / Math.min(1800, 650 * Math.max(1, Math.abs(target - from))));
      view.step = from + (target - from) * (t * t * (3 - 2 * t));
      slider.value = String(view.step);
      view.draw();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };
  function stop() {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    timer = 0;
    play.textContent = 'Play';
    play.setAttribute('aria-pressed', 'false');
  }
  function advance() {
    if (closed || !root.isConnected || view.step >= model.steps.length - 1e-6) return stop();
    go(Math.floor(view.step + 1e-6) + 1);
    timer = window.setTimeout(advance, 1900);
  }
  play.onclick = () => {
    if (timer) return stop();
    if (view.step >= model.steps.length - 1e-6) {
      view.step = 0;
      target = 0;
      slider.value = '0';
      render();
    }
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    timer = window.setTimeout(advance, 250);
  };
  slider.oninput = () => {
    // dragging the scrubber pauses the animation and shows the in-between frame for that position
    stop();
    view.step = Number(slider.value);
    target = Math.round(view.step);
    render(Math.ceil(view.step - 1e-6));
  };
  slider.onkeydown = (e) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    stop();
    go(Math.round(view.step) + d);
  };
  if (jump)
    jump.onchange = () => {
      stop();
      go(Number(jump.value));
    };
  back.onclick = () => {
    stop();
    go(Math.round(view.step) - 1);
  };
  next.onclick = () => {
    stop();
    go(Math.round(view.step) + 1);
  };
  const bar = cameraBar({
    zoomIn: () => (zoomCam(view, 1.25), view.draw()),
    zoomOut: () => (zoomCam(view, 0.8), view.draw()),
    reset: resetView,
  });
  const root = h(
    'section',
    { class: 'ka', 'aria-label': `${kit.title} assembly` },
    table.canvas,
    h('label', { for: id }, 'Assembly step'),
    slider,
    count,
    jump,
    h('div', { class: 'ka-buttons' }, back, next, play),
    bar,
    caption,
  );
  void table.showModel(() => Promise.resolve(() => view));
  render();
  return {
    root,
    focus: () => table.canvas.focus({ preventScroll: true }),
    close: () => {
      closed = true;
      stop();
      cancelAnimationFrame(raf);
      table.clear();
    },
  };
}
