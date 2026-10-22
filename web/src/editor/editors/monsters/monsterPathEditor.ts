// The monster path editor: draw a monster's path (or attack path) with the mouse right on a
// map of a scene that uses the monster set, pick the picture (orientation) and speed for each
// stretch, and watch the monster walk it exactly as playgame moves it.
//
// One closure per editor. Its sections, in order: the view (zoom and fit), maps, the DOM,
// drawing (run by requestAnimationFrame at the game's 18.2 Hz tick; the map, path arrows and
// walking monster are drawn by monsterPathDraw.ts), editing with the pointer, the
// picture/speed popup for a corner, and the panels (tabs, toolbar, notices, side list, the
// numbers table, which monsterPathNumbers.ts builds). The path math and the walker are in
// monsterPath.ts; measurements and map choices in monsterPathView.ts.
import './monsterPath.css';
import { h, clear, modal, toast } from '../../core/ui';
import { blockImages, paintBlock } from '../../core/draw';
import { BACKBL, BLEN, MONBL, parseBlocks, type Block } from '../../../formats/blocks';
import { MLEN, MWID, parseMap, type GameMap } from '../../../formats/map';
import { MAXMARCH } from '../../../formats/monster';
import { parsePalette, type Palette } from '../../../formats/palette';
import {
  addCorner,
  clearPath,
  corners,
  firstCorner,
  insertCorner,
  mirrorOrient,
  moveCorner,
  pathBox,
  pathKind,
  pathLength,
  PathWalker,
  removeCorner,
  rotateOrient,
  type Corner,
  type PathKind,
} from './monsterPath';
import { MAX_SPEED, ORIENTS, TICK_MS, mapChoices, type PathEditorOptions } from './monsterPathView';
import { drawPathScene, mapLayerCanvas } from './monsterPathDraw';
import { renderPathNumbers } from './monsterPathNumbers';

export function monsterPathEditor(o: PathEditorOptions): { el: HTMLElement; refresh: () => void; destroy: () => void } {
  const { project } = o;
  let tab: 0 | 1 = 0;
  let selected = -1; // march index
  let playing = true;
  let mapIdx = 0;
  let map: GameMap | undefined;
  let bg: Block[] = [];
  let bgPal: Palette | undefined;
  let start = { x: 50, y: 50 };
  let startMon = -1; // monster index start was chosen for
  let walker: PathWalker | undefined;
  let hover: { x: number; y: number } | undefined;
  let mapLayer: HTMLCanvasElement | undefined;
  let spriteCache = new Map<string, HTMLCanvasElement>();
  let dirty = true;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let ants = 0;
  let antsAt = 0;

  const mon = () => o.monsters[o.index()];
  const kind = (): PathKind => pathKind(mon(), tab);
  const path = () => mon().march[tab];
  const box = () => pathBox(kind());
  /** The part of the drawing box on screen (blocks from the origin). */
  let viewRect = { x0: -7, y0: -7, w: 15, h: 15 };
  const view = () => viewRect;

  /** Zooms so the whole path (and the origin) fits with a little room around it. */
  function fitView(width?: number, centre?: { x: number; y: number }): void {
    const b = box();
    const aspect = b.w / b.h;
    const pts = [{ x: 0, y: 0 }, ...corners(path(), kind())];
    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    let w = width ?? Math.max(maxX - minX + 7, (maxY - minY + 7) * aspect, kind() === 'normal' ? 13 : 19);
    w = Math.max(8, Math.min(b.w, Math.round(w)));
    const hgt = Math.min(b.h, Math.max(5, Math.round(w / aspect)));
    const c = centre ?? { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    const x0 = Math.max(b.x0, Math.min(b.x0 + b.w - w, Math.round(c.x - w / 2 + 0.5)));
    const y0 = Math.max(b.y0, Math.min(b.y0 + b.h - hgt, Math.round(c.y - hgt / 2 + 0.5)));
    viewRect = { x0, y0, w, h: hgt };
    mapLayer = undefined;
    dirty = true;
  }
  function zoom(f: number): void {
    const v = view();
    fitView(v.w * f, { x: v.x0 + v.w / 2 - 0.5, y: v.y0 + v.h / 2 - 0.5 });
    hidePop();
  }

  // ---- Maps: the scenes that use this monster set (mapChoices, in monsterPathView.ts) ------
  let choices = mapChoices(project, o.monFile);

  function loadMap(): void {
    const c = choices[mapIdx] ?? choices[0];
    map = c.map && project.files.has(c.map) ? parseMap(project.files.get(c.map)!) : undefined;
    bg = c.bbl && project.files.has(c.bbl) ? parseBlocks(project.files.get(c.bbl)!, BACKBL) : [];
    bgPal = c.pal && project.files.has(c.pal) ? parsePalette(project.files.get(c.pal)!) : undefined;
    mapImgs = bg.length ? blockImages(bg, bgPal ?? o.palette()) : [];
    startMon = -1;
  }
  let mapImgs: HTMLCanvasElement[] = [];

  /** Where this monster sits on the map (first placed copy), else the middle of the map. */
  function placed(): { x: number; y: number }[] {
    if (!map) return [];
    return map.monsters.filter((p) => p.monnum === o.index()).map((p) => ({ x: p.curx, y: p.cury }));
  }

  function defaultStart(): void {
    if (startMon === o.index()) return;
    startMon = o.index();
    start = placed()[0] ?? { x: 50, y: 50 };
  }

  const solidAt = (x: number, y: number) => {
    if (!map || !bg.length) return 0;
    const v = map.blocks[(((y % MWID) + MWID) % MWID) * MLEN + (((x % MLEN) + MLEN) % MLEN)];
    return bg[v]?.solid ?? 0;
  };

  function restartWalker(): void {
    walker = new PathWalker(mon(), tab, start, start, solidAt);
    acc = 0;
    dirty = true;
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

  function sprite(pic: number, orient: number): HTMLCanvasElement | undefined {
    const blocks = o.mblk();
    if (pic < 0 || pic >= MONBL || !blocks[pic]) return undefined;
    const key = `${pic}:${orient}`;
    let c = spriteCache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      paintBlock(c, blocks[pic].pixels, o.palette(), { transparent: true, orient });
      spriteCache.set(key, c);
    }
    return c;
  }
  const firstPic = () => {
    const p = mon().pic[0][0];
    return p >= 0 && p < MONBL ? p : -1;
  };

  function pictureCanvas(orient: number, size = 40): HTMLCanvasElement {
    const c = h('canvas', { class: 'pixel checker', width: BLEN, height: BLEN, style: `width:${size}px;height:${size}px` });
    const s = sprite(firstPic(), orient);
    if (s) c.getContext('2d')!.drawImage(s, 0, 0);
    return c;
  }

  // ---- Drawing (monsterPathDraw.ts) --------------------------------------------------------
  function buildMapLayer(): void {
    mapLayer = mapLayerCanvas(view(), map, mapImgs, start);
  }

  function draw(): void {
    if (!mapLayer) buildMapLayer();
    const disabled = tab === 1 && mon().activate === 0;
    if (!disabled) ants = (ants + 1) % 16;
    drawPathScene(ctx, {
      view: view(),
      mapLayer: mapLayer!,
      kind: kind(),
      disabled,
      corners: corners(path(), kind()),
      selected,
      ants,
      hover,
      walker,
      start,
      firstPic: firstPic(),
      walkerPic: walker ? (mon().pic[Math.max(0, walker.frame)]?.[0] ?? -1) : -1,
      sprite,
    });
  }

  function loop(t: number): void {
    raf = requestAnimationFrame(loop);
    if (!last) last = t;
    const dt = Math.min(250, t - last);
    last = t;
    if (playing && walker && pathLength(path()) > firstCorner(kind())) {
      acc += dt;
      while (acc >= TICK_MS) {
        acc -= TICK_MS;
        walker.tick();
        dirty = true;
      }
      const b = box();
      const far = Math.abs(walker.bx - start.x) > b.w || Math.abs(walker.by - start.y) > b.h;
      if (walker.laps >= 4 || far) restartWalker();
    }
    if (selected >= 0 && t - antsAt > 120) {
      antsAt = t;
      dirty = true;
    }
    if (dirty) {
      dirty = false;
      draw();
    }
  }

  // ---- Editing ----------------------------------------------------------------------------
  function changed(restart = true): void {
    o.onEdit();
    if (restart) restartWalker();
    renderTabs();
    renderSide();
    renderNumbers();
    dirty = true;
  }

  function cellAt(e: PointerEvent | MouseEvent): { x: number; y: number } {
    const r = canvas.getBoundingClientRect();
    const b = view();
    const x = Math.floor(((e.clientX - r.left) / r.width) * b.w);
    const y = Math.floor(((e.clientY - r.top) / r.height) * b.h);
    return { x: Math.max(0, Math.min(b.w - 1, x)) + b.x0, y: Math.max(0, Math.min(b.h - 1, y)) + b.y0 };
  }

  function cornerAt(spot: { x: number; y: number }): Corner | undefined {
    const here = corners(path(), kind()).filter((c) => c.x === spot.x && c.y === spot.y);
    if (!here.length) return undefined;
    // Several corners on one block: each click picks the next.
    const at = here.findIndex((c) => c.i === selected);
    return here[(at + 1) % here.length];
  }

  let drag: { i: number; moved: boolean; added: boolean; from: { x: number; y: number } } | undefined;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (tab === 1 && mon().activate === 0) return;
    canvas.focus();
    hidePop();
    const spot = cellAt(e);
    const hit = cornerAt(spot);
    if (hit) {
      selected = hit.i;
      drag = { i: hit.i, moved: false, added: false, from: spot };
      renderSide();
      dirty = true;
    } else {
      const i = addCorner(path(), kind(), spot.x, spot.y);
      if (i < 0) {
        toast(`A path has at most ${MAXMARCH - firstCorner(kind())} corners. Drag one to move it, or delete one first.`);
        return;
      }
      selected = i;
      drag = { i, moved: false, added: true, from: spot };
      changed();
    }
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    const spot = cellAt(e);
    if (!hover || hover.x !== spot.x || hover.y !== spot.y) {
      hover = spot;
      dirty = true;
      const mx = (((start.x + spot.x) % MLEN) + MLEN) % MLEN;
      const my = (((start.y + spot.y) % MWID) + MWID) % MWID;
      readout.textContent = `${spot.x >= 0 ? '+' : ''}${spot.x}, ${spot.y >= 0 ? '+' : ''}${spot.y} blocks from ${kind() === 'chase' ? 'the character' : 'the start'} · map block (${mx}, ${my})`;
    }
    if (!drag) return;
    if (spot.x === drag.from.x && spot.y === drag.from.y && !drag.moved) return;
    drag.moved = true;
    moveCorner(path(), kind(), drag.i, spot.x, spot.y);
    changed(false);
  });

  const endDrag = (e: PointerEvent) => {
    if (!drag) return;
    const d = drag;
    drag = undefined;
    if (d.moved) restartWalker();
    else if (!d.added) showPop(d.i);
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => {
    hover = undefined;
    dirty = true;
  });

  canvas.addEventListener('keydown', (e) => {
    const list = corners(path(), kind());
    const at = list.findIndex((c) => c.i === selected);
    const cur = path()[selected];
    let handled = true;
    switch (e.key) {
      case 'Backspace':
        if (list.length) {
          removeCorner(path(), kind(), list[list.length - 1].i);
          selected = Math.min(selected, pathLength(path()) - 1);
          changed();
        }
        break;
      case 'Delete':
        if (at >= 0) deleteSelected();
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        if (list.length) selected = list[(Math.max(0, at) + (e.key === 'ArrowLeft' ? list.length - 1 : 1)) % list.length].i;
        renderSide();
        dirty = true;
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        if (at >= 0) {
          cur.pic = Math.max(1, Math.min(MAX_SPEED, cur.pic + (e.key === 'ArrowUp' ? 1 : -1)));
          changed();
        }
        break;
      case 'r':
      case 'R':
        if (at >= 0) ((cur.orient = rotateOrient(cur.orient)), changed());
        break;
      case 's':
      case 'S':
        if (at >= 0) ((cur.orient = mirrorOrient(cur.orient)), changed());
        break;
      case ' ':
        togglePlay();
        break;
      case 'Escape':
        hidePop();
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  });

  function deleteSelected(): void {
    const list = corners(path(), kind());
    const at = list.findIndex((c) => c.i === selected);
    if (at < 0) return;
    removeCorner(path(), kind(), selected);
    const left = corners(path(), kind());
    selected = left.length ? left[Math.min(at, left.length - 1)].i : -1;
    hidePop();
    changed();
  }

  // ---- The picture/speed controls for one corner ------------------------------------------
  function orientPicker(i: number, after?: () => void): HTMLElement {
    const c = path()[i];
    return h(
      'div',
      { class: 'mpath-orients', role: 'radiogroup', 'aria-label': 'Picture while heading to this corner' },
      ...ORIENTS.map(([v, label]) =>
        h(
          'button',
          {
            class: c.orient === v ? 'selected' : '',
            title: label,
            role: 'radio',
            'aria-checked': String(c.orient === v),
            onclick: () => {
              c.orient = v;
              changed();
              after?.();
            },
          },
          pictureCanvas(v, 32),
        ),
      ),
    );
  }

  function speedControl(i: number): HTMLElement {
    const c = path()[i];
    const out = h('output', null, String(c.pic));
    const range = h('input', { type: 'range', min: 1, max: Math.max(MAX_SPEED, c.pic), value: String(c.pic), 'aria-label': 'Speed in pixels per tick' });
    range.addEventListener('input', () => {
      c.pic = Number(range.value);
      out.textContent = range.value;
      o.onEdit();
      restartWalker();
      renderNumbers();
    });
    return h('label', { class: 'mpath-speed' }, h('span', null, 'Speed'), range, out, h('small', null, 'pixels per tick'));
  }

  function showPop(i: number): void {
    const list = corners(path(), kind());
    const c = list.find((x) => x.i === i);
    if (!c) return;
    const b = view();
    const left = ((c.x - b.x0 + 1) / b.w) * 100;
    const top = ((c.y - b.y0 + 1) / b.h) * 100;
    clear(
      pop,
      h(
        'div',
        { class: 'mpath-pop-head' },
        h('strong', null, `Corner ${list.indexOf(c) + 1}`),
        h('button', { class: 'modal-close', 'aria-label': 'Close', onclick: hidePop }, '×'),
      ),
      h('div', { class: 'meta' }, 'Picture on the way here'),
      orientPicker(i, () => showPop(i)),
      speedControl(i),
      h(
        'div',
        { class: 'mpath-pop-actions' },
        h('button', { onclick: () => (insertHere(i), hidePop()) }, '+ Corner before'),
        h('button', { class: 'danger', onclick: deleteSelected }, 'Delete'),
      ),
    );
    pop.hidden = false;
    pop.style.left = left > 60 ? '' : `${left}%`;
    pop.style.right = left > 60 ? `${100 - left + 100 / b.w}%` : '';
    pop.style.top = top > 55 ? '' : `${top}%`;
    pop.style.bottom = top > 55 ? `${100 - top + 100 / b.h}%` : '';
  }
  function hidePop(): void {
    pop.hidden = true;
  }

  function insertHere(i: number): void {
    const n = insertCorner(path(), kind(), i);
    if (n < 0) toast(`A path has at most ${MAXMARCH - firstCorner(kind())} corners.`);
    else {
      selected = n;
      changed();
    }
  }

  function togglePlay(): void {
    playing = !playing;
    renderToolbar();
  }

  // ---- Panels -----------------------------------------------------------------------------
  function renderTabs(): void {
    const m = mon();
    const t = (p: 0 | 1, label: string) =>
      h(
        'button',
        {
          role: 'tab',
          class: tab === p ? 'selected' : '',
          'aria-selected': String(tab === p),
          onclick: () => {
            tab = p;
            selected = corners(path(), kind())[0]?.i ?? -1;
            hidePop();
            fitView();
            renderAll();
          },
        },
        label,
        h('small', null, `${Math.max(0, pathLength(m.march[p]) - firstCorner(pathKind(m, p)))} corners`),
      );
    clear(tabsEl, t(0, 'Path'), t(1, 'Attack path'));
  }

  function renderToolbar(): void {
    const sel = h('select', { 'aria-label': 'Map' }, ...choices.map((c, i) => h('option', { value: String(i), selected: i === mapIdx }, c.label)));
    sel.addEventListener('change', () => {
      mapIdx = Number(sel.value);
      loadMap();
      defaultStart();
      mapLayer = undefined;
      renderAll();
    });
    const spots = placed();
    const startSel = h(
      'select',
      { 'aria-label': kind() === 'chase' ? 'Character at' : 'Starts at' },
      ...spots.map((p, i) => h('option', { value: String(i), selected: p.x === start.x && p.y === start.y }, `Placed #${i + 1} (${p.x}, ${p.y})`)),
      !spots.some((p) => p.x === start.x && p.y === start.y) && h('option', { value: '-1', selected: true }, `(${start.x}, ${start.y})`),
    );
    startSel.addEventListener('change', () => {
      const p = spots[Number(startSel.value)];
      if (p) setStart(p);
    });
    clear(
      toolbar,
      h('label', { class: 'field' }, h('span', null, 'Map'), sel),
      h(
        'label',
        { class: 'field' },
        h('span', null, kind() === 'chase' ? 'Character at' : 'Starts at'),
        h('div', { class: 'mpath-row' }, startSel, map && h('button', { onclick: pickStart, title: 'Pick the start block on the whole map' }, 'Pick…')),
      ),
      h(
        'button',
        { class: playing ? 'primary mpath-play' : 'mpath-play', onclick: togglePlay, title: 'Play or pause the preview (Space)' },
        playing ? '❚❚ Pause' : '▶ Play',
      ),
      h('button', { onclick: restartWalker, title: 'Start the walk over', 'aria-label': 'Restart' }, '↺'),
    );
  }

  function setStart(p: { x: number; y: number }): void {
    start = { x: p.x, y: p.y };
    mapLayer = undefined;
    restartWalker();
    renderToolbar();
  }

  async function pickStart(): Promise<void> {
    if (!map) return;
    const c = h('canvas', { class: 'pixel mpath-mini', width: MLEN * 4, height: MWID * 4 });
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < MWID; y++)
      for (let x = 0; x < MLEN; x++) if (mapImgs[map.blocks[y * MLEN + x]]) g.drawImage(mapImgs[map.blocks[y * MLEN + x]], x * 4, y * 4, 4, 4);
    g.lineWidth = 1;
    for (const p of placed()) {
      g.strokeStyle = '#ffd400';
      g.strokeRect(p.x * 4 - 1.5, p.y * 4 - 1.5, 7, 7);
    }
    g.strokeStyle = '#40ff60';
    g.strokeRect(start.x * 4 - 2.5, start.y * 4 - 2.5, 9, 9);
    const p = await modal<{ x: number; y: number }>('Pick where the monster starts', (close) => {
      c.addEventListener('click', (e) => {
        const r = c.getBoundingClientRect();
        close({ x: Math.floor(((e.clientX - r.left) / r.width) * MLEN), y: Math.floor(((e.clientY - r.top) / r.height) * MWID) });
      });
      return [h('p', { class: 'hint' }, 'Click any block. Yellow squares are where this monster is placed on the map.'), c];
    });
    if (p) setStart(p);
  }

  function renderNotice(): void {
    const m = mon();
    const msgs: (string | Node)[] = [];
    if (tab === 0 && m.towards !== 0) msgs.push('This monster chases, flees or wanders (see Movement), so playgame ignores this path. It is kept in the file.');
    if (tab === 1) {
      const modes: [number, string, string][] = [
        [0, 'Ignores the character', 'Never attacks; keeps to its path.'],
        [1, 'Attack path', 'Follows the attack path from wherever it is.'],
        [2, 'Attack around the character', 'Heads for spots around the character, following it.'],
      ];
      msgs.push(
        h(
          'div',
          { class: 'mpath-modes', role: 'radiogroup', 'aria-label': 'When the character comes within 8 × 5 blocks' },
          h('span', null, 'When the character comes within 8 × 5 blocks:'),
          ...modes.map(([v, label, title]) =>
            h(
              'button',
              {
                class: m.activate === v ? 'selected' : '',
                role: 'radio',
                'aria-checked': String(m.activate === v),
                title,
                onclick: () => {
                  m.activate = v;
                  selected = corners(path(), kind())[0]?.i ?? -1;
                  fitView();
                  o.onEdit();
                  restartWalker();
                  renderAll();
                },
              },
              label,
            ),
          ),
        ),
      );
      if (m.activate === 0) msgs.push('Choose an attack above to draw its path.');
      else if (m.activate === 1) {
        msgs.push('The attack starts wherever the monster is (S) and is drawn from there.');
        if (m.towards !== 0) msgs.push('Only monsters that follow their path use this attack path; this one chases, flees or wanders.');
      } else
        msgs.push(
          'Each corner is a spot around the character (☺); the monster heads for them in turn, even as the character moves. The dashed box is the attack range.',
        );
    }
    clear(notice, ...msgs.map((x) => (typeof x === 'string' ? h('p', null, x) : x)));
  }

  function renderSide(): void {
    const list = corners(path(), kind());
    if (!list.some((c) => c.i === selected)) selected = list[0]?.i ?? -1;
    const max = MAXMARCH - firstCorner(kind());
    const disabled = tab === 1 && mon().activate === 0;
    const chips = h(
      'div',
      { class: 'mpath-chips' },
      ...list.map((c, n) =>
        h(
          'button',
          {
            class: c.i === selected ? 'selected' : '',
            title: `Corner ${n + 1}: ${c.x}, ${c.y} at speed ${c.speed}`,
            onclick: () => {
              selected = c.i;
              hidePop();
              renderSide();
              dirty = true;
            },
          },
          pictureCanvas(c.orient, 24),
          h('small', null, n + 1),
        ),
      ),
    );
    const cur = list.find((c) => c.i === selected);
    clear(
      side,
      h('div', { class: 'mpath-count' }, `${list.length} of ${max} corners`),
      disabled
        ? null
        : list.length
          ? chips
          : h(
              'p',
              { class: 'hint' },
              'Click blocks on the map to lay down corners. The monster walks from the start (S) to each in turn, then starts over from where it ended.',
            ),
      cur &&
        h(
          'div',
          { class: 'mpath-inspect' },
          h('h3', null, `Corner ${list.indexOf(cur) + 1}`, h('small', null, ` ${cur.x >= 0 ? '+' : ''}${cur.x}, ${cur.y >= 0 ? '+' : ''}${cur.y}`)),
          h('div', { class: 'meta' }, 'Picture on the way here'),
          orientPicker(cur.i),
          speedControl(cur.i),
          h(
            'div',
            { class: 'mpath-pop-actions' },
            h('button', { onclick: () => insertHere(cur.i), disabled: list.length >= max }, '+ Corner before'),
            h('button', { class: 'danger', onclick: deleteSelected }, 'Delete'),
          ),
        ),
      !disabled &&
        list.length > 0 &&
        h(
          'button',
          {
            class: 'mpath-clear',
            onclick: () => {
              clearPath(path());
              selected = -1;
              changed();
            },
          },
          'Clear path',
        ),
      !disabled &&
        h('p', { class: 'hint mpath-keys' }, 'Drag corners to move them · ←/→ pick a corner · ↑/↓ speed · R turn · S mirror · Delete / Backspace remove'),
    );
  }

  function renderNumbers(): void {
    renderPathNumbers(numbers, path(), kind(), changed, draw);
  }

  function renderAll(): void {
    renderTabs();
    renderToolbar();
    renderNotice();
    renderSide();
    renderNumbers();
    restartWalker();
  }

  let lastIndex = -1;
  function refresh(): void {
    spriteCache = new Map();
    choices = mapChoices(project, o.monFile);
    if (mapIdx >= choices.length) mapIdx = 0;
    if (!map && choices[mapIdx]?.map) loadMap();
    defaultStart();
    if (lastIndex !== o.index()) {
      lastIndex = o.index();
      if (tab === 1 && pathLength(mon().march[1]) === 0 && mon().activate === 0) tab = 0;
      selected = corners(path(), kind())[0]?.i ?? -1;
      hidePop();
      fitView();
    }
    mapLayer = undefined;
    renderAll();
  }

  loadMap();
  refresh();
  raf = requestAnimationFrame(loop);
  return { el, refresh, destroy: () => cancelAnimationFrame(raf) };
}
