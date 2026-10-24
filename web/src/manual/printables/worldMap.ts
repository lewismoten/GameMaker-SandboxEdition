// The fold-out World Map in every Sandbox Software box (and with a Bard of Bizarre game's maps): every scene of the game as a card
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
import { parseBackdrop, parseSlideList } from '../../formats/graphicScripts';
import { autoArrange } from '../../editor/editors/integrator/integratorLayout';
import { arrival, graphOf } from '../../editor/editors/integrator/layoutCells';
import { graphicShot, levelShot } from '../../editor/editors/integrator/integratorArt';
import { hashString, sheet, type PrintContext, type Sheet } from './kit';
import { CELL, bounds, cardRects, folds, tiles, type Rect } from './worldMapLayout';
import { INK, PAPER, blobPath, lookOf, mix, regions, scatter, trailBetween, type Look, type Terrain } from './worldMapTerrain';
import { SERIF, TERRAIN_NAMES, agedPaper, cartouche, compassRose, el, freshCopy, glyph, scaleBar } from './worldMapArt';
import { panZoom } from './panZoom';

const NS = 'http://www.w3.org/2000/svg';
const SEA = '#9fc0c4';
const RIPPLE = mix('#3f6f80', PAPER, 0.25);

/** Margin, header and footer heights, in map units (tenths of an inch). */
const M = 10;
const HEAD = 22;
const FOOT = 17;
/** One printed page's part of the map, and how much neighbors overlap (landscape letter). */
const PAGE = { w: 105, h: 80, overlap: 3 };
/** A place's round picture, and the land round it. */
const R = 5.2;
const LAND = { rx: 13.5, ry: 11.6 };
const KIND = { start: '#c58a00', end: '#a8281f', scene: '#2f5a3a' };

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
  scenes: number;
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
  kind: 'start' | 'end' | 'scene';
  look: Look;
  pic?: HTMLCanvasElement;
}

/** The whole map as an SVG, `W` x `H` tenths of an inch. */
function drawWorld(entry: CatalogEntry, game: Game, files: GameFiles): World {
  const graph = graphOf(game);
  const rects = cardRects(autoArrange(game), { x: M, y: HEAD + 4 });
  const b = bounds(rects.values());
  const W = Math.max(PAGE.w, b.x + b.w + M);
  const H = Math.max(PAGE.h, b.y + b.h + FOOT + M - 4);
  // a narrow map's places stand in the middle
  const dx = (W - (b.x + b.w + M)) / 2;
  for (const r of rects.values()) r.x += dx;
  const accent = entry.original?.box?.accent ?? '#c8962a';
  const navy = entry.original?.box?.background ?? '#22304a';
  const seed = hashString(entry.id);

  // each place: where it is, its kind, its picture and the look of its country
  const places = new Map<number, Place>();
  for (const [i, r] of rects) {
    const s = game.scenes[i];
    const kind = s.gametype === STARTTYPE ? 'start' : s.gametype === ENDTYPE ? 'end' : 'scene';
    const pic = kind === 'scene' ? levelShot(files, s, arrival(game, i), 7, 7) : (graphicShot(files, s.files[0]) ?? graphicShot(files, s.files[2]));
    places.set(i, { i, c: { x: r.x + r.w / 2, y: r.y + r.h / 2 - 1.2 }, kind, look: lookOf(colorsOf(pic)), pic });
  }
  const svg = el('svg', { xmlns: NS, viewBox: `0 0 ${W} ${H}`, class: 'wm-svg', 'font-family': SERIF }) as SVGSVGElement;
  const paper = agedPaper(W, H, seed, accent);
  const border = paper.pop()!;
  svg.append(...paper, el('rect', { x: 2, y: 2, width: W - 4, height: H - 4, fill: SEA, opacity: 0.5 }));

  // the trails, worked out first: the land bridges and the trees keep to them
  const trails = graph.pairs.flatMap(([a, c]) => {
    const pa = places.get(a);
    const pc = places.get(c);
    return pa && pc
      ? [{ a, c, t: trailBetween(pa.c, pc.c, R + 0.5, seed ^ (a * 977 + c * 131)), near: Math.hypot(pa.c.x - pc.c.x, pa.c.y - pc.c.y) < CELL.w * 1.6 }]
      : [];
  });

  // the land: ripples off the coast, the coast, then each country's color over it
  const all = [...places.values()];
  const blob = (p: Place, grow = 0) => blobPath(p.c.x, p.c.y + 1.2, LAND.rx + grow, LAND.ry + grow, seed + p.i * 7919);
  const ripples = el('g', { class: 'wm-ripples', fill: 'none', stroke: RIPPLE, 'stroke-width': 0.14 });
  for (const p of all) ripples.append(el('path', { d: blob(p, 1.3) }), el('path', { d: blob(p, 2.6), 'stroke-dasharray': '1.4 0.8' }));
  const coast = el('g', { class: 'wm-coast', fill: 'none', stroke: INK, 'stroke-width': 0.7, 'stroke-linecap': 'round' });
  const land = el('g', { class: 'wm-land' });
  for (const p of all) coast.append(el('path', { d: blob(p) }));
  for (const t of trails) if (t.near) coast.append(el('path', { d: t.t.d, 'stroke-width': 7.7 }));
  for (const t of trails) if (t.near) land.append(el('path', { d: t.t.d, fill: 'none', stroke: places.get(t.a)!.look.fill, 'stroke-width': 7 }));
  for (const p of all) land.append(el('path', { d: blob(p), fill: p.look.fill }));
  svg.append(ripples, coast, land);

  // each country's little drawings, off the places and the trails
  const avoid = [...all.map((p) => ({ p: { x: p.c.x, y: p.c.y + 1.8 }, r: R + 3 })), ...trails.flatMap((t) => t.t.samples.map((p) => ({ p, r: 1.8 })))];
  const marks = el('g', { class: 'wm-terrain' });
  const used = new Set<Terrain>();
  for (const p of all) {
    const spots = scatter(
      { x: p.c.x, y: p.c.y + 1.2 },
      LAND.rx * 0.95,
      LAND.ry * 0.95,
      7,
      seed + p.i * 31,
      avoid,
      all.filter((o) => o !== p).map((o) => ({ x: o.c.x, y: o.c.y + 1.2 })),
    );
    spots.forEach((s, k) => marks.append(glyph(p.look.terrain, s.x, s.y, p.look.ink, k)));
    if (spots.length) used.add(p.look.terrain);
  }
  svg.append(marks);

  // regions: scenes on one map, linked to each other, lettered across the top of their land
  const lettering = el('g', { class: 'wm-regions', 'font-family': SERIF, 'font-style': 'italic', 'text-anchor': 'middle' });
  const maps = game.scenes.map((s, i) => (places.has(i) && s.gametype !== STARTTYPE && s.gametype !== ENDTYPE ? s.files[1]?.toLowerCase() : undefined));
  for (const group of regions(maps, graph.pairs)) {
    if (group.length < 2) continue;
    const ps = group.map((i) => places.get(i)!);
    const x = ps.reduce((n, p) => n + p.c.x, 0) / ps.length;
    const top = Math.min(...ps.map((p) => p.c.y));
    const name = fit(game.scenes[group[0]].desc || 'Region', 26).toUpperCase();
    // as wide as the region, never over its neighbors' lettering
    const span = Math.max(...ps.map((p) => p.c.x)) - Math.min(...ps.map((p) => p.c.x)) + CELL.w * 0.9;
    const size = 2;
    const spacing = size * 0.3;
    const natural = name.length * (size * 0.72 + spacing);
    lettering.append(
      el(
        'text',
        {
          x,
          y: top - R - 1.3,
          'font-size': size,
          'letter-spacing': spacing,
          fill: ps[0].look.ink,
          stroke: PAPER,
          'stroke-width': 0.5,
          'paint-order': 'stroke',
          opacity: 0.9,
          ...(natural > span ? { textLength: span, lengthAdjust: 'spacingAndGlyphs' } : {}),
        },
        name,
      ),
    );
  }
  svg.append(lettering);

  // the trails: a pale road under a line of dots, dashes and an arrowhead where only one way goes
  const roads = el('g', { class: 'wm-trails', fill: 'none', 'stroke-linecap': 'round' });
  for (const { a, c, t } of trails) {
    const fwd = graph.out.get(a)?.includes(c);
    const back = graph.out.get(c)?.includes(a);
    roads.append(el('path', { d: t.d, stroke: '#fbf5e4', 'stroke-width': 1.1, opacity: 0.75 }));
    roads.append(
      el(
        'path',
        fwd && back
          ? { d: t.d, stroke: INK, 'stroke-width': 0.5, 'stroke-dasharray': '0.05 0.9' }
          : { d: t.d, stroke: INK, 'stroke-width': 0.3, 'stroke-dasharray': '1.1 0.6' },
      ),
    );
    if (!(fwd && back)) {
      const deg = (t.angle * 180) / Math.PI + (fwd ? 0 : 180);
      roads.append(
        el('path', {
          d: 'M-0.9,-0.8 L0.7,0 L-0.9,0.8 z',
          fill: INK,
          stroke: 'none',
          transform: `translate(${t.mid.x.toFixed(2)},${t.mid.y.toFixed(2)}) rotate(${deg.toFixed(1)})`,
        }),
      );
    }
  }
  svg.append(roads);

  // the places: a round picture of where you come in, framed like a map's inset, with a ribbon
  const defs = el('defs', {});
  svg.append(defs);
  for (const p of all) {
    const s = game.scenes[p.i];
    const { x, y } = p.c;
    const color = KIND[p.kind];
    const id = `wm-clip-${p.i}`;
    defs.append(el('clipPath', { id }, el('circle', { cx: x, cy: y, r: R })));
    const g = el('g', { class: `wm-place wm-${p.kind}` });
    g.append(
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
    const name = fit(s.desc || (p.kind === 'start' ? 'Title' : p.kind === 'end' ? 'The end' : 'Untitled'), 24);
    const rw = Math.max(11, Math.min(19, name.length * 0.82 + 3));
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
    svg.append(g);
  }

  // the title cartouche, the key, the scale and the compass
  svg.append(
    cartouche(
      W / 2,
      3.5,
      Math.min(W - 2 * M, 78),
      entry.title,
      `A Map of the Known World · ${graph.nodes.length} scenes · ${entry.company ?? 'Sandbox Software'}`,
      navy,
      accent,
    ),
  );
  svg.append(legend(M - 6, H - FOOT - 3, [...used], accent));
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
  return { W, H, svg, scenes: graph.nodes.length };
}

/** The key in the bottom corner: places, start and end, the two kinds of trail, the countries drawn. */
function legend(x: number, y: number, terrains: Terrain[], accent: string): SVGElement {
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
  g.append(
    ...dot(x + 3, row(0) - 0.4, KIND.scene, '7'),
    el('text', { x: x + 5, y: row(0) }, 'A scene: where you arrive in it'),
    ...dot(x + 3, row(1) - 0.4, KIND.start, '★'),
    el('text', { x: x + 5, y: row(1) }, 'The title: the game starts'),
    ...dot(x + 3, row(2) - 0.4, KIND.end, '⚑'),
    el('text', { x: x + 5, y: row(2) }, 'The end of the game'),
    el('path', { d: `M${c2},${row(0) - 0.4} h6`, stroke: INK, 'stroke-width': 0.5, 'stroke-dasharray': '0.05 0.9', 'stroke-linecap': 'round', fill: 'none' }),
    el('text', { x: c2 + 8, y: row(0) }, 'A way there and back'),
    el('path', { d: `M${c2},${row(1) - 0.4} h6`, stroke: INK, 'stroke-width': 0.3, 'stroke-dasharray': '1.1 0.6', fill: 'none' }),
    el('path', { d: `M${c2 + 2.4},${row(1) - 1.2} l1.6,0.8 l-1.6,0.8 z`, fill: INK }),
    el('text', { x: c2 + 8, y: row(1) }, 'One way only'),
  );
  g.append(scaleBar(x + 2, row(3), CELL.w));
  // the countries this map draws, a little drawing and its name
  terrains.slice(0, 3).forEach((t, k) => {
    const gx = c2 + 1.4 + k * 11.5;
    g.append(glyph(t, gx, row(2) - 0.6, INK, 1), el('text', { x: gx + 2, y: row(2), 'font-size': 1.1, 'font-style': 'italic' }, TERRAIN_NAMES[t]));
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
export async function worldMap(ctx: PrintContext): Promise<Sheet[]> {
  const loaded = await loadWorld(ctx.entry);
  if (!loaded) return [];
  const world = drawWorld(ctx.entry, loaded.game, loaded.files);
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

/** On screen: a folded map that opens into one you can zoom (buttons, wheel, keys) and drag around. */
export function worldMapScreen(sheets: Sheet[]): HTMLElement {
  const s = sheets[0];
  if (!s) return h('p', { class: 'gmb-loading' }, 'This game has no scenes to map.');
  const map = freshCopy(s.el);
  map.classList.add('wm-screen-sheet');
  const pz = panZoom(map, s.w, 'The World Map: drag to look around');
  const pages = sheets.length > 1 ? sheets.length - 1 : 1;
  const bar = h(
    'div',
    { class: 'wm-bar' },
    ...pz.buttons,
    h(
      'span',
      null,
      `${s.w.toFixed(1)}" × ${s.h.toFixed(1)}" · prints as ${pages > 1 ? `an overview and ${pages} pages to tape together` : 'one page'} · drag to look around, ctrl+scroll to zoom`,
    ),
  );

  // folded: the title panel on top of a stack of folds
  const face = freshCopy(s.el);
  face.classList.add('wm-face');
  face.style.width = `${Math.max(1, s.w / 8.5) * 340}px`;
  const holder = h('div', { class: 'wm-fold' });
  const open = () => {
    dispatchEvent(new CustomEvent('gm-achievement', { detail: { id: 'print-world-map' } }));
    holder.replaceChildren(bar, pz.view);
    holder.classList.add('open');
    // a readable start: places about 150 px across (or the whole map when that's smaller)
    requestAnimationFrame(() => pz.setZoom(Math.max(pz.view.clientWidth - 24, Math.min(s.w * 100, pz.view.clientWidth * 2.4))));
  };
  const folded = h('div', { class: 'wm-folded', 'aria-hidden': 'true', onclick: open }, h('div', { class: 'wm-face-crop' }, face));
  holder.append(folded, h('button', { type: 'button', class: 'fo-btn wm-open', onclick: open }, 'Unfold the map'));
  return holder;
}
