// The fold-out World Map in every Sandbox Software box: every scene of the game as a card
// (its number and name and a picture of where you arrive) and an arrow for every way from
// one scene to another, laid out by the Game Integrator's Auto-arrange from the game's own
// .GAM. It's drawn as one SVG in tenths of an inch, so it prints at full size: a big game
// prints as an overview page plus pages to trim and tape together (A1, B1, ... like a road
// atlas), each the same SVG looking at its own part. On screen it comes folded and opens
// into a map you can zoom and drag around.
import './worldMap.css';
import { h } from '../../editor/core/ui';
import { GameFiles, fetchGameFile, type CatalogEntry } from '../../project/files';
import { ENDTYPE, NOSCENE, STARTTYPE, parseGame, type Game, type Point } from '../../formats/game';
import { MLEN, MWID } from '../../formats/map';
import { parseBackdrop, parseSlideList } from '../../formats/graphicScripts';
import { autoArrange } from '../../editor/editors/integrator/integratorLayout';
import { graphOf } from '../../editor/editors/integrator/layoutCells';
import { graphicShot, levelShot } from '../../editor/editors/integrator/integratorArt';
import { sheet, type PrintContext, type Sheet } from './kit';
import { bounds, cardRects, edgePoint, folds, tiles, type Rect } from './worldMapLayout';

const NS = 'http://www.w3.org/2000/svg';
const INK = '#2b241c';
const PAPER = '#f4ecd6';
const KIND = { start: '#d99a00', end: '#b3261e', scene: '#2f6b3a' };
/** Margin, header and legend heights, in map units (tenths of an inch). */
const M = 5;
const HEAD = 20;
const FOOT = 12;
/** One printed page's part of the map, and how much neighbors overlap (landscape letter). */
const PAGE = { w: 105, h: 80, overlap: 3 };

function el(tag: string, attrs: Record<string, string | number>, ...kids: (Node | string)[]): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  e.append(...kids);
  return e;
}

/** Where the hero arrives in a scene: the "to" block of the first link into it (as the integrator shows it). */
function arrival(game: Game, i: number): Point {
  for (const s of game.scenes) {
    if (s.gametype === NOSCENE) continue;
    const l = s.links.find((x) => x.toScene === i);
    if (l) return l.to;
  }
  return { x: MLEN >> 1, y: MWID >> 1 };
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

interface World {
  W: number;
  H: number;
  svg: SVGSVGElement;
  scenes: number;
}

/** The whole map as an SVG, `W` x `H` tenths of an inch. */
function drawWorld(entry: CatalogEntry, game: Game, files: GameFiles): World {
  const graph = graphOf(game);
  const rects = cardRects(autoArrange(game), { x: M, y: HEAD + 2 });
  const b = bounds(rects.values());
  const W = Math.max(110, b.x + b.w + M);
  const H = Math.max(85, b.y + b.h + FOOT + M);
  // a narrow map's cards stand in the middle
  const dx = (W - (b.x + b.w + M)) / 2;
  for (const r of rects.values()) r.x += dx;
  const accent = entry.original?.box?.accent ?? '#f2b632';
  const navy = entry.original?.box?.background ?? '#14182a';

  const svg = el('svg', { xmlns: NS, viewBox: `0 0 ${W} ${H}`, class: 'wm-svg', 'font-family': 'Arial, Helvetica, sans-serif' }) as SVGSVGElement;
  const defs = el(
    'defs',
    {},
    el(
      'marker',
      { id: 'wm-head', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 3.2, markerHeight: 3.2, orient: 'auto-start-reverse', markerUnits: 'strokeWidth' },
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: INK }),
    ),
    el(
      'pattern',
      { id: 'wm-grid', width: 5, height: 5, patternUnits: 'userSpaceOnUse' },
      el('path', { d: 'M5,0 L0,0 0,5', fill: 'none', stroke: '#c9d3d6', 'stroke-width': 0.08 }),
    ),
  );
  svg.append(
    defs,
    el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }),
    el('rect', { x: 0, y: HEAD, width: W, height: H - HEAD - FOOT, fill: 'url(#wm-grid)' }),
  );

  // the title band
  svg.append(
    el('rect', { x: 0, y: 0, width: W, height: HEAD - 3, fill: navy }),
    el('rect', { x: 0, y: HEAD - 3, width: W, height: 0.8, fill: accent }),
    el('text', { x: M, y: 8.5, fill: accent, 'font-size': 6, 'font-weight': 900, 'font-style': 'italic', 'letter-spacing': 0.2 }, 'WORLD MAP'),
    el('text', { x: M, y: 13.6, fill: '#fff', 'font-size': 2.6, 'font-weight': 700 }, entry.title),
    el(
      'text',
      { x: W - M, y: 7, fill: '#fff', 'font-size': 1.7, 'text-anchor': 'end', 'letter-spacing': 0.15 },
      `SANDBOX SOFTWARE · FOLD-OUT MAP · ${graph.nodes.length} SCENES`,
    ),
    el(
      'text',
      { x: W - M, y: 10.2, fill: '#d8d2c2', 'font-size': 1.5, 'text-anchor': 'end' },
      'Every scene and the ways between them, as the Game Integrator lays them out.',
    ),
    el('text', { x: W - M, y: 12.8, fill: '#d8d2c2', 'font-size': 1.5, 'text-anchor': 'end' }, 'Scene numbers match the hint book.'),
  );

  // fold lines, faint, as on a map that has been folded and opened
  const fx = folds(W, 85);
  const fy = folds(H, 55);
  for (const x of fx) svg.append(el('line', { x1: x, y1: 0, x2: x, y2: H, stroke: '#00000022', 'stroke-width': 0.15, 'stroke-dasharray': '1 1' }));
  for (const y of fy) svg.append(el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#00000022', 'stroke-width': 0.15, 'stroke-dasharray': '1 1' }));

  // arrows under the cards: one per linked pair, a head at each end it goes to
  const arrows = el('g', { class: 'wm-arrows', fill: 'none', stroke: INK, 'stroke-width': 0.32, 'stroke-linecap': 'round' });
  for (const [a, c] of graph.pairs) {
    const ra = rects.get(a);
    const rc = rects.get(c);
    if (!ra || !rc) continue;
    const ca = { x: ra.x + ra.w / 2, y: ra.y + ra.h / 2 };
    const cc = { x: rc.x + rc.w / 2, y: rc.y + rc.h / 2 };
    const p = edgePoint(ra, cc);
    const q = edgePoint(rc, ca);
    const fwd = graph.out.get(a)?.includes(c);
    const back = graph.out.get(c)?.includes(a);
    const attrs: Record<string, string | number> = { x1: p.x, y1: p.y, x2: q.x, y2: q.y };
    if (fwd) attrs['marker-end'] = 'url(#wm-head)';
    if (back) attrs['marker-start'] = 'url(#wm-head)';
    if (!(fwd && back)) attrs['stroke-dasharray'] = '1.2 0.6';
    arrows.append(el('line', attrs));
  }
  svg.append(arrows);

  // the cards
  for (const [i, r] of rects) {
    const s = game.scenes[i];
    const kind = s.gametype === STARTTYPE ? 'start' : s.gametype === ENDTYPE ? 'end' : 'scene';
    const color = KIND[kind];
    const title = kind === 'start' ? `★ ${s.desc || 'Title'}` : kind === 'end' ? `⚑ ${s.desc || 'The end'}` : `${i} · ${s.desc || 'Untitled'}`;
    const g = el('g', { class: `wm-card wm-${kind}` });
    g.append(
      el('rect', { x: r.x + 0.5, y: r.y + 0.6, width: r.w, height: r.h, rx: 0.8, fill: '#00000030' }),
      el('rect', { x: r.x, y: r.y, width: r.w, height: r.h, rx: 0.8, fill: '#fffdf6', stroke: INK, 'stroke-width': 0.22 }),
      el('path', { d: `M${r.x},${r.y + 2.6} v-1.8 a0.8,0.8 0 0 1 0.8,-0.8 h${r.w - 1.6} a0.8,0.8 0 0 1 0.8,0.8 v1.8 z`, fill: color }),
      el('text', { x: r.x + 0.8, y: r.y + 1.95, fill: '#fff', 'font-size': 1.45, 'font-weight': 700 }, fit(title, 24)),
    );
    // the picture: where you arrive, or the title / end screen
    const pic = kind === 'scene' ? levelShot(files, s, arrival(game, i), 8, 5) : (graphicShot(files, s.files[0]) ?? graphicShot(files, s.files[2]));
    const px = r.x + 0.8;
    const py = r.y + 3.2;
    const pw = r.w - 1.6;
    const ph = pw / 1.6;
    g.append(el('rect', { x: px, y: py, width: pw, height: ph, fill: '#1b1b1b' }));
    if (pic)
      g.append(
        el('image', {
          href: pic.toDataURL(),
          x: px,
          y: py,
          width: pw,
          height: ph,
          preserveAspectRatio: kind === 'scene' ? 'none' : 'xMidYMid slice',
          style: 'image-rendering:pixelated',
        }),
      );
    else g.append(el('text', { x: px + pw / 2, y: py + ph / 2 + 0.4, fill: '#bbb', 'font-size': 1.2, 'text-anchor': 'middle' }, 'no picture'));
    // the way on: scene numbers it leads to
    const to = (graph.out.get(i) ?? []).map((t) => (game.scenes[t].gametype === ENDTYPE ? '⚑' : game.scenes[t].gametype === STARTTYPE ? '★' : String(t)));
    const foot = kind === 'start' ? 'Start here' : kind === 'end' ? 'Game over / you win' : to.length ? `Exits to ${to.join(', ')}` : 'No exits';
    g.append(el('text', { x: r.x + 0.8, y: r.y + r.h - 0.7, fill: INK, 'font-size': 1.15 }, fit(foot, 30)));
    svg.append(g);
  }

  // the legend
  const ly = H - FOOT + 2.5;
  const legend = el('g', { class: 'wm-legend', 'font-size': 1.5, fill: INK });
  legend.append(
    el('text', { x: M, y: ly + 1.2, 'font-weight': 900, 'letter-spacing': 0.2 }, 'LEGEND'),
    el('rect', { x: M + 9, y: ly, width: 2.4, height: 1.4, fill: KIND.start }),
    el('text', { x: M + 12, y: ly + 1.2 }, 'Start'),
    el('rect', { x: M + 18, y: ly, width: 2.4, height: 1.4, fill: KIND.scene }),
    el('text', { x: M + 21, y: ly + 1.2 }, 'Scene (its number, its name, where you come in)'),
    el('rect', { x: M + 57, y: ly, width: 2.4, height: 1.4, fill: KIND.end }),
    el('text', { x: M + 60, y: ly + 1.2 }, 'End'),
    el('line', {
      x1: M + 9,
      y1: ly + 4.2,
      x2: M + 15,
      y2: ly + 4.2,
      stroke: INK,
      'stroke-width': 0.32,
      'marker-end': 'url(#wm-head)',
      'marker-start': 'url(#wm-head)',
    }),
    el('text', { x: M + 17, y: ly + 4.7 }, 'Ways both there and back'),
    el('line', {
      x1: M + 40,
      y1: ly + 4.2,
      x2: M + 46,
      y2: ly + 4.2,
      stroke: INK,
      'stroke-width': 0.32,
      'stroke-dasharray': '1.2 0.6',
      'marker-end': 'url(#wm-head)',
    }),
    el('text', { x: M + 48, y: ly + 4.7 }, 'One way only'),
  );
  svg.append(legend);
  // a compass rose, because it's a map
  const cx = W - M - 4;
  const cy = H - FOOT / 2;
  svg.append(
    el(
      'g',
      { class: 'wm-rose', stroke: INK, 'stroke-width': 0.15 },
      el('circle', { cx, cy, r: 3.6, fill: 'none' }),
      el('path', { d: `M${cx},${cy - 4.4} L${cx + 1},${cy} L${cx},${cy + 4.4} L${cx - 1},${cy} z`, fill: accent }),
      el('path', { d: `M${cx - 4.4},${cy} L${cx},${cy + 1} L${cx + 4.4},${cy} L${cx},${cy - 1} z`, fill: '#fffdf6' }),
      el('text', { x: cx, y: cy - 4.8, 'font-size': 1.4, 'text-anchor': 'middle', fill: INK, stroke: 'none', 'font-weight': 700 }, 'N'),
    ),
  );
  return { W, H, svg, scenes: graph.nodes.length };
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
  const svg = world.svg.cloneNode(true) as SVGSVGElement;
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
    svg as unknown as HTMLElement,
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
export async function worldMap(ctx: PrintContext): Promise<Sheet[]> {
  const loaded = await loadWorld(ctx.entry);
  if (!loaded) return [];
  const world = drawWorld(ctx.entry, loaded.game, loaded.files);
  const grid = tileGrid(world.W, world.H);
  const full = world.svg.cloneNode(true) as SVGSVGElement;
  if (grid) full.append(grid);
  const ts = tiles(world.W, world.H, PAGE.w, PAGE.h, PAGE.overlap);
  const cols = Math.max(...ts.map((t) => t.col)) + 1;
  const rows = Math.max(...ts.map((t) => t.row)) + 1;
  const sheets = [sheet(world.W / 10, world.H / 10, 'wm', full as unknown as HTMLElement)];
  if (ts.length > 1) sheets.push(...ts.map((t) => tileSheet(world, t, { cols, rows })));
  return sheets;
}

/** On screen: a folded map that opens into one you can zoom (buttons, wheel) and drag around. */
export function worldMapScreen(sheets: Sheet[]): HTMLElement {
  const s = sheets[0];
  if (!s) return h('p', { class: 'gmb-loading' }, 'This game has no scenes to map.');
  const inches = s.w;
  const map = s.el.cloneNode(true) as HTMLElement;
  map.classList.add('wm-screen-sheet');
  const view = h('div', { class: 'wm-view' }, map);
  let zoom = 0;
  const setZoom = (px: number) => {
    zoom = Math.max(360, Math.min(inches * 260, px));
    map.style.width = `${zoom}px`;
  };
  const fitW = () => setZoom(view.clientWidth - 24);
  const by = (k: number) => {
    const cx = (view.scrollLeft + view.clientWidth / 2) / map.offsetWidth;
    const cy = (view.scrollTop + view.clientHeight / 2) / map.offsetHeight;
    setZoom(zoom * k);
    view.scrollLeft = cx * map.offsetWidth - view.clientWidth / 2;
    view.scrollTop = cy * map.offsetHeight - view.clientHeight / 2;
  };
  view.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      by(Math.exp(-e.deltaY / 300));
    },
    { passive: false },
  );
  let drag: { x: number; y: number; l: number; t: number } | undefined;
  view.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop };
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag) return;
    view.scrollLeft = drag.l - (e.clientX - drag.x);
    view.scrollTop = drag.t - (e.clientY - drag.y);
  });
  const end = () => (drag = undefined);
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);

  const pages = sheets.length > 1 ? sheets.length - 1 : 1;
  const bar = h(
    'div',
    { class: 'wm-bar' },
    h('button', { onclick: () => by(1 / 1.3), 'aria-label': 'Zoom out' }, '−'),
    h('button', { onclick: () => by(1.3), 'aria-label': 'Zoom in' }, '+'),
    h('button', { onclick: fitW }, 'Fit'),
    h('button', { onclick: () => setZoom(inches * 96) }, 'Actual size'),
    h(
      'span',
      null,
      `${s.w.toFixed(1)}" × ${s.h.toFixed(1)}" · prints as ${pages > 1 ? `an overview and ${pages} pages to tape together` : 'one page'} · drag to look around, ctrl+scroll to zoom`,
    ),
  );

  // folded: the title panel on top of a stack of folds
  const folded = h('div', { class: 'wm-folded' });
  const face = s.el.cloneNode(true) as HTMLElement;
  face.classList.add('wm-face');
  face.style.width = `${Math.max(1, s.w / 8.5) * 340}px`;
  folded.append(h('div', { class: 'wm-face-crop' }, face));
  const holder = h('div', { class: 'wm-fold' });
  const open = () => {
    holder.replaceChildren(bar, view);
    holder.classList.add('open');
    // a readable start: cards about 180 px wide (or the whole map when that's smaller)
    requestAnimationFrame(() => setZoom(Math.max(view.clientWidth - 24, Math.min(inches * 100, view.clientWidth * 2.4))));
  };
  holder.append(folded, h('button', { class: 'fo-btn wm-open', onclick: open }, 'Unfold the map'));
  folded.addEventListener('click', open);
  return holder;
}
