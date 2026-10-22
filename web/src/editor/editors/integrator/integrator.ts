// Integrator (GRATOR.EXE): the game's scenes, the files each uses, and the links between them.
// The scenes are cards on a zoomable board: each shows what the player first sees there
// (a level's map around the block the hero arrives on, the title screen, the won/lost
// screens). Card positions are the .GAM's integrator coordinates, so the DOS integrator
// shows the same arrangement.
//
// The editor is one closure over the game. Its sections, in order: pictures (cached scene
// shots), songs, the board (pan, zoom, dragging cards), the toolbar (Auto-arrange, Spread
// out, zoom, PNG), the side panel (screens and music), scenes (adding, playing from one),
// and the selected scene's panel (its links table is sceneLinks.ts). Drawing the board is in
// board.ts; the layout algorithms are in integratorLayout.ts and layoutCells.ts.
import './integrator.css';
import { registerEditor } from '../registry';
import { h, clear, selectField, textField, modal, confirmDialog, download, toast } from '../../core/ui';
import type { FileKind } from '../../core/project';
import { fileField } from '../../widgets/filePicker';
import { GameFiles } from '../../../project/files';
import { mountPlayer, type PlayerHandle } from '../../../player/player';
import {
  ADVTYPE,
  ENDTYPE,
  GRAPHIC_EXTS,
  NOSCENE,
  SCENEDESCLEN,
  STARTTYPE,
  emptyScene,
  serializeGame,
  fileSlotsFor,
  sceneKind,
  slotExtensions,
  type Point,
  type Scene,
} from '../../../formats/game';
import { newMap, parseMap, serializeMap } from '../../../formats/map';
import { WORLD, CARD_UNITS, clampPos } from './layoutCells';
import { arrangements, closeGaps, gapSavings, spreadOut, type Arrangement } from './integratorLayout';
import { graphicShot, levelShot } from './integratorArt';
import { audio } from '../../widgets/mediaShared';
import { linksPanel } from './sceneLinks';
import { viewState } from '../../../urlState';
import { startingAt } from './startAt';
import { fileUndo } from '../../core/fileUndo';
import { screensAndSongs } from './sceneSlots';
import { screensGrid, songsList } from './sideLists';
import {
  S,
  inRect,
  usedScenes,
  arrival as arrivalOf,
  cardRect as cardRectOf,
  cardButtons as cardButtonsOf,
  paintBoard as paintBoardOf,
  type Rect,
} from './board';

registerEditor(['gam'], (host, project, file) => {
  const game = project.game();
  // the address keeps the selected scene and the side panel's tab (…/GAME.GAM?scene=3&side=music)
  const view = viewState(['p', project.id, file]);
  const urlScene = view.num('scene');
  let selected = urlScene !== undefined && usedScenes(game).includes(urlScene) ? urlScene : 0;
  let playing: string | undefined;
  /** Auto-arrange's layouts, best first, while the user steps through them. */
  let arranged: { list: Arrangement[]; k: number } | undefined;
  // Undo takes back any change to the .gam: cards moved, scenes added, files and links chosen
  const undo = fileUndo(project.files, () => {
    Object.assign(game, project.game());
    arranged = undefined;
    const gone = !usedScenes(game).includes(selected);
    if (gone) selected = 0;
    shots.clear();
    renderTools();
    renderSide();
    renderPanel();
    if (gone) fit();
    else draw();
  });
  // small, so the toolbar keeps to one line
  for (const [b, name] of [[undo.undoBtn, 'Undo'], [undo.redoBtn, 'Redo']] as const) {
    b.textContent = name === 'Undo' ? '↶' : '↷';
    b.setAttribute('aria-label', name);
    b.classList.add('grator-undo');
  }
  const stopKeys = undo.listenKeys();
  const save = (sameStep = false) => {
    if (sameStep) undo.join(project.gam);
    else undo.before(project.gam);
    project.saveGame(game);
  };

  // ---- pictures --------------------------------------------------------------------
  const shots = new Map<string, HTMLCanvasElement | undefined>();
  const cached = (key: string, make: () => HTMLCanvasElement | undefined) => {
    if (!shots.has(key)) shots.set(key, make());
    return shots.get(key);
  };
  const screenOf = (name: string | undefined) => (name ? cached(`g:${name.toLowerCase()}`, () => graphicShot(project.files, name)) : undefined);
  const arrival = (i: number): Point => arrivalOf(game, i);
  const levelOf = (i: number) => {
    const s = game.scenes[i];
    const at = arrival(i);
    return cached(`l:${s.files.slice(0, 7).join('|')}|${at.x},${at.y}`, () => levelShot(project.files, s, at, 8, 5));
  };
  const stopWatching = project.onChange((name) => {
    if (name === project.gam) return;
    shots.clear();
    draw();
    renderSide();
  });

  // ---- songs ---------------------------------------------------------------------------
  async function toggleSong(file: string): Promise<void> {
    if (playing === file) {
      audio.stopSong();
      playing = undefined;
    } else {
      await audio.resume();
      if (await audio.playSong(project.files.get(file))) playing = file;
      else {
        playing = undefined;
        toast(`${file} can’t be played (it isn’t Game-Maker Sound Blaster music).`, 'error');
      }
    }
    draw();
    for (const b of host.querySelectorAll<HTMLButtonElement>('button[data-song]')) {
      const on = b.dataset.song === playing;
      b.textContent = on ? '■' : '▶';
      b.classList.toggle('playing', on);
      b.title = `${on ? 'Stop' : 'Play'} ${b.dataset.song}`;
    }
  }
  const songButton = (file: string) =>
    h(
      'button',
      {
        class: `grator-play${playing === file ? ' playing' : ''}`,
        dataset: { song: file },
        title: `${playing === file ? 'Stop' : 'Play'} ${file}`,
        'aria-label': `Play ${file}`,
        onclick: () => void toggleSong(file),
      },
      playing === file ? '■' : '▶',
    );

  // ---- board -----------------------------------------------------------------------------
  const board = h('canvas', {
    class: 'grator-board',
    tabIndex: 0,
    'aria-label': 'Scenes and links: drag a card to move it, drag the background to pan, scroll to zoom',
  });
  const zoomLabel = h('span', { class: 'grator-zoom' }, '100%');
  const cam = { x: 0, y: 0, z: 1 };
  /** True while the view is still the "show every scene" fit: resizing the board fits it again. */
  let fitted = true;
  const used = () => usedScenes(game);
  const cardRect = (i: number): Rect => cardRectOf(game, i);
  const boardBounds = (): Rect => {
    const rs = used().map(cardRect);
    const world = { x: WORLD.x * S, y: WORLD.y * S, w: WORLD.w * S, h: WORLD.h * S };
    const x0 = Math.min(world.x, ...rs.map((r) => r.x));
    const y0 = Math.min(world.y, ...rs.map((r) => r.y));
    const x1 = Math.max(world.x + world.w, ...rs.map((r) => r.x + r.w));
    const y1 = Math.max(world.y + world.h, ...rs.map((r) => r.y + r.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };

  const cardButtons = (i: number, r: Rect) => cardButtonsOf(project, game, i, r);
  const paintBoard = (ctx: CanvasRenderingContext2D, view: Rect, forExport: boolean) =>
    paintBoardOf(ctx, view, forExport, { project, game, selected, playing, screenOf, levelOf });

  let raf = 0;
  function draw(): void {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const dpr = window.devicePixelRatio || 1;
      const w = board.clientWidth;
      const hh = board.clientHeight;
      if (!w || !hh) return;
      if (board.width !== Math.round(w * dpr) || board.height !== Math.round(hh * dpr)) {
        board.width = Math.round(w * dpr);
        board.height = Math.round(hh * dpr);
      }
      const ctx = board.getContext('2d')!;
      ctx.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, -cam.x * dpr * cam.z, -cam.y * dpr * cam.z);
      paintBoard(ctx, { x: cam.x, y: cam.y, w: w / cam.z, h: hh / cam.z }, false);
      zoomLabel.textContent = `${Math.round(cam.z * 100)}%`;
    });
  }

  const toBoard = (clientX: number, clientY: number) => {
    const r = board.getBoundingClientRect();
    return { x: cam.x + (clientX - r.left) / cam.z, y: cam.y + (clientY - r.top) / cam.z };
  };
  function zoomAt(z: number, clientX?: number, clientY?: number): void {
    const r = board.getBoundingClientRect();
    const cx = clientX ?? r.left + r.width / 2;
    const cy = clientY ?? r.top + r.height / 2;
    const before = toBoard(cx, cy);
    fitted = false;
    cam.z = Math.max(0.15, Math.min(4, z));
    cam.x = before.x - (cx - r.left) / cam.z;
    cam.y = before.y - (cy - r.top) / cam.z;
    draw();
  }
  function fit(): void {
    const rs = used().map(cardRect);
    const b = rs.length
      ? (() => {
          const x0 = Math.min(...rs.map((r) => r.x));
          const y0 = Math.min(...rs.map((r) => r.y)) - 30;
          return { x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 };
        })()
      : boardBounds();
    const w = board.clientWidth || 800;
    const hh = board.clientHeight || 500;
    const pad = 30;
    fitted = true;
    // no bigger than 125%: a game of one or two scenes shouldn't fill the board with giant cards
    cam.z = Math.max(0.15, Math.min(1.25, Math.min((w - pad * 2) / b.w, (hh - pad * 2) / b.h)));
    cam.x = b.x - (w / cam.z - b.w) / 2;
    cam.y = b.y - (hh / cam.z - b.h) / 2;
    draw();
  }
  function centerOn(i: number): void {
    const r = cardRect(i);
    const w = board.clientWidth / cam.z;
    const hh = board.clientHeight / cam.z;
    if (r.x >= cam.x && r.y >= cam.y && r.x + r.w <= cam.x + w && r.y + r.h <= cam.y + hh) return;
    fitted = false;
    cam.x = r.x + r.w / 2 - w / 2;
    cam.y = r.y + r.h / 2 - hh / 2;
    draw();
  }

  function sceneAt(x: number, y: number): number {
    const order = used().sort((a, b) => Number(b === selected) - Number(a === selected));
    return order.find((i) => inRect(cardRect(i), x, y)) ?? -1;
  }

  // pointers: one = drag a card or pan; two = pinch zoom
  const pointers = new Map<number, { x: number; y: number }>();
  let gesture:
    | { type: 'card'; i: number; dx: number; dy: number; sx: number; sy: number; moved: boolean }
    | { type: 'pan'; sx: number; sy: number; cx: number; cy: number }
    | { type: 'pinch'; d: number; z: number }
    | undefined;
  board.addEventListener('pointerdown', (e) => {
    board.focus({ preventScroll: true });
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    board.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      gesture = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z };
      return;
    }
    const p = toBoard(e.clientX, e.clientY);
    const i = sceneAt(p.x, p.y);
    if (i >= 0) {
      const btn = cardButtons(i, cardRect(i)).find((b) => inRect(b, p.x, p.y));
      if (btn) {
        void toggleSong(btn.file);
        gesture = undefined;
        return;
      }
      const pos = game.scenes[i].pos;
      gesture = { type: 'card', i, dx: p.x - (pos.x + 2) * S, dy: p.y - (pos.y + 2) * S, sx: e.clientX, sy: e.clientY, moved: false };
      if (selected !== i) {
        selected = i;
        renderPanel();
      }
      if (panelInSide() && sideTab !== 'scene') {
        sideTab = 'scene';
        view.set({ side: 'scene' });
        renderSide();
      }
      draw();
    } else gesture = { type: 'pan', sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y };
  });
  board.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!gesture) {
      const p = toBoard(e.clientX, e.clientY);
      const i = sceneAt(p.x, p.y);
      board.style.cursor = i < 0 ? 'grab' : cardButtons(i, cardRect(i)).some((b) => inRect(b, p.x, p.y)) ? 'pointer' : 'move';
      return;
    }
    if (gesture.type === 'pinch') {
      const [a, b] = [...pointers.values()];
      if (a && b) zoomAt((gesture.z * Math.hypot(a.x - b.x, a.y - b.y)) / gesture.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else if (gesture.type === 'pan') {
      fitted = false;
      cam.x = gesture.cx - (e.clientX - gesture.sx) / cam.z;
      cam.y = gesture.cy - (e.clientY - gesture.sy) / cam.z;
      board.style.cursor = 'grabbing';
      draw();
    } else {
      if (!gesture.moved && Math.hypot(e.clientX - gesture.sx, e.clientY - gesture.sy) < 4) return;
      gesture.moved = true;
      const p = toBoard(e.clientX, e.clientY);
      game.scenes[gesture.i].pos = clampPos({ x: (p.x - gesture.dx) / S - 2, y: (p.y - gesture.dy) / S - 2 });
      draw();
    }
  });
  const endPointer = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (gesture?.type === 'card' && gesture.moved) {
      arranged = undefined;
      renderTools();
      save();
    }
    if (gesture?.type === 'pinch' && pointers.size === 1) {
      const [p] = [...pointers.values()];
      gesture = { type: 'pan', sx: p.x, sy: p.y, cx: cam.x, cy: cam.y };
      return;
    }
    gesture = undefined;
  };
  board.addEventListener('pointerup', endPointer);
  board.addEventListener('pointercancel', endPointer);
  board.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) zoomAt(cam.z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
      else {
        fitted = false;
        cam.x += e.deltaX / cam.z;
        draw();
      }
    },
    { passive: false },
  );
  board.addEventListener('dblclick', (e) => {
    const p = toBoard(e.clientX, e.clientY);
    const i = sceneAt(p.x, p.y);
    if (i >= 0 && game.scenes[i].gametype === ADVTYPE) playFrom(i);
  });
  board.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') zoomAt(cam.z * 1.25);
    else if (e.key === '-') zoomAt(cam.z / 1.25);
    else if (e.key === '0') fit();
    else if (e.key === 'Tab') return;
    else if (e.key.startsWith('Arrow')) {
      // step the selection to the nearest scene in that direction
      const here = game.scenes[selected]?.pos ?? { x: 0, y: 0 };
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key] ?? [0, 0];
      let best = -1;
      let bestD = Infinity;
      for (const i of used()) {
        const p = game.scenes[i].pos;
        const dx = p.x - here.x;
        const dy = p.y - here.y;
        const along = dx * dir[0] + dy * dir[1];
        if (i === selected || along <= 0) continue;
        const d = along + 2 * Math.abs(dx * dir[1] + dy * dir[0]);
        if (d < bestD) [best, bestD] = [i, d];
      }
      if (best >= 0) {
        selected = best;
        centerOn(best);
        renderPanel();
        draw();
      }
    } else return;
    e.preventDefault();
  });
  const resize = new ResizeObserver(() => (fitted ? fit() : draw()));
  resize.observe(board);

  async function exportPng(): Promise<void> {
    const b = boardBounds();
    const pad = 40;
    const scale = 2;
    const c = document.createElement('canvas');
    c.width = Math.round((b.w + pad * 2) * scale);
    c.height = Math.round((b.h + pad * 2) * scale);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(scale, 0, 0, scale, (pad - b.x) * scale, (pad - b.y) * scale);
    paintBoard(ctx, { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 }, true);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
    if (!blob) return toast('Couldn’t make the picture.', 'error');
    download(`${project.gam.replace(/\.gam$/i, '')}-scenes.png`, new Uint8Array(await blob.arrayBuffer()), 'image/png');
  }

  // ---- toolbar ------------------------------------------------------------------------
  const tools = h('div', { class: 'toolbar grator-tools' });
  /** How many cards sit on top of another one. */
  const overlapping = () => {
    const ps = used().map((i) => game.scenes[i].pos);
    let n = 0;
    ps.forEach((a, k) => {
      if (ps.some((b, j) => j !== k && Math.abs(a.x - b.x) < CARD_UNITS.w - 1 && Math.abs(a.y - b.y) < CARD_UNITS.h - 1)) n++;
    });
    return n;
  };
  /** `again`: another of Auto-arrange's layouts, which Undo takes back with the first. */
  function relayout(positions: Map<number, Point>, keepArranged = false, again = false): void {
    if (!keepArranged) arranged = undefined;
    for (const [i, p] of positions) game.scenes[i].pos = p;
    save(again);
    renderTools();
    fit();
  }
  /** A tool's symbol and name; on a narrow board only the symbol shows (the name stays its label). */
  const toolFace = (symbol: string, name: string) => [h('span', { class: 'grator-sym', 'aria-hidden': 'true' }, symbol), h('span', { class: 'grator-label' }, name)];
  function renderTools(): void {
    const crowded = overlapping();
    const saved = gapSavings(game);
    const roomy = Math.max(saved.x, saved.y);
    clear(
      tools,
      h('button', { class: 'primary', onclick: addScene }, '+ Add level scene'),
      h(
        'button',
        {
          class: crowded ? 'grator-attention' : undefined,
          title: `${crowded ? `${crowded} scenes are hiding one another. ` : ''}Move the cards apart so none hides another, keeping your arrangement`,
          'aria-label': 'Spread out',
          onclick: () => relayout(spreadOut(game)),
        },
        ...toolFace('✥', 'Spread out'),
      ),
      h(
        'button',
        {
          class: arranged && arranged.list.length > 1 ? 'grator-arranging' : undefined,
          title: arranged
            ? 'Try the next best layout'
            : 'Lay the scenes out as a map of the game: the start first, each scene next to the one that leads there, the end last (press again for other layouts)',
          'aria-label': arranged && arranged.list.length > 1 ? `Another layout, ${arranged.k + 1} of ${arranged.list.length}` : 'Auto-arrange',
          onclick: () => {
            const again = !!arranged;
            if (arranged) arranged.k = (arranged.k + 1) % arranged.list.length;
            else arranged = { list: arrangements(game), k: 0 };
            relayout(arranged.list[arranged.k].positions, true, again);
          },
        },
        ...toolFace('⇄', arranged && arranged.list.length > 1 ? `Another layout ${arranged.k + 1}/${arranged.list.length}` : 'Auto-arrange'),
      ),
      // only when the cards sit far apart (e.g. the DOS layout: title at the top, the end at the bottom)
      roomy >= 0.15
        ? h(
            'button',
            {
              class: roomy >= 0.3 ? 'grator-attention' : undefined,
              title: 'Bring the cards closer together, keeping your arrangement, so the board can show them bigger',
              'aria-label': 'Close gaps',
              onclick: () => relayout(closeGaps(game)),
            },
            ...toolFace('⇲', 'Close gaps'),
          )
        : null,
      undo.undoBtn,
      undo.redoBtn,
      h('span', { class: 'grator-spacer' }),
      h('button', { title: 'Download a picture of all the scenes and links', 'aria-label': 'Download PNG', onclick: () => void exportPng() }, ...toolFace('⬇', 'PNG')),
    );
  }
  /** Zoom controls float over the board's corner, like a map's. */
  const zoomBar = h(
    'div',
    { class: 'grator-zoombar', role: 'group', 'aria-label': 'Zoom' },
    h('button', { title: 'Zoom out (-)', 'aria-label': 'Zoom out', onclick: () => zoomAt(cam.z / 1.25) }, '−'),
    zoomLabel,
    h('button', { title: 'Zoom in (+)', 'aria-label': 'Zoom in', onclick: () => zoomAt(cam.z * 1.25) }, '+'),
    h('button', { title: 'Show every scene (0)', onclick: fit }, '⤢ Fit'),
  );

  // ---- side panel: screens and music ---------------------------------------------------
  const store = {
    get: (k: string) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k: string, v: string) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* private mode: just don't remember */
      }
    },
  };
  const savedTab = store.get('gm-grator-tab');
  const urlSide = view.get('side');
  let sideTab: 'scene' | 'screens' | 'music' =
    urlSide === 'scene' || urlSide === 'music' || urlSide === 'screens' ? urlSide : savedTab === 'music' || savedTab === 'screens' ? savedTab : 'scene';
  const side = h('aside', { class: 'grator-side', 'aria-label': 'Scene, screens and music' });
  const sideHead = h('div', { class: 'grator-side-head' });
  const sideBody = h('div', { class: 'grator-side-body' });
  const grator = h('div', { class: 'grator' });
  /** On wide windows the selected scene's panel is the side panel's first tab, beside the board, so the editor fits the window. */
  const wide = window.matchMedia?.('(min-width: 1000px)');
  const panelInSide = () => !!wide?.matches && !grator.classList.contains('side-collapsed');
  const shownTab = () => (sideTab === 'scene' && !panelInSide() ? 'screens' : sideTab);
  const onWide = () => (renderSide(), requestAnimationFrame(fit));
  wide?.addEventListener?.('change', onWide);
  /** The side panel folds away so the board gets the whole width (remembered; folded by default on phones). */
  const setCollapsed = (on: boolean, remember = true) => {
    grator.classList.toggle('side-collapsed', on);
    if (remember) store.set('gm-grator-side-collapsed', on ? '1' : '0');
    renderSide();
    requestAnimationFrame(fit);
  };
  const savedCollapsed = store.get('gm-grator-side-collapsed');
  grator.classList.toggle('side-collapsed', savedCollapsed ? savedCollapsed === '1' : window.matchMedia?.('(max-width: 820px)').matches);
  const savedWidth = Number(store.get('gm-grator-side-w'));
  if (savedWidth >= 160 && savedWidth <= 640) grator.style.setProperty('--grator-side-w', `${savedWidth}px`);
  // drag the bar between the board and the panel to make the panel wider or narrower
  const handle = h('div', {
    class: 'grator-resize',
    role: 'separator',
    'aria-orientation': 'vertical',
    'aria-label': 'Side panel width',
    title: 'Drag to resize the side panel (or focus it and use ← →, Page Up/Down, Home/End)',
    tabIndex: 0,
    'aria-valuemin': 160,
    'aria-valuemax': 640,
  });
  /** The handle reports the panel's real width (its default depends on the window), kept in step as it changes. */
  const syncHandle = () => {
    const w = Math.round(side.getBoundingClientRect().width);
    if (!w) return;
    handle.setAttribute('aria-valuenow', String(w));
    handle.setAttribute('aria-valuetext', `${w} pixels wide`);
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(syncHandle).observe(side);
  const setSideW = (w: number) => {
    grator.style.setProperty('--grator-side-w', `${w}px`);
    store.set('gm-grator-side-w', String(w));
    syncHandle();
    draw();
  };
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const x0 = e.clientX;
    const w0 = side.getBoundingClientRect().width;
    const move = (ev: PointerEvent) => {
      setSideW(Math.round(Math.max(160, Math.min(640, w0 - (ev.clientX - x0)))));
    };
    const up = () => (handle.removeEventListener('pointermove', move), handle.removeEventListener('pointerup', up));
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
  // ← widens the panel (the handle moves left), → narrows it; Page Up/Down take bigger steps, Home is narrowest and End widest
  handle.addEventListener('keydown', (e) => {
    const w = Math.round(side.getBoundingClientRect().width);
    const next: Record<string, number> = { ArrowLeft: w + 20, ArrowUp: w + 20, ArrowRight: w - 20, ArrowDown: w - 20, PageUp: w + 80, PageDown: w - 80, Home: 160, End: 640 };
    if (!(e.key in next)) return;
    e.preventDefault();
    setSideW(Math.max(160, Math.min(640, next[e.key])));
  });
  function renderSide(): void {
    const { screens, songs } = screensAndSongs(game);
    const pick = (scene: number) => {
      selected = scene;
      centerOn(scene);
      renderPanel();
      draw();
    };
    const edit = (file: string) =>
      project.files.has(file)
        ? h(
            'a',
            { class: 'grator-edit', href: `#/p/${project.id}/${encodeURIComponent(file.toLowerCase())}`, title: `Edit ${file}`, 'aria-label': `Edit ${file}` },
            '✎',
          )
        : h('span', { class: 'grator-missing', title: 'This file is not in the game' }, 'missing');
    const collapsed = grator.classList.contains('side-collapsed');
    // the selected scene's panel: in the side panel's Scene tab, or under the board
    if (panelInSide()) {
      if (sideTab !== 'scene' && panel.parentElement) panel.remove();
    } else if (panel.parentElement !== host || panel.previousElementSibling !== grator) grator.after(panel);
    if (collapsed) {
      clear(
        side,
        h(
          'button',
          { class: 'grator-side-open', title: 'Show the side panel', 'aria-expanded': 'false', onclick: () => setCollapsed(false) },
          h('span', { 'aria-hidden': 'true' }, '‹'),
          h('span', { class: 'grator-side-open-label' }, `${wide?.matches ? 'Scene · ' : ''}Screens ${screens.length} · Music ${songs.length}`),
        ),
      );
      return;
    }
    const now = shownTab();
    const tab = (id: typeof sideTab, label: string, n?: number) =>
      h(
        'button',
        {
          role: 'tab',
          id: `grator-tab-${id}`,
          class: `grator-tab${now === id ? ' on' : ''}`,
          'aria-selected': String(now === id),
          'aria-controls': 'grator-side-body',
          onclick: () => {
            sideTab = id;
            store.set('gm-grator-tab', id);
            view.set({ side: id });
            renderSide();
          },
        },
        label,
        n === undefined ? null : h('span', { class: 'grator-count' }, String(n)),
      );
    sideBody.id = 'grator-side-body';
    sideBody.setAttribute('role', 'tabpanel');
    sideBody.setAttribute('aria-labelledby', `grator-tab-${now}`);
    clear(
      sideHead,
      h(
        'div',
        { class: 'grator-tabs', role: 'tablist', 'aria-label': 'Side panel' },
        panelInSide() ? tab('scene', 'Scene') : null,
        tab('screens', 'Screens', screens.length),
        tab('music', 'Music', songs.length),
      ),
      h(
        'button',
        {
          class: 'grator-side-close',
          title: 'Hide this panel (more room for the board)',
          'aria-label': 'Hide the side panel',
          'aria-expanded': 'true',
          onclick: () => setCollapsed(true),
        },
        '›',
      ),
    );
    // moving a focused field out of the page would drop the focus, so the panel and body stay put
    if (side.firstChild !== sideHead || sideBody.parentElement !== side) clear(side, sideHead, sideBody);
    sideBody.classList.toggle('grator-side-scene', now === 'scene');
    if (now === 'scene') {
      if (sideBody.firstChild !== panel || sideBody.childNodes.length !== 1) clear(sideBody, panel);
      return;
    }
    clear(
      sideBody,
      now === 'screens' ? screensGrid(screens, screenOf, pick, edit) : songsList(songs, (f) => project.files.has(f), songButton, pick),
    );
  }

  // ---- scenes --------------------------------------------------------------------------
  function freeSpot(): Point {
    // the first grid spot with no card near it
    const taken = used().map((i) => game.scenes[i].pos);
    for (let y = WORLD.y + 12; y < WORLD.y + WORLD.h - 10; y += CARD_UNITS.h)
      for (let x = WORLD.x + 12; x < WORLD.x + WORLD.w - 10; x += CARD_UNITS.w)
        if (!taken.some((p) => Math.abs(p.x - x) < CARD_UNITS.w && Math.abs(p.y - y) < CARD_UNITS.h)) return clampPos({ x, y });
    return clampPos({ x: 40 + ((game.scenes.length * 37) % 220), y: 70 + ((game.scenes.length * 23) % 90) });
  }

  function addScene(): void {
    const s = emptyScene(ADVTYPE);
    s.desc = `Level ${game.scenes.filter((x) => x.gametype === ADVTYPE).length + 1}`;
    s.pos = freeSpot();
    // A new level shares the last level's palette, blocks, monsters, hero and sounds,
    // on a map of its own (open ground in its most used floor block), so it isn't empty.
    const prev = [...game.scenes].reverse().find((x) => x.gametype === ADVTYPE);
    if (prev) {
      s.files = prev.files.map((f, i) => (i === 1 || i >= 9 ? '' : f));
      const mapName = project.freeName(`level${game.scenes.filter((x) => x.gametype === ADVTYPE).length + 1}`, 'map');
      const oldMap = prev.files[1] && project.files.get(prev.files[1]);
      const map = newMap();
      if (oldMap) {
        const counts = new Map<number, number>();
        for (const b of parseMap(oldMap).blocks) counts.set(b, (counts.get(b) ?? 0) + 1);
        map.blocks.fill([...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0);
      }
      // one step with the scene: Undo takes the new map away too
      undo.before(project.gam, mapName);
      project.files.set(mapName, serializeMap(map));
      s.files[1] = mapName;
    }
    const free = game.scenes.findIndex((x, i) => i > 1 && x.gametype === NOSCENE);
    if (free >= 0) game.scenes[free] = s;
    else game.scenes.push(s);
    selected = free >= 0 ? free : game.scenes.length - 1;
    save();
    centerOn(selected);
    draw();
    renderSide();
    renderPanel();
  }

  /** Plays a copy of the game whose start link goes straight to this level. */
  function playFrom(scene: number): void {
    audio.stopSong();
    playing = undefined;
    const copy = startingAt(game, scene);
    const files = new GameFiles(project.files.entries());
    files.set(project.gam, serializeGame(copy));
    let player: PlayerHandle | undefined;
    void modal<void>(`Playing ${game.scenes[scene].desc || `level ${scene}`}`, (close) => {
      const host = h('div', { class: 'player-host rec-player' });
      queueMicrotask(() => (player = mountPlayer(host, files, project.gam, { title: project.name, record: true, onExit: () => close(undefined) })));
      return h('div', { class: 'stack rec-dialog' }, host, h('p', { class: 'hint' }, 'Click the screen to start. Esc ends the level.'));
    }).then(() => player?.stop());
  }

  function sceneOptions(): [number, string][] {
    return [
      [NOSCENE, '— no link —'],
      ...game.scenes.map((s, i) => [i, `${i}: ${s.desc || '(untitled)'}`] as [number, string]).filter(([i]) => game.scenes[i].gametype !== NOSCENE),
    ];
  }

  // ---- the selected scene ------------------------------------------------------------------
  const panel = h('div', { class: 'stack grator-panel' });
  function renderPanel(): void {
    view.set({ scene: selected });
    const s: Scene | undefined = game.scenes[selected];
    if (!s) {
      clear(panel);
      return;
    }
    const kind = sceneKind(s);
    const slots = fileSlotsFor(s);
    const exts = slotExtensions(s);
    const scrollOpt: [number, string][] = [
      [0xff, 'Scroll when the character nears the edge'],
      [0, 'Never scroll'],
    ];
    const changed = () => (save(), draw());
    clear(
      panel,
      h(
        'div',
        { class: 'panel stack' },
        h(
          'h2',
          { style: 'margin:0' },
          kind === 'start' ? 'Start scene (title & menu)' : kind === 'end' ? 'End scene (game won / lost)' : `Level scene #${selected}`,
        ),
        textField(
          'Description (the start scene’s is the game title)',
          () => s.desc,
          (v) => ((s.desc = v.slice(0, SCENEDESCLEN - 1)), (s.descRaw = undefined), save(), draw(), renderSide()),
          { maxLength: SCENEDESCLEN - 1 },
        ),
        kind === 'adventure' || kind === 'unused'
          ? h(
              'div',
              { class: 'toolbar' },
              kind === 'adventure'
                ? h(
                    'button',
                    { class: 'primary', onclick: () => playFrom(selected), title: 'Play this level straight away, without the title and menu' },
                    '▶ Play from here',
                  )
                : null,
              h(
                'button',
                {
                  class: 'danger',
                  onclick: async () => {
                    if (!(await confirmDialog('Delete scene', `Delete “${s.desc}” and every link to it?`, 'Delete'))) return;
                    for (const other of game.scenes) for (const l of other.links) if (l.toScene === selected) l.toScene = NOSCENE;
                    game.scenes[selected] = emptyScene();
                    selected = 0;
                    save();
                    draw();
                    renderSide();
                    renderPanel();
                  },
                },
                'Delete scene',
              ),
            )
          : null,
      ),
      h(
        'div',
        { class: 'panel' },
        h('h2', { style: 'margin-top:0' }, 'Files'),
        h(
          'div',
          { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(190px,1fr))' },
          ...slots.map((label, i) => {
            const field = fileField(
              project,
              label,
              (exts[i] === 'graphic' ? GRAPHIC_EXTS : [exts[i]]) as FileKind[],
              () => s.files[i] ?? '',
              (v) => {
                s.files[i] = v;
                save();
                draw();
                renderSide();
                renderPanel();
              },
            );
            const file = s.files[i];
            return exts[i] === 'cmf' && file && project.files.has(file) ? h('div', { class: 'grator-song-field' }, field, songButton(file)) : field;
          }),
        ),
      ),
      kind === 'adventure'
        ? h(
            'div',
            { class: 'panel' },
            h('h2', { style: 'margin-top:0' }, 'Scrolling'),
            h(
              'div',
              { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(230px,1fr))' },
              ...(['up', 'down', 'left', 'right'] as const).map((d) =>
                selectField(
                  d[0].toUpperCase() + d.slice(1),
                  scrollOpt,
                  () => (s.scroll[d] === 0 ? 0 : 0xff),
                  (v) => ((s.scroll[d] = v), save()),
                ),
              ),
            ),
          )
        : null,
      kind === 'end'
        ? null
        : linksPanel({ project, game, scene: selected, sceneOptions, changed, rerender: renderPanel }, s, kind),
    );
  }

  /** How the board works, folded into a small ? in its corner. */
  const tips = h(
    'details',
    { class: 'grator-tips' },
    h('summary', { title: 'How the board works', 'aria-label': 'How the board works' }, '?'),
    h(
      'div',
      { class: 'grator-tips-body' },
      h('p', null, 'Each card is a scene, showing what the player sees on arriving.'),
      h(
        'ul',
        null,
        h('li', null, 'Click a card to edit it below; double-click a level to play it.'),
        h('li', null, 'Drag cards to arrange them; drag the background to pan.'),
        h('li', null, 'Scroll or pinch to zoom (keys: + − 0); arrow keys step between scenes.'),
        h('li', null, 'Arrows are links: gold leave the selected scene, green lead into it.'),
      ),
    ),
  );
  const missing = !game.scenes.some((s) => s.gametype === STARTTYPE) || !game.scenes.some((s) => s.gametype === ENDTYPE);
  clear(
    host,
    missing ? h('p', { class: 'hint grator-missing' }, 'This game is missing its start or end scene.') : null,
    (grator.append(h('div', { class: 'grator-main' }, tools, h('div', { class: 'grator-board-wrap' }, board, zoomBar, tips)), handle, side), grator),
  );
  renderTools();
  renderSide();
  renderPanel();
  // the board gives up the height of a toolbar that wraps onto a second row
  const toolsSize = new ResizeObserver(() => grator.style.setProperty('--grator-tools-h', `${tools.offsetHeight}px`));
  toolsSize.observe(tools);
  requestAnimationFrame(fit);
  return () => {
    stopKeys();
    stopWatching();
    resize.disconnect();
    toolsSize.disconnect();
    wide?.removeEventListener?.('change', onWide);
    if (raf) cancelAnimationFrame(raf);
    audio.stopSong();
  };
});
