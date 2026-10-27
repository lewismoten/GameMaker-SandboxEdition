// The monster path editor: draw a monster's path (or attack path) with the mouse right on a
// map of a scene that uses the monster set, pick the picture (orientation) and speed for each
// stretch, and watch the monster walk it exactly as playgame moves it.
//
// One editor per call, its state in a PathEd (monsterPathState.ts). This file holds the view
// (zoom and fit), the maps, the DOM and the drawing (run by requestAnimationFrame at the game's
// 18.2 Hz tick; the map, path arrows and walking monster are drawn by monsterPathDraw.ts). The
// pointer and keys are monsterPathInput.ts; a corner's picture and speed, monsterPathCorner.ts;
// the tabs and toolbar, monsterPathToolbar.ts; the notice and side list, monsterPathSide.ts; the
// numbers table, monsterPathNumbers.ts. The path math and the walker are in monsterPath.ts;
// measurements and map choices in monsterPathView.ts.
import './monsterPath.css';
import { h } from '../../core/ui';
import { blockImages } from '../../core/draw';
import { BACKBL, parseBlocks } from '../../../formats/blocks';
import { MLEN, MWID, parseMap } from '../../../formats/map';
import { parsePalette } from '../../../formats/palette';
import { corners, firstCorner, pathBox, pathLength, PathWalker } from './monsterPath';
import { TICK_MS, mapChoices, type PathEditorOptions } from './monsterPathView';
import { drawPathScene, mapLayerCanvas } from './monsterPathDraw';
import { renderPathNumbers } from './monsterPathNumbers';
import { kind, mon, path, placed, type PathEd } from './monsterPathState';
import { firstPic, hidePop, sprite } from './monsterPathCorner';
import { pathInput } from './monsterPathInput';
import { renderTabs, renderToolbar } from './monsterPathToolbar';
import { renderNotice, renderSide } from './monsterPathSide';

export function monsterPathEditor(o: PathEditorOptions): { el: HTMLElement; refresh: () => void; destroy: () => void } {
  const { project } = o;
  let startMon = -1; // monster index start was chosen for
  let raf = 0;
  let last = 0;
  let acc = 0;
  let ants = 0;
  let antsAt = 0;

  const box = () => pathBox(kind(ed));

  /** Zooms so the whole path (and the origin) fits with a little room around it. */
  function fitView(width?: number, center?: { x: number; y: number }): void {
    const b = box();
    const aspect = b.w / b.h;
    const pts = [{ x: 0, y: 0 }, ...corners(path(ed), kind(ed))];
    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    let w = width ?? Math.max(maxX - minX + 7, (maxY - minY + 7) * aspect, kind(ed) === 'normal' ? 13 : 19);
    w = Math.max(8, Math.min(b.w, Math.round(w)));
    const hgt = Math.min(b.h, Math.max(5, Math.round(w / aspect)));
    const c = center ?? { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    const x0 = Math.max(b.x0, Math.min(b.x0 + b.w - w, Math.round(c.x - w / 2 + 0.5)));
    const y0 = Math.max(b.y0, Math.min(b.y0 + b.h - hgt, Math.round(c.y - hgt / 2 + 0.5)));
    ed.viewRect = { x0, y0, w, h: hgt };
    ed.mapLayer = undefined;
    ed.dirty = true;
  }
  function zoom(f: number): void {
    const v = ed.viewRect;
    fitView(v.w * f, { x: v.x0 + v.w / 2 - 0.5, y: v.y0 + v.h / 2 - 0.5 });
    hidePop(ed);
  }

  // ---- Maps: the scenes that use this monster set (mapChoices, in monsterPathView.ts) ------
  function loadMap(): void {
    const c = ed.choices[ed.mapIdx] ?? ed.choices[0];
    ed.map = c.map && project.files.has(c.map) ? parseMap(project.files.get(c.map)!) : undefined;
    ed.bg = c.bbl && project.files.has(c.bbl) ? parseBlocks(project.files.get(c.bbl)!, BACKBL) : [];
    const bgPal = c.pal && project.files.has(c.pal) ? parsePalette(project.files.get(c.pal)!) : undefined;
    ed.mapImgs = ed.bg.length ? blockImages(ed.bg, bgPal ?? o.palette()) : [];
    startMon = -1;
  }

  /** Where this monster sits on the map (first placed copy), else the middle of the map. */
  function defaultStart(): void {
    if (startMon === o.index()) return;
    startMon = o.index();
    ed.start = placed(ed)[0] ?? { x: 50, y: 50 };
  }

  const solidAt = (x: number, y: number) => {
    const { map, bg } = ed;
    if (!map || !bg.length) return 0;
    const v = map.blocks[(((y % MWID) + MWID) % MWID) * MLEN + (((x % MLEN) + MLEN) % MLEN)];
    return bg[v]?.solid ?? 0;
  };

  function restartWalker(): void {
    ed.walker = new PathWalker(mon(ed), ed.tab, ed.start, ed.start, solidAt);
    acc = 0;
    ed.dirty = true;
  }

  // ---- DOM ------------------------------------------------------------------------------
  const canvas = h('canvas', {
    class: 'pixel mpath-canvas',
    tabindex: 0,
    'aria-label': 'Path drawing area: click a block to add a corner, drag corners to move them',
  });
  const ctx = canvas.getContext('2d')!;
  const pop = h('div', { class: 'mpath-pop', hidden: true });
  // zoom floats over the map's corner, like a map's, so the toolbar keeps to one row
  const zoomBar = h(
    'div',
    { class: 'mpath-zoom', role: 'group', 'aria-label': 'Zoom' },
    h('button', { onclick: () => zoom(1.5), title: 'Zoom out', 'aria-label': 'Zoom out' }, '−'),
    h('button', { onclick: () => fitView(), title: 'Fit the path' }, 'Fit'),
    h('button', { onclick: () => zoom(1 / 1.5), title: 'Zoom in', 'aria-label': 'Zoom in' }, '+'),
  );
  const stage = h('div', { class: 'mpath-stage' }, canvas, zoomBar, pop);
  const readout = h('div', { class: 'mpath-readout' });
  const tabsEl = h('div', { class: 'mpath-tabs', role: 'tablist' });
  const toolbar = h('div', { class: 'mpath-toolbar' });
  const notice = h('div', { class: 'mpath-notice' });
  const side = h('div', { class: 'mpath-side-list' });
  const numbers = h('details', { class: 'mpath-numbers' });
  // beside the map: the notice, the corners and their numbers (on a wide window this column
  // is as tall as the map and scrolls by itself, so the panel fits the window)
  const el = h(
    'section',
    { class: 'panel mpath' },
    tabsEl,
    toolbar,
    h('div', { class: 'mpath-body' }, h('div', { class: 'mpath-left' }, stage, readout), h('div', { class: 'mpath-side' }, notice, side, numbers)),
  );

  const ed: PathEd = {
    o,
    tab: 0,
    selected: -1,
    playing: true,
    mapIdx: 0,
    choices: mapChoices(project, o.monFile),
    bg: [],
    mapImgs: [],
    start: { x: 50, y: 50 },
    spriteCache: new Map(),
    dirty: true,
    viewRect: { x0: -7, y0: -7, w: 15, h: 15 },
    canvas,
    pop,
    readout,
    tabsEl,
    toolbar,
    notice,
    side,
    changed,
    restartWalker,
    renderAll,
    renderSide: () => renderSide(ed),
    renderNumbers,
    fitView,
    loadMap,
    defaultStart,
  };

  // ---- Drawing (monsterPathDraw.ts) --------------------------------------------------------
  function draw(): void {
    ed.mapLayer ??= mapLayerCanvas(ed.viewRect, ed.map, ed.mapImgs, ed.start);
    const { walker } = ed;
    const disabled = ed.tab === 1 && mon(ed).activate === 0;
    if (!disabled) ants = (ants + 1) % 16;
    drawPathScene(ctx, {
      view: ed.viewRect,
      mapLayer: ed.mapLayer,
      kind: kind(ed),
      disabled,
      corners: corners(path(ed), kind(ed)),
      selected: ed.selected,
      ants,
      hover: ed.hover,
      walker,
      start: ed.start,
      firstPic: firstPic(ed),
      walkerPic: walker ? (mon(ed).pic[Math.max(0, walker.frame)]?.[0] ?? -1) : -1,
      sprite: (pic, orient) => sprite(ed, pic, orient),
    });
  }

  function loop(t: number): void {
    raf = requestAnimationFrame(loop);
    if (!last) last = t;
    const dt = Math.min(250, t - last);
    last = t;
    const { walker, start } = ed;
    if (ed.playing && walker && pathLength(path(ed)) > firstCorner(kind(ed))) {
      acc += dt;
      while (acc >= TICK_MS) {
        acc -= TICK_MS;
        walker.tick();
        ed.dirty = true;
      }
      const b = box();
      const far = Math.abs(walker.bx - start.x) > b.w || Math.abs(walker.by - start.y) > b.h;
      if (walker.laps >= 4 || far) restartWalker();
    }
    if (ed.selected >= 0 && t - antsAt > 120) {
      antsAt = t;
      ed.dirty = true;
    }
    if (ed.dirty) {
      ed.dirty = false;
      draw();
    }
  }

  // ---- Editing (monsterPathInput.ts) -------------------------------------------------------
  function changed(restart = true): void {
    o.onEdit();
    if (restart) restartWalker();
    renderTabs(ed);
    renderSide(ed);
    renderNumbers();
    ed.dirty = true;
  }
  pathInput(ed);

  // ---- Panels -----------------------------------------------------------------------------
  function renderNumbers(): void {
    renderPathNumbers(numbers, path(ed), kind(ed), changed, draw);
  }

  function renderAll(): void {
    renderTabs(ed);
    renderToolbar(ed);
    renderNotice(ed);
    renderSide(ed);
    renderNumbers();
    restartWalker();
  }

  let lastIndex = -1;
  function refresh(): void {
    ed.spriteCache = new Map();
    ed.choices = mapChoices(project, o.monFile);
    if (ed.mapIdx >= ed.choices.length) ed.mapIdx = 0;
    if (!ed.map && ed.choices[ed.mapIdx]?.map) loadMap();
    defaultStart();
    if (lastIndex !== o.index()) {
      lastIndex = o.index();
      if (ed.tab === 1 && pathLength(mon(ed).march[1]) === 0 && mon(ed).activate === 0) ed.tab = 0;
      ed.selected = corners(path(ed), kind(ed))[0]?.i ?? -1;
      hidePop(ed);
      fitView();
    }
    ed.mapLayer = undefined;
    renderAll();
  }

  loadMap();
  refresh();
  raf = requestAnimationFrame(loop);
  return { el, refresh, destroy: () => cancelAnimationFrame(raf) };
}
