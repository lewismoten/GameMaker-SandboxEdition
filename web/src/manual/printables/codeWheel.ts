// A game's paper code wheel (types.ts CodeWheelItem): an outer disc with a ring of symbols and a smaller disc
// pinned over it that turns, its own ring facing the outer one and windows cut through it onto a ring printed
// on the outer disc underneath. A wheel may have a third disc between the two (`middle`, turning on its own;
// the windows then open onto rings printed on it), split pictures (`split`: the big disc's ring holds the top
// halves and the next disc's the bottom halves, drawn flush to the edge they share, so a picture joins when
// they line up), and a spiral of windows toward the pin (five rings or more get a smaller hub and bigger
// numbers). Drawn once as SVG for both uses: printed (codeWheelSheets), the two discs on
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

/** A wheel's layout: the big disc's ring, the turning discs (outermost first), the hidden rings' band, the hub. */
interface Geo {
  ringIn: number;
  discs: { edge: number; ringIn: number; ringOut: number }[];
  top: number;
  bottom: number;
  single: { out: number; in: number };
  hub: number;
  spiral: boolean;
  /** Split pictures: each half's height (0 when not split). */
  half: number;
}

/** The layout for a wheel; a two-disc wheel without split pictures or a spiral keeps the classic one (R). */
function geo(it: CodeWheelItem): Geo {
  const three = !!it.middle?.length;
  const spiral = hiddenRings(it).length >= 5;
  const hub = spiral ? 9 : three ? 12 : R.hub;
  const discs = three
    ? [
        { edge: 73, ringIn: 57, ringOut: 71 },
        { edge: 55, ringIn: 39, ringOut: 53 },
      ]
    : [{ edge: R.inner, ringIn: R.innerRingIn, ringOut: R.inner - 2 }];
  const half = it.split ? 14 : 0;
  if (half) Object.assign(discs[0], { ringIn: discs[0].edge - half, ringOut: discs[0].edge });
  const top = discs[discs.length - 1].ringIn - 3;
  const bottom = hub + (spiral ? 3 : 5);
  const classic = !three && !half;
  return {
    ringIn: half ? discs[0].edge : R.ringIn,
    discs,
    top,
    bottom,
    single: classic ? { out: R.hiddenOut, in: R.hiddenIn } : { out: top - 3, in: Math.max(bottom, top - 20) },
    hub,
    spiral,
    half,
  };
}

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

/**
 * The colors under a picture's ink (it.fills: rows of letters; it.fillColors: their colors; a capital also covers
 * ink), drawn first so the ink outline stays on top. `top` gives each row's y (null: skip the row).
 */
function colorFills(it: CodeWheelItem, g: SVGElement, name: string, rows: string[], cell: number, x0: number, top: (ry: number) => number | null): Set<string> {
  const cover = new Set<string>(); // 'rx,ry' of ink cells a capital covers
  const fill = it.fills?.[name];
  if (!fill || !it.fillColors) return cover;
  const byColor = new Map<string, string>();
  fill.forEach((row, ry) => {
    const y = top(ry);
    if (y === null) return;
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      const color = it.fillColors?.[ch.toLowerCase()];
      if (ch === '.' || !color) continue;
      if (ch !== ch.toLowerCase() && rows[ry][rx] === '#') cover.add(`${rx},${ry}`);
      byColor.set(
        color,
        (byColor.get(color) ?? '') + `M${(x0 + rx * cell).toFixed(2)},${y.toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h${(-cell).toFixed(2)}z`,
      );
    }
  });
  for (const [color, d] of byColor) g.append(el('path', { d, fill: color, class: 'cw-fill' }));
  return cover;
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
    const cov = colorFills(it, g, name, rows, cell, -w / 2, (ry) => ry * cell - size / 2);
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++)
        if (row[rx] === '#' && !cov.has(`${rx},${ry}`))
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

/**
 * Half of a picture for split rings: the top half (toward the rim) standing on the edge at radius `seam`, or
 * the bottom half hanging from it, so the two halves on neighboring discs join into one picture there.
 */
function halfPic(it: CodeWheelItem, name: string, seam: number, deg: number, half: number, n: number, part: 'top' | 'bottom'): SVGElement {
  const rows = it.glyphs?.[name];
  if (!rows?.length) return symbol(it, name, part === 'top' ? seam + half / 2 : seam - half / 2, deg, half * 0.8, 'cw-sym');
  const [x, y] = at(seam, deg);
  const g = el('g', { class: 'cw-sym cw-half', transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg})` });
  const k = Math.ceil(rows.length / 2);
  const cell = Math.min((2 * half) / rows.length, (((seam * 2 * Math.PI) / n) * 0.85) / rows[0].length);
  const w = rows[0].length * cell;
  let d = '';
  const cov = colorFills(it, g, name, rows, cell, -w / 2, (ry) => ((part === 'top' ? ry >= k : ry < k) ? null : (ry - k) * cell));
  rows.forEach((row, ry) => {
    if (part === 'top' ? ry >= k : ry < k) return;
    const top = (ry - k) * cell; // above the seam for the top half, below it for the bottom
    for (let rx = 0; rx < row.length; rx++)
      if (row[rx] === '#' && !cov.has(`${rx},${ry}`))
        d += `M${(rx * cell - w / 2).toFixed(2)},${top.toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h${(-cell).toFixed(2)}z`;
  });
  g.append(el('path', { d, class: 'cw-glyph' }));
  return g;
}

/**
 * A window: a plain rectangle square to the radius (straight edges cut cleanly with scissors or a craft knife,
 * where a curved wedge doesn't), as wide as it is tall where its ring allows, inside its cell at `deg`.
 */
function windowBox(deg: number, r0: number, r1: number, n: number): string {
  const rx = Math.cos(rad(deg));
  const ry = Math.sin(rad(deg));
  const [i, o] = [r0 + 1, r1 - 1];
  const half = Math.min(((r0 * 2 * Math.PI) / n) * 0.4, (o - i) / 2 + 1);
  const pt = (r: number, u: number) => `${(r * rx - u * ry).toFixed(2)},${(r * ry + u * rx).toFixed(2)}`;
  return `M${pt(o, -half)}L${pt(o, half)}L${pt(i, half)}L${pt(i, -half)}Z`;
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
/** Hidden ring k's band, between the hub and the top disc's own ring; one ring keeps the classic place. */
function band(g: Geo, k: number, count: number): { out: number; in: number } {
  if (count <= 1) return g.single;
  const w = (g.top - g.bottom) / count;
  return { out: g.top - k * w, in: g.top - (k + 1) * w + 1 };
}

/** The hidden rings' cells and symbols at place `i`, printed on the disc under the top one. */
function hiddenCells(it: CodeWheelItem, g: Geo, i: number, into: SVGElement): void {
  const n = it.outer.length;
  const step = 360 / n;
  hiddenRings(it).forEach((ring, k, all) => {
    const b = band(g, k, all.length);
    into.append(el('path', { d: sector(b.in, b.out, i * step - step / 2, i * step + step / 2), class: 'cw-cell cw-hidden-cell' }));
    // a spiral's narrow rings fill more of their band, so their numbers stay big enough to read
    const size = Math.min(11, ((b.in * 2 * Math.PI) / n) * 0.8, (b.out - b.in) * (g.spiral ? 0.95 : 0.75));
    into.append(symbol(it, ring[i], (b.in + b.out) / 2, i * step, size, 'cw-sym'));
  });
}

/** The outer disc: its rim lettering, its ring of symbols, and the hidden ring under the turning disc. */
function outerDisc(it: CodeWheelItem, cut: boolean): SVGElement {
  const g0 = geo(it);
  const n = it.outer.length;
  const step = 360 / n;
  const g = el('g', { class: 'cw-outer' }, el('circle', { r: R.outer, class: `cw-paper${cut ? ' cw-cut' : ''}` }));
  for (let i = 0; i < n; i++) {
    g.append(el('path', { d: sector(g0.ringIn, R.rimBand, i * step - step / 2, i * step + step / 2), class: 'cw-cell' }));
    g.append(
      g0.half
        ? halfPic(it, it.outer[i], g0.discs[0].edge, i * step, g0.half, n, 'top')
        : symbol(it, it.outer[i], (R.ringIn + R.rimBand) / 2, i * step, Math.min(13, (R.ringIn * 2 * Math.PI) / n) * 0.8, 'cw-sym'),
    );
    if (!it.middle?.length) hiddenCells(it, g0, i, g);
  }
  // the heading in the band between the ring and the rim
  g.append(rimText(`cw-rim${++uid}`, R.rimBand + 2.2, it.heading.toUpperCase(), 4.2, 'cw-rim'));
  g.append(el('circle', { r: 1.4, class: 'cw-pin' }));
  return g;
}

/** A turning disc's own ring of symbols (the bottom halves, when split pictures join it to the big disc's). */
function discRing(it: CodeWheelItem, g0: Geo, k: number, ring: string[], into: SVGElement): void {
  const n = ring.length;
  const step = 360 / n;
  const d = g0.discs[k];
  for (let i = 0; i < n; i++) {
    into.append(el('path', { d: sector(d.ringIn, d.ringOut, i * step - step / 2, i * step + step / 2), class: 'cw-cell' }));
    into.append(
      g0.half && k === 0
        ? halfPic(it, ring[i], d.edge, i * step, g0.half, n, 'bottom')
        : symbol(it, ring[i], (d.ringIn + d.ringOut) / 2, i * step, Math.min(12, (d.ringIn * 2 * Math.PI) / n) * 0.8, 'cw-sym'),
    );
  }
}

/** The middle disc of a three-disc wheel: its ring, and the hidden rings the top disc's windows open onto. */
function middleDisc(it: CodeWheelItem, cut: boolean): SVGElement {
  const g0 = geo(it);
  const g = el('g', { class: 'cw-middle' }, el('circle', { r: g0.discs[0].edge, class: `cw-paper cw-mid-paper${cut ? ' cw-cut' : ''}` }));
  discRing(it, g0, 0, it.middle!, g);
  for (let i = 0; i < it.outer.length; i++) hiddenCells(it, g0, i, g);
  g.append(el('circle', { r: 1.4, class: 'cw-pin' }));
  return g;
}

/**
 * The hub's emblem: "CLOWN CLUB" round the hub with the O of "CLOWN" a red rubber nose, and a big red nose in the
 * middle with a shine on it. The brass fastener's pin sits on the nose's middle, so the pivot is still marked.
 */
function noseEmblem(hub: number): SVGElement {
  const id = `cw-emblem-${uid++}`;
  const r = hub * 0.6;
  const path = el('path', { id, d: `M${-r},0A${r},${r} 0 1 1 ${r},0A${r},${r} 0 1 1 ${-r},0`, fill: 'none' });
  const tp = el('textPath', { href: `#${id}`, startOffset: '25%' });
  const o = el('tspan', { class: 'cw-nose-o' });
  o.textContent = 'O';
  tp.append(document.createTextNode('CL'), o, document.createTextNode('WN CLUB'));
  const t = el('text', { 'font-size': (hub * 0.23).toFixed(2), class: 'cw-emblem-text', 'text-anchor': 'middle' }, tp);
  const nose = el('circle', { r: (hub * 0.36).toFixed(2), class: 'cw-nose' });
  const shine = el('ellipse', {
    cx: (-hub * 0.12).toFixed(2),
    cy: (-hub * 0.14).toFixed(2),
    rx: (hub * 0.1).toFixed(2),
    ry: (hub * 0.06).toFixed(2),
    class: 'cw-nose-shine',
    transform: 'rotate(-35)',
  });
  return el('g', { class: 'cw-emblem' }, el('defs', {}, path), t, nose, shine);
}

/** The turning disc: its ring facing the outer one, the windows cut through it, its hub and pointer. */
function innerDisc(it: CodeWheelItem, cut: boolean): SVGElement {
  const g0 = geo(it);
  const top = g0.discs.length - 1;
  const edge = g0.discs[top].edge;
  const n = it.inner.length;
  const step = 360 / n;
  const g = el('g', { class: 'cw-inner' });
  // the disc with its windows as holes (evenodd), so the outer disc shows through them on screen
  let d = `M0,${-edge}A${edge},${edge} 0 1 1 0,${edge}A${edge},${edge} 0 1 1 0,${-edge}Z`;
  const rings = hiddenRings(it).length;
  const pad = g0.spiral ? 1 : 0; // a spiral's narrow rings: each window opens its whole ring's width
  for (const w of it.windows ?? []) {
    const b = band(g0, w.ring ?? 0, rings);
    d += windowBox(w.at * step, b.in - pad, b.out + pad, n);
  }
  g.append(el('path', { d, class: `cw-paper cw-inner-paper${cut ? ' cw-cut' : ''}`, 'fill-rule': 'evenodd' }));
  // each window's outline, lit when it holds a puzzle's answer
  (it.windows ?? []).forEach((w, i) => {
    const b = band(g0, w.ring ?? 0, rings);
    g.append(el('path', { d: windowBox(w.at * step, b.in - pad, b.out + pad, n), class: 'cw-win', 'data-win': i }));
  });
  discRing(it, g0, top, it.inner, g);
  for (const w of it.windows ?? [])
    if (w.label) {
      // one ring: the label inside the window, toward the pin; several: beside its window, along its ring
      const b = band(g0, w.ring ?? 0, rings);
      const [r, deg] = rings <= 1 ? [g0.single.in - 6, w.at * step] : [(b.in + b.out) / 2, w.at * step + step * 0.5 + 1];
      const [x, y] = at(r, deg);
      const t = el('text', {
        transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rings <= 1 ? 0 : deg + 90})`,
        'text-anchor': rings <= 1 ? 'middle' : 'start',
        'dominant-baseline': 'central',
        'font-size': rings <= 1 ? 4 : g0.spiral ? Math.min(4.6, (b.out - b.in) * 0.8).toFixed(2) : 3.2,
        class: 'cw-label',
      });
      t.textContent = w.label;
      g.append(t);
    }
  // the hub with its name
  g.append(el('circle', { r: g0.hub, class: 'cw-hub' }));
  if (it.emblem === 'nose') g.append(noseEmblem(g0.hub));
  else if (it.center) {
    const t = el('text', { 'text-anchor': 'middle', y: g0.spiral ? -2.5 : -4, 'font-size': g0.spiral ? 2.6 : 4.2, class: 'cw-center' });
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

/** The discs, outermost first: the big one, the middle one if there is one, and the small one on top. */
const allDiscs = (it: CodeWheelItem, cut: boolean): SVGElement[] =>
  it.middle?.length ? [outerDisc(it, cut), middleDisc(it, cut), innerDisc(it, cut)] : [outerDisc(it, cut), innerDisc(it, cut)];

/** The wheel as it lies, every disc and the reading arrow, as a picture (the desk's small view of it). */
export function codeWheelPicture(it: CodeWheelItem): SVGSVGElement {
  return el('svg', { viewBox: VIEW, class: 'cw-svg', 'aria-hidden': 'true' }, ...allDiscs(it, false), arrow());
}

/** The turn (in places) that puts the turning disc's `inner` symbol against the outer disc's `outer`. */
export function turnFor(it: CodeWheelItem, inner: string, outer: string): number {
  const n = it.outer.length;
  return (((it.outer.indexOf(outer) - it.inner.indexOf(inner)) % n) + n) % n;
}

/** The discs on letter sheets, to cut out and pin together. */
export function codeWheelSheets(it: CodeWheelItem): Promise<Sheet[]> {
  const disc = (part: SVGElement) => el('svg', { viewBox: '-102 -102 204 204', class: 'cw-svg cw-print', role: 'img' }, part);
  if (it.middle?.length) return Promise.resolve(threeSheets(it, disc));
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

/** A three-disc wheel's sheets: the big disc, the middle one, the small one, to stack and pin. */
function threeSheets(it: CodeWheelItem, disc: (part: SVGElement) => SVGSVGElement): Sheet[] {
  const parts: [SVGElement, string, string][] = [
    [outerDisc(it, true), 'the outer disc', 'the big disc'],
    [middleDisc(it, true), 'the middle disc', 'the middle disc'],
    [innerDisc(it, true), 'the turning disc on top', 'the small disc'],
  ];
  const steps = [
    'Cut out all three discs along the dashed lines.',
    ...(it.windows?.length ? ['Cut out the windows in the small disc (the dashed boxes).'] : []),
    'Stack them, biggest at the bottom, and push a brass paper fastener through all three centers.',
    'Each disc turns on its own: line up their symbols under the top of the wheel.',
  ];
  return parts.map(([part, label, name], i) => {
    const svg = disc(part);
    svg.setAttribute('aria-label', `${it.title}: ${label}`);
    return sheet(
      8.5,
      11,
      'cw-sheet',
      h('header', { class: 'cw-head' }, h('b', null, it.title), h('span', null, `${i + 1} of 3: ${name}`)),
      svg,
      i === 0 ? howto(it) : i === 2 ? h('ol', { class: 'cw-steps' }, ...steps.map((s) => h('li', null, s))) : null,
    );
  });
}

const howto = (it: CodeWheelItem) => (it.howto?.length ? h('div', { class: 'cw-howto' }, ...it.howto.map((l) => h('p', null, l))) : null);

/** The wheel to turn on screen (either disc; the arrow over the top stays put); with `only`, just the puzzles on that scene. */
export function codeWheelLive(it: CodeWheelItem, only?: number): HTMLElement {
  const n = it.outer.length;
  const step = 360 / n;
  const g0 = geo(it);
  const groups = allDiscs(it, false);
  const inner = groups[groups.length - 1];
  const svg = el('svg', { viewBox: VIEW, class: 'cw-svg' }, ...groups, arrow());
  const three = groups.length === 3;
  /** Each disc: its group, its ring, and which of its places is under the arrow (outermost first). */
  const discs = [
    { g: groups[0], ring: it.outer, name: 'the big disc', pos: 0 },
    ...(three ? [{ g: groups[1], ring: it.middle!, name: 'the middle disc', pos: 0 }] : []),
    { g: inner, ring: it.inner, name: 'the small disc', pos: 0 },
  ];
  /** The windows are cut in the top disc and open onto rings printed on the disc under it. */
  const [under, top] = discs.slice(-2);
  const place = (pos: number) => ((pos % n) + n) % n;
  // what each window shows, drawn upright beside the wheel, so nobody has to read the wheel upside down
  const readRows = (it.windows ?? []).map((w, i) => {
    const pic = h('span', { class: 'cw-read-sym' });
    return { row: h('div', { class: 'cw-read-row' }, h('dt', null, w.label ?? `Window ${i + 1}`), h('dd', null, pic)), pic };
  });
  const readout = readRows.length ? h('dl', { class: 'cw-readout', 'aria-label': 'What the windows show' }, ...readRows.map((r) => r.row)) : null;
  /** Fills the readout for the discs at these positions (a drag passes the place it would settle on). */
  function showReadout(outerPos = under.pos, innerPos = top.pos) {
    readRows.forEach((r, i) => {
      const w = it.windows![i];
      const sym = hiddenRings(it)[w.ring ?? 0][place(w.at - innerPos + outerPos)];
      if (r.pic.dataset.sym === sym) return;
      r.pic.dataset.sym = sym;
      r.pic.replaceChildren(el('svg', { viewBox: '-8 -8 16 16', class: 'cw-answer-sym', role: 'img', 'aria-label': sym }, symbol(it, sym, 0, 0, 12, 'cw-sym')));
    });
  }
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
    showReadout();
  };
  /** What window `i` shows now: the hidden ring's symbol under it. */
  const inWindow = (i: number) => {
    const w = it.windows![i];
    return hiddenRings(it)[w.ring ?? 0][place(w.at - top.pos + under.pos)];
  };
  /** Turns a disc the short way round until its place `k` is under the arrow. */
  const set = (d: (typeof discs)[number], k: number) => {
    let by = place(k - d.pos);
    if (by > n / 2) by -= n;
    move(d, d.pos + by);
  };
  for (const d of discs) {
    d.g.classList.add('cw-turn'); // beside its cw-outer / cw-middle / cw-inner
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
      e.stopPropagation(); // the disc's key, not the page's or the PC's underneath
      answer.textContent = '';
    });
  }
  const dial = h('div', { class: 'cw-dial', role: 'group', 'aria-label': `${it.title}: turn ${three ? 'any' : 'either'} disc` }, svg);
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
    // the topmost disc under the pointer: the first whose edge is still outside it, counting in from the big one
    const d = discs[g0.discs.filter((x) => p.r <= x.edge).length];
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
    const settle = grab.d.pos - Math.round(grab.turned / step);
    showReadout(grab.d === under ? settle : under.pos, grab.d === top ? settle : top.pos);
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
            if (three) set(discs[1], it.middle!.indexOf(p.turn.middle ?? it.middle![0]));
            set(top, it.inner.indexOf(p.turn.inner));
            const how = three
              ? `${p.turn.outer}, ${p.turn.middle ?? it.middle![0]} and ${p.turn.inner} under the arrow`
              : `${p.turn.outer} and ${p.turn.inner} under the arrow`;
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
        three
          ? 'Turn any disc: drag it by its own ring, or Tab to it and use the arrow keys. Read the symbols that meet under the red arrow.'
          : 'Turn either disc: drag it (the big one by its outer ring), or Tab to it and use the arrow keys. Read the symbols that meet under the red arrow.',
      ),
      readout,
      howto(it),
      asks.length ? h('ol', { class: 'cw-asks' }, ...asks) : null,
      answer,
    ),
  );
}
