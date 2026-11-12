// The balloon cube's fold as a 3D animation you step through: the flat square to the finished die, the steps of the traditional paper
// balloon (crease, collapse, corners up, sides in, flaps tucked, turn over, the same on the back, blow), with a slider, back and next
// buttons, an optional play and a caption per step. Drawn by balloonCubeScene.ts from the fold model; loaded only when the item opens.
import './balloonCubeFold.css';
import './orbitCamera.css';
import { h } from '../../editor/core/ui';
import type { BalloonCubeItem } from './balloonCubeTypes';
import { LAST as last, STEPS } from './balloonCubeFold';
import { sceneBody, sceneDefs } from './balloonCubeScene';
import { attachOrbit, cameraBar, resetCam, zoomCam, type OrbitCam } from './orbitCamera';

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
  svg.setAttribute('tabindex', '0');
  svg.innerHTML = `<defs>${sceneDefs(item, id)}</defs><rect width="${W}" height="${H}" fill="#fff"/>`;
  const stage = document.createElementNS(NS, 'g');
  svg.append(stage);

  const caption = h('p', { class: 'bcf-caption', id: `${id}-cap`, 'aria-live': 'polite' });
  const slider = h('input', { type: 'range', min: '0', max: String(last), step: '0.01', value: '0', id: `${id}-slider`, class: 'bcf-slider' });
  const back = h('button', { type: 'button', class: 'bcf-btn', 'aria-label': 'Back one fold' }, 'Back');
  const next = h('button', { type: 'button', class: 'bcf-btn', 'aria-label': 'Next fold' }, 'Next');
  const play = h('button', { type: 'button', class: 'bcf-btn bcf-play', 'aria-pressed': 'false' }, 'Play');
  const count = h('span', { class: 'bcf-count' });

  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // the viewer's own turn and zoom, added to the animation's camera and kept while stepping
  const home: OrbitCam = { yaw: 0, pitch: 0, zoom: 1 };
  const cam: OrbitCam = { ...home };
  let pos = 0;
  let target = 0;
  let raf = 0;
  let timer = 0;

  function render(): void {
    // toView turns the front face left as yaw grows, so the drag's yaw is negated: dragging right turns the cube right
    stage.innerHTML = sceneBody(pos, id, { w: W, h: H, art: true, zoom: cam.zoom, yaw: -cam.yaw, pitch: cam.pitch });
    slider.value = String(pos);
    // the caption and slider follow the step being worked on: partway through a fold it is that fold's
    const shown = Math.min(last, Math.ceil(pos - 1e-6));
    svg.setAttribute(
      'aria-label',
      `The paper cube, ${STEPS[shown].label.toLowerCase()}. Drag or use the arrow keys to turn it; the wheel, pinch, plus and minus zoom; Home resets the view.`,
    );
    caption.textContent = STEPS[shown].caption;
    count.textContent = `Step ${shown} of ${last}: ${STEPS[shown].label}`;
    slider.setAttribute('aria-valuetext', `Step ${shown} of ${last}: ${STEPS[shown].label}`);
    back.disabled = target <= 0;
    next.disabled = target >= last;
  }

  function goTo(step: number): void {
    target = Math.max(0, Math.min(last, Math.round(step)));
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
    cancelAnimationFrame(raf);
    window.clearTimeout(timer);
    timer = 0;
    play.textContent = target >= last ? 'Play again' : 'Play';
    play.setAttribute('aria-pressed', 'false');
  }
  function advance(): void {
    if (pos >= last - 1e-6) return stop();
    goTo(Math.floor(pos + 1e-6) + 1);
    timer = window.setTimeout(advance, reduced() ? 1800 : 1500);
  }
  play.addEventListener('click', () => {
    if (timer) return stop();
    if (pos >= last - 1e-6) {
      pos = 0;
      target = 0;
      render();
    }
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    timer = window.setTimeout(advance, reduced() ? 1800 : 900);
  });
  slider.addEventListener('input', () => {
    // dragging the scrubber pauses the animation and shows the paper in between two steps
    stop();
    pos = Number(slider.value);
    target = Math.round(pos);
    render();
  });
  slider.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    stop();
    goTo(Math.round(pos) + d);
  });
  back.addEventListener('click', () => {
    stop();
    goTo(target - 1);
  });
  next.addEventListener('click', () => {
    stop();
    goTo(target + 1);
  });

  // a drag during a fold lets the fold run on: every frame draws with the camera as it is then
  attachOrbit(svg, cam, home, () => render(), 1);
  const bar = cameraBar({
    zoomIn: () => (zoomCam(cam, 1.25), render()),
    zoomOut: () => (zoomCam(cam, 0.8), render()),
    reset: () => (resetCam(cam, home), render()),
  });
  render();
  return h(
    'section',
    { class: 'bcf', 'aria-label': 'Watch the die fold, step by step' },
    h('div', { class: 'bcf-stage' }, svg as unknown as Node),
    h('label', { class: 'bcf-label', for: `${id}-slider` }, 'Fold step'),
    h('div', { class: 'bcf-bar' }, back, slider, next),
    h('div', { class: 'bcf-bar bcf-bar2' }, count, play),
    bar,
    caption,
  );
}
