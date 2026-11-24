// Pack Level Maps onto printed overview and full-size atlas sheets.
import { el, SERIF } from './worldMapArt';
import {
  COLORS,
  MARGIN,
  PAGE,
  levelWidth,
  AREA,
  FULL,
  castHeight,
  CAPTION,
  labelRoom,
  captionWidth,
  OVERLAP,
  GAP,
  type CropOf,
  HEAD,
  captionSvg,
  levelSvg,
  castSvg,
  COURSE_AREA,
  markText,
  FOOT,
} from './levelMapDrawing';
import { type CatalogEntry } from '../../project/files';
import { type Sheet, sheet } from './kit';
import { type Level, mapPrintLayout } from './levelMapLayout';
import { type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { tiles } from './worldMapLayout';
import { type Painter, type CoursePainter } from './levelMaps';
import { yieldNow } from './yieldNow';
import { wholeCourseSize, wholeCourseSvg } from './levelCourseSvg';

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
const fits = (l: Level) => !l.course && levelWidth(l) <= AREA.w && Math.max(l.area.h * FULL, castHeight(l)) + CAPTION <= AREA.h;

/** A level's box on a shared page: its caption, the room its labels need, and its map at full size. */
function levelBox(game: Game, l: Level): { w: number; h: number } {
  if (!fits(l)) return { w: Infinity, h: Infinity };
  const room = labelRoom(game, l);
  return { w: Math.max(levelWidth(l), captionWidth(game, l)), h: CAPTION + Math.max(l.area.h * FULL + room.above + room.below, castHeight(l)) };
}

/** The scale a big level prints at on a page of its own. */
const fitScale = (l: Level) => Math.min(AREA.w / l.area.w, (AREA.h - CAPTION) / l.area.h);

/** A big level drawn much smaller than full size on its page also prints full size, in parts. */
const tiled = (l: Level) => !l.course && !fits(l) && fitScale(l) < 0.8;

/** The full-size pages of a big level: its map cut into page-sized parts, named like an atlas. */
function levelTiles(l: Level) {
  return tiles(l.area.w * FULL, l.area.h * FULL, AREA.w, AREA.h - CAPTION, OVERLAP);
}

/** How many pages the maps print on: overviews only, and with the big ones full size too. */
export function pageCounts(id: string, game: Game, levels: Level[]): { overviews: number; full: number } {
  const { placed } = mapPrintLayout(
    id,
    levels.map((l) => levelBox(game, l)),
    AREA,
    GAP,
  );
  const overviews = placed.length ? Math.max(...placed.map((p) => p.page)) + 1 : 0;
  const extra = levels.reduce((n, l) => n + (l.course ? courseTiles(l).length : tiled(l) ? levelTiles(l).length : 0), 0);
  return { overviews, full: overviews + extra };
}

/** The pages to print. */
export async function printSheets(
  entry: CatalogEntry,
  game: Game,
  levels: Level[],
  paint: Painter,
  paintCourse: CoursePainter,
  crop: CropOf,
  full: boolean,
  firstOnly = false,
): Promise<Sheet[]> {
  const urls = new Map<Level, string>();
  const boxes = levels.map((l) => levelBox(game, l));
  const { placed, scale } = mapPrintLayout(entry.id, boxes, AREA, GAP);
  // a first-sheet picture paints only the levels on page 0
  for (const [i, l] of levels.entries())
    if (!l.course && (!firstOnly || placed[i].page === 0)) {
      urls.set(l, await paint(l));
      await yieldNow(); // a level at a time, so a key pressed meanwhile is not kept waiting for them all
    }
  const pages = new Map<number, SVGElement[]>();
  const out: Sheet[] = [];
  const pageCount = firstOnly ? Math.min(1, placed.length) : placed.length ? Math.max(...placed.map((p) => p.page)) + 1 : 0;
  let sheetNo = 0;
  for (let k = 0; k < pageCount; k++) {
    const course = levels.find((l, i) => placed[i].page === k && l.course);
    if (course) {
      out.push(...(await courseSheets(entry, game, course, paintCourse, () => ++sheetNo, full)));
      continue;
    }
    const body: SVGElement[] = [];
    pages.set(k, body);
    for (const [i, l] of levels.entries()) {
      const p = placed[i];
      if (p.page !== k) continue;
      const url = urls.get(l)!;
      if (fits(l)) {
        const left = MARGIN + p.x;
        const top = HEAD + p.y;
        const x = scale === 1 ? left : 0;
        const y = scale === 1 ? top : 0;
        const artwork = [
          captionSvg(game, l, x, y, Math.max(levelWidth(l), captionWidth(game, l))),
          levelSvg(game, l, url, x, y + CAPTION + labelRoom(game, l).above, FULL),
        ];
        if (l.cast) artwork.push(await castSvg(game, l, x + l.area.w * FULL + GAP, y + CAPTION, paint, crop));
        if (scale === 1) body.push(...artwork);
        else body.push(el('g', { transform: `translate(${left} ${top}) scale(${scale})` }, ...artwork));
        continue;
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
    }
    out.push(pageSheet(entry, `page ${++sheetNo}`, body));
    // a big level's full-size pages follow its overview
    if (!full || firstOnly) continue;
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

/** What a course's caption adds: how to read its strip (one that runs down the page reads from the top). */
export const courseNote = (c: { down: boolean }) =>
  c.down
    ? ' · the way as you ride it, unrolled through the wrap: start at the top and go down'
    : ' · the way as you fly it, unrolled through the wrap: start at the foot and go up';

/** Atlas sheets use one coordinate system, so adjacent pages can be taped into a giant map. */
function courseTiles(l: Level) {
  const size = wholeCourseSize({ ...l.course!, scale: FULL });
  return Math.min(COURSE_AREA.w / size.w, COURSE_AREA.h / size.h) < 0.8 ? tiles(size.w, size.h, COURSE_AREA.w, COURSE_AREA.h, OVERLAP) : [];
}

/** One continuous overview, optionally followed by full-size atlas pages. */
async function courseSheets(entry: CatalogEntry, game: Game, l: Level, paint: CoursePainter, next: () => number, full: boolean): Promise<Sheet[]> {
  const c = { ...l.course!, scale: FULL };
  const level = { ...l, course: c };
  const urls = await paint(l);
  const size = wholeCourseSize(c);
  const ts = full ? courseTiles(l) : [];
  const art = () => wholeCourseSvg(game, level, urls, 0, 0, COLORS, (m) => markText(game, m));
  const picture = (viewBox: string, ...body: SVGElement[]) =>
    el(
      'svg',
      {
        x: MARGIN,
        y: HEAD + CAPTION,
        width: COURSE_AREA.w,
        height: COURSE_AREA.h,
        viewBox,
        overflow: 'hidden',
      },
      ...body,
    );
  const overview = picture(`0 0 ${size.w} ${size.h}`, art());
  for (const t of ts)
    overview.append(
      el('rect', {
        x: t.x,
        y: t.y,
        width: Math.min(t.w, size.w - t.x),
        height: Math.min(t.h, size.h - t.y),
        fill: 'none',
        stroke: '#1565c0',
        'stroke-width': 0.25,
        'stroke-dasharray': '2 1',
      }),
      el('text', { x: t.x + 0.8, y: t.y + 2.6, 'font-size': 2.2, 'font-weight': 900, fill: '#1565c0' }, t.name),
    );
  const out = [
    pageSheet(entry, `page ${next()} · ${l.name}, whole course`, [
      captionSvg(game, { ...l, note: `${courseNote(c).slice(3)}${l.note ? ` · ${l.note}` : ''}` }, MARGIN, HEAD, AREA.w),
      overview,
      el(
        'text',
        { x: MARGIN, y: PAGE.h - FOOT + 1, 'font-family': 'Arial, Helvetica, sans-serif', 'font-size': 1.2, fill: COLORS.join },
        `Dashed purple: map wrap.${ts.length ? ' Blue grid: full-size sheets to trim and tape together.' : ''}`,
      ),
    ]),
  ];
  for (const t of ts) {
    const joins = [
      t.col > 0 ? `${String.fromCharCode(64 + t.col)}${t.row + 1} to the left` : '',
      t.row > 0 ? `${String.fromCharCode(65 + t.col)}${t.row} above` : '',
    ].filter(Boolean);
    out.push(
      pageSheet(entry, `page ${next()} · ${t.name}${joins.length ? ` · tape over ${joins.join(' and ')}` : ''}`, [
        captionSvg(game, l, MARGIN, HEAD, AREA.w),
        picture(`${t.x} ${t.y} ${t.w} ${t.h}`, art()),
      ]),
    );
  }
  return out;
}
