// Show Level Maps in the zoomable page viewer or the scrolling column.
import { type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { type Level } from './levelMapLayout';
import { type Painter, type CoursePainter } from './levelMaps';
import { type CropOf, labelRoom, levelWidth, castHeight, sceneList, sceneWord, COLORS, markText, castSvg, GAP, levelSvg } from './levelMapDrawing';
import { type ReaderOptions, type Reader, type ReadView } from '../readView';
import { type ReadSize, widthAt, percentOf } from '../readSize';
import { h } from '../../editor/core/ui';
import { pageCounts, courseNote } from './levelMapPages';
import { wholeCourseSize, wholeCourseSvg } from './levelCourseSvg';
import { el } from './worldMapArt';
import { panZoom } from './panZoom';
import { type ScrollPages, scrollPages } from '../scrollPages';

/** A game's levels, loaded: cropped to what the player sees and whole, and which to print. */
export interface Loaded {
  game: Game;
  seen: Level[];
  every: Level[];
  paint: Painter;
  paintCourse: CoursePainter;
  crop: CropOf;
  /** Print big maps full size too. */
  full: boolean;
  /** Print and show every block of each map, not only the part the player sees. */
  all: boolean;
}

/** On screen: the maps listed beside the one picked, in a view to zoom and drag (Pages); or every map in one column (Scroll, readView.ts). */
export function levelViewer(id: string, opts: Loaded, o: ReaderOptions): Reader {
  const { game, paint, crop } = opts;
  const { root } = o;
  let view = o.view;
  let size: ReadSize = o.size;
  const levels = () => (opts.all ? opts.every : opts.seen);
  const holder = h('div', { class: 'lm-view' });
  const list = h('ul', { class: 'lm-list', 'aria-label': 'Maps' });
  const stage = h('div', { class: 'lm-stage' });
  const printNote = h('p', { class: 'lm-print' });
  const notePrint = () => {
    const counts = pageCounts(id, game, levels());
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
              dropColumn();
              show(Math.max(0, shown));
            },
          }),
          ' Every block of the map, not just what the player sees',
        ),
      )
    : null;
  const pad = 3;
  /** A map's size on screen, keeping a wrapped course connected in one coordinate system. */
  const sizeOf = (l: Level) => {
    if (l.course) {
      const c = l.course;
      const size = wholeCourseSize(c);
      return { w: size.w + pad * 2, ht: size.h + pad * 2 };
    }
    const room = labelRoom(game, l);
    return { w: levelWidth(l) + pad * 2, ht: Math.max(l.area.h + room.above + room.below, castHeight(l)) + pad * 2 + 1, room };
  };
  const caption = (l: Level) =>
    l.course
      ? `Scene ${sceneList(game, l)} · ${l.name}${courseNote(l.course)}`
      : `${sceneWord(l)} ${sceneList(game, l)} · ${l.name}${l.note ? ` · ${l.note}` : ''} · ${l.area.w} × ${l.area.h} blocks`;
  /** The map's drawing, or undefined once another is wanted. */
  const drawMap = async (l: Level, still: () => boolean): Promise<SVGElement | undefined> => {
    const { w, ht, room } = sizeOf(l);
    const svg = (label: string, ...art: SVGElement[]) =>
      el(
        'svg',
        { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${w} ${ht}`, class: 'lm-svg', role: 'img', 'aria-label': label },
        el('rect', { x: 0, y: 0, width: w, height: ht, fill: '#fffdf7' }),
        ...art,
      );
    if (l.course) {
      const urls = await opts.paintCourse(l);
      if (!still()) return undefined;
      return svg(
        `Map of scene ${sceneList(game, l)}, ${l.name}, as you ${l.course.down ? 'ride' : 'fly'} it`,
        wholeCourseSvg(game, l, urls, pad, pad, COLORS, (m) => markText(game, m)),
      );
    }
    const url = await paint(l);
    if (!still()) return undefined;
    const cast = l.cast && (await castSvg(game, l, pad + l.area.w + GAP, pad + 1, paint, crop));
    if (!still()) return undefined;
    return svg(`Map of scene ${sceneList(game, l)}, ${l.name}`, levelSvg(game, l, url, pad, pad + 1 + room!.above, 1), ...(cast ? [cast] : []));
  };
  const legend = (course: boolean) =>
    h(
      'p',
      { class: 'lm-legend' },
      h('span', { class: 'lm-k lm-k-start' }, '▶ 4'),
      ' where you arrive in scene 4 ',
      h('span', { class: 'lm-k lm-k-exit' }, '→ 7'),
      course ? ' the way to scene 7 · dashed lines are the edges of the map, where the way runs on round it' : ' the way to scene 7 ',
      ...(course ? [] : [h('span', { class: 'lm-k lm-k-end' }, '⚑'), ' the way to the end']),
    );

  // ---- Pages: the map picked, to zoom and drag
  let shown = -1;
  const mark = (i: number) => {
    shown = i;
    for (const [k, li] of [...list.children].entries()) li.querySelector('button')?.setAttribute('aria-current', String(k === i));
  };
  const showOne = async (i: number) => {
    mark(i);
    const l = levels()[i];
    stage.replaceChildren(h('p', { class: 'gmb-loading' }, 'Drawing the map…'));
    const svg = await drawMap(l, () => shown === i && levels()[i] === l && view === 'pages');
    if (!svg) return;
    const { w } = sizeOf(l);
    const pz = panZoom(h('div', { class: 'lm-map' }, svg), w / 10, `Map of ${l.name}: drag to look around`, 400);
    stage.replaceChildren(h('div', { class: 'wm-bar' }, ...pz.buttons, h('span', null, caption(l))), pz.view, legend(!!l.course));
    requestAnimationFrame(() => pz.setZoom(Math.min(Math.max(pz.view.clientWidth - 24, 300), w * 20)));
  };

  // ---- Scroll: every map in one column, drawn as it nears the view
  let column: ScrollPages | undefined;
  const dropColumn = () => {
    column?.dispose();
    column = undefined;
  };
  const showAll = (i: number) => {
    if (!column) {
      const all = levels();
      column = scrollPages({
        root,
        count: all.length,
        ratio: (k) => {
          const { w, ht } = sizeOf(all[k]);
          return ht / w;
        },
        width: widthOf,
        page: (k) => {
          const { w, ht } = sizeOf(all[k]);
          const map = h('div', { class: 'lm-map', style: `aspect-ratio: ${w} / ${ht}` });
          void drawMap(all[k], () => !!column).then((svg) => svg && map.replaceChildren(svg));
          return map;
        },
        label: (k) => caption(all[k]),
        showing: (k) => (mark(k), told(k)),
      });
      stage.replaceChildren(legend(all.some((l) => !!l.course)), column.el);
      column.resize();
    }
    column.scrollTo(i);
    mark(i);
    told(i);
  };
  // a map's width at the size chosen: 100% is its printed size, a tenth of an inch a block
  const natural = (k: number) => (sizeOf(levels()[k]).w / 10) * 96;
  const widthOf = (k: number) => {
    const { w, ht } = sizeOf(levels()[k]);
    return widthAt(size, { viewW: stage.clientWidth, viewH: root.clientHeight - 90, natural: natural(k), ratio: ht / w });
  };
  const told = (k: number) => o.shown(percentOf(widthOf(k), natural(k)));
  const refit = () => {
    if (!column) return;
    column.resize();
    told(Math.max(0, column.current));
  };
  addEventListener('resize', refit);
  const show = (i: number) => (view === 'scroll' ? showAll(i) : (dropColumn(), void showOne(i)));

  opts.seen.forEach((l, i) =>
    list.append(h('li', null, h('button', { type: 'button', onclick: () => show(i) }, h('b', null, sceneList(game, l)), ` ${l.name}`))),
  );
  holder.append(h('div', { class: 'lm-side' }, list, printNote, everyNote), stage);
  const setView = (v: ReadView) => {
    view = v;
    holder.classList.toggle('scrolled', v === 'scroll');
    if (v === 'pages') root.scrollTop = 0;
    show(Math.max(0, shown));
  };
  setView(view);
  return {
    el: holder,
    view: (v) => v !== view && setView(v),
    size: (s) => {
      size = s;
      refit();
    },
    step: (dir) => show(Math.max(0, Math.min(levels().length - 1, shown + dir))),
    dispose: () => {
      dropColumn();
      removeEventListener('resize', refit);
    },
  };
}
