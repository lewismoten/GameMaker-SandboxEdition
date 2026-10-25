// The World Map's drawings (worldMap.ts), as SVG in tenths of an inch: the little trees, hills
// and waves of each country, a compass rose, the title cartouche, a scale bar, the key, and the
// aged paper with its border. Each takes where to draw and returns the elements.
import type { Terrain } from './worldMapTerrain';
import { INK, PAPER, mix } from './worldMapTerrain';
import { xorshift32 } from '../../seededRandom';

const NS = 'http://www.w3.org/2000/svg';
export const SERIF = "Georgia, 'Times New Roman', Times, serif";

export function el(tag: string, attrs: Record<string, string | number>, ...kids: (Node | string)[]): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  e.append(...kids);
  return e;
}

/** One little drawing of a country's ground at (x, y), about 2 units across. */
export function glyph(t: Terrain, x: number, y: number, ink: string, k: number): SVGElement {
  const g = el('g', { fill: 'none', stroke: ink, 'stroke-width': 0.18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const s = 0.85 + (k % 3) * 0.12;
  const p = (d: string, fill = 'none') => g.append(el('path', { d, fill }));
  switch (t) {
    case 'forest':
      p(
        `M${x},${y - 1.5 * s} l${0.8 * s},${1.2 * s} h${-0.4 * s} l${0.6 * s},${0.9 * s} h${-2 * s} l${0.6 * s},${-0.9 * s} h${-0.4 * s} z`,
        mix(ink, PAPER, 0.55),
      );
      p(`M${x},${y + 0.6 * s} v${0.5 * s}`);
      break;
    case 'grass':
      g.append(el('circle', { cx: x, cy: y - 0.4 * s, r: 0.75 * s, fill: mix(ink, PAPER, 0.6) }));
      p(`M${x},${y + 0.35 * s} v${0.7 * s}`);
      break;
    case 'water':
      p(`M${x - 1.2 * s},${y} q${0.3 * s},${-0.45 * s} ${0.6 * s},0 t${0.6 * s},0 t${0.6 * s},0 t${0.6 * s},0`);
      p(`M${x - 0.6 * s},${y + 0.7 * s} q${0.3 * s},${-0.45 * s} ${0.6 * s},0 t${0.6 * s},0`);
      break;
    case 'sand':
      p(`M${x - 1.3 * s},${y + 0.5 * s} q${1.3 * s},${-1.4 * s} ${2.6 * s},0`);
      [-0.6, 0.2, 0.9].forEach((dx, i) => g.append(el('circle', { cx: x + dx * s, cy: y + (0.9 + (i % 2) * 0.25) * s, r: 0.09, fill: ink, stroke: 'none' })));
      break;
    case 'rock':
    case 'snow':
    case 'ember':
      p(`M${x - 1.4 * s},${y + 0.8 * s} L${x - 0.1 * s},${y - 1.2 * s} L${x + 1.3 * s},${y + 0.8 * s}`, mix(ink, PAPER, 0.7));
      p(`M${x - 0.1 * s},${y - 1.2 * s} L${x + 0.3 * s},${y + 0.8 * s}`);
      if (t === 'snow') p(`M${x - 0.75 * s},${y - 0.2 * s} l${0.35 * s},${0.25 * s} l${0.3 * s},${-0.3 * s} l${0.3 * s},${0.3 * s} l${0.3 * s},${-0.2 * s}`);
      if (t === 'ember') p(`M${x - 0.1 * s},${y - 1.5 * s} q${-0.4 * s},${-0.5 * s} 0,${-1 * s}`);
      break;
    case 'night':
      p(
        `M${x},${y - 0.9 * s} v${1.8 * s} M${x - 0.9 * s},${y} h${1.8 * s} M${x - 0.5 * s},${y - 0.5 * s} l${s},${s} M${x + 0.5 * s},${y - 0.5 * s} l${-s},${s}`,
      );
      break;
    case 'town':
      p(`M${x - 0.9 * s},${y + 0.8 * s} v${-1 * s} l${0.9 * s},${-0.8 * s} l${0.9 * s},${0.8 * s} v${1 * s} z`, mix(ink, PAPER, 0.7));
      p(`M${x - 0.2 * s},${y + 0.8 * s} v${-0.6 * s} h${0.4 * s} v${0.6 * s}`);
      break;
  }
  return g;
}

/** What the key calls each country. */
export const TERRAIN_NAMES: Record<Terrain, string> = {
  forest: 'Woods',
  grass: 'Meadow',
  water: 'Waters',
  sand: 'Sands',
  rock: 'Hills',
  snow: 'Peaks',
  ember: 'Badlands',
  night: 'Night',
  town: 'Towns',
};

/** An eight-point compass rose, `r` units across the long points, centered on (cx, cy). */
export function compassRose(cx: number, cy: number, r: number, accent: string): SVGElement {
  const g = el('g', { class: 'wm-rose', stroke: INK, 'stroke-width': 0.14, 'stroke-linejoin': 'round' });
  g.append(el('circle', { cx, cy, r: r * 0.78, fill: 'none' }), el('circle', { cx, cy, r: r * 0.7, fill: 'none', 'stroke-dasharray': '0.25 0.35' }));
  const point = (a: number, len: number, w: number, dark: string, light: string) => {
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const tip = { x: cx + dx * len, y: cy + dy * len };
    const l = { x: cx - dy * w, y: cy + dx * w };
    const rr = { x: cx + dy * w, y: cy - dx * w };
    g.append(
      el('path', { d: `M${cx},${cy} L${l.x},${l.y} L${tip.x},${tip.y} z`, fill: dark }),
      el('path', { d: `M${cx},${cy} L${rr.x},${rr.y} L${tip.x},${tip.y} z`, fill: light }),
    );
  };
  for (let i = 0; i < 4; i++) point(Math.PI / 4 + (i * Math.PI) / 2, r * 0.62, r * 0.12, mix(INK, PAPER, 0.35), PAPER);
  for (let i = 0; i < 4; i++) point((i * Math.PI) / 2, r, r * 0.17, i === 0 ? accent : INK, PAPER);
  g.append(el('circle', { cx, cy, r: r * 0.08, fill: PAPER }));
  const letter = (t: string, x: number, y: number) =>
    el(
      'text',
      {
        x,
        y,
        'font-size': r * 0.3,
        'font-family': SERIF,
        'font-weight': 700,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        fill: INK,
        stroke: 'none',
      },
      t,
    );
  g.append(letter('N', cx, cy - r * 1.22), letter('S', cx, cy + r * 1.22), letter('E', cx + r * 1.22, cy), letter('W', cx - r * 1.22, cy));
  return g;
}

/** The title cartouche: a framed plate with curled ends, the game's name in map lettering. */
export function cartouche(cx: number, y: number, w: number, title: string, sub: string, navy: string, accent: string): SVGElement {
  const hgt = 12;
  const x = cx - w / 2;
  const g = el('g', { class: 'wm-cartouche' });
  // a plate with its corners cut in, like an engraved title
  const n = 1.6;
  const plate = (o: number) =>
    `M${x + o + n},${y + o} H${x + w - o - n} L${x + w - o},${y + o + n} V${y + hgt - o - n} L${x + w - o - n},${y + hgt - o} H${x + o + n} L${x + o},${y + hgt - o - n} V${y + o + n} z`;
  g.append(
    el('path', { d: plate(0), fill: '#00000022', transform: 'translate(0.5 0.6)' }),
    el('path', { d: plate(0), fill: navy, stroke: INK, 'stroke-width': 0.25 }),
    el('path', { d: plate(0.7), fill: 'none', stroke: accent, 'stroke-width': 0.2 }),
    el('path', { d: plate(1.1), fill: 'none', stroke: accent, 'stroke-width': 0.08 }),
  );
  // bold serif capitals run about an em wide with their spacing; a long title is also held
  // to the plate (textLength), whatever font the printer has
  const room = w - 8;
  const big = Math.min(4.6, room / Math.max(4, title.length * 0.98));
  const long = title.length * big * 0.98 > room * 0.9;
  g.append(
    el(
      'text',
      {
        x: cx,
        y: y + 6.4,
        'text-anchor': 'middle',
        'font-family': SERIF,
        'font-size': big,
        'font-weight': 700,
        'letter-spacing': big * 0.08,
        fill: accent,
        ...(long ? { textLength: room, lengthAdjust: 'spacingAndGlyphs' } : {}),
      },
      title.toUpperCase(),
    ),
    el(
      'text',
      { x: cx, y: y + 9.6, 'text-anchor': 'middle', 'font-family': SERIF, 'font-style': 'italic', 'font-size': 1.6, 'letter-spacing': 0.18, fill: '#f6efdc' },
      sub,
    ),
  );
  return g;
}

/** A scale bar a cell (`unit` long) split in four, "0" to "1 scene", its caption on its left; `y` is the caption's baseline. */
export function scaleBar(x: number, y: number, unit: number): SVGElement {
  const g = el('g', { class: 'wm-scale', 'font-family': SERIF, fill: INK });
  const bx = x + 13;
  g.append(el('text', { x, y, 'font-size': 1.35, 'font-style': 'italic' }, 'Scale of scenes'));
  for (let i = 0; i < 4; i++)
    g.append(el('rect', { x: bx + (i * unit) / 4, y: y - 1.1, width: unit / 4, height: 0.8, fill: i % 2 ? PAPER : INK, stroke: INK, 'stroke-width': 0.12 }));
  g.append(
    el('text', { x: bx, y: y + 1.2, 'font-size': 1, 'text-anchor': 'middle' }, '0'),
    el('text', { x: bx + unit, y: y + 1.2, 'font-size': 1, 'text-anchor': 'middle' }, '1 scene'),
  );
  return g;
}

/** The aged sheet: paper darker toward its edges, a few faint stains and specks, and the border. */
export function agedPaper(W: number, H: number, seed: number, accent: string): SVGElement[] {
  const rand = xorshift32(seed);
  const out: SVGElement[] = [
    el(
      'defs',
      {},
      el(
        'radialGradient',
        { id: 'wm-age', cx: '50%', cy: '45%', r: '75%' },
        el('stop', { offset: '0%', 'stop-color': mix(PAPER, '#ffffff', 0.35) }),
        el('stop', { offset: '70%', 'stop-color': PAPER }),
        el('stop', { offset: '100%', 'stop-color': mix(PAPER, '#a3824f', 0.35) }),
      ),
    ),
    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#wm-age)' }),
  ];
  const specks = el('g', { fill: '#6b4f2a', opacity: 0.18 });
  const n = Math.round((W * H) / 40);
  for (let i = 0; i < n; i++)
    specks.append(el('circle', { cx: +(rand() * W).toFixed(1), cy: +(rand() * H).toFixed(1), r: +(0.05 + rand() * 0.12).toFixed(2) }));
  out.push(specks);
  for (let i = 0; i < 2; i++) {
    const r = 4 + rand() * 4;
    out.push(
      el('circle', {
        cx: +(rand() * W).toFixed(1),
        cy: +(rand() * H).toFixed(1),
        r: +r.toFixed(1),
        fill: 'none',
        stroke: '#8a6a3a',
        'stroke-width': 0.5,
        opacity: 0.08,
      }),
    );
  }
  // the neatline: a double rule with a band of alternating marks between, like a printed map's
  const b = el('g', { class: 'wm-border', fill: 'none', stroke: INK });
  b.append(
    el('rect', { x: 1, y: 1, width: W - 2, height: H - 2, 'stroke-width': 0.3 }),
    el('rect', { x: 2, y: 2, width: W - 4, height: H - 4, 'stroke-width': 0.12 }),
  );
  const band = el('g', { stroke: 'none', fill: mix(accent, INK, 0.4) });
  for (let x = 2, k = 0; x < W - 2; x += 5, k++)
    if (k % 2)
      band.append(
        el('rect', { x, y: 1.15, width: Math.min(5, W - 2 - x), height: 0.7 }),
        el('rect', { x, y: H - 1.85, width: Math.min(5, W - 2 - x), height: 0.7 }),
      );
  for (let y = 2, k = 0; y < H - 2; y += 5, k++)
    if (k % 2)
      band.append(
        el('rect', { x: 1.15, y, width: 0.7, height: Math.min(5, H - 2 - y) }),
        el('rect', { x: W - 1.85, y, width: 0.7, height: Math.min(5, H - 2 - y) }),
      );
  b.append(band);
  out.push(b);
  return out;
}

let copies = 0;

/**
 * A copy of a drawing with its own ids (clip paths, gradients): Chrome draws no clip path whose
 * first match in the page is inside something hidden, as the screen's copy is while printing.
 */
export function freshCopy<T extends Element>(node: T): T {
  const copy = node.cloneNode(true) as T;
  const tag = `-c${++copies}`;
  const ids = new Set<string>();
  copy.querySelectorAll('[id]').forEach((e) => {
    ids.add(e.id);
    e.id += tag;
  });
  if (!ids.size) return copy;
  copy.querySelectorAll('*').forEach((e) => {
    for (const a of ['clip-path', 'fill', 'mask', 'href']) {
      const v = e.getAttribute(a);
      const m = v && /^url\(#([^)]+)\)$/.exec(v);
      if (m && ids.has(m[1])) e.setAttribute(a, `url(#${m[1]}${tag})`);
    }
  });
  return copy;
}
