// The balloon cube's fold as a 3D animation you step through: the flat square to the finished die, the steps of the traditional paper
// balloon (crease, collapse, corners up, sides in, flaps tucked, turn over, the same on the back, blow), with a slider, back and next
// buttons, an optional play and a caption per step. Drawn by balloonCubeScene.ts from the fold model; loaded only when the item opens.
import './balloonCubeFold.css';
import { h } from '../../editor/core/ui';
import type { BalloonCubeItem } from './balloonCubeTypes';
import { LAST as last, STEPS } from './balloonCubeFold';
import { sceneBody, sceneDefs } from './balloonCubeScene';

const NS = 'http://www.w3.org/2000/svg';
const W = 300;
const H = 250;
let uid = 0;

/** Build the viewer for one item; the caller puts it on the page. */
export function foldViewer(item: BalloonCubeItem): HTMLElement {
  const id = `bcf${uid++}`;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'bcf-svg');
  svg.setAttribute('role', 'img');
  svg.innerHTML = `<defs>${sceneDefs(item, id)}</defs><rect width="${W}" height="${H}" fill="#fff"/>`;
  const stage = document.createElementNS(NS, 'g');
  svg.append(stage);

  const caption = h('p', { class: 'bcf-caption', id: `${id}-cap`, 'aria-live': 'polite' });
  const slider = h('input', { type: 'range', min: '0', max: String(last), step: '1', value: '0', id: `${id}-slider`, class: 'bcf-slider' });
  const back = h('button', { type: 'button', class: 'bcf-btn', 'aria-label': 'Back one fold' }, 'Back');
  const next = h('button', { type: 'button', class: 'bcf-btn', 'aria-label': 'Next fold' }, 'Next');
  const play = h('button', { type: 'button', class: 'bcf-btn bcf-play', 'aria-pressed': 'false' }, 'Play');
  const count = h('span', { class: 'bcf-count' });

  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pos = 0;
  let target = 0;
  let raf = 0;
  let timer = 0;

  function render(): void {
    stage.innerHTML = sceneBody(pos, id, { w: W, h: H, art: true });
    // the caption and slider follow the step being worked on: partway through a fold it is that fold's
    const shown = Math.min(last, Math.ceil(pos - 1e-6));
    svg.setAttribute('aria-label', `The paper cube, ${STEPS[shown].label.toLowerCase()}`);
    caption.textContent = STEPS[shown].caption;
    count.textContent = `Step ${shown} of ${last}: ${STEPS[shown].label}`;
    slider.setAttribute('aria-valuetext', `Step ${shown} of ${last}: ${STEPS[shown].label}`);
    back.disabled = shown <= 0 && target <= 0;
    next.disabled = target >= last;
  }

  function goTo(step: number): void {
    target = Math.max(0, Math.min(last, Math.round(step)));
    slider.value = String(target);
    cancelAnimationFrame(raf);
    if (reduced()) {
      pos = target;
      render();
      return;
    }
    let from = pos;
    let t0 = 0;
    const dur = 650 * Math.max(0.6, Math.abs(target - from));
    const tick = (now: number) => {
      t0 ||= now;
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      pos = from + (target - from) * e;
      render();
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    from = pos;
  }

  function stop(): void {
    window.clearTimeout(timer);
    timer = 0;
    play.textContent = target >= last ? 'Play again' : 'Play';
    play.setAttribute('aria-pressed', 'false');
  }
  function advance(): void {
    if (target >= last) return stop();
    goTo(target + 1);
    timer = window.setTimeout(advance, reduced() ? 1800 : 1500);
  }
  play.addEventListener('click', () => {
    if (timer) return stop();
    if (target >= last) goTo(0);
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    timer = window.setTimeout(advance, reduced() ? 1800 : 900);
  });
  slider.addEventListener('input', () => {
    stop();
    goTo(Number(slider.value));
  });
  back.addEventListener('click', () => {
    stop();
    goTo(target - 1);
  });
  next.addEventListener('click', () => {
    stop();
    goTo(target + 1);
  });

  render();
  return h(
    'section',
    { class: 'bcf', 'aria-label': 'Watch the die fold, step by step' },
    h('div', { class: 'bcf-stage' }, svg as unknown as Node),
    h('label', { class: 'bcf-label', for: `${id}-slider` }, 'Fold step'),
    h('div', { class: 'bcf-bar' }, back, slider, next),
    h('div', { class: 'bcf-bar bcf-bar2' }, count, play),
    caption,
  );
}
