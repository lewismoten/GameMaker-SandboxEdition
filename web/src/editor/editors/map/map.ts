// Map editor (MAPMAKER.EXE): paint background blocks onto the 100x100 map and place monsters.
import { BACKBL, BLEN, MONBL, newBlockSet, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { LASTMM, MLEN, MWID, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTMON, parseMonsters, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { normalize } from '../../../project/files';
import { viewState } from '../../../urlState';
import { blockImages } from '../../core/draw';
import { History } from '../../core/history';
import type { FileKind, Project } from '../../core/project';
import { clear, debounce, h, toast } from '../../core/ui';
import { assetMenu, type AssetAction } from '../../shell/assetMenu';
import { fileField, pickFile } from '../../widgets/filePicker';
import { paletteChooser } from '../../widgets/paletteChooser';
import { panelTabs } from '../../widgets/panelTabs';
import { rovingGrid } from '../../widgets/rovingGrid';
import { takeNewestMonster } from '../monsters/newestMonster';
import { simulate } from '../palette/colorVision';
import { registerEditor } from '../registry';
import type { checkPanel } from './check/checkPanel';
import { linkMarkers } from './links/linkMarkers';
import './mapExport.css';
import { mapKeyboard } from './mapKeyboard';
import { createMapPainting } from './mapPainting';
import { createMapPickers } from './mapPickers';
import { createMapPicture } from './mapPicture';
import { createMapPlacement } from './mapPlacement';
import { bindMapPointer } from './mapPointer';
import { drawTile } from './mapTile';
import { mapToolbar } from './mapToolbar';
import { TOOLS, isTool, nowTool, type Mode } from './mapToolModes';
import { createMapTooltip } from './mapTooltip';
import { touchGestures } from './mapTouchGestures';
import { mapViewMemory } from './mapViewMemory';
import { mapViewport } from './mapViewport';
import { lastZoom, recallView } from './mapViews';
import { wrapFor } from './mapWrapPref';
import { clampZoom, pictureScale, zoomFromUrl, zoomToUrl } from './mapZoom';
import { createMapZoomControls } from './mapZoomControls';
import { roleFilter } from './roleFilter';
import { blockMarksControls } from './tools/blockMarksControls';
import { blockMarksLayer } from './tools/blockMarksDraw';
import { findBlock } from './tools/cellOps';
import './tools/mapTools.css';
import { drawOverlay, type OverlayState } from './tools/overlay';
import { MapTools } from './tools/toolController';

/** A remembered on/off choice (the grid); off when storage is unavailable. */
function readPref(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writePref(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    /* remembered for this visit only */
  }
}

/** The block set, monsters and monster blocks of the scene that uses this map. */
function sceneSet(project: Project, file: string): { bbl?: string; mon?: string; mbl?: string; chr?: string; cbl?: string; scenes: number[] } {
  const game = project.game();
  const scenes = project
    .usesOf(file)
    .filter((u) => u.slot === 1)
    .map((u) => u.scene);
  const s = game.scenes[scenes[0]];
  return {
    bbl: s?.files[2] || project.files.byExtension('bbl')[0],
    mon: s?.files[3] || project.files.byExtension('mon')[0],
    mbl: s?.files[4] || project.files.byExtension('mbl')[0],
    chr: s?.files[5] || project.files.byExtension('chr')[0],
    cbl: s?.files[6] || project.files.byExtension('cbl')[0],
    scenes,
  };
}

registerEditor(['map'], (host, project, file) => {
  const map = parseMap(project.files.get(file)!);
  const set = sceneSet(project, file);
  let bblName = set.bbl ?? '';
  let mblName = set.mbl ?? '';
  let monName = set.mon ?? '';
  const loadBlocks = (n: string, kind: 'bbl' | 'mbl') =>
    n && project.files.has(n) ? parseBlocks(project.files.get(n)!, kind === 'bbl' ? BACKBL : MONBL) : newBlockSet(kind);
  let bg = loadBlocks(bblName, 'bbl');
  let mblk = loadBlocks(mblName, 'mbl');
  let mons: Monster[] = monName && project.files.has(monName) ? parseMonsters(project.files.get(monName)!) : [];
  let mode: Mode = 'paint';
  let brush = 0;
  let monBrush = 0;
  // the address keeps where the map is scrolled to (the block at the middle) and the zoom
  // (…/PLANET1.MAP?x=40&y=12&zoom=2)
  const view = viewState(['p', project.id, file]);
  // An address with a spot (a shared link, Back, a reload) wins; else the view this map was left at;
  // else the zoom of the map looked at last.
  const urlSpot = view.num('x') !== undefined && view.num('y') !== undefined;
  const urlZoom = zoomFromUrl(view.get('zoom'));
  const lastView = recallView(project.id, file);
  // the address keeps whole blocks, the saved view keeps the exact spot: the same place, so use the exact one
  const saved =
    lastView && (!urlSpot || (Math.abs(lastView.x - view.num('x')!) < 1 && Math.abs(lastView.y - view.num('y')!) < 1 && Math.abs(lastView.z - urlZoom) < 0.002))
      ? lastView
      : undefined;
  let zoom = saved ? clampZoom(saved.z) : urlSpot || view.get('zoom') ? urlZoom : clampZoom(lastZoom());
  /** The scale the map picture and its layers are drawn at (a power of two); the browser scales it to `zoom`. */
  let drawnScale = pictureScale(zoom);
  const scale = () => drawnScale;
  let redrawTimer: ReturnType<typeof setTimeout> | undefined;
  let bgImgs: HTMLCanvasElement[] = [];
  const overlay: OverlayState = { grid: readPref('gm-map-grid'), found: [] };
  let finding = false;
  // Wrap is remembered for this map in the companion (a town stays flat when the world map wraps); a map never toggled follows the last choice made anywhere.
  let wrapping = wrapFor(project, file, readPref('gm-map-wrap'));
  overlay.wrap = wrapping;

  let monImgs: HTMLCanvasElement[] = [];
  // the Level check's "Gray level": the map on screen in the palette's lightness only, so the
  // heat map's colors stand out (made when first asked for; exports always draw in color)
  let gray: { bg: HTMLCanvasElement[]; mon: HTMLCanvasElement[] } | undefined;
  let drawnGray = false;
  const onScreen = () => {
    if (!overlay.gray) return { bg: bgImgs, mon: monImgs };
    if (!gray) {
      const pal = simulate(chooser.palette, 'gray');
      gray = { bg: blockImages(bg, pal), mon: blockImages(mblk, pal, true) };
    }
    return gray;
  };
  const save = debounce(() => project.files.set(file, serializeMap(map)), 300);
  // undo: a snapshot of the whole map (about 22 KB) before each stroke, fill or monster change,
  // and with it the .gam's bytes before a link marker's change (links/linkMarkers.ts)
  const history = new History<{ map: Uint8Array; gam?: Uint8Array }>();
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶', h('span', { class: 'mt-hist-text' }, ' Undo'));
  const redoBtn = h('button', { title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷', h('span', { class: 'mt-hist-text' }, ' Redo'));
  const syncHistory = () => {
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };
  let remembered = 0;
  const remember = () => {
    remembered++;
    history.record({ map: serializeMap(map) });
    syncHistory();
  };
  const rememberLinks = () => {
    remembered++;
    history.record({ map: serializeMap(map), gam: project.files.get(project.gam) });
    syncHistory();
  };
  function step(back: boolean): void {
    const now: { map: Uint8Array; gam?: Uint8Array } = { map: serializeMap(map), gam: project.files.get(project.gam) };
    const to = back ? history.undo(now) : history.redo(now);
    if (!to) return;
    // the step kept for redo holds the .gam only when this one changed it
    if (!to.gam) delete now.gam;
    Object.assign(map, parseMap(to.map));
    if (to.gam) project.files.set(project.gam, to.gam);
    syncHistory();
    draw();
    save();
  }

  const chooser = paletteChooser(project, set.bbl ?? file, () => rebuild());

  const canvas = h('canvas', { class: 'pixel', style: 'cursor:crosshair;display:block' });
  const over = h('canvas', { class: 'pixel mt-overlay', 'aria-hidden': 'true' });
  const marksCanvas = h('canvas', { class: 'pixel mt-overlay', 'aria-hidden': 'true' });
  const scroller = h(
    'div',
    {
      tabindex: 0,
      role: 'region',
      'aria-label': 'The map (scroll with the arrow keys)',
      style:
        'overflow:auto;max-height:max(280px, var(--map-room, calc(100dvh - 320px)));max-width:100%;border:1px solid var(--border);border-radius:6px;background:#000;touch-action:none',
    },
    h('div', { class: 'mt-stack' }, canvas, over),
  );
  const viewport = mapViewport({
    scroller,
    stack: canvas.parentElement!,
    canvas,
    overlay: over,
    layers: [marksCanvas],
    block: () => BLEN * zoom,
    smooth: () => zoom < 1,
    moved: () => {
      markers.render();
      if (viewport.wrapped && marks.any()) (marks.redraw(), viewport.render());
    },
  });
  // what blocks do (barriers, push and pull, touch, pickup, timed): drawn for the cells in view
  const marks = blockMarksLayer({
    canvas: marksCanvas,
    block: () => BLEN * scale(),
    cells: () => map.blocks,
    blocks: () => bg,
    // the marks are drawn at the picture's scale, the view is in screen pixels
    view: () => {
      const v = viewport.view(),
        k = scale() / zoom;
      return { x: v.x * k, y: v.y * k, w: v.w * k, h: v.h * k };
    },
    frame: () => viewport.wrapped && viewport.render(),
  });
  let marksPending = 0;
  scroller.addEventListener(
    'scroll',
    () => {
      if (viewport.wrapped || !marks.any() || marksPending) return;
      marksPending = requestAnimationFrame(() => ((marksPending = 0), marks.redraw()));
    },
    { passive: true },
  );
  const marksUi = blockMarksControls(marks);
  const ctx = viewport.picture.getContext('2d')!;
  const redrawOverlay = () => {
    overlay.found = finding ? findBlock(map.blocks, brush) : [];
    drawOverlay(over, scale(), overlay, bgImgs);
    marks.refresh();
    viewport.render();
  };
  const status = h('div', { class: 'meta' });
  const picker = rovingGrid(
    h('div', {
      class: 'block-picker',
    }),
    'Blocks to paint with',
  );
  const filter = roleFilter({ project, file: () => bblName, count: () => bg.length, onChange: () => renderPicker() });
  const monPicker = rovingGrid(
    h('div', {
      class: 'block-picker',
    }),
    'Monsters to place',
  );
  const monCount = h('div', { class: 'meta' });

  // Links touching this map: where the character starts (to) and where scenes change (from).
  function linkMarks(): { x: number; y: number; kind: 'from' | 'to'; label: string }[] {
    const game = project.game();
    const marks: { x: number; y: number; kind: 'from' | 'to'; label: string }[] = [];
    const sceneIdx = new Set(set.scenes);
    game.scenes.forEach((s, i) =>
      s.links.forEach((l) => {
        if (l.toScene === 0xffff) return;
        if (sceneIdx.has(i))
          marks.push({ ...l.from, kind: 'from', label: `to ${game.scenes[l.toScene] ? fromCp437(game.scenes[l.toScene].desc) : l.toScene}` });
        if (sceneIdx.has(l.toScene)) marks.push({ ...l.to, kind: 'to', label: `start from ${fromCp437(s.desc)}` });
      }),
    );
    return marks;
  }

  function rebuild(): void {
    bgImgs = blockImages(bg, chooser.palette);
    monImgs = blockImages(mblk, chooser.palette, true);
    gray = undefined;
    filter.refresh();
    renderPicker();
    rebuildMonsters();
    draw();
  }

  const { renderPicker, rebuildPickers, firstPic, rebuildMonsters } = createMapPickers({
    picker,
    get bg() {
      return bg;
    },
    filter,
    get brush() {
      return brush;
    },
    set brush(value) {
      brush = value;
    },
    project,
    get bblName() {
      return bblName;
    },
    get mode() {
      return mode;
    },
    setMode,
    redrawOverlay,
    chooser,
    monPicker,
    get mons() {
      return mons;
    },
    get monName() {
      return monName;
    },
    get monBrush() {
      return monBrush;
    },
    set monBrush(value) {
      monBrush = value;
    },
    get mblk() {
      return mblk;
    },
  });

  function draw(): void {
    clearTimeout(redrawTimer);
    drawnScale = pictureScale(zoom);
    const s = BLEN * scale();
    viewport.picture.width = MLEN * s;
    viewport.picture.height = MWID * s;
    ctx.imageSmoothingEnabled = false;
    const { bg: bgI, mon: monI } = onScreen();
    drawnGray = !!overlay.gray;
    for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) drawTile(ctx, bgI[map.blocks[y * MLEN + x]] ?? bgI[0], x, y, s);
    map.monsters.forEach((m) => {
      if (m.monnum >= LASTMON) return;
      const pic = firstPic(mons[m.monnum]);
      if (pic >= 0) drawTile(ctx, monI[pic], m.curx, m.cury, s);
      else if (BLEN * zoom < 8) {
        // zoomed far out: too small to outline, a filled dot
        ctx.fillStyle = '#f0f';
        ctx.fillRect(m.curx * s, m.cury * s, s, s);
      } else {
        ctx.strokeStyle = '#f0f';
        ctx.strokeRect(m.curx * s + 2, m.cury * s + 2, s - 4, s - 4);
      }
    });
    monCount.textContent = `${map.monsters.filter((m) => m.monnum < LASTMON).length} of ${LASTMM} monster slots used`;
    for (const mk of linkMarks()) {
      const color = mk.kind === 'from' ? '#ffd400' : '#00e0ff';
      if (BLEN * zoom < 8) {
        ctx.fillStyle = color;
        ctx.fillRect(mk.x * s, mk.y * s, s, s);
        continue;
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.strokeRect(mk.x * s + 1, mk.y * s + 1, s - 2, s - 2);
    }
    viewport.layout();
    redrawOverlay();
    markers.render();
  }

  const { exportImage } = createMapPicture({
    project,
    file,
    map,
    get bgImgs() {
      return bgImgs;
    },
    get monImgs() {
      return monImgs;
    },
    get mons() {
      return mons;
    },
    linkMarks,
    firstPic,
  });

  const cell = (e: PointerEvent) => viewport.cell(e);

  let painting = false;

  const { paintCell, changedCells } = createMapPainting({
    map,
    get brush() {
      return brush;
    },
    get wrapping() {
      return wrapping;
    },
    ctx,
    onScreen,
    scale,
    draw,
    redrawOverlay,
    save,
  });

  const tools = new MapTools(
    {
      project,
      // undo swaps in a new array: always the current one
      get blocksArr() {
        return map.blocks;
      },
      bbl: () => bblName,
      blocks: () => bg,
      palette: () => chooser.palette,
      imgs: () => bgImgs,
      brush: () => brush,
      wrap: () => wrapping,
      remember,
      changed: changedCells,
      overlay,
      drawOverlay: redrawOverlay,
      setMode: (m) => {
        setMode(m);
        revealTool(m);
      },
    },
    h('div', { class: 'stack mt-panel', role: 'region', 'aria-label': 'Tool options' }),
  );

  const { placeMonster, floodFill } = createMapPlacement({
    map,
    get monBrush() {
      return monBrush;
    },
    get brush() {
      return brush;
    },
    get wrapping() {
      return wrapping;
    },
    draw,
    save,
    changedCells,
  });

  let placingExit = false;
  let lastPaint: { x: number; y: number } | undefined;
  bindMapPointer({
    map,
    get mode() {
      return mode;
    },
    get brush() {
      return brush;
    },
    set brush(value) {
      brush = value;
    },
    get painting() {
      return painting;
    },
    set painting(value) {
      painting = value;
    },
    get placingExit() {
      return placingExit;
    },
    set placingExit(value) {
      placingExit = value;
    },
    get lastPaint() {
      return lastPaint;
    },
    set lastPaint(value) {
      lastPaint = value;
    },
    canvas,
    scroller,
    cell,
    viewport,
    tools,
    remember,
    placeMonster,
    rebuildPickers,
    setMode,
    redrawOverlay,
    floodFill,
    paintCell,
    get zoom() {
      return zoom;
    },
    setZoom,
    linkMarks,
    marks,
    get bg() {
      return bg;
    },
    status,
    get finding() {
      return finding;
    },
    overlay,
    revealTool,
    save,
    get markers() {
      return markers;
    },
  });

  const { hideTip, tip } = createMapTooltip({
    canvas,
    scroller,
    cell,
    get zoom() {
      return zoom;
    },
    get check() {
      return check;
    },
    linkMarks,
  });

  // the links' markers over the map: ways in and exits, to drag, nudge and open (links/)
  let showLinks = (() => {
    try {
      return localStorage.getItem('gm-map-links') !== '0';
    } catch {
      return true;
    }
  })();
  const markers = linkMarkers({
    project,
    scenes: set.scenes,
    canvas,
    block: () => BLEN * zoom,
    get wrapped() {
      return viewport.wrapped;
    },
    point: (p) => viewport.point(p),
    cell: (e) => viewport.cell(e),
    remember: rememberLinks,
    redraw: () => draw(),
  });
  markers.setShown(showLinks);
  const { linksBtn, exitBtn, hereBtn, gridBtn, wrapBtn, findBtn, replaceBtn, toggleGrid } = mapToolbar({
    project,
    file,
    set,
    viewport,
    markers,
    get showLinks() {
      return showLinks;
    },
    set showLinks(value) {
      showLinks = value;
    },
    get placingExit() {
      return placingExit;
    },
    set placingExit(value) {
      placingExit = value;
    },
    tools,
    get painting() {
      return painting;
    },
    set painting(value) {
      painting = value;
    },
    get lastPaint() {
      return lastPaint;
    },
    set lastPaint(value) {
      lastPaint = value;
    },
    get wrapping() {
      return wrapping;
    },
    set wrapping(value) {
      wrapping = value;
    },
    overlay,
    redrawOverlay,
    writePref,
    get finding() {
      return finding;
    },
    set finding(value) {
      finding = value;
    },
    get brush() {
      return brush;
    },
    map,
    get bg() {
      return bg;
    },
    chooser,
    get bblName() {
      return bblName;
    },
    remember,
    draw,
    save,
  });

  // the level check: a panel beside the map, its heat map and marks on the overlay (loaded when
  // first opened; until then a hidden slot holds its place in the side column)
  let check: ReturnType<typeof checkPanel> | undefined;
  let loadingCheck: Promise<ReturnType<typeof checkPanel>> | undefined;
  const checkSlot = h('div', { hidden: true });
  const openCheck = () =>
    (loadingCheck ??= import('./check/checkPanel').then((m) => {
      check = m.checkPanel(checkHost);
      checkSlot.replaceWith(check.el);
      fitter.observe(check.el);
      return check;
    }));
  const checkHost: Parameters<typeof checkPanel>[0] = {
    project,
    file,
    scene: set.scenes[0],
    overlay,
    redraw: () => (!!overlay.gray !== drawnGray ? draw() : redrawOverlay()),
    goTo: (c) => {
      const x = c % MLEN;
      const y = Math.floor(c / MLEN);
      viewport.goTo({ x, y });
      status.textContent = `(${x}, ${y}) block ${map.blocks[c]}`;
    },
    reload: (names) => {
      const n = new Set(names.map((x) => normalize(x)));
      if (n.has(normalize(file))) Object.assign(map, parseMap(project.files.get(file)!));
      if (bblName && n.has(normalize(bblName))) bg = loadBlocks(bblName, 'bbl');
      if (mblName && n.has(normalize(mblName))) mblk = loadBlocks(mblName, 'mbl');
      if (monName && n.has(normalize(monName))) mons = parseMonsters(project.files.get(monName)!);
      rebuild();
    },
    selection: () => tools.selection,
    paint: (cells) => {
      remember();
      for (const [c, b] of cells) map.blocks[c] = b;
      changedCells(cells.map(([c]) => c));
    },
  };
  const checkBtn = h(
    'button',
    {
      type: 'button',
      class: 'mt-tool',
      'aria-label': 'Level check',
      'aria-pressed': 'false',
      title: 'Level check: let a bot play this scene and show where it went and what players would mind',
      onclick: () =>
        void openCheck().then((check) => {
          check.toggle();
          checkBtn.setAttribute('aria-pressed', String(check.shown()));
          if (check.shown()) check.el.scrollIntoView({ block: 'nearest' });
        }),
    },
    '🩺',
    h('span', { class: 'mt-label' }, 'Check'),
  );

  const modeBar = h('div', { class: 'toolbar mt-modes' });
  function setMode(m: Mode): void {
    placingExit = false;
    mode = m;
    canvas.style.touchAction = 'none';
    clear(
      modeBar,
      h(
        'div',
        { class: 'mt-toolset', role: 'group', 'aria-label': 'Map tools' },
        ...TOOLS.map(([k, icon, label, key, what]) =>
          h(
            'button',
            {
              type: 'button',
              class: `mt-tool${k === mode ? ' primary' : ''}${k === 'pan' ? ' mt-touch-only' : ''}`,
              'aria-pressed': String(k === mode),
              'aria-label': label,
              title: `${label}${key ? ` (${key})` : ''}: ${what}`,
              onclick: () => (setMode(k), revealTool(k), rebuildMonsters()),
            },
            icon,
            h('span', { class: 'mt-label' }, label),
          ),
        ),
      ),
      // touch has no hover to show a tool's title: the chosen tool says what it does here (mapTools.css)
      h('p', { class: 'mt-now hint' }, ...nowTool(m)),
      h('span', { style: 'flex:1' }),
      gridBtn,
      wrapBtn,
      linksBtn,
      marksUi.button,
      exitBtn,
      hereBtn,
      findBtn,
      replaceBtn,
      checkBtn,
      undoBtn,
      redoBtn,
    );
    tools.enter(isTool(m) ? m : undefined);
    canvas.style.cursor = m === 'pan' ? 'grab' : m === 'zoom' ? 'zoom-in' : m === 'pick' ? 'copy' : 'crosshair';
  }
  setMode('paint');
  // a monster just made in the monster editor is the brush, already in monster mode
  const justMade = takeNewestMonster(project);
  if (justMade !== undefined) {
    monBrush = justMade;
    setMode('monster');
    rebuildMonsters();
  }

  const fileSelect = (label: string, ext: FileKind, get: () => string, setv: (v: string) => void) =>
    fileField(
      project,
      label,
      [ext],
      get,
      (v) => {
        if (!v) return;
        setv(normalize(v));
        rebuild();
      },
      { allowNone: false, title: `Which ${label.toLowerCase()} to paint this map with` },
    );

  function setZoom(value: number, pointer = { x: scroller.clientWidth / 2, y: scroller.clientHeight / 2 }): void {
    value = clampZoom(value);
    if (value === zoom) return;
    stopRestoring();
    tools.cancel();
    if (painting) save();
    painting = false;
    lastPaint = undefined;
    const anchor = viewport.at(pointer);
    zoom = value;
    view.set({ zoom: zoomToUrl(value) });
    showZoom();
    // the picture is only scaled by the browser; when the zoom crosses into another drawing level the
    // redraw waits until the wheel pauses, so no step is slower than a frame
    viewport.layout();
    markers.render();
    if (pictureScale(zoom) !== drawnScale) {
      clearTimeout(redrawTimer);
      redrawTimer = setTimeout(draw, 140);
    }
    viewport.goTo(anchor, pointer);
    if (!viewport.wrapped && marks.any()) marks.redraw();
    noteView();
  }
  const { noteView, flushView, restoreView, stopRestoring } = mapViewMemory({
    project,
    file,
    host,
    scroller,
    viewport,
    get wrapping() {
      return wrapping;
    },
    get zoom() {
      return zoom;
    },
    view,
    saved,
    linkMarks,
    map,
  });
  const { zoomControl, filesToggle, showZoom } = createMapZoomControls({
    get zoom() {
      return zoom;
    },
    setZoom,
    scroller,
  });

  // fingers: two pinch and pan with any tool; one held still opens a menu; the Hand tool scrolls (mapTouchGestures.ts)
  let strokeFrom = 0;
  touchGestures({
    el: scroller,
    scroller,
    zoom: () => zoom,
    setZoom,
    hand: () => mode === 'pan',
    begin: () => (strokeFrom = remembered),
    abort: (undo) => {
      tools.cancel();
      painting = false;
      lastPaint = undefined;
      if (undo && remembered > strokeFrom) {
        strokeFrom = remembered;
        step(true);
      }
    },
    longPress: (at) => {
      const p = viewport.cell({ clientX: at.x, clientY: at.y });
      if (p.x < 0 || p.y < 0 || p.x >= MLEN || p.y >= MWID) return false;
      const mon = map.monsters.find((m) => m.monnum < LASTMON && m.curx === p.x && m.cury === p.y);
      const actions: AssetAction[] = [];
      if (mon && !project.readOnly)
        actions.push({
          label: 'Erase monster',
          run: () => {
            remember();
            placeMonster(p.x, p.y, true);
          },
        });
      actions.push({
        label: 'Pick this block',
        run: () => {
          brush = map.blocks[p.y * MLEN + p.x];
          rebuildPickers();
          setMode('paint');
          redrawOverlay();
        },
      });
      if (showLinks && !project.readOnly && markers.hasExit())
        actions.push({ label: "Use as the exit's place", run: () => markers.moveExit({ x: p.x, y: p.y }) });
      // the menu opens as the finger lifts: a popover opened under a held finger closes when it lifts
      const open = () => {
        removeEventListener('pointerup', lifted, true);
        removeEventListener('pointercancel', lifted, true);
        setTimeout(() => assetMenu(scroller, actions, at, 'Map actions'), 0);
      };
      const lifted = open;
      addEventListener('pointerup', lifted, true);
      addEventListener('pointercancel', lifted, true);
      return true;
    },
  });
  const generateBtn = h(
    'button',
    {
      type: 'button',
      class: 'mt-generate-btn',
      title: 'Draw a dungeon, forest, building, town, overworld or side view from the blocks marked with roles in the block editor',
      disabled: !bblName || !project.files.has(bblName),
      onclick: () =>
        void import('./generate/generateDialog').then((m) =>
          m.generateDialog({
            project,
            bbl: bblName,
            blockCount: bg.length,
            blocks: () => map.blocks,
            images: () => bgImgs,
            selection: () => tools.selection,
            blockSet: () => bg,
            monsters: () => mons,
            placedMonsters: () => map.monsters,
            wrap: () => wrapping,
            scene: set.scenes[0],
            hero: set.chr && project.files.has(set.chr) ? { chr: set.chr, cbl: set.cbl, mbl: mblName } : undefined,
            apply: (blocks, _what, withMonsters) => {
              remember();
              map.blocks.set(blocks);
              if (withMonsters)
                void import('./generate/place').then((p) => {
                  const result = p.placeMonsters(map, withMonsters);
                  draw();
                  save();
                  toast(p.placementText(result));
                });
              draw();
              save();
              if (!withMonsters) toast('Layout drawn. Undo takes it back in one step.');
            },
          }),
        ),
    },
    '✨ Generate…',
  );
  if (view.get('generate') === '1') {
    view.set({ generate: undefined });
    if (!generateBtn.disabled) queueMicrotask(() => generateBtn.click());
    else toast('Choose background blocks for this map before generating a layout.');
  }
  const blockPanel = h('div', { class: 'stack' }, filter.el, generateBtn, picker);
  const monsterPanel = h('div', { class: 'stack' }, monPicker, monCount);
  const optionsPanel = h(
    'div',
    { class: 'stack' },
    h('p', { class: 'meta' }, 'Choose a tool in the toolbar to see its settings. Select an area to fill, copy, cut or save it as a stamp.'),
    tools.panel,
  );
  const panels = { blocks: blockPanel, monsters: monsterPanel, options: optionsPanel };
  const sideTabs = panelTabs(
    'Map panels',
    [
      { id: 'blocks', label: 'Blocks', panel: blockPanel },
      { id: 'monsters', label: 'Monsters', panel: monsterPanel },
      { id: 'options', label: 'Tool options', panel: optionsPanel },
    ],
    view.get('panel') ?? undefined,
    (panel) => view.set({ panel: panel === 'blocks' ? undefined : panel }),
  );
  function revealTool(tool: Mode): void {
    const panel = tool === 'monster' ? 'monsters' : isTool(tool) && tool !== 'line' ? 'options' : 'blocks';
    sideTabs.querySelector<HTMLButtonElement>(`[aria-controls="${panels[panel].id}"]`)?.click();
  }
  const sideCol = h('div', { class: 'stack mt-side-col', style: 'flex:0 1 260px;min-width:0' }, checkSlot, sideTabs);
  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      'Drag to paint blocks. Terrain paints edges and corners for you, Building drags out a house of any size, and Select copies blocks to paste or keep as a stamp. In Monsters, click to place the chosen monster and right-click to remove one. Gold markers are exits to other scenes and cyan ones are ways in, where the character arrives: drag one to move it, or click it to see where it leads.',
    ),
    // Nothing to paint with yet: say so, and offer the quickest ways to get blocks.
    !bblName || !project.files.has(bblName)
      ? h(
          'div',
          { class: 'callout' },
          h('strong', null, 'This map has no background blocks to paint with yet. '),
          'Take a set from the CD library, or draw your own.',
          h(
            'div',
            { class: 'toolbar' },
            h(
              'button',
              {
                class: 'primary',
                onclick: async () => {
                  const v = await pickFile(project, 'bbl', { adding: true, title: 'Background blocks for this map' });
                  if (!v) return;
                  // reopen the map with the new blocks (saved first: saving is otherwise delayed)
                  await project.saveNow();
                  location.reload();
                },
              },
              '📀 Take blocks from the library',
            ),
            h(
              'button',
              {
                onclick: async () => {
                  const v = await pickFile(project, 'bbl', { title: 'Background blocks for this map' });
                  if (v) location.hash = `#/p/${project.id}/${encodeURIComponent(v)}`;
                },
              },
              '✎ Draw my own',
            ),
          ),
        )
      : null,
    h(
      'div',
      { class: 'toolbar mt-filebar', style: 'margin-bottom:8px' },
      filesToggle,
      h(
        'div',
        { class: 'mt-files-body', id: 'mt-files-body' },
        fileSelect(
          'Background blocks',
          'bbl',
          () => bblName,
          (v) => ((bblName = v), (bg = loadBlocks(v, 'bbl')), tools.renderPanel()),
        ),
        fileSelect(
          'Monsters',
          'mon',
          () => monName,
          (v) => ((monName = v), (mons = parseMonsters(project.files.get(v)!))),
        ),
        fileSelect(
          'Monster blocks',
          'mbl',
          () => mblName,
          (v) => ((mblName = v), (mblk = loadBlocks(v, 'mbl'))),
        ),
        chooser.el,
        h(
          'button',
          { class: 'mt-big', onclick: () => void exportImage(), title: 'Save the map, just the level, or a screen-sized crop as a picture' },
          '🖼 Download picture',
        ),
      ),
      zoomControl,
    ),
    h('div', { class: 'row' }, h('div', { class: 'stack', style: 'flex:1 1 480px;min-width:0' }, modeBar, marksUi.panel, scroller, status), sideCol),
  );
  rebuild();
  // One screen: the map, and the blocks and monsters lists, end at the editor's bottom edge,
  // measured from where they start (below the tip, file toolbar and tool panel, whatever
  // their height), so the editor pane itself needn't scroll.
  const fit = () => {
    const main = host.closest('main');
    if (!main) return;
    const pad = parseFloat(getComputedStyle(main).paddingBottom) || 0;
    const top = (el: Element) => el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
    const bottom = main.clientHeight - pad - 4;
    const room = Math.round(bottom - top(scroller) - status.offsetHeight - 10);
    if (host.style.getPropertyValue('--map-room') !== `${room}px`) host.style.setProperty('--map-room', `${room}px`);
    // a long Level check report scrolls the side column by itself (mapTools.css)
    host.style.setProperty('--side-col-room', `${Math.round(bottom - top(sideCol))}px`);
  };
  const fitter = new ResizeObserver(() => requestAnimationFrame(fit));
  for (const el of [host, sideCol, tools.panel]) fitter.observe(el);
  addEventListener('resize', fit);
  const { onKey } = mapKeyboard({
    step,
    tools,
    get placingExit() {
      return placingExit;
    },
    set placingExit(value) {
      placingExit = value;
    },
    revealTool,
    get mode() {
      return mode;
    },
    toggleGrid,
    setMode,
    rebuildMonsters,
  });

  window.addEventListener('keydown', onKey);
  restoreView();
  return () => {
    hideTip();
    flushView();
    tip.remove();
    clearTimeout(redrawTimer);
    markers.dispose();
    marks.dispose();
    cancelAnimationFrame(marksPending);
    viewport.dispose();
    window.removeEventListener('keydown', onKey);
    fitter.disconnect();
    removeEventListener('resize', fit);
  };
});
