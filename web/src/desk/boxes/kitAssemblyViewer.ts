// Lazy assembly controls: one step per physical cut part, with the feelie turntable's drag and keyboard camera.
import './kitAssemblyViewer.css';
import { h } from '../../editor/core/ui';
import { assemblyModel } from './kitAssemblyModel';
import { assemblyView } from './kitAssemblyDraw';
import { trinketTurntable } from './trinketTurntable';
import type { LaserKit } from './laserKits';

let serial = 0;
export function kitAssemblyViewer(kit: LaserKit): { root: HTMLElement; close(): void; focus(): void } {
  const model = assemblyModel(kit.assembly!);
  const table = trinketTurntable(undefined, { spin: false });
  const view = assemblyView(table.canvas, model);
  view.step = 0;
  const id = `kit-assembly-${serial++}`;
  const caption = h('p', { 'aria-live': 'polite', class: 'ka-caption' });
  const count = h('span');
  const slider = h('input', { id, type: 'range', min: '0', max: String(model.parts.length), step: '1', value: '0' });
  const back = h('button', { type: 'button' }, 'Back');
  const next = h('button', { type: 'button' }, 'Next');
  const play = h('button', { type: 'button', 'aria-pressed': 'false' }, 'Play');
  let target = 0,
    raf = 0,
    timer = 0,
    closed = false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const render = () => {
    const p = model.parts[target - 1];
    count.textContent = target ? `${target} of ${model.parts.length}: ${p.id}` : '0: Exploded parts';
    caption.textContent =
      p?.caption ??
      'All parts are separated. Use Next to slide each part into place. Drag or use the arrow keys on the model to turn it. Escape returns to the box.';
    slider.value = String(target);
    slider.setAttribute('aria-valuetext', count.textContent);
    table.canvas.setAttribute('aria-label', `${kit.title}. ${count.textContent}. Drag or use arrow keys to turn; Home resets the view.`);
    back.disabled = target === 0;
    next.disabled = target === model.parts.length;
    view.draw();
  };
  const go = (step: number) => {
    target = Math.max(0, Math.min(model.parts.length, step));
    cancelAnimationFrame(raf);
    const from = view.step,
      start = performance.now();
    render();
    if (reduced()) {
      view.step = target;
      view.draw();
      return;
    }
    const tick = (now: number) => {
      if (closed || !root.isConnected) return stop();
      const t = reduced() ? 1 : Math.min(1, (now - start) / (650 * Math.max(1, Math.abs(target - from))));
      view.step = from + (target - from) * (t * t * (3 - 2 * t));
      view.draw();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };
  function stop() {
    clearTimeout(timer);
    timer = 0;
    play.textContent = 'Play';
    play.setAttribute('aria-pressed', 'false');
  }
  function advance() {
    if (closed || !root.isConnected || target === model.parts.length) return stop();
    go(target + 1);
    timer = window.setTimeout(advance, 1900);
  }
  play.onclick = () => {
    if (timer) return stop();
    if (target === model.parts.length) {
      view.step = 0;
      target = 0;
      render();
    }
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    timer = window.setTimeout(advance, 250);
  };
  slider.oninput = () => {
    stop();
    go(Number(slider.value));
  };
  back.onclick = () => {
    stop();
    go(target - 1);
  };
  next.onclick = () => {
    stop();
    go(target + 1);
  };
  const root = h(
    'section',
    { class: 'ka', 'aria-label': `${kit.title} assembly` },
    table.canvas,
    h('label', { for: id }, 'Assembly step'),
    slider,
    count,
    h('div', { class: 'ka-buttons' }, back, next, play),
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
