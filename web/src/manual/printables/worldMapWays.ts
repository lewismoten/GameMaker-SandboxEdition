// How the World Map (worldMap.ts) draws a way between two places in each theme
// (worldMapThemes.ts): a road on the land, a street in town, a hall in a floor plan, a warp
// lane between worlds, a copper trace on a circuit board, a pen line on a draftsman's grid.
// A way both ways is dotted (or plain), one way is dashed with an arrowhead. Lines come from
// worldMapRoute.ts as straight runs; their corners are rounded (cut square on a board).
import type { Point } from '../../formats/game';
import { el } from './worldMapArt';
import { INK } from './worldMapTerrain';
import type { ThemeId } from './worldMapThemes';

const f = (n: number) => +n.toFixed(2);

/** An SVG path along `line`, its corners rounded by up to `r` (or cut straight across with `cut`). */
export function cornered(line: Point[], r: number, cut = false): string {
  if (line.length < 2) return '';
  let d = `M${f(line[0].x)},${f(line[0].y)}`;
  for (let i = 1; i < line.length - 1; i++) {
    const [a, p, b] = [line[i - 1], line[i], line[i + 1]];
    const la = Math.hypot(p.x - a.x, p.y - a.y);
    const lb = Math.hypot(b.x - p.x, b.y - p.y);
    const k = Math.min(r, la / 2, lb / 2);
    const p1 = { x: p.x + ((a.x - p.x) / la) * k, y: p.y + ((a.y - p.y) / la) * k };
    const p2 = { x: p.x + ((b.x - p.x) / lb) * k, y: p.y + ((b.y - p.y) / lb) * k };
    d += ` L${f(p1.x)},${f(p1.y)} ${cut ? 'L' : `Q${f(p.x)},${f(p.y)}`} ${f(p2.x)},${f(p2.y)}`;
  }
  const z = line[line.length - 1];
  return `${d} L${f(z.x)},${f(z.y)}`;
}

/** The middle of a line's longest run and the way it runs there (radians), for an arrowhead. */
export function midArrow(line: Point[]): { at: Point; angle: number } {
  let best = 1;
  let most = -1;
  for (let i = 1; i < line.length; i++) {
    const len = Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y);
    if (len > most) ((most = len), (best = i));
  }
  const [a, b] = [line[best - 1], line[best]];
  return { at: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

interface Style {
  /** Strokes under the line (casing, road, glow), widest first. */
  under: { stroke: string; width: number; opacity?: number }[];
  line: string;
  both: Record<string, string | number>;
  one: Record<string, string | number>;
  arrow: string;
  /** Corner rounding, and cut corners (a board's traces). */
  r: number;
  cut?: boolean;
}

const STYLES: Record<ThemeId, Style> = {
  land: {
    under: [{ stroke: '#fbf5e4', width: 1.1, opacity: 0.75 }],
    line: INK,
    both: { 'stroke-width': 0.5, 'stroke-dasharray': '0.05 0.9' },
    one: { 'stroke-width': 0.3, 'stroke-dasharray': '1.1 0.6' },
    arrow: INK,
    r: 2.4,
  },
  town: {
    under: [
      { stroke: '#7d705a', width: 3 },
      { stroke: '#fdfaf0', width: 2.4 },
    ],
    line: '#b88a2e',
    both: { 'stroke-width': 0.22, 'stroke-dasharray': '1 0.8' },
    one: { 'stroke-width': 0, 'stroke-dasharray': '1 0.8' },
    arrow: '#5a4a32',
    r: 2.6,
  },
  rooms: {
    under: [
      { stroke: '#3a2c1c', width: 2.7, opacity: 0.55 },
      { stroke: '#f1e8d2', width: 2.3 },
    ],
    line: INK,
    both: { 'stroke-width': 0.45, 'stroke-dasharray': '0.05 0.85' },
    one: { 'stroke-width': 0.28, 'stroke-dasharray': '1 0.6' },
    arrow: INK,
    r: 1.2,
  },
  library: {
    under: [
      { stroke: '#3a2c1c', width: 2.7, opacity: 0.55 },
      { stroke: '#efe2c4', width: 2.3 },
    ],
    line: '#6a2a1a',
    both: { 'stroke-width': 0.45, 'stroke-dasharray': '0.05 0.85' },
    one: { 'stroke-width': 0.28, 'stroke-dasharray': '1 0.6' },
    arrow: '#6a2a1a',
    r: 1.2,
  },
  space: {
    under: [{ stroke: '#8fb4ff', width: 1.6, opacity: 0.22 }],
    line: '#f3ecd6',
    both: { 'stroke-width': 0.5, 'stroke-dasharray': '0.05 0.9' },
    one: { 'stroke-width': 0.3, 'stroke-dasharray': '1.1 0.6' },
    arrow: '#f3ecd6',
    r: 3,
  },
  board: {
    under: [{ stroke: '#1d3b2a', width: 1.5, opacity: 0.6 }],
    line: '#d8a84e',
    both: { 'stroke-width': 0.85 },
    one: { 'stroke-width': 0.85 },
    arrow: '#f6e7b8',
    r: 1.6,
    cut: true,
  },
  grid: {
    under: [{ stroke: '#ffffff', width: 1, opacity: 0.8 }],
    line: '#284a70',
    both: { 'stroke-width': 0.45, 'stroke-dasharray': '0.05 0.85' },
    one: { 'stroke-width': 0.28, 'stroke-dasharray': '1 0.6' },
    arrow: '#284a70',
    r: 1.4,
  },
};

/**
 * Ways drawn along their lines, each both ways or one way toward its end. The casings and roads
 * under the lines go in layers of their own, so ways that run together don't darken each other.
 */
export function ways(theme: ThemeId, list: { line: Point[]; both: boolean }[]): SVGElement {
  const s = STYLES[theme];
  const under = s.under.map((u) => el('g', { stroke: u.stroke, 'stroke-width': u.width, ...(u.opacity ? { opacity: u.opacity } : {}) }));
  const over = el('g', {});
  for (const { line, both } of list) {
    const d = cornered(line, s.r, s.cut);
    under.forEach((g) => g.append(el('path', { d })));
    const look = both ? s.both : s.one;
    if (look['stroke-width']) over.append(el('path', { d, stroke: s.line, ...look }));
    if (theme === 'board')
      for (const p of [line[0], line[line.length - 1]])
        over.append(el('circle', { cx: f(p.x), cy: f(p.y), r: 0.7, fill: '#1d3b2a', stroke: s.line, 'stroke-width': 0.4 }));
    if (!both) {
      const { at, angle } = midArrow(line);
      const big = theme === 'town' || theme === 'board' ? 1.25 : 1;
      over.append(
        el('path', {
          d: `M${-0.9 * big},${-0.8 * big} L${0.7 * big},0 L${-0.9 * big},${0.8 * big} z`,
          fill: s.arrow,
          stroke: 'none',
          transform: `translate(${f(at.x)},${f(at.y)}) rotate(${((angle * 180) / Math.PI).toFixed(1)})`,
        }),
      );
    }
  }
  return el('g', { class: 'wm-trails', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ...under, over);
}

/** A short sample of a way for the key, `len` long from (x, y). */
export const waySample = (theme: ThemeId, x: number, y: number, len: number, both: boolean): SVGElement =>
  ways(theme, [
    {
      line: [
        { x, y },
        { x: x + len, y },
      ],
      both,
    },
  ]);
