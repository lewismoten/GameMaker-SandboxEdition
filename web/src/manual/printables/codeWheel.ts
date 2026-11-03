// A game's paper code wheel (types.ts CodeWheelItem): an outer disc with a ring of symbols and a smaller disc
// pinned over it that turns, its own ring facing the outer one and windows cut through it onto a ring printed
// on the outer disc underneath. Drawn once as SVG for both uses: printed (codeWheelSheets), the two discs on
// their own letter sheets with cut lines, the windows to cut out and the pin's mark, to cut out and fasten with
// a brass paper fastener; on screen (codeWheelLive), either disc turns (drag it, or the arrow keys, a place at
// a time) under a red arrow fixed over the top, the symbols that meet under it read together, and each puzzle
// has a "Tell me the answer" that turns both discs to it and says it. The 1994 desk
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

/** The hidden rings, outermost first (one ring or several). */
const hiddenRings = (it: CodeWheelItem): string[][] =>
  !it.hidden?.length ? [] : Array.isArray(it.hidden[0]) ? (it.hidden as string[][]) : [it.hidden as string[]];
/** Hidden ring k's band, between the hub and the turning disc's own ring; one ring keeps the classic place. */
function band(k: number, count: number): { out: number; in: number } {
  if (count <= 1) return { out: R.hiddenOut, in: R.hiddenIn };
  const top = R.innerRingIn - 3;
  const w = (top - (R.hub + 5)) / count;
  return { out: top - k * w, in: top - (k + 1) * w + 1 };
}

/** The outer disc: its rim lettering, its ring of symbols, and the hidden ring under the turning disc. */
function outerDisc(it: CodeWheelItem, cut: boolean): SVGElement {
  const n = it.outer.length;
  const step = 360 / n;
  const g = el('g', { class: 'cw-outer' }, el('circle', { r: R.outer, class: `cw-paper${cut ? ' cw-cut' : ''}` }));
  for (let i = 0; i < n; i++) {
    g.append(el('path', { d: sector(R.ringIn, R.rimBand, i * step - step / 2, i * step + step / 2), class: 'cw-cell' }));
    g.append(symbol(it, it.outer[i], (R.ringIn + R.rimBand) / 2, i * step, Math.min(13, (R.ringIn * 2 * Math.PI) / n) * 0.8, 'cw-sym'));
    hiddenRings(it).forEach((ring, k, all) => {
      const b = band(k, all.length);
      g.append(el('path', { d: sector(b.in, b.out, i * step - step / 2, i * step + step / 2), class: 'cw-cell cw-hidden-cell' }));
      const size = Math.min(11, ((b.in * 2 * Math.PI) / n) * 0.8, (b.out - b.in) * 0.75);
      g.append(symbol(it, ring[i], (b.in + b.out) / 2, i * step, size, 'cw-sym'));
    });
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
  const rings = hiddenRings(it).length;
  for (const w of it.windows ?? []) {
    const b = band(w.ring ?? 0, rings);
    d += sector(b.in + 1, b.out - 1, w.at * step - step / 2 + 2, w.at * step + step / 2 - 2);
  }
  g.append(el('path', { d, class: `cw-paper cw-inner-paper${cut ? ' cw-cut' : ''}`, 'fill-rule': 'evenodd' }));
  // each window's outline, lit when it holds a puzzle's answer
  (it.windows ?? []).forEach((w, i) => {
    const b = band(w.ring ?? 0, rings);
    g.append(el('path', { d: sector(b.in + 1, b.out - 1, w.at * step - step / 2 + 2, w.at * step + step / 2 - 2), class: 'cw-win', 'data-win': i }));
  });
  for (let i = 0; i < n; i++) {
    g.append(el('path', { d: sector(R.innerRingIn, R.inner - 2, i * step - step / 2, i * step + step / 2), class: 'cw-cell' }));
    g.append(symbol(it, it.inner[i], (R.innerRingIn + R.inner - 2) / 2, i * step, Math.min(12, (R.innerRingIn * 2 * Math.PI) / n) * 0.8, 'cw-sym'));
  }
  for (const w of it.windows ?? [])
    if (w.label) {
      // one ring: the label inside the window, toward the pin; several: beside its window, along its ring
      const b = band(w.ring ?? 0, rings);
      const [r, deg] = rings <= 1 ? [R.hiddenIn - 6, w.at * step] : [(b.in + b.out) / 2, w.at * step + step * 0.5 + 1];
      const [x, y] = at(r, deg);
      const t = el('text', {
        transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rings <= 1 ? 0 : deg + 90})`,
        'text-anchor': rings <= 1 ? 'middle' : 'start',
        'dominant-baseline': 'central',
        'font-size': rings <= 1 ? 4 : 3.2,
        class: 'cw-label',
      });
      t.textContent = w.label;
      g.append(t);
    }
  // the hub with its name
  g.append(el('circle', { r: R.hub, class: 'cw-hub' }));
  if (it.center) {
    const t = el('text', { 'text-anchor': 'middle', y: -4, 'font-size': 4.2, class: 'cw-center' });
    t.textContent = it.center;
    g.append(t);
  }
  g.append(el('circle', { r: 1.4, class: 'cw-pin' }));
  return g;
}

/** On screen, room above the wheel for the reading arrow. */
const VIEW = '-102 -114 204 216';
/** The red arrow over the top of the wheel, fixed: the symbols that meet under it are read together. */
const arrow = () => el('path', { d: `M0,${-R.outer + 1}l-5,-9h10z`, class: 'cw-pointer' });

/** The wheel as it lies, both discs and the reading arrow, as a picture (the desk's small view of it). */
export function codeWheelPicture(it: CodeWheelItem): SVGSVGElement {
  return el('svg', { viewBox: VIEW, class: 'cw-svg', 'aria-hidden': 'true' }, outerDisc(it, false), innerDisc(it, false), arrow());
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

/** The wheel to turn on screen (either disc; the arrow over the top stays put); with `only`, just the puzzles on that scene. */
export function codeWheelLive(it: CodeWheelItem, only?: number): HTMLElement {
  const n = it.outer.length;
  const step = 360 / n;
  const outer = outerDisc(it, false);
  const inner = innerDisc(it, false);
  const svg = el('svg', { viewBox: VIEW, class: 'cw-svg' }, outer, inner, arrow());
  /** Each disc: its group, its ring, and which of its places is under the arrow. */
  const discs = [
    { g: outer, ring: it.outer, name: 'the big disc', pos: 0 },
    { g: inner, ring: it.inner, name: 'the small disc', pos: 0 },
  ];
  const place = (pos: number) => ((pos % n) + n) % n;
  const answer = h('p', { class: 'cw-answer', 'aria-live': 'polite' });
  // a disc's position counts on past a full turn (never wrapping back), so each move turns it the short way
  const show = (d: (typeof discs)[number], animate = true) => {
    d.g.style.transition = animate ? '' : 'none';
    d.g.style.transform = `rotate(${-d.pos * step}deg)`;
    d.g.setAttribute('aria-valuenow', String(place(d.pos)));
    d.g.setAttribute('aria-valuetext', `${d.ring[place(d.pos)]} under the arrow`);
  };
  /** Moves a disc to position `pos` (any whole number; its place under the arrow is pos mod n). */
  const move = (d: (typeof discs)[number], pos: number, animate = true) => {
    d.pos = pos;
    show(d, animate);
    for (const w of inner.querySelectorAll('.cw-win.on')) w.classList.remove('on');
  };
  /** What window `i` shows now: the hidden ring's symbol under it. */
  const inWindow = (i: number) => {
    const w = it.windows![i];
    return hiddenRings(it)[w.ring ?? 0][place(w.at - discs[1].pos + discs[0].pos)];
  };
  /** Turns a disc the short way round until its place `k` is under the arrow. */
  const set = (d: (typeof discs)[number], k: number) => {
    let by = place(k - d.pos);
    if (by > n / 2) by -= n;
    move(d, d.pos + by);
  };
  for (const d of discs) {
    d.g.classList.add('cw-turn'); // beside its cw-outer / cw-inner
    Object.entries({ tabindex: 0, role: 'slider', 'aria-label': `${it.title}: ${d.name}`, 'aria-valuemin': 0, 'aria-valuemax': n - 1 }).forEach(([k, v]) =>
      d.g.setAttribute(k, String(v)),
    );
    move(d, 0, false);
    d.g.addEventListener('keydown', (e) => {
      const by = { ArrowRight: -1, ArrowDown: -1, ArrowLeft: 1, ArrowUp: 1 }[e.key];
      if (by) move(d, d.pos + by);
      else if (e.key === 'Home') set(d, 0);
      else return;
      e.preventDefault();
      answer.textContent = '';
    });
  }
  const dial = h('div', { class: 'cw-dial', role: 'group', 'aria-label': `${it.title}: turn either disc` }, svg);
  // drag: the disc under the pointer (the big one by its outer ring) follows its angle round the pin, and settles on the nearest place
  // the angle is followed move by move (its jump from +180 to -180 taken out), so a drag past the left side doesn't spin it
  let grab: { d: (typeof discs)[number]; last: number; turned: number } | undefined;
  const where = (e: PointerEvent) => {
    const b = svg.getBoundingClientRect();
    const unit = b.width / 204; // the drawing's units per pixel
    const x = e.clientX - (b.left + b.width / 2);
    const y = e.clientY - (b.top + (114 / 216) * b.height);
    return { angle: (Math.atan2(y, x) * 180) / Math.PI, r: Math.hypot(x, y) / unit };
  };
  dial.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // no text selection starting under the drag
    const p = where(e);
    if (p.r > R.outer) return;
    const d = p.r > R.inner ? discs[0] : discs[1];
    d.g.focus({ preventScroll: true });
    grab = { d, last: p.angle, turned: 0 };
    dial.setPointerCapture(e.pointerId);
    d.g.style.transition = 'none';
  });
  const follow = (e: PointerEvent) => {
    if (!grab) return;
    const a = where(e).angle;
    grab.turned += ((a - grab.last + 540) % 360) - 180;
    grab.last = a;
  };
  dial.addEventListener('pointermove', (e) => {
    if (!grab) return;
    follow(e);
    grab.d.g.style.transform = `rotate(${-grab.d.pos * step + grab.turned}deg)`;
  });
  const drop = (e: PointerEvent) => {
    if (!grab) return;
    follow(e);
    move(grab.d, grab.d.pos - Math.round(grab.turned / step));
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
            // the pair meets under the arrow (the small disc's turn from the big one's is turnFor)
            set(discs[0], it.outer.indexOf(p.turn.outer));
            set(discs[1], it.inner.indexOf(p.turn.inner));
            const how = `${p.turn.outer} and ${p.turn.inner} under the arrow`;
            if (p.window !== undefined && it.windows?.[p.window]) {
              // the answer is what the wheel shows: that window's symbol, its window lit
              const sym = inWindow(p.window);
              inner.querySelector(`.cw-win[data-win="${p.window}"]`)?.classList.add('on');
              const pic = el('svg', { viewBox: '-8 -8 16 16', class: 'cw-answer-sym', role: 'img', 'aria-label': sym }, symbol(it, sym, 0, 0, 12, 'cw-sym'));
              answer.replaceChildren(
                h('span', null, `${how}. ${it.windows[p.window].label ?? 'The'} window: `),
                pic,
                p.answer ? h('span', null, ` ${p.answer}`) : '',
              );
            } else answer.textContent = `${how}: ${p.answer ?? ''}`;
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
      h(
        'p',
        { class: 'cw-help' },
        'Turn either disc: drag it (the big one by its outer ring), or Tab to it and use the arrow keys. Read the symbols that meet under the red arrow.',
      ),
      howto(it),
      asks.length ? h('ol', { class: 'cw-asks' }, ...asks) : null,
      answer,
    ),
  );
}
