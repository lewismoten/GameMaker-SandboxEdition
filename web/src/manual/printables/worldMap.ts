// The fold-out World Map in every Sandbox Software box (and with a Bard of Bizarre game's maps): every place of the game as a
// round picture of where you arrive (its number and name) and a way for every link from one
// place to another, drawn in a theme that suits the game (worldMapThemes.ts: a star chart, a
// floor plan, a street map, a circuit board...). Places go where their paths are easy to follow
// (worldMapPlan.ts: few crossings, no path under a place, regions kept together). A scene that
// is only a conversation or a passage is folded into its place and listed on its land
// (worldMapGroups.ts); the "Every scene" view shows every scene. It's drawn as one SVG in tenths
// of an inch, so it prints at full size: a big game prints as an overview page plus pages to
// trim and tape together (A1, B1, ... like a road atlas), each the same SVG looking at its own
// part. On screen it comes folded and opens into a map you can zoom and drag around.
import './paper.css'; // first: this piece's own styles build on the paper's
import './worldMap.css';
import { h } from '../../editor/core/ui';
import { GameFiles, fetchGameFile, type CatalogEntry } from '../../project/files';
import { ENDTYPE, NOSCENE, STARTTYPE, parseGame, type Game, type Point } from '../../formats/game';
import { parseBackdrop, parseSlideList } from '../../formats/graphicScripts';
import { arrival, graphOf } from '../../editor/editors/integrator/layoutCells';
import { graphicShot, levelShot } from '../../editor/editors/integrator/integratorArt';
import { sheet, type PrintContext, type Sheet } from './kit';
import { fnv1a } from '../../seededRandom';
import { folds, tiles, type Rect } from './worldMapLayout';
import { groupScenes, isBlackPalette, placeLabels, placesGame } from './worldMapGroups';
import type { WorldMapHints } from './types';
import { INK, PAPER, lookOf, mix, type Look } from './worldMapTerrain';
import { SERIF, agedPaper, cartouche, compassRose, el, freshCopy, scaleBar } from './worldMapArt';
import { NAME_LINE, ribbonWidth } from './worldMapMeasure';
import { STEP, planWorld } from './worldMapPlan';
import { regionsOf } from './worldMapRegions';
import { SPACE, ground } from './worldMapGround';
import { ways, waySample } from './worldMapWays';
import { themeOf, type Theme, type ThemeId } from './worldMapThemes';
import { panZoom } from './panZoom';

const NS = 'http://www.w3.org/2000/svg';

/** Margin, header and footer heights, in map units (tenths of an inch). */
const M = 10;
const HEAD = 22;
const FOOT = 17;
/** One printed page's part of the map, and how much neighbors overlap (landscape letter). */
const PAGE = { w: 105, h: 80, overlap: 3 };
/** A place's round picture. */
const R = 5.2;
const KIND = { start: '#c58a00', end: '#a8281f', scene: '#2f5a3a' };
/** How many lines of names a place lists at most, and about how many letters fit on one. */
const MOST_LINES = 5;
const LINE_CHARS = 42;

/** Names joined with dots into lines of about LINE_CHARS letters; what doesn't fit is counted. */
function wrapNames(names: string[]): string[] {
  const lines: string[] = [];
  let k = 0;
  for (; k < names.length; k++) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + 3 + names[k].length <= LINE_CHARS) lines[last] += ` · ${names[k]}`;
    else if (lines.length < MOST_LINES) lines.push(names[k]);
    else break;
  }
  if (k < names.length) lines[lines.length - 1] += ` · and ${names.length - k} more`;
  return lines;
}

/** The game and just the files its cards need (maps, blocks, palettes, title and end screens). */
async function loadWorld(entry: CatalogEntry): Promise<{ game: Game; files: GameFiles } | undefined> {
  if (!entry.gam) return undefined;
  const gam = await fetchGameFile(entry, entry.gam);
  if (!gam) return undefined;
  const game = parseGame(gam);
  const files = new GameFiles();
  const want = new Set<string>();
  for (const s of game.scenes) {
    if (s.gametype === NOSCENE) continue;
    const slots = s.gametype === STARTTYPE || s.gametype === ENDTYPE ? [0, 2] : [0, 1, 2, 3, 4, 5, 6];
    for (const k of slots) if (s.files[k]) want.add(s.files[k].toLowerCase());
  }
  const fetchAll = (names: Iterable<string>) =>
    Promise.all(
      [...names].map(async (n) => {
        if (files.has(n)) return;
        const b = await fetchGameFile(entry, n).catch(() => undefined);
        if (b) files.set(n, b);
      }),
    );
  await fetchAll(want);
  // what the title and end screens show in turn: a backdrop's GIF, a slide show's pictures
  const more = new Set<string>();
  for (const n of want) {
    const b = files.get(n);
    if (!b) continue;
    try {
      if (n.endsWith('.bkd')) more.add(parseBackdrop(b).gif.toLowerCase());
      if (n.endsWith('.lst'))
        parseSlideList(b)
          .slice(0, 3)
          .forEach((e) => more.add(e.name.toLowerCase()));
    } catch {
      /* not one we can read: the card says so */
    }
  }
  await fetchAll(more);
  return { game, files };
}

/** Text cut to fit about `max` characters. */
const fit = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** A line of text no wider than `width`: squeezed a little if it would run over (bold Arial is about 0.62 em a letter). */
function squeeze(attrs: Record<string, string | number>, text: string, size: number, width: number): Record<string, string | number> {
  return text.length * size * 0.62 > width ? { ...attrs, textLength: width, lengthAdjust: 'spacingAndGlyphs' } : attrs;
}

interface World {
  W: number;
  H: number;
  svg: SVGSVGElement;
}

/** The colors of a picture, 0xRRGGBB -> how many of every 4th pixel are that color. */
function colorsOf(canvas: HTMLCanvasElement | undefined): Map<number, number> {
  const counts = new Map<number, number>();
  const data = canvas?.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
  if (!data) return counts;
  for (let i = 0; i < data.length; i += 16) {
    const c = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return counts;
}

interface Place {
  i: number;
  c: Point;
  box: Rect;
  kind: 'start' | 'end' | 'scene';
  look: Look;
  pic?: HTMLCanvasElement;
  /** The names it lists under its ribbon, a line each. */
  names: string[];
}

/** What a theme adds round a place's picture: a world's orbit, a chip's package on a board. */
function frameExtras(theme: ThemeId, x: number, y: number): SVGElement[] {
  if (theme === 'space')
    return [el('circle', { cx: x, cy: y, r: R + 2.1, fill: 'none', stroke: '#e9e2ff', 'stroke-width': 0.18, 'stroke-dasharray': '0.5 0.5', opacity: 0.8 })];
  if (theme !== 'board') return [];
  const s = R + 1.6;
  const out = [el('rect', { x: x - s, y: y - s, width: s * 2, height: s * 2, rx: 0.6, fill: '#1f2623', stroke: '#0e1411', 'stroke-width': 0.2 })];
  for (let k = 0; k < 5; k++) {
    const o = -s + 1.5 + (k * (2 * s - 3)) / 4;
    for (const [px, py, w, h] of [
      [x - s - 0.8, y + o - 0.3, 0.8, 0.6],
      [x + s, y + o - 0.3, 0.8, 0.6],
      [x + o - 0.3, y - s - 0.8, 0.6, 0.8],
    ])
      out.push(el('rect', { x: +px.toFixed(2), y: +py.toFixed(2), width: w, height: h, fill: '#d8a84e' }));
  }
  return out;
}

const moved = (p: Point, d: Point): Point => ({ x: p.x + d.x, y: p.y + d.y });

/**
 * The whole map as an SVG, `W` x `H` tenths of an inch: the player's places, or with `every`
 * every scene as the Game Integrator shows them.
 */
function drawWorld(entry: CatalogEntry, scenes: Game, files: GameFiles, hints: WorldMapHints | undefined, every: boolean): World {
  const black = (i: number) => isBlackPalette(files.get(scenes.scenes[i].files[0]?.toLowerCase() ?? ''));
  const grouping = every ? undefined : groupScenes(scenes, graphOf(scenes), black, hints);
  const game = grouping ? placesGame(scenes, grouping) : scenes;
  const graph = graphOf(game);
  const theme = themeOf(entry);
  const names = new Map<number, string[]>();
  if (grouping) for (const i of new Set([...grouping.folded.keys(), ...grouping.labels.keys()])) names.set(i, wrapNames(placeLabels(scenes, grouping, i)));
  const kindOf = (i: number) => (game.scenes[i].gametype === STARTTYPE ? 'start' : game.scenes[i].gametype === ENDTYPE ? 'end' : 'scene');
  const label = (i: number) => fit(game.scenes[i].desc || { start: 'Title', end: 'The end', scene: 'Untitled' }[kindOf(i)], 24);
  const plan = planWorld(game, label, (i) => names.get(i)?.length ?? 0);
  // the plan (places and paths) between the title and the key, in the middle of a narrow sheet
  const b = plan.bounds;
  const W = Math.max(PAGE.w, b.w + 2 * (M + 2));
  const H = Math.max(PAGE.h, b.h + HEAD + 6 + FOOT + M);
  const d = { x: (W - b.w) / 2 - b.x, y: HEAD + 6 - b.y };
  const accent = entry.original?.box?.accent ?? '#c8962a';
  const navy = entry.original?.box?.background ?? '#22304a';
  const seed = fnv1a(entry.id);

  // each place: where it is, its kind, its picture and the look of its country
  const places = new Map<number, Place>();
  for (const [i, at] of plan.at) {
    const s = game.scenes[i];
    const kind = kindOf(i);
    const pic = kind === 'scene' ? levelShot(files, s, arrival(scenes, i), 7, 7) : (graphicShot(files, s.files[0]) ?? graphicShot(files, s.files[2]));
    const box = plan.boxes.get(i)!;
    places.set(i, { i, c: moved(at, d), box: { ...box, x: box.x + d.x, y: box.y + d.y }, kind, look: lookOf(colorsOf(pic)), pic, names: names.get(i) ?? [] });
  }
  const paths = plan.paths.map((p) => ({ ...p, line: p.line.map((q) => moved(q, d)) }));
  const all = [...places.values()];
  const regions = regionsOf(game, graph).filter((r) => r.ids.length >= 2 && r.ids.every((i) => places.has(i)));
  const land = ground({ theme: theme.id, W, H, seed, places: all, regions: regions.map((r) => r.ids), lines: paths.map((p) => p.line) });

  const svg = el('svg', { xmlns: NS, viewBox: `0 0 ${W} ${H}`, class: `wm-svg wm-theme-${theme.id}`, 'font-family': SERIF }) as SVGSVGElement;
  const paper = agedPaper(W, H, seed, accent);
  const border = paper.pop()!;
  svg.append(...paper, ...land.under);

  // regions: lettered across the top of their places
  const lettering = el('g', {
    class: 'wm-regions',
    'font-family': land.letter.family ?? SERIF,
    'font-style': land.letter.family ? 'normal' : 'italic',
    'text-anchor': 'middle',
  });
  for (const r of regions) {
    const ps = r.ids.map((i) => places.get(i)!);
    const x = ps.reduce((n, p) => n + p.c.x, 0) / ps.length;
    const top = Math.min(...ps.map((p) => p.box.y));
    const name = fit(r.name || 'Region', 26).toUpperCase();
    const span = Math.max(...ps.map((p) => p.box.x + p.box.w)) - Math.min(...ps.map((p) => p.box.x));
    const size = 2;
    const spacing = size * 0.3;
    const natural = name.length * (size * 0.72 + spacing);
    lettering.append(
      el(
        'text',
        {
          x,
          y: top - 1.4,
          'font-size': size,
          'letter-spacing': spacing,
          fill: land.letter.fill,
          stroke: land.letter.stroke,
          'stroke-width': 0.5,
          'paint-order': 'stroke',
          ...(natural > span ? { textLength: span, lengthAdjust: 'spacingAndGlyphs' } : {}),
        },
        name,
      ),
    );
  }

  // the ways: dotted (or plain) both ways, dashed with an arrowhead where only one way goes
  const lanes = ways(
    theme.id,
    paths.map(({ a, b: c, line }) => {
      const fwd = !!graph.out.get(a)?.includes(c);
      const back = !!graph.out.get(c)?.includes(a);
      return { line: fwd || !back ? line : [...line].reverse(), both: fwd && back };
    }),
  );
  svg.append(lanes, ...land.over, lettering);

  // the places: a round picture of where you come in, framed like a map's inset, with a ribbon
  const defs = el('defs', {});
  svg.append(defs);
  for (const p of all) {
    const { x, y } = p.c;
    const color = KIND[p.kind];
    const id = `wm-clip-${p.i}`;
    defs.append(el('clipPath', { id }, el('circle', { cx: x, cy: y, r: R })));
    const g = el('g', { class: `wm-place wm-${p.kind}` });
    g.append(
      ...frameExtras(theme.id, x, y),
      el('circle', { cx: x + 0.45, cy: y + 0.55, r: R + 0.7, fill: '#00000033' }),
      el('circle', { cx: x, cy: y, r: R + 0.7, fill: '#fbf6e8', stroke: INK, 'stroke-width': 0.25 }),
    );
    g.append(el('circle', { cx: x, cy: y, r: R, fill: '#1b1b1b' }));
    if (p.pic)
      g.append(
        el('image', {
          href: p.pic.toDataURL(),
          x: p.kind === 'scene' ? x - R : x - R * 1.6,
          y: y - R,
          width: p.kind === 'scene' ? R * 2 : R * 3.2,
          height: R * 2,
          'clip-path': `url(#${id})`,
          preserveAspectRatio: 'xMidYMid slice',
          style: 'image-rendering:pixelated',
        }),
      );
    g.append(el('circle', { cx: x, cy: y, r: R, fill: 'none', stroke: color, 'stroke-width': 0.45 }));
    // its number (a star at the start, a flag at the end) in a disc on the frame
    const nx = x - R * 0.74;
    const ny = y - R * 0.74;
    g.append(
      el('circle', { cx: nx, cy: ny, r: 1.75, fill: color, stroke: '#fbf6e8', 'stroke-width': 0.3 }),
      el(
        'text',
        {
          x: nx,
          y: ny + 0.62,
          'font-size': p.kind === 'scene' && p.i > 99 ? 1.35 : 1.7,
          'font-weight': 700,
          fill: '#fff',
          'text-anchor': 'middle',
          'font-family': 'Arial, Helvetica, sans-serif',
        },
        p.kind === 'start' ? '★' : p.kind === 'end' ? '⚑' : String(p.i),
      ),
    );
    // the ribbon with its name, the ways on below it
    const name = label(p.i);
    const rw = ribbonWidth(name);
    const ry = y + R + 0.5;
    g.append(
      el('path', {
        d: `M${x - rw / 2 - 1.6},${ry + 0.4} l1.1,1.05 l-1.1,1.05 h2.2 v-2.1 z M${x + rw / 2 + 1.6},${ry + 0.4} l-1.1,1.05 l1.1,1.05 h-2.2 v-2.1 z`,
        fill: mix(color, INK, 0.35),
      }),
      el('rect', { x: x - rw / 2, y: ry, width: rw, height: 2.5, fill: color, stroke: INK, 'stroke-width': 0.15 }),
      el(
        'text',
        squeeze({ x, y: ry + 1.8, 'font-size': 1.5, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle', 'letter-spacing': 0.05 }, name, 1.5, rw - 1.2),
        name,
      ),
    );
    const to = (graph.out.get(p.i) ?? []).map((t) => (game.scenes[t].gametype === ENDTYPE ? '⚑' : game.scenes[t].gametype === STARTTYPE ? '★' : String(t)));
    const foot = p.kind === 'start' ? 'Begin here' : p.kind === 'end' ? 'Journey’s end' : to.length ? `on to ${to.join(', ')}` : 'no way on';
    g.append(
      el(
        'text',
        {
          x,
          y: ry + 4.1,
          'font-size': 1.15,
          'font-style': 'italic',
          fill: INK,
          'text-anchor': 'middle',
          stroke: PAPER,
          'stroke-width': 0.35,
          'paint-order': 'stroke',
        },
        fit(foot, 34),
      ),
    );
    // who and what else is here: the scenes folded into it
    p.names.forEach((line, k) =>
      g.append(
        el(
          'text',
          {
            class: 'wm-here',
            x,
            y: y + R + 0.5 + 4.1 + NAME_LINE * (k + 1),
            'font-size': 1.1,
            fill: INK,
            'text-anchor': 'middle',
            stroke: PAPER,
            'stroke-width': 0.4,
            'paint-order': 'stroke',
            ...(line.length * 1.1 * 0.48 > 21.5 ? { textLength: 21.5, lengthAdjust: 'spacingAndGlyphs' } : {}),
          },
          line,
        ),
      ),
    );
    svg.append(g);
  }

  // the title cartouche, the key, the scale and the compass
  const count = every ? `${graph.nodes.length} scenes` : `${all.filter((p) => p.kind === 'scene').length} ${theme.places}`;
  svg.append(
    cartouche(W / 2, 3.5, Math.min(W - 2 * M, 78), entry.title, `${theme.subtitle} · ${count} · ${entry.company ?? 'Sandbox Software'}`, navy, accent),
  );
  svg.append(legend(M - 6, H - FOOT - 3, theme, land.key, accent, names.size > 0));
  if (grouping?.hostOf.size) svg.setAttribute('data-folded', String(grouping.hostOf.size));
  svg.append(compassRose(W - 13, H - 10.5, 5.2, accent));

  // fold creases, as on a map that has been folded and opened, then the border over everything
  const creases = el('g', { class: 'wm-folds', 'stroke-width': 0.18 });
  for (const x of folds(W, 85))
    creases.append(
      el('line', { x1: x, y1: 0, x2: x, y2: H, stroke: '#ffffff88' }),
      el('line', { x1: x + 0.2, y1: 0, x2: x + 0.2, y2: H, stroke: '#5a40201f' }),
    );
  for (const y of folds(H, 55))
    creases.append(
      el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#ffffff88' }),
      el('line', { x1: 0, y1: y + 0.2, x2: W, y2: y + 0.2, stroke: '#5a40201f' }),
    );
  svg.append(creases, border);
  return { W, H, svg };
}

/** The key in the bottom corner: places, start and end, the two kinds of way, what the ground shows, the names a place lists. */
function legend(
  x: number,
  y: number,
  theme: Theme,
  key: { draw: (x: number, y: number) => SVGElement; name: string }[],
  accent: string,
  lists: boolean,
): SVGElement {
  const g = el('g', { class: 'wm-legend', 'font-size': 1.35, fill: INK });
  const w = 72;
  g.append(
    el('rect', { x, y, width: w, height: 16, fill: '#fbf6e8', stroke: INK, 'stroke-width': 0.25 }),
    el('rect', { x: x + 0.6, y: y + 0.6, width: w - 1.2, height: 14.8, fill: 'none', stroke: accent, 'stroke-width': 0.12 }),
    el('text', { x: x + 2, y: y + 2.9, 'font-weight': 700, 'letter-spacing': 0.35, 'font-size': 1.5 }, 'KEY'),
  );
  const row = (k: number) => y + 5.2 + k * 2.7;
  const dot = (cx: number, cy: number, color: string, t: string) => [
    el('circle', { cx, cy, r: 1.05, fill: color, stroke: '#fbf6e8', 'stroke-width': 0.2 }),
    el(
      'text',
      { x: cx, y: cy + 0.42, 'font-size': 1.1, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle', 'font-family': 'Arial, Helvetica, sans-serif' },
      t,
    ),
  ];
  const c2 = x + 36;
  // a way's sample on a patch of its ground, where the ground is dark
  const patch = theme.id === 'space' ? SPACE : theme.id === 'board' ? '#2f5e45' : undefined;
  g.append(
    ...dot(x + 3, row(0) - 0.4, KIND.scene, '7'),
    el('text', { x: x + 5, y: row(0) }, theme.key.place),
    ...dot(x + 3, row(1) - 0.4, KIND.start, '★'),
    el('text', { x: x + 5, y: row(1) }, 'The title: the game starts'),
    ...dot(x + 3, row(2) - 0.4, KIND.end, '⚑'),
    el('text', { x: x + 5, y: row(2) }, 'The end of the game'),
  );
  for (const [k, both] of [true, false].entries()) {
    if (patch) g.append(el('rect', { x: c2 - 0.8, y: row(k) - 1.7, width: 7.6, height: 2.6, fill: patch }));
    g.append(waySample(theme.id, c2, row(k) - 0.4, 6, both), el('text', { x: c2 + 8, y: row(k) }, both ? theme.key.both : theme.key.one));
  }
  g.append(scaleBar(x + 2, row(3), STEP.w));
  if (lists)
    g.append(el('text', { x: c2 + 9, y: row(3), 'font-size': 1.1 }, '12 The Shop'), el('text', { x: c2 + 17, y: row(3) }, 'Who and what you meet there'));
  // what the ground shows, a little drawing and its name
  key.slice(0, 3).forEach((t, k) => {
    const gx = c2 + 1.4 + k * 11.5;
    g.append(t.draw(gx, row(2) - 0.6), el('text', { x: gx + 2, y: row(2), 'font-size': 1.1, 'font-style': 'italic' }, t.name));
  });
  return g;
}

/** The atlas grid on the overview: where each printed page goes. */
function tileGrid(W: number, H: number): SVGElement | undefined {
  const ts = tiles(W, H, PAGE.w, PAGE.h, PAGE.overlap);
  if (ts.length < 2) return undefined;
  const g = el('g', { class: 'wm-tiles' });
  for (const t of ts)
    g.append(
      el('rect', {
        x: t.x + 0.4,
        y: t.y + 0.4,
        width: Math.min(t.w, W - t.x) - 0.8,
        height: Math.min(t.h, H - t.y) - 0.8,
        fill: 'none',
        stroke: '#1565c055',
        'stroke-width': 0.25,
        'stroke-dasharray': '2 1',
      }),
      el('text', { x: t.x + 1.2, y: t.y + 3.2, 'font-size': 2.4, 'font-weight': 900, fill: '#1565c088' }, t.name),
    );
  return g;
}

/** One printed page: the map's SVG looking at tile `t`, with its name and where it joins. */
function tileSheet(world: World, t: Rect & { name: string; col: number; row: number }, count: { cols: number; rows: number }): Sheet {
  const svg = freshCopy(world.svg);
  svg.querySelector('.wm-tiles')?.remove();
  svg.setAttribute('viewBox', `${t.x} ${t.y} ${t.w} ${t.h}`);
  const joins = [
    t.col > 0 ? `${String.fromCharCode(64 + t.col)}${t.row + 1} to the left` : '',
    t.row > 0 ? `${String.fromCharCode(65 + t.col)}${t.row} above` : '',
  ].filter(Boolean);
  return sheet(
    PAGE.w / 10,
    PAGE.h / 10,
    'wm wm-tile',
    svg,
    h(
      'div',
      { class: 'wm-tile-tag' },
      h('b', null, t.name),
      ` · page ${t.row * count.cols + t.col + 1} of ${count.cols * count.rows}${joins.length ? ` · trim and tape over ${joins.join(' and ')}` : ''}`,
    ),
  );
}

/**
 * The World Map's sheets: the whole map first (on screen the fold-out; in print an overview
 * scaled to one page, with the atlas grid), then, for a map bigger than a page, the pages
 * that print it at full size.
 */
export async function worldMap(ctx: PrintContext, every = false): Promise<Sheet[]> {
  const loaded = await loadWorld(ctx.entry);
  if (!loaded) return [];
  const world = drawWorld(ctx.entry, loaded.game, loaded.files, ctx.printables.worldMap, every);
  const grid = tileGrid(world.W, world.H);
  const full = freshCopy(world.svg);
  if (grid) full.append(grid);
  const ts = tiles(world.W, world.H, PAGE.w, PAGE.h, PAGE.overlap);
  const cols = Math.max(...ts.map((t) => t.col)) + 1;
  const rows = Math.max(...ts.map((t) => t.row)) + 1;
  const sheets = [sheet(world.W / 10, world.H / 10, 'wm', full)];
  if (ts.length > 1) sheets.push(...ts.map((t) => tileSheet(world, t, { cols, rows })));
  return sheets;
}

/**
 * On screen: a folded map that opens into one you can zoom (buttons, wheel, keys) and drag
 * around. With `other` (and a map that folds scenes away), a button swaps it for the map of
 * every scene and back; `other(every)` gives that view's sheets and what printing then prints.
 */
export function worldMapScreen(sheets: Sheet[], other?: (every: boolean) => Promise<Sheet[]>): HTMLElement {
  const s = sheets[0];
  if (!s) return h('p', { class: 'gmb-loading' }, 'This game has no scenes to map.');
  const holder = h('div', { class: 'wm-fold' });
  const folds = !!s.el.querySelector('svg[data-folded]');
  const show = (s: Sheet, pages: number, every: boolean) => {
    const map = freshCopy(s.el);
    map.classList.add('wm-screen-sheet');
    const pz = panZoom(map, s.w, every ? 'The World Map, every scene: drag to look around' : 'The World Map: drag to look around');
    const swap =
      other && folds
        ? h(
            'button',
            {
              type: 'button',
              class: 'wm-every',
              'aria-pressed': String(every),
              title: 'Every scene as its own card, as the Game Integrator shows them',
              onclick: async () => {
                const next = await other(!every);
                if (!next[0]) return;
                show(next[0], next.length > 1 ? next.length - 1 : 1, !every);
                holder.querySelector<HTMLElement>('.wm-every')?.focus(); // the new bar's button keeps the keyboard's place
              },
            },
            'Every scene',
          )
        : undefined;
    const bar = h(
      'div',
      { class: 'wm-bar' },
      ...pz.buttons,
      ...(swap ? [swap] : []),
      h(
        'span',
        null,
        `${s.w.toFixed(1)}" × ${s.h.toFixed(1)}" · prints as ${pages > 1 ? `an overview and ${pages} pages to tape together` : 'one page'} · drag to look around, ctrl+scroll to zoom`,
      ),
    );
    holder.replaceChildren(bar, pz.view);
    holder.classList.add('open');
    // a readable start: places about 150 px across (or the whole map when that's smaller)
    requestAnimationFrame(() => pz.setZoom(Math.max(pz.view.clientWidth - 24, Math.min(s.w * 100, pz.view.clientWidth * 2.4))));
  };

  // folded: the title panel on top of a stack of folds
  const face = freshCopy(s.el);
  face.classList.add('wm-face');
  face.style.width = `${Math.max(1, s.w / 8.5) * 340}px`;
  const open = () => {
    dispatchEvent(new CustomEvent('gm-achievement', { detail: { id: 'print-world-map' } }));
    show(s, sheets.length > 1 ? sheets.length - 1 : 1, false);
  };
  const folded = h('div', { class: 'wm-folded', 'aria-hidden': 'true', onclick: open }, h('div', { class: 'wm-face-crop' }, face));
  holder.append(folded, h('button', { type: 'button', class: 'fo-btn wm-open', onclick: open }, 'Unfold the map'));
  return holder;
}
