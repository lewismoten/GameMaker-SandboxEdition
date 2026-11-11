// The balloon cube's fold as a 3D animation you step through: the flat square to the finished die, one fold per step, with a slider,
// back and next buttons, an optional play and a caption per step. Drawn as svg from balloonCubeFold.ts (the real net: panels, tucks and
// corner triangles), seen from a fixed angle, nearest panels last. Loaded only when someone asks to watch it (balloonCube.ts).
import './balloonCubeFold.css';
import { h } from '../../editor/core/ui';
import { faceArt } from './balloonCube';
import { L, PLACEMENTS, type V2, type V3 } from './balloonCubeModel';
import type { BalloonCubeItem } from './balloonCubeTypes';
import { PANELS, STEPS, apply, creaseAt, normalOf, pose, stateAt, toView, tuckFocusAt, type Panel, type View } from './balloonCubeFold';

const NS = 'http://www.w3.org/2000/svg';
const VIEW: View = { yaw: (38 * Math.PI) / 180, pitch: (57 * Math.PI) / 180 };
const W = 300;
const H = 250;
const LIGHT: V3 = [-0.35, -0.5, 0.8]; // view space: x right, y down, nearness (so up-left of the viewer)
const last = STEPS.length - 1;
let uid = 0;

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};
const f2 = (n: number) => n.toFixed(2);

interface Drawn {
  panel: Panel;
  g: SVGGElement;
  fill: SVGPolygonElement;
  art?: SVGGElement;
  shade: SVGPolygonElement;
}

/** Build the viewer for one item; the caller puts `.root` on the page. */
export function foldViewer(item: BalloonCubeItem): HTMLElement {
  const id = `bcf${uid++}`;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bcf-svg', role: 'img' });
  const defs = el('defs');
  defs.innerHTML = `<pattern id="${id}-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#ece8dc"/><line x1="0" y1="0" x2="0" y2="7" stroke="#8b857b" stroke-width="2"/></pattern>`;
  svg.append(defs);
  const stage = el('g');
  svg.append(stage);
  // the pre-crease lines (step 1), drawn over the flat sheet: both midlines and both diagonals
  const creaseG = el('g', { class: 'bcf-creases', 'aria-hidden': 'true' });
  const CREASE_LINES: { a: V2; b: V2; valley: boolean }[] = [
    { a: [-0.5, 0], b: [0.5, 0], valley: false },
    { a: [0, -0.5], b: [0, 0.5], valley: false },
    { a: [-0.5, -0.5], b: [0.5, 0.5], valley: true },
    { a: [-0.5, 0.5], b: [0.5, -0.5], valley: true },
  ];
  const creaseEls = CREASE_LINES.map((c) => {
    const ln = el('line', { class: c.valley ? 'bcf-crease bcf-valley' : 'bcf-crease bcf-mountain' });
    creaseG.append(ln);
    return ln;
  });
  svg.append(creaseG);

  const drawn: Drawn[] = PANELS.map((panel) => {
    const g = el('g');
    const fill = el('polygon', { class: 'bcf-paper' });
    g.append(fill);
    let art: SVGGElement | undefined;
    if (panel.art !== undefined) {
      const pl = PLACEMENTS[panel.art];
      // the art's clip, in the art's own units
      const toArt = (q: V2): V2 => {
        const dx = q[0] - pl.sheet.o[0];
        const dy = q[1] - pl.sheet.o[1];
        return [((dx * pl.sheet.right[0] + dy * pl.sheet.right[1]) / L) * 100, (-(dx * pl.sheet.up[0] + dy * pl.sheet.up[1]) / L) * 100];
      };
      const cid = `${id}-c${panel.art}`;
      const cp = el('clipPath', { id: cid });
      cp.append(el('polygon', { points: pl.clip.map((q) => toArt(q).map(f2).join(',')).join(' ') }));
      defs.append(cp);
      art = el('g');
      const inner = el('g', { 'clip-path': `url(#${cid})` });
      inner.innerHTML = faceArt(item.faces[pl.face], pl.face === 'top');
      art.append(inner);
      g.append(art);
    }
    const shade = el('polygon', { class: 'bcf-shade' });
    g.append(shade);
    stage.append(g);
    return { panel, g, fill, art, shade };
  });

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
    const poses = pose(stateAt(pos));
    const swell = 1 + 0.07 * stateAt(pos).puff;
    // fit the paper to the picture: the flat square wide, the finished cube close
    const raw = drawn.map((d) => {
      const m = poses.get(d.panel.id)!;
      return { d, m, vs: d.panel.poly.map((p) => toView(apply(m, [p[0], p[1], 0]), VIEW)) };
    });
    const xs = raw.flatMap((r) => r.vs.map((v) => v[0]));
    const ys = raw.flatMap((r) => r.vs.map((v) => v[1]));
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const focus = tuckFocusAt(pos);
    const scale0 = Math.min(330, Math.min((W * 0.86) / (x1 - x0), (H * 0.78) / (y1 - y0))) * swell;
    const scale = scale0 * (1 + 0.2 * focus);
    const cx = W / 2 - ((x0 + x1) / 2) * scale;
    const cy = H * 0.47 - ((y0 + y1) / 2) * scale;
    const items = raw.map(({ d, m }) => {
      const view = (p: V2): V3 => {
        const q = toView(apply(m, [p[0], p[1], 0]), VIEW);
        return [cx + q[0] * scale, cy + q[1] * scale, q[2]];
      };
      const vs = d.panel.poly.map(view);
      const n = toView(normalOf(m), VIEW); // the view is a pure turn, so this is the printed side's direction
      return { d, vs, n, view, depth: vs.reduce((s, v) => s + v[2], 0) / vs.length };
    });
    items.sort((a, b) => a.depth - b.depth);
    const cr = creaseAt(pos);
    creaseG.setAttribute('opacity', f2(cr));
    CREASE_LINES.forEach((c, i) => {
      const q = [c.a, c.b].map((p) => toView(apply(pose(stateAt(0)).get('bottom')!, [p[0], p[1], 0]), VIEW));
      creaseEls[i].setAttribute('x1', f2(cx + q[0][0] * scale));
      creaseEls[i].setAttribute('y1', f2(cy + q[0][1] * scale));
      creaseEls[i].setAttribute('x2', f2(cx + q[1][0] * scale));
      creaseEls[i].setAttribute('y2', f2(cy + q[1][1] * scale));
    });
    for (const { d, vs, n, view } of items) {
      stage.append(d.g); // moves it last: drawn on top
      const printed = d.panel.kind !== 'tuck' && n[2] > 0; // the printed side faces the viewer
      const pts = vs.map((v) => `${f2(v[0])},${f2(v[1])}`).join(' ');
      d.fill.setAttribute('points', pts);
      d.shade.setAttribute('points', pts);
      d.g.setAttribute('class', `bcf-panel bcf-${d.panel.kind}`);
      d.fill.setAttribute('class', d.panel.kind === 'tuck' ? 'bcf-paper bcf-tuck' : printed ? 'bcf-paper bcf-front' : 'bcf-paper bcf-back');
      if (d.panel.kind === 'tuck') d.fill.setAttribute('fill', `url(#${id}-hatch)`);
      else d.fill.removeAttribute('fill');
      // the tuck close-up: the lid corners turn see-through so the gray tucks under them show, outlined in red
      d.g.setAttribute('opacity', f2(d.panel.kind === 'corner' ? 1 - 0.55 * focus : 1));
      const hot = d.panel.kind === 'tuck' && focus > 0;
      d.fill.style.stroke = hot ? '#c4202c' : '';
      d.fill.style.strokeWidth = hot ? '3' : '';
      const sign = n[2] > 0 ? 1 : -1;
      const lit = Math.max(0, sign * (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]));
      d.shade.setAttribute('fill-opacity', f2(Math.min(0.2, (1 - Math.min(1, lit)) * 0.2)));
      if (d.art) {
        d.art.style.display = printed ? '' : 'none';
        if (printed) {
          const pl = PLACEMENTS[d.panel.art!];
          const o = view(pl.sheet.o);
          const px = view([pl.sheet.o[0] + pl.sheet.right[0] * L, pl.sheet.o[1] + pl.sheet.right[1] * L]);
          const py = view([pl.sheet.o[0] - pl.sheet.up[0] * L, pl.sheet.o[1] - pl.sheet.up[1] * L]);
          d.art.setAttribute(
            'transform',
            `matrix(${[(px[0] - o[0]) / 100, (px[1] - o[1]) / 100, (py[0] - o[0]) / 100, (py[1] - o[1]) / 100, o[0], o[1]].map((v) => v.toFixed(5)).join(' ')})`,
          );
        }
      }
    }
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
