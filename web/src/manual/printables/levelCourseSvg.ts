// Drawing a course through the wrap (levelCourse.ts lays it out) for the Level Maps: each panel
// of the strip as a picture turned so the way on points up the page (sampled nearest-neighbor,
// so the blocks stay crisp and in the palette), side by side in order with the start at the
// bottom of the first (or, on a way down the map, upright with the start at the top), and over it the wrap's seams (dashed), the laps, the kinks, the
// shortcuts and the marks. Each panel says where it carries on. Grayscale-safe: every mark has
// its own shape and words, not only a color.
import { BLEN } from '../../formats/blocks';
import { paletteToRGBA } from '../../formats/palette';
import type { Game } from '../../formats/game';
import { scenePixels } from '../../gfx/levelPicture';
import type { GameFiles } from '../../project/files';
import { courseRaster, panelOf, type CourseLayout, type StripPoint } from './levelCourse';
import { packPages, type Level } from './levelMapLayout';
import { el, SERIF } from './worldMapArt';

/** Pixels a block in a panel's picture: twice the map's, so a block turned 45 degrees keeps its pixels. */
const SCALE = 2 * BLEN;
/** Room beside a panel for its labels, and over and under it for where it carries on (paper units). */
export const GUTTER = 6;
export const PANEL_HEAD = 2.6;
/** Between two panels on a page. */
export const PANEL_GAP = 1.2;

type Course = CourseLayout<Level['marks'][number]>;
type Colors = Record<'start' | 'exit' | 'end' | 'join', string>;

/** Each panel's picture as a URL, in order. */
export async function coursePanelUrls(game: Game, files: GameFiles, l: Level): Promise<string[]> {
  const course = l.course!;
  const src = scenePixels(files, game.scenes[l.scene], 0, 0, 100, 100, l.cells);
  if (!src) return course.panels.map(() => '');
  const lut = paletteToRGBA(src.palette);
  const urls: string[] = [];
  for (const p of course.panels) {
    const r = courseRaster(course, p, src, BLEN, SCALE, 256);
    const canvas = document.createElement('canvas');
    canvas.width = r.width;
    canvas.height = r.height;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(r.width, r.height);
    const out = new Uint32Array(img.data.buffer);
    for (let i = 0; i < r.pixels.length; i++) out[i] = r.pixels[i] > 255 ? 0 : lut[r.pixels[i]];
    ctx.putImageData(img, 0, 0);
    urls.push(await new Promise<string>((resolve) => canvas.toBlob((b) => resolve(b ? URL.createObjectURL(b) : canvas.toDataURL()))));
  }
  return urls;
}

/** A panel's room across the page, with its gutters (paper units at `s` a block). */
const panelWidth = (c: Course, i: number, s: number): number => (c.panels[i].c1 - c.panels[i].c0) * s + 2 * GUTTER;
/** A panel's room down the page, with its labels over and under. */
const panelHeight = (c: Course, i: number, s: number): number => (c.panels[i].a1 - c.panels[i].a0) * s + 2 * PANEL_HEAD;

/** A panel placed on a page: its number and its box's top-left (labels and all). */
export interface PlacedPanel {
  i: number;
  x: number;
  y: number;
}

/** The panels on each page, in order: side by side, and in rows when they are short, within `area`. */
export function coursePages(c: Course, area: { w: number; h: number }): PlacedPanel[][] {
  const placed = packPages(
    c.panels.map((_, i) => ({ w: panelWidth(c, i, c.scale), h: panelHeight(c, i, c.scale) })),
    area,
    PANEL_GAP,
  );
  const pages: PlacedPanel[][] = [];
  placed.forEach((p, i) => (pages[p.page] ??= []).push({ i, x: p.x, y: p.y }));
  return pages.filter(Boolean);
}

/** A panel's box on paper, its labels and all, at the course's own size. */
export const coursePanelBox = (c: Course, i: number): { w: number; h: number } => ({ w: panelWidth(c, i, c.scale), h: panelHeight(c, i, c.scale) });

/** The size of a page's panels, as placed. */
export function placedSize(c: Course, which: PlacedPanel[]): { w: number; h: number } {
  return {
    w: Math.max(...which.map((p) => p.x + panelWidth(c, p.i, c.scale))),
    h: Math.max(...which.map((p) => p.y + panelHeight(c, p.i, c.scale))),
  };
}

const text = (x: number, y: number, size: number, body: string, attrs: Record<string, string | number> = {}) =>
  el(
    'text',
    {
      x,
      y,
      'font-family': 'Arial, Helvetica, sans-serif',
      'font-size': size,
      fill: '#2b241c',
      stroke: '#fffdf7',
      'stroke-width': 0.3,
      'paint-order': 'stroke',
      ...attrs,
    },
    body,
  );

/** One panel `i`, its picture's top-left at (`ox`, `oy`), `s` paper units a block. */
function panelSvg(
  game: Game,
  c: Course,
  i: number,
  url: string,
  ox: number,
  oy: number,
  s: number,
  colors: Colors,
  label: (m: Level['marks'][number]) => string,
  id: string,
): SVGElement {
  const p = c.panels[i];
  const w = (p.c1 - p.c0) * s;
  const ht = (p.a1 - p.a0) * s;
  const X = (q: StripPoint) => ox + (q.c - p.c0) * s;
  const Y = (q: StripPoint) => oy + (p.a1 - q.a) * s;
  const inside = (q: StripPoint) => q.a >= p.a0 && q.a <= p.a1;
  const mine = (q: StripPoint) => panelOf(c, q.a) === i;
  const clip = `${id}-clip${i}`;
  const g = el('g', { class: 'lm-course-panel' });
  g.append(
    el('defs', {}, el('clipPath', { id: clip }, el('rect', { x: ox, y: oy, width: w, height: ht }))),
    el('rect', { x: ox - 0.15, y: oy - 0.15, width: w + 0.3, height: ht + 0.3, fill: 'none', stroke: '#222', 'stroke-width': 0.3 }),
    el('image', { href: url, x: ox, y: oy, width: w, height: ht, preserveAspectRatio: 'none', style: 'image-rendering:pixelated' }),
  );
  const over = el('g', { 'clip-path': `url(#${clip})` });
  g.append(over);
  // the wrap's seams: where the way runs on round the map's edge
  for (const seam of c.seams) {
    const [a, b] = seam.ends;
    if (Math.max(a.a, b.a) < p.a0 || Math.min(a.a, b.a) > p.a1) continue;
    const at = { x1: X(a), y1: Y(a), x2: X(b), y2: Y(b) };
    over.append(
      el('line', { ...at, stroke: '#fff', 'stroke-width': 0.55 }),
      el('line', { ...at, stroke: colors.join, 'stroke-width': 0.3, 'stroke-dasharray': '1 0.6' }),
    );
  }
  // laps, at the left
  for (const lap of c.laps)
    if (inside(lap.at) && mine(lap.at)) {
      const y = Y(lap.at);
      g.append(
        el('line', { x1: ox - 1.2, y1: y, x2: ox, y2: y, stroke: '#2b241c', 'stroke-width': 0.25 }),
        text(ox - 1.4, y + 0.45, 1.2, `LAP ${lap.n}`, { 'font-weight': 700, 'text-anchor': 'end' }),
      );
    }
  // kinks, a bracket at the right
  for (const k of c.kinks) {
    if (!mine(k.at)) continue;
    const y0 = oy + (p.a1 - Math.min(p.a1, Math.max(k.a0, k.a1))) * s;
    const y1 = oy + (p.a1 - Math.max(p.a0, Math.min(k.a0, k.a1))) * s;
    const x = ox + w + 0.6;
    g.append(
      el('path', { d: `M${x - 0.4},${y0} h0.4 V${y1} h-0.4`, fill: 'none', stroke: '#2b241c', 'stroke-width': 0.25 }),
      text(x + 0.5, (y0 + y1) / 2 + 0.4, 1.1, k.taken ? 'shortcut' : 'kink', { 'font-style': 'italic' }),
    );
  }
  // shortcuts: a dotted ring at each end, with where the other end is
  c.shortcuts.forEach((sc, n) => {
    const name = String.fromCharCode(65 + n);
    for (const [q, words] of [
      [sc.from, `shortcut ${name} ⇒ panel ${panelOf(c, sc.to.a) + 1}`],
      [sc.to, `⇐ shortcut ${name} from panel ${panelOf(c, sc.from.a) + 1}`],
    ] as const) {
      if (!inside(q) || !mine(q)) continue;
      const x = X(q);
      const y = Y(q);
      g.append(
        el('circle', { cx: x, cy: y, r: 2.2, fill: 'none', stroke: '#fff', 'stroke-width': 0.55 }),
        el('circle', { cx: x, cy: y, r: 2.2, fill: 'none', stroke: '#2b241c', 'stroke-width': 0.3, 'stroke-dasharray': '0.4 0.4' }),
        // (under the ring near the panel's top, so it stays clear of the panel's own words)
        text(Math.min(Math.max(x, ox + words.length * 0.3), ox + w - words.length * 0.3), y - oy < 4 ? y + 3.6 : y - 2.7, 1.1, words, {
          'font-weight': 700,
          'text-anchor': 'middle',
        }),
      );
    }
  });
  // where you arrive and the ways out
  for (const m of c.marks) {
    if (!inside(m.at) || !mine(m.at)) continue;
    const x = X(m.at);
    const y = Y(m.at);
    const kind = m.mark.kind;
    const r = Math.max(1, (Math.max(m.mark.w, m.mark.h) * s) / 2 + 0.3);
    const shape = (stroke: string, width: number) =>
      kind === 'start'
        ? el('circle', { cx: x, cy: y, r, fill: 'none', stroke, 'stroke-width': width })
        : el('rect', { x: x - r, y: y - r, width: 2 * r, height: 2 * r, fill: 'none', stroke, 'stroke-width': width });
    g.append(
      shape('#fff', 0.6),
      shape(colors[kind], 0.3),
      text(x, kind === 'start' ? y + r + 1.6 : y - r - 0.6, 1.4, label(m.mark), { 'font-weight': 700, fill: colors[kind], 'text-anchor': 'middle' }),
    );
  }
  // where it joins the panels before and after: the blocks both show (a band, the same on each),
  // and a ring numbered for the join at the same place on both, to lay one over the other
  for (const j of [i - 1, i + 1]) {
    const q = c.panels[j];
    if (!q) continue;
    const lo = Math.max(p.a0, q.a0);
    const hi = Math.min(p.a1, q.a1);
    if (hi <= lo) continue;
    const y0 = oy + (p.a1 - hi) * s;
    const y1 = oy + (p.a1 - lo) * s;
    const cj = (Math.max(p.c0, q.c0) + Math.min(p.c1, q.c1)) / 2;
    const x = X({ c: cj, a: 0 });
    const name = `${Math.min(i, j) + 1}·${Math.max(i, j) + 1}`;
    over.append(
      el('rect', { x: ox, y: y0, width: w, height: y1 - y0, fill: '#fffdf7', 'fill-opacity': 0.3 }),
      ...[y0, y1].map((y) => el('line', { x1: ox, y1: y, x2: ox + w, y2: y, stroke: '#2b241c', 'stroke-width': 0.2, 'stroke-dasharray': '0.8 0.5' })),
    );
    g.append(
      el('circle', { cx: x, cy: (y0 + y1) / 2, r: 1.5, fill: '#2b241c', stroke: '#fffdf7', 'stroke-width': 0.3 }),
      text(x, (y0 + y1) / 2 + 0.38, 1, name, { 'font-weight': 700, fill: '#fffdf7', stroke: 'none', 'text-anchor': 'middle' }),
      el('path', { d: `M${ox + w + 0.3},${y0} h0.5 V${y1} h-0.5`, fill: 'none', stroke: '#2b241c', 'stroke-width': 0.2 }),
      text(ox + w + 1, (y0 + y1) / 2 + 0.35, 0.95, `= ${j > i ? (c.down ? 'top' : 'foot') : c.down ? 'foot' : 'top'} of ${j + 1}`, { 'font-style': 'italic' }),
    );
  }
  // its number, and where it carries on
  const last = i === c.panels.length - 1;
  const [ahead, behind] = c.down
    ? [last ? 'the end of the way' : `▼ continues at the top of ${i + 2}`, i === 0 ? '▼ start here and ride down' : `▼ from the foot of ${i}`]
    : [last ? 'the end of the way' : `▲ continues at the foot of ${i + 2}`, i === 0 ? '▲ start here and fly up' : `▲ from the top of ${i}`];
  g.append(
    el('text', { x: ox - GUTTER + 0.4, y: oy - 0.7, 'font-family': SERIF, 'font-size': 2, 'font-weight': 700, fill: '#2b241c' }, String(i + 1)),
    text(ox + w / 2, c.down ? oy + ht + 1.6 : oy - 0.7, 1.1, ahead, { 'text-anchor': 'middle', 'font-style': 'italic' }),
    text(ox + w / 2, c.down ? oy - 0.7 : oy + ht + 1.6, 1.1, behind, { 'text-anchor': 'middle', 'font-style': 'italic' }),
  );
  void game;
  return g;
}

/** Clip paths are named across the whole document. */
let clips = 0;

/** The panels `which` where they are placed, from (`x`, `y`), at the course's own size. */
export function courseSvg(
  game: Game,
  l: Level,
  urls: string[],
  which: PlacedPanel[],
  x: number,
  y: number,
  colors: Colors,
  label: (m: Level['marks'][number]) => string,
): SVGElement {
  const c = l.course!;
  const g = el('g', { class: 'lm-course' });
  const id = `lmc${++clips}`;
  for (const p of which) g.append(panelSvg(game, c, p.i, urls[p.i], x + p.x + GUTTER, y + p.y + PANEL_HEAD, c.scale, colors, label, id));
  return g;
}
