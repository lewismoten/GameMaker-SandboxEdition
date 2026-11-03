// A game's paper code wheel (types.ts CodeWheelItem): an outer disc with a ring of symbols and a smaller disc
// pinned over it that turns, its own ring facing the outer one and windows cut through it onto a ring printed
// on the outer disc underneath. Drawn once as SVG for both uses: printed (codeWheelSheets), the two discs on
// their own letter sheets with cut lines, the windows to cut out and the pin's mark, to cut out and fasten with
// a brass paper fastener; on screen (codeWheelLive), the turning disc turns (drag it, or the arrow keys, a
// place at a time) and each puzzle has a "Tell me the answer" that sets the wheel and says it. The 1994 desk
// lays the same wheel beside its monitor on a puzzle's scenes (desk/codeWheelOnDesk.ts).
import './codeWheel.css';
import { h } from '../../editor/core/ui';
import { sheet, type Sheet } from './kit';
import type { CodeWheelItem } from './types';

const NS = 'http://www.w3.org/2000/svg';
/** The discs, in the drawing's units (the outer disc is 200 across). */
const R = { outer: 98, rimBand: 89, ringIn: 75, inner: 73, innerRingIn: 55, hiddenOut: 49, hiddenIn: 32, hub: 15 };

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...kids: SVGElement[]): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  e.append(...kids);
  return e;
}

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
const at = (r: number, deg: number) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))] as const;

/** A ring segment from r0 to r1, `a0`..`a1` degrees clockwise from the top. */
function sector(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = at(r1, a0);
  const [x1, y1] = at(r1, a1);
  const [x2, y2] = at(r0, a1);
  const [x3, y3] = at(r0, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${x0},${y0}A${r1},${r1} 0 ${big} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${big} 0 ${x3},${y3}Z`;
}

/** One symbol, upright to the ring (its top toward the rim), `size` tall, centered at radius r and angle deg. */
function symbol(it: CodeWheelItem, name: string, r: number, deg: number, size: number, cls: string): SVGElement {
  const [x, y] = at(r, deg);
  const g = el('g', { class: cls, transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg})` });
  const rows = it.glyphs?.[name];
  if (rows?.length) {
    const cell = size / rows.length;
    const w = rows[0].length * cell;
    let d = '';
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++)
        if (row[rx] === '#')
          d += `M${(rx * cell - w / 2).toFixed(2)},${(ry * cell - size / 2).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h${(-cell).toFixed(2)}z`;
    });
    g.append(el('path', { d, class: 'cw-glyph' }));
  } else {
    const t = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': (size * (name.length > 2 ? 0.55 : 0.85)).toFixed(2) });
    t.textContent = name;
    g.append(t);
  }
  return g;
}

/** Text running clockwise round a circle of radius r, centered at the top. */
function rimText(id: string, r: number, text: string, size: number, cls: string): SVGElement {
  const path = el('path', { id, d: `M${-r},0A${r},${r} 0 1 1 ${r},0A${r},${r} 0 1 1 ${-r},0`, fill: 'none' });
  const t = el('text', { 'font-size': size, class: cls, 'text-anchor': 'middle' });
  const tp = el('textPath', { href: `#${id}`, startOffset: '25%' });
  tp.textContent = text;
  t.append(tp);
  return el('g', {}, el('defs', {}, path), t);
}

let uid = 0;

/** The outer disc: its rim lettering, its ring of symbols, and the hidden ring under the turning disc. */
function outerDisc(it: CodeWheelItem, cut: boolean): SVGElement {
  const n = it.outer.length;
  const step = 360 / n;
  const g = el('g', { class: 'cw-outer' }, el('circle', { r: R.outer, class: `cw-paper${cut ? ' cw-cut' : ''}` }));
  for (let i = 0; i < n; i++) {
    g.append(el('path', { d: sector(R.ringIn, R.rimBand, i * step - step / 2, i * step + step / 2), class: 'cw-cell' }));
    g.append(symbol(it, it.outer[i], (R.ringIn + R.rimBand) / 2, i * step, Math.min(13, (R.ringIn * 2 * Math.PI) / n) * 0.8, 'cw-sym'));
    if (it.hidden) {
      g.append(el('path', { d: sector(R.hiddenIn, R.hiddenOut, i * step - step / 2, i * step + step / 2), class: 'cw-cell cw-hidden-cell' }));
      g.append(symbol(it, it.hidden[i], (R.hiddenIn + R.hiddenOut) / 2, i * step, Math.min(11, (R.hiddenIn * 2 * Math.PI) / n) * 0.8, 'cw-sym'));
    }
  }
  // the heading in the band between the ring and the rim
  g.append(rimText(`cw-rim${++uid}`, R.rimBand + 2.2, it.heading.toUpperCase(), 4.2, 'cw-rim'));
  g.append(el('circle', { r: 1.4, class: 'cw-pin' }));
  return g;
}

/** The turning disc: its ring facing the outer one, the windows cut through it, its hub and pointer. */
function innerDisc(it: CodeWheelItem, cut: boolean): SVGElement {
  const n = it.inner.length;
  const step = 360 / n;
  const g = el('g', { class: 'cw-inner' });
  // the disc with its windows as holes (evenodd), so the outer disc shows through them on screen
  let d = `M0,${-R.inner}A${R.inner},${R.inner} 0 1 1 0,${R.inner}A${R.inner},${R.inner} 0 1 1 0,${-R.inner}Z`;
  for (const w of it.windows ?? []) d += sector(R.hiddenIn + 1, R.hiddenOut - 1, w.at * step - step / 2 + 2, w.at * step + step / 2 - 2);
  g.append(el('path', { d, class: `cw-paper cw-inner-paper${cut ? ' cw-cut' : ''}`, 'fill-rule': 'evenodd' }));
  for (let i = 0; i < n; i++) {
    g.append(el('path', { d: sector(R.innerRingIn, R.inner - 2, i * step - step / 2, i * step + step / 2), class: 'cw-cell' }));
    g.append(symbol(it, it.inner[i], (R.innerRingIn + R.inner - 2) / 2, i * step, Math.min(12, (R.innerRingIn * 2 * Math.PI) / n) * 0.8, 'cw-sym'));
  }
  for (const w of it.windows ?? [])
    if (w.label) {
      const [x, y] = at(R.hiddenIn - 6, w.at * step);
      const t = el('text', { x: x.toFixed(2), y: y.toFixed(2), 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 4, class: 'cw-label' });
      t.textContent = w.label;
      g.append(t);
    }
  // the pointer at the top, and the hub with its name
  g.append(el('path', { d: `M0,${-R.inner + 0.5}l-3,-5h6z`, class: 'cw-pointer' }));
  g.append(el('circle', { r: R.hub, class: 'cw-hub' }));
  if (it.center) {
    const t = el('text', { 'text-anchor': 'middle', y: -4, 'font-size': 4.2, class: 'cw-center' });
    t.textContent = it.center;
    g.append(t);
  }
  g.append(el('circle', { r: 1.4, class: 'cw-pin' }));
  return g;
}

/** The wheel as it lies, both discs, as a picture (the desk's small view of it). */
export function codeWheelPicture(it: CodeWheelItem): SVGSVGElement {
  return el('svg', { viewBox: '-102 -102 204 204', class: 'cw-svg', 'aria-hidden': 'true' }, outerDisc(it, false), innerDisc(it, false));
}

/** The turn (in places) that puts the turning disc's `inner` symbol against the outer disc's `outer`. */
export function turnFor(it: CodeWheelItem, inner: string, outer: string): number {
  const n = it.outer.length;
  return (((it.outer.indexOf(outer) - it.inner.indexOf(inner)) % n) + n) % n;
}

/** The two discs on letter sheets, to cut out and pin together. */
export function codeWheelSheets(it: CodeWheelItem): Promise<Sheet[]> {
  const disc = (part: SVGElement) => el('svg', { viewBox: '-102 -102 204 204', class: 'cw-svg cw-print', role: 'img' }, part);
  const outerSvg = disc(outerDisc(it, true));
  outerSvg.setAttribute('aria-label', `${it.title}: the outer disc`);
  const innerSvg = disc(innerDisc(it, true));
  innerSvg.setAttribute('aria-label', `${it.title}: the turning disc`);
  const steps = [
    'Cut out both discs along the dashed lines.',
    ...(it.windows?.length ? ['Cut out the windows in the small disc (the dashed boxes).'] : []),
    'Lay the small disc on the big one and push a brass paper fastener through both centers.',
    'Turn the small disc to line up its symbols with the big disc’s.',
  ];
  return Promise.resolve([
    sheet(8.5, 11, 'cw-sheet', h('header', { class: 'cw-head' }, h('b', null, it.title), h('span', null, '1 of 2: the big disc')), outerSvg, howto(it)),
    sheet(
      8.5,
      11,
      'cw-sheet',
      h('header', { class: 'cw-head' }, h('b', null, it.title), h('span', null, '2 of 2: the small disc')),
      innerSvg,
      h('ol', { class: 'cw-steps' }, ...steps.map((s) => h('li', null, s))),
    ),
  ]);
}

const howto = (it: CodeWheelItem) => (it.howto?.length ? h('div', { class: 'cw-howto' }, ...it.howto.map((l) => h('p', null, l))) : null);

/** The wheel to turn on screen; with `only`, just the puzzles on that scene. */
export function codeWheelLive(it: CodeWheelItem, only?: number): HTMLElement {
  const n = it.outer.length;
  const step = 360 / n;
  let turn = 0;
  const inner = innerDisc(it, false);
  const svg = el('svg', { viewBox: '-102 -102 204 204', class: 'cw-svg' }, outerDisc(it, false), inner);
  const facing = (k: number) => `${it.inner[0]} against ${it.outer[k % n]}`;
  const dial = h('div', {
    class: 'cw-dial',
    role: 'slider',
    tabindex: 0,
    'aria-label': `${it.title}: the turning disc`,
    'aria-valuemin': 0,
    'aria-valuemax': n - 1,
  });
  dial.append(svg);
  const answer = h('p', { class: 'cw-answer', 'aria-live': 'polite' });
  const set = (k: number, animate = true) => {
    turn = ((k % n) + n) % n;
    inner.style.transition = animate ? '' : 'none';
    inner.style.transform = `rotate(${turn * step}deg)`;
    dial.setAttribute('aria-valuenow', String(turn));
    dial.setAttribute('aria-valuetext', facing(turn));
  };
  set(0, false);
  dial.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (d) set(turn + d);
    else if (e.key === 'Home') set(0);
    else return;
    e.preventDefault();
    answer.textContent = '';
  });
  // drag: the disc follows the pointer's angle round the pin, and settles on the nearest place
  let grab: { a: number; t: number } | undefined;
  const angle = (e: PointerEvent) => {
    const b = svg.getBoundingClientRect();
    return (Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180) / Math.PI;
  };
  dial.addEventListener('pointerdown', (e) => {
    grab = { a: angle(e), t: turn * step };
    dial.setPointerCapture(e.pointerId);
    inner.style.transition = 'none';
  });
  dial.addEventListener('pointermove', (e) => {
    if (grab) inner.style.transform = `rotate(${grab.t + angle(e) - grab.a}deg)`;
  });
  const drop = (e: PointerEvent) => {
    if (!grab) return;
    set(Math.round((grab.t + angle(e) - grab.a) / step));
    grab = undefined;
    answer.textContent = '';
  };
  dial.addEventListener('pointerup', drop);
  dial.addEventListener('pointercancel', drop);

  const puzzles = (it.puzzles ?? []).filter((p) => only === undefined || p.scenes.includes(only));
  const asks = puzzles.map((p) =>
    h(
      'li',
      null,
      h('span', null, p.ask),
      h(
        'button',
        {
          type: 'button',
          class: 'cw-tell',
          onclick: () => {
            set(turnFor(it, p.turn.inner, p.turn.outer));
            answer.textContent = `Turn ${p.turn.inner} to ${p.turn.outer}: ${p.answer}`;
          },
        },
        'Tell me the answer',
      ),
    ),
  );
  return h(
    'div',
    { class: 'cw-live' },
    dial,
    h(
      'div',
      { class: 'cw-side' },
      h('p', { class: 'cw-help' }, 'Drag the small disc round, or use the arrow keys, to line its symbols up with the big disc’s.'),
      howto(it),
      asks.length ? h('ol', { class: 'cw-asks' }, ...asks) : null,
      answer,
    ),
  );
}
