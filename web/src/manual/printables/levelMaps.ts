// Level Maps: every map the game's levels play on, drawn whole from its own blocks, palette and
// monsters (gfx/levelPicture.ts scenePixels), cropped to the part the player sees (levelViews.ts;
// "Every block of the map" shows all of the part in use), with where you arrive
// and the ways out marked (levelMapLayout.ts). Tin hearts and eggs are drawn as the ground they
// sit on and never marked (levelSecrets.ts). Small maps share a printed page; a big one gets a
// page of its own and, if wanted, full-size pages to tape together (A1, B1... as the World Map
// does). Nothing is drawn until the piece is opened or printed, and on screen only the map shown.
import './paper.css'; // first: this piece's own styles build on the paper's
import './levelMaps.css';
import { h } from '../../editor/core/ui';
import { paintIndexed } from '../../editor/core/draw';
import { GameFiles, fetchGameFile, type CatalogEntry } from '../../project/files';
import { parseGame, type Game } from '../../formats/game';
import { scenePixels } from '../../gfx/levelPicture';
import { sheet, type PrintContext, type Sheet } from './kit';
import { tiles } from './worldMapLayout';
import { el, SERIF } from './worldMapArt';
import { fillerBlock, levelsOf, markLabel, packPages, type Level } from './levelMapLayout';
import { listedSecrets } from './levelSecrets';
import { listedUnrolled, listedViews } from './levelViews';
import { unrolledShows } from '../../editor/check/unroll';
import { BLEN } from '../../formats/blocks';
import { MLEN } from '../../formats/map';
import { panZoom } from './panZoom';

/** A printed page (landscape letter, tenths of an inch), its margin, header and footer. */
const PAGE = { w: 105, h: 80 };
const MARGIN = 2;
const HEAD = 7;
const FOOT = 6;
/** The space for maps on a page, and a level's caption over its map. */
const AREA = { w: PAGE.w - 2 * MARGIN, h: PAGE.h - HEAD - FOOT };
const CAPTION = 3;
const GAP = 2.4;
const OVERLAP = 3;
/** A block's size at full size: a tenth of an inch (a 16 x 10 screen is 1.6 x 1 inches). */
const FULL = 1;
/** "Print everything" stays sensible: big maps go full size too unless that runs past this many pages. */
const MOST_PAGES = 60;

export const COLORS = { start: '#17762f', exit: '#1d4e9e', end: '#b3261e', join: '#7a3db8' };

/** The game and every level's files (palette, map, blocks, monsters). */
async function loadLevels(entry: CatalogEntry): Promise<{ game: Game; files: GameFiles } | undefined> {
  if (!entry.gam) return undefined;
  const gam = await fetchGameFile(entry, entry.gam);
  if (!gam) return undefined;
  const game = parseGame(gam);
  const files = new GameFiles();
  const want = new Set<string>();
  for (const s of game.scenes) if (s.gametype === 10) for (const k of [0, 1, 2, 3, 4]) if (s.files[k]) want.add(s.files[k].toLowerCase());
  await Promise.all(
    [...want].map(async (n) => {
      const b = await fetchGameFile(entry, n).catch(() => undefined);
      if (b) files.set(n, b);
    }),
  );
  return { game, files };
}

/** The scene numbers of a level, short: "3", "3, 11", "5–9". */
const sceneList = (game: Game, l: Level) => markLabel(game, l.group.scenes);

/** A mark's label: its text and width, and where it sits (paper units, `s` a block from `ox`, `oy`). */
interface MarkLabel {
  text: string;
  /** Its middle, kept over the picture. */
  x: number;
  w: number;
  /** Arrivals' labels sit over the mark, the ways out under it. */
  up: boolean;
  /** 0 next to the mark; further out when it would cover another label. */
  lane: number;
}

const LANE = 1.8;

/** The labels of a level's marks, laid out so none covers another or runs off the picture. */
function markLabels(game: Game, l: Level, ox: number, s: number): MarkLabel[] {
  const left = ox;
  const right = ox + l.area.w * s;
  const labels = l.marks.map((m) => {
    const text = `${m.kind === 'start' ? '▶' : m.kind === 'end' ? '⚑' : '→'}${m.kind === 'end' ? '' : markLabel(game, m.scenes)}`;
    const w = Math.min(14, text.length * 0.6 + 0.8);
    const mid = ox + (m.x + (m.w - 1) / 2 - l.area.x + 0.5) * s;
    const x = w >= right - left ? (left + right) / 2 : Math.min(Math.max(mid, left + w / 2), right - w / 2);
    return { text, x, w, up: m.kind === 'start', lane: 0 };
  });
  // in order across, each label takes the first lane out where it covers no other
  const lanes: { up: boolean; lane: number; from: number; to: number }[] = [];
  for (const lb of [...labels].sort((a, b) => a.x - b.x)) {
    const from = lb.x - lb.w / 2 - 0.2;
    const to = lb.x + lb.w / 2 + 0.2;
    while (lanes.some((o) => o.up === lb.up && o.lane === lb.lane && o.from < to && from < o.to)) lb.lane++;
    lanes.push({ up: lb.up, lane: lb.lane, from, to });
  }
  return labels;
}

/** The room a level's labels need over and under its picture, past the first lane. */
export function labelRoom(game: Game, l: Level): { above: number; below: number } {
  const labels = markLabels(game, l, 0, FULL);
  const most = (up: boolean) => Math.max(0, ...labels.filter((x) => x.up === up).map((x) => x.lane));
  // (a label over the top row already reaches into the caption's last unit: lanes start past it)
  return { above: most(true) ? most(true) * LANE + 1 : 0, below: most(false) * LANE };
}

/** The marks of a level drawn over its picture, `s` paper units a block, from (`ox`, `oy`); sizes stay the same on paper. */
function marksSvg(game: Game, l: Level, ox: number, oy: number, s: number): SVGElement {
  const g = el('g', { class: 'lm-marks', 'font-family': 'Arial, Helvetica, sans-serif' });
  const px = (x: number) => ox + (x - l.area.x + 0.5) * s;
  const py = (y: number) => oy + (y - l.area.y + 0.5) * s;
  const labels = markLabels(game, l, ox, s);
  // the lines from moved labels back to their marks go under every label
  const leaders = el('g', { class: 'lm-leaders' });
  g.append(leaders);
  for (const [i, m] of l.marks.entries()) {
    // the middle of the mark, and its box (at least a block, and big enough to see)
    const x = px(m.x + (m.w - 1) / 2);
    const y = py(m.y + (m.h - 1) / 2);
    const bw = Math.max(m.w * s, 0.9);
    const bh = Math.max(m.h * s, 0.9);
    const box = bh;
    const color = COLORS[m.kind];
    const shape = (stroke: string, width: number) =>
      m.kind === 'start' && m.w === 1 && m.h === 1
        ? el('circle', { cx: x, cy: y, r: bw * 0.42, fill: 'none', stroke, 'stroke-width': width })
        : el('rect', { x: x - bw / 2, y: y - bh / 2, width: bw, height: bh, rx: m.kind === 'start' ? bh / 2 : 0, fill: 'none', stroke, 'stroke-width': width });
    g.append(shape('#fff', 0.42), shape(color, 0.24));
    const { text, x: lx, w: tw, lane } = labels[i];
    const ty = m.kind === 'start' ? y - box / 2 - 1.9 - lane * LANE : y + box / 2 + 0.25 + lane * LANE;
    // a label moved off its mark points back to it
    if (lane || Math.abs(lx - x) > tw / 2)
      leaders.append(
        el('line', {
          x1: x,
          y1: m.kind === 'start' ? y - box / 2 : y + box / 2,
          x2: Math.min(Math.max(x, lx - tw / 2 + 0.4), lx + tw / 2 - 0.4),
          y2: m.kind === 'start' ? ty + 1.6 : ty,
          stroke: color,
          'stroke-width': 0.2,
        }),
      );
    g.append(
      el('rect', { x: lx - tw / 2, y: ty, width: tw, height: 1.6, rx: 0.4, fill: color, stroke: '#fff', 'stroke-width': 0.15 }),
      el(
        'text',
        {
          x: lx,
          y: ty + 1.2,
          'font-size': 1.1,
          'font-weight': 700,
          fill: '#fff',
          'text-anchor': 'middle',
          ...(text.length * 0.6 > tw - 0.6 ? { textLength: tw - 0.6, lengthAdjust: 'spacingAndGlyphs' } : {}),
        },
        text,
      ),
    );
  }
  return g;
}

/** A level's picture and marks, `s` paper units a block, from (`ox`, `oy`). */
export function levelSvg(game: Game, l: Level, url: string, ox: number, oy: number, s: number): SVGElement {
  return el(
    'g',
    { class: 'lm-level' },
    el('rect', { x: ox - 0.15, y: oy - 0.15, width: l.area.w * s + 0.3, height: l.area.h * s + 0.3, fill: 'none', stroke: '#222', 'stroke-width': 0.3 }),
    el('image', { href: url, x: ox, y: oy, width: l.area.w * s, height: l.area.h * s, preserveAspectRatio: 'none', style: 'image-rendering:pixelated' }),
    ...joinedEdges(l, ox, oy, s),
    marksSvg(game, l, ox, oy, s),
  );
}

/** Edges that are the same place (the map goes round forever that way): dashed, with arrows going on through them. */
function joinedEdges(l: Level, ox: number, oy: number, s: number): SVGElement[] {
  const [lx, ly] = l.unrolled?.loops ?? [false, false];
  const w = l.area.w * s;
  const ht = l.area.h * s;
  const out: SVGElement[] = [];
  const edge = (x1: number, y1: number, x2: number, y2: number) =>
    out.push(
      el('line', { x1, y1, x2, y2, stroke: '#fff', 'stroke-width': 0.5 }),
      el('line', { x1, y1, x2, y2, stroke: COLORS.join, 'stroke-width': 0.3, 'stroke-dasharray': '1 0.6' }),
    );
  const arrow = (x: number, y: number, text: string) =>
    out.push(
      el(
        'text',
        {
          x,
          y,
          'font-family': 'Arial, Helvetica, sans-serif',
          'font-size': 1.6,
          'font-weight': 700,
          fill: COLORS.join,
          stroke: '#fff',
          'stroke-width': 0.25,
          'paint-order': 'stroke',
          'text-anchor': 'middle',
        },
        text,
      ),
    );
  if (lx) {
    edge(ox, oy, ox, oy + ht);
    edge(ox + w, oy, ox + w, oy + ht);
    arrow(ox + 0.9, oy + ht / 2 + 0.55, '⇠');
    arrow(ox + w - 0.9, oy + ht / 2 + 0.55, '⇢');
  }
  if (ly) {
    edge(ox, oy, ox + w, oy);
    edge(ox, oy + ht, ox + w, oy + ht);
    arrow(ox + w / 2, oy + 1.5, '⇡');
    arrow(ox + w / 2, oy + ht - 0.4, '⇣');
  }
  return out;
}

/** What a caption adds for a map whose edges join, so the dashed edges read. */
function joinNote(l: Level): string {
  const [lx, ly] = l.unrolled?.loops ?? [false, false];
  return lx && ly ? ' · all four edges join up' : lx ? ' · the left and right edges join up' : ly ? ' · the top and bottom edges join up' : '';
}

/** A level's caption: its scene numbers and name. */
export function captionSvg(game: Game, l: Level, x: number, y: number, width: number): SVGElement {
  const t = `Scene ${sceneList(game, l)} · ${l.name}${joinNote(l)}`;
  return el(
    'text',
    {
      x,
      y: y + 2,
      'font-family': SERIF,
      'font-size': 1.7,
      'font-weight': 700,
      fill: '#2b241c',
      ...(t.length * 0.85 > width ? { textLength: width, lengthAdjust: 'spacingAndGlyphs' } : {}),
    },
    t,
  );
}

/** The key printed at the foot of every page. */
function keySvg(y: number): SVGElement {
  const g = el('g', { class: 'lm-key', 'font-family': 'Arial, Helvetica, sans-serif', 'font-size': 1.3, fill: '#2b241c' });
  const item = (x: number, kind: keyof typeof COLORS, text: string) => {
    if (kind === 'start') g.append(el('circle', { cx: x + 0.6, cy: y - 0.45, r: 0.5, fill: 'none', stroke: COLORS[kind], 'stroke-width': 0.25 }));
    else g.append(el('rect', { x: x + 0.1, y: y - 0.95, width: 1, height: 1, fill: 'none', stroke: COLORS[kind], 'stroke-width': 0.25 }));
    g.append(el('text', { x: x + 1.8, y }, text));
  };
  g.append(el('text', { x: MARGIN, y, 'font-weight': 700, 'letter-spacing': 0.2 }, 'KEY'));
  item(MARGIN + 5, 'start', '▶ 4: where you arrive in scene 4');
  item(MARGIN + 34, 'exit', '→ 7: the way to scene 7 (★ the title)');
  item(MARGIN + 66, 'end', '⚑ the way to the end');
  g.append(el('text', { x: PAGE.w - MARGIN, y, 'text-anchor': 'end', 'font-style': 'italic' }, 'Numbers match the World Map'));
  return g;
}

/** A page: its title band, then `body`, then the key. */
function pageSheet(entry: CatalogEntry, tag: string, body: SVGElement[], w = PAGE.w, ht = PAGE.h): Sheet {
  const svg = el(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${w} ${ht}`, class: 'lm-svg' },
    el('rect', { x: 0, y: 0, width: w, height: ht, fill: '#fffdf7' }),
    el('text', { x: MARGIN, y: 4.2, 'font-family': SERIF, 'font-size': 2.8, 'font-weight': 700, 'letter-spacing': 0.3, fill: '#2b241c' }, 'LEVEL MAPS'),
    el('text', { x: MARGIN + 25, y: 4.2, 'font-family': SERIF, 'font-size': 2, 'font-style': 'italic', fill: '#2b241c' }, entry.title),
    el('text', { x: w - MARGIN, y: 4.2, 'font-family': 'Arial, Helvetica, sans-serif', 'font-size': 1.4, 'text-anchor': 'end', fill: '#555' }, tag),
    el('line', { x1: MARGIN, y1: 5.4, x2: w - MARGIN, y2: 5.4, stroke: '#2b241c', 'stroke-width': 0.2 }),
    ...body,
    keySvg(ht - 2),
  ) as SVGSVGElement;
  return sheet(w / 10, ht / 10, 'lm', svg);
}

/** Does a level fit a page at full size? */
const fits = (l: Level) => l.area.w * FULL <= AREA.w && l.area.h * FULL + CAPTION <= AREA.h;

/** A level's box on a shared page: its caption, the room its labels need, and its map at full size. */
function levelBox(game: Game, l: Level): { w: number; h: number } {
  if (!fits(l)) return { w: Infinity, h: Infinity };
  const room = labelRoom(game, l);
  return { w: l.area.w * FULL, h: l.area.h * FULL + CAPTION + room.above + room.below };
}

/** The scale a big level prints at on a page of its own. */
const fitScale = (l: Level) => Math.min(AREA.w / l.area.w, (AREA.h - CAPTION) / l.area.h);
/** A big level drawn much smaller than full size on its page also prints full size, in parts. */
const tiled = (l: Level) => !fits(l) && fitScale(l) < 0.8;

/** The full-size pages of a big level: its map cut into page-sized parts, named like an atlas. */
function levelTiles(l: Level) {
  return tiles(l.area.w * FULL, l.area.h * FULL, AREA.w, AREA.h - CAPTION, OVERLAP);
}

/** How many pages the maps print on: overviews only, and with the big ones full size too. */
function pageCounts(game: Game, levels: Level[]): { overviews: number; full: number } {
  const placed = packPages(
    levels.map((l) => levelBox(game, l)),
    AREA,
    GAP,
  );
  const overviews = placed.length ? Math.max(...placed.map((p) => p.page)) + 1 : 0;
  const extra = levels.filter(tiled).reduce((n, l) => n + levelTiles(l).length, 0);
  return { overviews, full: overviews + extra };
}

/** Draws a level (once) and gives a URL of its picture, ready to show. */
type Painter = (l: Level) => Promise<string>;

/** A level's picture, a block to 20 pixels: its blocks and monsters, secrets drawn as ground. */
export function levelCanvas(game: Game, files: GameFiles, l: Level): HTMLCanvasElement {
  const pic = scenePixels(files, game.scenes[l.scene], l.area.x, l.area.y, l.area.w, l.area.h, l.cells);
  if (pic && l.unrolled?.runs) blankUnseen(pic, l, files, game);
  const canvas = document.createElement('canvas');
  if (pic) paintIndexed(canvas, pic.pixels, pic.width, pic.height, pic.palette);
  return canvas;
}

function painter(game: Game, files: GameFiles): Painter {
  const done = new Map<Level, Promise<string>>();
  return (l) => {
    let p = done.get(l);
    if (!p) {
      p = new Promise<string>((resolve) => {
        const canvas = levelCanvas(game, files, l);
        canvas.toBlob((b) => {
          const url = b ? URL.createObjectURL(b) : canvas.toDataURL();
          const img = new Image();
          img.src = url;
          void img.decode().then(
            () => resolve(url),
            () => resolve(url),
          );
        });
      });
      done.set(l, p);
    }
    return p;
  };
}

/**
 * A level that winds on past a lap shows only what the player sees there: the rest of its box
 * is the map's padding block (the same blocks come round again where the player does see them).
 */
function blankUnseen(pic: { width: number; pixels: Uint8Array }, l: Level, files: GameFiles, game: Game): void {
  const u = l.unrolled!;
  const filler = fillerBlock(l.cells);
  const at = l.cells.indexOf(filler);
  const pad = at >= 0 ? scenePixels(files, game.scenes[l.scene], at % MLEN, Math.floor(at / MLEN), 1, 1, l.cells) : undefined;
  for (let by = 0; by < l.area.h; by++)
    for (let bx = 0; bx < l.area.w; bx++) {
      if (unrolledShows(u, l.area.x + bx, l.area.y + by)) continue;
      for (let yy = 0; yy < BLEN; yy++)
        for (let xx = 0; xx < BLEN; xx++) pic.pixels[(by * BLEN + yy) * pic.width + bx * BLEN + xx] = pad ? pad.pixels[yy * BLEN + xx] : 0;
    }
}

/** The pages to print. */
async function printSheets(entry: CatalogEntry, game: Game, levels: Level[], paint: Painter, full: boolean): Promise<Sheet[]> {
  const urls = new Map<Level, string>();
  for (const l of levels) urls.set(l, await paint(l));
  const boxes = levels.map((l) => levelBox(game, l));
  const placed = packPages(boxes, AREA, GAP);
  const pages = new Map<number, SVGElement[]>();
  const out: Sheet[] = [];
  const pageCount = placed.length ? Math.max(...placed.map((p) => p.page)) + 1 : 0;
  for (let k = 0; k < pageCount; k++) {
    const body: SVGElement[] = [];
    pages.set(k, body);
    levels.forEach((l, i) => {
      const p = placed[i];
      if (p.page !== k) return;
      const url = urls.get(l)!;
      if (fits(l)) {
        const x = MARGIN + p.x;
        const y = HEAD + p.y;
        body.push(captionSvg(game, l, x, y, Math.max(l.area.w * FULL, 30)), levelSvg(game, l, url, x, y + CAPTION + labelRoom(game, l).above, FULL));
        return;
      }
      // a big level: fitted to the page (its atlas grid over it when it also prints full size)
      const s = fitScale(l);
      const x = MARGIN + (AREA.w - l.area.w * s) / 2;
      const y = HEAD + CAPTION;
      body.push(captionSvg(game, l, MARGIN, HEAD, AREA.w), levelSvg(game, l, url, x, y, s));
      if (full && tiled(l))
        for (const t of levelTiles(l))
          body.push(
            el('rect', {
              x: x + (t.x / FULL) * s,
              y: y + (t.y / FULL) * s,
              width: Math.min(t.w, l.area.w * FULL - t.x) * s,
              height: Math.min(t.h, l.area.h * FULL - t.y) * s,
              fill: 'none',
              stroke: '#1565c0aa',
              'stroke-width': 0.25,
              'stroke-dasharray': '2 1',
            }),
            el(
              'text',
              {
                x: x + (t.x / FULL) * s + 0.8,
                y: y + (t.y / FULL) * s + 2.6,
                'font-size': 2.2,
                'font-weight': 900,
                fill: '#1565c0cc',
                'font-family': 'Arial, Helvetica, sans-serif',
              },
              t.name,
            ),
          );
    });
    out.push(pageSheet(entry, `page ${k + 1}`, body));
    // a big level's full-size pages follow its overview
    if (!full) continue;
    for (const l of levels.filter((x, i) => placed[i].page === k && tiled(x))) {
      const ts = levelTiles(l);
      const cols = Math.max(...ts.map((t) => t.col)) + 1;
      for (const t of ts) {
        const inner = el(
          'svg',
          { x: MARGIN, y: HEAD + CAPTION, width: AREA.w, height: AREA.h - CAPTION, viewBox: `${t.x} ${t.y} ${t.w} ${t.h}`, overflow: 'hidden' },
          levelSvg(game, l, urls.get(l)!, 0, 0, FULL),
        );
        const joins = [
          t.col > 0 ? `${String.fromCharCode(64 + t.col)}${t.row + 1} to the left` : '',
          t.row > 0 ? `${String.fromCharCode(65 + t.col)}${t.row} above` : '',
        ].filter(Boolean);
        out.push(
          pageSheet(entry, `${t.name} · part ${t.row * cols + t.col + 1} of ${ts.length}${joins.length ? ` · tape over ${joins.join(' and ')}` : ''}`, [
            captionSvg(game, l, MARGIN, HEAD, AREA.w * 0.6),
            inner,
          ]),
        );
      }
    }
  }
  return out;
}

/** The Level Maps of a game: printed pages, and the on-screen viewer. Undefined when it gets none. */
export function levelMaps(ctx: PrintContext): { render(): Promise<Sheet[]>; live(): Promise<HTMLElement> } | undefined {
  const secret = listedSecrets(ctx.entry.id);
  if (!secret) return undefined;
  let loaded: Promise<Loaded | undefined> | undefined;
  const load = () =>
    (loaded ??= loadLevels(ctx.entry).then((x) => {
      if (!x) return undefined;
      const seen = levelsOf(x.game, x.files, secret, listedViews(ctx.entry.id), listedUnrolled(ctx.entry.id));
      // every block of the map as it is on the map, not as the player goes through it
      const every = seen.map((l) => ({ ...l, area: l.whole, marks: l.mapMarks ?? l.marks, unrolled: undefined }));
      return { game: x.game, seen, every, paint: painter(x.game, x.files), full: pageCounts(x.game, seen).full <= MOST_PAGES, all: false };
    }));
  return {
    async render() {
      const x = await load();
      return x ? printSheets(ctx.entry, x.game, x.all ? x.every : x.seen, x.paint, x.full) : [];
    },
    async live() {
      const x = await load();
      if (!x?.seen.length) return h('p', { class: 'gmb-loading' }, 'This game has no levels to map.');
      dispatchEvent(new CustomEvent('gm-achievement', { detail: { id: 'print-level-maps' } }));
      return levelViewer(x);
    },
  };
}

/** A game's levels, loaded: cropped to what the player sees and whole, and which to print. */
interface Loaded {
  game: Game;
  seen: Level[];
  every: Level[];
  paint: Painter;
  /** Print big maps full size too. */
  full: boolean;
  /** Print and show every block of each map, not only the part the player sees. */
  all: boolean;
}

/** On screen: a list of the maps, and the one picked in a view to zoom and drag. */
function levelViewer(opts: Loaded): HTMLElement {
  const { game, paint } = opts;
  const levels = () => (opts.all ? opts.every : opts.seen);
  const holder = h('div', { class: 'lm-view' });
  const list = h('ul', { class: 'lm-list', 'aria-label': 'Maps' });
  const stage = h('div', { class: 'lm-stage' });
  const printNote = h('p', { class: 'lm-print' });
  const notePrint = () => {
    const counts = pageCounts(game, levels());
    const fullBox = h('input', {
      type: 'checkbox',
      id: 'lm-full',
      checked: opts.full,
      onchange: (e: Event) => (opts.full = (e.target as HTMLInputElement).checked),
    });
    printNote.replaceChildren(
      `Prints on ${counts.overviews} page${counts.overviews === 1 ? '' : 's'}.`,
      counts.full > counts.overviews ? h('label', { for: 'lm-full' }, fullBox, ` Big maps full size too (${counts.full} pages, to trim and tape)`) : '',
    );
  };
  notePrint();
  // the whole map, for authors: only offered where the crop cut something off
  const cropped = opts.seen.some((l) => l.area.w !== l.whole.w || l.area.h !== l.whole.h);
  const everyNote = cropped
    ? h(
        'p',
        { class: 'lm-print' },
        h(
          'label',
          { for: 'lm-every' },
          h('input', {
            type: 'checkbox',
            id: 'lm-every',
            checked: opts.all,
            onchange: (e: Event) => {
              opts.all = (e.target as HTMLInputElement).checked;
              notePrint();
              void show(Math.max(0, shown));
            },
          }),
          ' Every block of the map, not just what the player sees',
        ),
      )
    : null;
  let shown = -1;
  const show = async (i: number) => {
    shown = i;
    for (const [k, li] of [...list.children].entries()) li.querySelector('button')?.setAttribute('aria-current', String(k === i));
    const l = levels()[i];
    stage.replaceChildren(h('p', { class: 'gmb-loading' }, 'Drawing the map…'));
    const url = await paint(l);
    if (shown !== i || levels()[i] !== l) return;
    const pad = 3;
    const room = labelRoom(game, l);
    const w = l.area.w + pad * 2;
    const ht = l.area.h + pad * 2 + 1 + room.above + room.below;
    const svg = el(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: `0 0 ${w} ${ht}`,
        class: 'lm-svg',
        role: 'img',
        'aria-label': `Map of scene ${sceneList(game, l)}, ${l.name}`,
      },
      el('rect', { x: 0, y: 0, width: w, height: ht, fill: '#fffdf7' }),
      levelSvg(game, l, url, pad, pad + 1 + room.above, 1),
    );
    const map = h('div', { class: 'lm-map' }, svg);
    const pz = panZoom(map, w / 10, `Map of ${l.name}: drag to look around`, 400);
    stage.replaceChildren(
      h('div', { class: 'wm-bar' }, ...pz.buttons, h('span', null, `Scene ${sceneList(game, l)} · ${l.name} · ${l.area.w} × ${l.area.h} blocks`)),
      pz.view,
      h(
        'p',
        { class: 'lm-legend' },
        h('span', { class: 'lm-k lm-k-start' }, '▶ 4'),
        ' where you arrive in scene 4 ',
        h('span', { class: 'lm-k lm-k-exit' }, '→ 7'),
        ' the way to scene 7 ',
        h('span', { class: 'lm-k lm-k-end' }, '⚑'),
        ' the way to the end',
      ),
    );
    requestAnimationFrame(() => pz.setZoom(Math.min(Math.max(pz.view.clientWidth - 24, 300), w * 20)));
  };
  opts.seen.forEach((l, i) =>
    list.append(h('li', null, h('button', { type: 'button', onclick: () => void show(i) }, h('b', null, sceneList(game, l)), ` ${l.name}`))),
  );
  holder.append(h('div', { class: 'lm-side' }, list, printNote, everyNote), stage);
  void show(0);
  return holder;
}
