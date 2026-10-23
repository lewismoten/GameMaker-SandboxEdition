// Map editor (MAPMAKER.EXE): paint background blocks onto the 100x100 map and place monsters.
import { rovingGrid } from '../../widgets/rovingGrid';
import { History } from '../../core/history';
import { registerEditor } from '../registry';
import { viewState } from '../../../urlState';
import { h, clear, selectField, toast, debounce, modal, download } from '../../core/ui';
import { blockButton } from '../../widgets/blockChooser';
import { blockCanvas, blockImages } from '../../core/draw';
import { paletteChooser } from '../blocks/blocks';
import type { FileKind, Project } from '../../core/project';
import { fileField, pickFile } from '../../widgets/filePicker';
import { BACKBL, BLEN, MONBL, newBlockSet, parseBlocks } from '../../../formats/blocks';
import { LASTMM, MLEN, MWID, parseMap, reindexMonsters, serializeMap } from '../../../formats/map';
import { LASTMON, parseMonsters, type Monster } from '../../../formats/monster';
import { normalize } from '../../../project/files';
import { WHOLE_MAP, contentBounds, dragRect, gameView, type BlockRect, type Handle } from './mapClip';
import { drawOverlay, type OverlayState } from './tools/overlay';
import { MapTools, type ToolMode } from './tools/toolController';
import { findBlock, floodCells, replaceAll } from './tools/cellOps';
import './mapExport.css';
import './tools/mapTools.css';

type Mode = 'paint' | 'fill' | 'pick' | 'monster' | 'pan' | ToolMode;
const TOOL_MODES = new Set<string>(['line', 'rect', 'select', 'terrain', 'stamp', 'building', 'paste']);
const isTool = (m: Mode): m is ToolMode => TOOL_MODES.has(m);

/** The tool buttons: mode, icon, name, key, what it does. */
const TOOLS: [Mode, string, string, string, string][] = [
  ['paint', '✎', 'Paint', 'B', 'Drag to paint the chosen block'],
  ['line', '╱', 'Line', 'L', 'Drag a straight line of the chosen block'],
  ['rect', '▭', 'Rectangle', 'R', 'Drag out a rectangle of the chosen block'],
  ['fill', '▣', 'Fill', 'F', 'Fill the area of one block with the chosen block'],
  ['pick', '⌖', 'Pick', 'I', 'Click a block on the map to paint with it (eyedropper)'],
  ['select', '⬚', 'Select', 'S', 'Drag over blocks to copy, cut, paste or save them as a stamp'],
  ['terrain', '⛰', 'Terrain', 'T', 'Paint grass, water or paths: edges and corners are chosen for you'],
  ['stamp', '★', 'Stamp', 'P', 'Place a saved stamp (a house, a tree…)'],
  ['building', '⌂', 'Building', 'H', 'Drag out a rectangle to build a house of that size from its parts'],
  ['monster', '👾', 'Monsters', 'M', 'Click to place the chosen monster; right-click to remove one'],
  ['pan', '✋', 'Scroll', '', 'Touch screens: drag to scroll the map instead of drawing'],
];

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
function sceneSet(project: Project, file: string): { bbl?: string; mon?: string; mbl?: string; scenes: number[] } {
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
  const urlZoom = Number(view.get('zoom'));
  let zoom = [0.5, 1, 2].includes(urlZoom) ? urlZoom : 1;
  let bgImgs: HTMLCanvasElement[] = [];
  const overlay: OverlayState = { grid: readPref('gm-map-grid'), found: [] };
  let finding = false;
  let monImgs: HTMLCanvasElement[] = [];
  const save = debounce(() => project.files.set(file, serializeMap(map)), 300);
  // undo: a snapshot of the whole map (about 22 KB) before each stroke, fill or monster change
  const history = new History<Uint8Array>();
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶ Undo');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷ Redo');
  const syncHistory = () => {
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };
  const remember = () => {
    history.record(serializeMap(map));
    syncHistory();
  };
  function step(back: boolean): void {
    const now = serializeMap(map);
    const to = back ? history.undo(now) : history.redo(now);
    if (!to) return;
    Object.assign(map, parseMap(to));
    syncHistory();
    draw();
    save();
  }

  const chooser = paletteChooser(project, set.bbl ?? file, () => rebuild());

  const canvas = h('canvas', { class: 'pixel', style: 'cursor:crosshair;display:block' });
  const over = h('canvas', { class: 'pixel mt-overlay', 'aria-hidden': 'true' });
  const scroller = h(
    'div',
    {
      tabindex: 0,
      role: 'region',
      'aria-label': 'The map (scroll with the arrow keys)',
      style: 'overflow:auto;max-height:max(280px, calc(var(--ws-vh, 100dvh) - 240px - var(--map-tools-h, 60px)));max-width:100%;border:1px solid var(--border);border-radius:6px;background:#000',
    },
    h('div', { class: 'mt-stack' }, canvas, over),
  );
  const ctx = canvas.getContext('2d')!;
  const redrawOverlay = () => {
    overlay.found = finding ? findBlock(map.blocks, brush) : [];
    drawOverlay(over, zoom, overlay, bgImgs);
  };
  const status = h('div', { class: 'meta' });
  const picker = rovingGrid(h('div', { class: 'block-picker', style: 'max-height:max(120px, calc((var(--ws-vh, 100dvh) - 280px - var(--map-tools-h, 60px) - var(--mt-panel-h, 0px)) * 0.55))' }), 'Blocks to paint with');
  const monPicker = rovingGrid(h('div', { class: 'block-picker', style: 'max-height:max(100px, calc((var(--ws-vh, 100dvh) - 280px - var(--map-tools-h, 60px) - var(--mt-panel-h, 0px)) * 0.4))' }), 'Monsters to place');
  const monCount = h('div', { class: 'meta' });

  // Links touching this map: where the character starts (to) and where scenes change (from).
  function linkMarks(): { x: number; y: number; kind: 'from' | 'to'; label: string }[] {
    const game = project.game();
    const marks: { x: number; y: number; kind: 'from' | 'to'; label: string }[] = [];
    const sceneIdx = new Set(set.scenes);
    game.scenes.forEach((s, i) =>
      s.links.forEach((l) => {
        if (l.toScene === 0xffff) return;
        if (sceneIdx.has(i)) marks.push({ ...l.from, kind: 'from', label: `to ${game.scenes[l.toScene]?.desc ?? l.toScene}` });
        if (sceneIdx.has(l.toScene)) marks.push({ ...l.to, kind: 'to', label: `start from ${s.desc}` });
      }),
    );
    return marks;
  }

  function rebuild(): void {
    bgImgs = blockImages(bg, chooser.palette);
    monImgs = blockImages(mblk, chooser.palette, true);
    clear(
      picker,
      ...bg.map((b, i) =>
        h(
          'button',
          {
            class: i === brush ? 'selected' : '',
            title: `Block ${i}`,
            onclick: () => ((brush = i), setMode(['paint', 'line', 'rect', 'fill', 'select'].includes(mode) ? mode : 'paint'), rebuildPickers(), redrawOverlay()),
          },
          blockCanvas(b.pixels, chooser.palette),
          h('small', null, i),
        ),
      ),
    );
    rebuildMonsters();
    draw();
  }

  function rebuildPickers(): void {
    [...picker.children].forEach((b, i) => b.classList.toggle('selected', i === brush));
  }

  function firstPic(m: Monster | undefined): number {
    const p = m?.pic[0]?.[0] ?? MONBL;
    return p >= 0 && p < MONBL ? p : -1;
  }

  function rebuildMonsters(): void {
    clear(
      monPicker,
      ...mons.map((m, i) => {
        const pic = firstPic(m);
        return h(
          'button',
          {
            class: mode === 'monster' && i === monBrush ? 'selected' : '',
            title: `Monster ${i}`,
            onclick: () => ((monBrush = i), setMode('monster'), rebuildMonsters()),
          },
          pic >= 0 ? blockCanvas(mblk[pic].pixels, chooser.palette, { transparent: true, className: 'checker' }) : h('span', null, '—'),
          h('small', null, i),
        );
      }),
    );
  }

  function draw(): void {
    const s = BLEN * zoom;
    canvas.width = MLEN * s;
    canvas.height = MWID * s;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) ctx.drawImage(bgImgs[map.blocks[y * MLEN + x]] ?? bgImgs[0], x * s, y * s, s, s);
    map.monsters.forEach((m) => {
      if (m.monnum >= LASTMON) return;
      const pic = firstPic(mons[m.monnum]);
      if (pic >= 0) ctx.drawImage(monImgs[pic], m.curx * s, m.cury * s, s, s);
      else {
        ctx.strokeStyle = '#f0f';
        ctx.strokeRect(m.curx * s + 2, m.cury * s + 2, s - 4, s - 4);
      }
    });
    monCount.textContent = `${map.monsters.filter((m) => m.monnum < LASTMON).length} of ${LASTMM} monster slots used`;
    for (const mk of linkMarks()) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = mk.kind === 'from' ? '#ffd400' : '#00e0ff';
      ctx.strokeRect(mk.x * s + 1, mk.y * s + 1, s - 2, s - 2);
    }
    redrawOverlay();
  }

  /** The map (or the part of it in `area`) at one pixel per block pixel, as the scene draws it. */
  function renderWhole(opts: { monsters: boolean; grid: boolean; links: boolean }, scale = 1, area: BlockRect = WHOLE_MAP): HTMLCanvasElement {
    const s = BLEN * scale;
    const c = h('canvas', { width: area.w * s, height: area.h * s });
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.translate(-area.x * s, -area.y * s);
    for (let y = area.y; y < area.y + area.h; y++)
      for (let x = area.x; x < area.x + area.w; x++) g.drawImage(bgImgs[map.blocks[y * MLEN + x]] ?? bgImgs[0], x * s, y * s, s, s);
    if (opts.monsters)
      for (const m of map.monsters) {
        if (m.monnum >= LASTMON) continue;
        const pic = firstPic(mons[m.monnum]);
        if (pic >= 0) g.drawImage(monImgs[pic], m.curx * s, m.cury * s, s, s);
      }
    if (opts.grid) {
      g.fillStyle = 'rgba(255,255,255,0.22)';
      for (let i = 1; i < MLEN && s >= 8; i++) g.fillRect(i * s, 0, 1, MWID * s);
      for (let i = 1; i < MWID && s >= 8; i++) g.fillRect(0, i * s, MLEN * s, 1);
      g.fillStyle = 'rgba(255,212,0,0.55)'; // every 10 blocks, to count by
      for (let i = 10; i < MLEN; i += 10) g.fillRect(i * s, 0, 1, MWID * s);
      for (let i = 10; i < MWID; i += 10) g.fillRect(0, i * s, MLEN * s, 1);
    }
    if (opts.links)
      for (const mk of linkMarks()) {
        g.lineWidth = Math.max(1, 2 * scale);
        g.strokeStyle = mk.kind === 'from' ? '#ffd400' : '#00e0ff';
        g.strokeRect(mk.x * s + 1, mk.y * s + 1, s - 2, s - 2);
      }
    return c;
  }

  async function exportImage(): Promise<void> {
    const opts = { monsters: true, grid: false, links: false };
    const level = contentBounds(
      map.blocks,
      map.monsters.filter((m) => m.monnum < LASTMON).map((m) => ({ x: m.curx, y: m.cury })),
    );
    // where the character can start in this map (the game shows a screen round it)
    const starts = linkMarks()
      .filter((m) => m.kind === 'to')
      .filter((m, i, all) => all.findIndex((o) => o.x === m.x && o.y === m.y) === i);
    const startChoices: [number, string][] = starts.length
      ? starts.map((m, i) => [i, `${m.label} (${m.x}, ${m.y})`])
      : [[0, `the middle of the level (${level.x + (level.w >> 1)}, ${level.y + (level.h >> 1)})`]];
    const startAt = (i: number) => starts[i] ?? { x: level.x + (level.w >> 1), y: level.y + (level.h >> 1) };
    type AreaMode = 'whole' | 'level' | 'screen';
    let mode: AreaMode = level.w < MLEN || level.h < MWID ? 'level' : 'whole';
    let start = 0;
    let screens = 1;
    let scale = 1;
    let area: BlockRect = mode === 'level' ? { ...level } : { ...WHOLE_MAP };
    const PREVIEW = 4; // preview pixels per block

    await modal<void>('Download a picture of the map', (close) => {
      let shot = renderWhole(opts, PREVIEW / BLEN);
      shot.className = 'pixel map-export-shot';
      const frame = h('div', { class: 'map-export-frame' });
      for (const hd of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as Handle[])
        frame.append(h('span', { class: `map-export-handle h-${hd}`, dataset: { handle: hd } }));
      const preview = h('div', { class: 'map-export-preview' }, shot, frame);
      const info = h('p', { class: 'meta map-export-info' });
      const modeBar = h('div', { class: 'map-export-modes', role: 'radiogroup', 'aria-label': 'Which part of the map' });
      const screenOpts = h('div', { class: 'map-export-screen row' });
      const scaleSel = selectField(
        'Picture size',
        [
          [1, '1× (a block is 20 pixels)'],
          [2, '2×'],
          [3, '3×'],
        ],
        () => scale,
        (v) => ((scale = v), refresh()),
      );
      const fixed = () => mode === 'screen';
      const refresh = () => {
        const p = (v: number) => `${(v / MLEN) * 100}%`;
        Object.assign(frame.style, { left: p(area.x), top: p(area.y), width: p(area.w), height: `${(area.h / MWID) * 100}%` });
        frame.classList.toggle('fixed', fixed());
        frame.title = fixed() ? 'Drag to move the screen' : 'Drag to move; drag an edge or corner to resize';
        info.textContent = `Blocks ${area.x}–${area.x + area.w - 1} across, ${area.y}–${area.y + area.h - 1} down (${area.w}×${area.h}): a ${area.w * BLEN * scale}×${area.h * BLEN * scale} PNG picture.`;
        [...modeBar.children].forEach((b) => b.setAttribute('aria-checked', String((b as HTMLElement).dataset.mode === mode)));
        screenOpts.hidden = mode !== 'screen';
      };
      const setMode = (m: AreaMode) => {
        mode = m;
        area = m === 'whole' ? { ...WHOLE_MAP } : m === 'level' ? { ...level } : gameView(startAt(start), { w: screens, h: screens });
        if (m === 'screen' && scale === 1) scale = 2;
        scaleSel.querySelector('select')!.value = String(scale);
        refresh();
      };
      const modeBtn = (m: AreaMode, label: string, title: string) =>
        h('button', { role: 'radio', dataset: { mode: m }, title, onclick: () => setMode(m) }, label);
      modeBar.append(
        modeBtn('whole', 'Whole map', `All ${MLEN}×${MWID} blocks`),
        modeBtn('level', 'Just the level', 'Leaves out the background fill round the level, which the character never sees'),
        modeBtn('screen', 'Game screen', 'One screen as the game shows it when the character starts there (a screenshot)'),
      );
      screenOpts.append(
        selectField(
          'Start point',
          startChoices,
          () => start,
          (v) => ((start = v), setMode('screen')),
        ),
        selectField(
          'Size',
          [
            [1, '1 screen (16×10 blocks)'],
            [2, '2×2 screens'],
            [3, '3×3 screens'],
          ],
          () => screens,
          (v) => ((screens = v), setMode('screen')),
        ),
      );
      // drag the frame, its edges or its corners (in whole blocks)
      frame.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        frame.setPointerCapture(e.pointerId);
        const handle = ((e.target as HTMLElement).dataset.handle as Handle | undefined) ?? 'move';
        const r = preview.getBoundingClientRect();
        const from = { ...area };
        const move = (ev: PointerEvent) => {
          const dx = Math.round(((ev.clientX - e.clientX) / r.width) * MLEN);
          const dy = Math.round(((ev.clientY - e.clientY) / r.height) * MWID);
          area = dragRect(from, handle, dx, dy, fixed());
          if (mode === 'whole' && (area.w < MLEN || area.h < MWID)) mode = 'level';
          refresh();
        };
        const up = () => (frame.removeEventListener('pointermove', move), frame.removeEventListener('pointerup', up));
        frame.addEventListener('pointermove', move);
        frame.addEventListener('pointerup', up);
      });
      const opt = (label: string, k: keyof typeof opts) => {
        const input = h('input', { type: 'checkbox', checked: opts[k], style: 'width:auto;margin:0' });
        input.addEventListener('change', () => {
          opts[k] = input.checked;
          const c = renderWhole(opts, PREVIEW / BLEN);
          c.className = shot.className;
          shot.replaceWith(c);
          shot = c;
        });
        return h('label', { style: 'display:flex;flex-direction:row;align-items:center;gap:8px;font-weight:normal' }, input, label);
      };
      setMode(mode);
      return h(
        'div',
        { class: 'stack map-export' },
        modeBar,
        screenOpts,
        preview,
        info,
        h(
          'div',
          { class: 'map-export-opts' },
          h(
            'div',
            { class: 'stack', style: 'gap:4px' },
            opt('Monsters where they start', 'monsters'),
            opt('Block grid (yellow lines every 10 blocks)', 'grid'),
            opt('Scene links and start points', 'links'),
          ),
          scaleSel,
        ),
        h(
          'div',
          { class: 'buttons' },
          h('button', { onclick: () => close(undefined) }, 'Cancel'),
          h(
            'button',
            {
              class: 'primary',
              onclick: () =>
                renderWhole(opts, scale, area).toBlob(async (b) => {
                  if (!b) return toast('The picture could not be made.', 'error');
                  const suffix = mode === 'screen' ? 'screen' : area.w === MLEN && area.h === MWID ? 'map' : 'level';
                  download(`${file.replace(/\.map$/i, '')}-${suffix}.png`, new Uint8Array(await b.arrayBuffer()), 'image/png');
                  close(undefined);
                }, 'image/png'),
            },
            '⤓ Download PNG',
          ),
        ),
      );
    });
  }

  const cell = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const clamp = (v: number, n: number) => Math.max(0, Math.min(n - 1, v));
    return { x: clamp(Math.floor(((e.clientX - r.left) / r.width) * MLEN), MLEN), y: clamp(Math.floor(((e.clientY - r.top) / r.height) * MWID), MWID) };
  };
  let painting = false;

  function paintCell(x: number, y: number, v = brush): void {
    if (x < 0 || y < 0 || x >= MLEN || y >= MWID) return;
    map.blocks[y * MLEN + x] = v;
    const s = BLEN * zoom;
    ctx.drawImage(bgImgs[v], x * s, y * s, s, s);
  }

  /** Cells the tools changed: draw just them (with the links over them) and save. */
  function changedCells(cells: number[]): void {
    if (!cells.length) return;
    const s = BLEN * zoom;
    for (const i of cells) ctx.drawImage(bgImgs[map.blocks[i]] ?? bgImgs[0], (i % MLEN) * s, Math.floor(i / MLEN) * s, s, s);
    if (cells.length > 400) draw();
    else redrawOverlay();
    save();
  }

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
      remember,
      changed: changedCells,
      overlay,
      drawOverlay: redrawOverlay,
      setMode: (m) => setMode(m),
    },
    h('div', { class: 'stack mt-panel', role: 'region', 'aria-label': 'Tool options' }),
  );

  function placeMonster(x: number, y: number, remove: boolean): void {
    const at = map.monsters.findIndex((m) => m.monnum < LASTMON && m.curx === x && m.cury === y);
    if (at >= 0) map.monsters[at].monnum = LASTMON;
    if (!remove) {
      const slot = map.monsters.findIndex((m) => m.monnum >= LASTMON);
      if (slot < 0) {
        toast(`A map holds at most ${LASTMM} monsters.`, 'error');
        return;
      }
      Object.assign(map.monsters[slot], { monnum: monBrush, curx: x, cury: y });
    }
    reindexMonsters(map);
    draw();
    save();
  }

  function floodFill(x: number, y: number): void {
    if (map.blocks[y * MLEN + x] === brush) return;
    const cells = floodCells(map.blocks, { x, y }).map((c) => c.y * MLEN + c.x);
    for (const i of cells) map.blocks[i] = brush;
    changedCells(cells);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (mode === 'pan') return;
    const p = cell(e);
    if (isTool(mode)) {
      canvas.setPointerCapture(e.pointerId);
      tools.pointerDown(p, e.button);
      return;
    }
    if (mode !== 'pick') remember();
    if (mode === 'monster') {
      placeMonster(p.x, p.y, e.button === 2);
      return;
    }
    if (mode === 'pick') {
      brush = map.blocks[p.y * MLEN + p.x];
      rebuildPickers();
      setMode('paint');
      redrawOverlay();
      return;
    }
    if (mode === 'fill') {
      floodFill(p.x, p.y);
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    painting = true;
    paintCell(p.x, p.y);
  });
  let lastPaint: { x: number; y: number } | undefined;
  canvas.addEventListener('pointermove', (e) => {
    const p = cell(e);
    const b = map.blocks[p.y * MLEN + p.x];
    const mon = map.monsters.find((m) => m.monnum < LASTMON && m.curx === p.x && m.cury === p.y);
    const marks = linkMarks().filter((m) => m.x === p.x && m.y === p.y);
    status.textContent = `(${p.x}, ${p.y}) block ${b}${mon ? ` · monster ${mon.monnum}` : ''}${marks.map((m) => ` · link ${m.label}`).join('')}${finding ? ` · block ${brush} is used ${overlay.found.length} times` : ''}`;
    if (isTool(mode)) return tools.pointerMove(p, e.buttons);
    if (!painting || !canvas.hasPointerCapture(e.pointerId)) return;
    // a fast stroke skips cells: fill them in along a line
    const from = lastPaint ?? p;
    const n = Math.max(Math.abs(p.x - from.x), Math.abs(p.y - from.y));
    for (let k = 1; k <= n; k++) paintCell(Math.round(from.x + ((p.x - from.x) * k) / n), Math.round(from.y + ((p.y - from.y) * k) / n));
    paintCell(p.x, p.y);
    lastPaint = p;
  });
  canvas.addEventListener('pointerdown', (e) => (lastPaint = cell(e)));
  const endStroke = (e: PointerEvent) => {
    if (isTool(mode)) return tools.pointerUp(cell(e));
    if (painting) {
      painting = false;
      lastPaint = undefined;
      redrawOverlay();
      save();
    }
  };
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('pointerleave', () => tools.leave());
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const pressed = (on: boolean) => ({ 'aria-pressed': String(on) });
  const gridBtn = h('button', { type: 'button', class: 'mt-tool', 'aria-label': 'Grid', title: 'Show the block grid (G)', onclick: () => toggleGrid() }, '#', h('span', { class: 'mt-label' }, 'Grid'));
  const findBtn = h('button', { type: 'button', class: 'mt-tool', 'aria-label': 'Find', title: 'Highlight every use of the chosen block', onclick: () => toggleFind() }, '🔍', h('span', { class: 'mt-label' }, 'Find'));
  const replaceBtn = h('button', { type: 'button', class: 'mt-tool', 'aria-label': 'Replace…', title: 'Replace every use of one block with another', onclick: () => void replaceDialog() }, '⇄', h('span', { class: 'mt-label' }, 'Replace…'));
  function syncToggles(): void {
    for (const [b, on] of [
      [gridBtn, overlay.grid],
      [findBtn, finding],
    ] as const)
      Object.entries(pressed(on)).forEach(([k, v]) => b.setAttribute(k, v));
  }
  function toggleGrid(): void {
    overlay.grid = !overlay.grid;
    writePref('gm-map-grid', overlay.grid);
    syncToggles();
    redrawOverlay();
  }
  function toggleFind(): void {
    finding = !finding;
    syncToggles();
    redrawOverlay();
    if (finding) toast(`Block ${brush} is used ${overlay.found.length} time${overlay.found.length === 1 ? '' : 's'} on this map.`);
  }
  async function replaceDialog(): Promise<void> {
    let from = brush;
    let to = brush;
    const go = await modal<boolean>('Replace a block everywhere', (close) => {
      const count = h('p', { class: 'meta', 'aria-live': 'polite' });
      const sync = () => (count.textContent = `Block ${from} is used ${findBlock(map.blocks, from).length} times on this map.`);
      const pick = (label: string, get: () => number, set: (v: number) => void) => {
        const b = blockButton(() => bg, () => chooser.palette, get, (v) => (set(v), sync()), { title: label, transparent: false });
        b.setAttribute('aria-label', label);
        return h('div', { class: 'field' }, h('span', null, label), b);
      };
      sync();
      return h(
        'div',
        { class: 'stack' },
        h('div', { class: 'toolbar' }, pick('Replace block', () => from, (v) => (from = v)), h('span', { 'aria-hidden': 'true' }, '→'), pick('With block', () => to, (v) => (to = v))),
        count,
        h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(false) }, 'Cancel'), h('button', { type: 'button', class: 'primary', onclick: () => close(true) }, 'Replace all')),
      );
    });
    if (!go || from === to) return;
    remember();
    const n = replaceAll(map.blocks, from, to);
    draw();
    save();
    toast(`Replaced block ${from} with block ${to} in ${n} place${n === 1 ? '' : 's'}.`);
  }
  syncToggles();

  const modeBar = h('div', { class: 'toolbar mt-modes' });
  function setMode(m: Mode): void {
    mode = m;
    canvas.style.touchAction = m === 'pan' ? 'auto' : 'none';
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
              onclick: () => (setMode(k), rebuildMonsters()),
            },
            icon,
            h('span', { class: 'mt-label' }, label),
          ),
        ),
      ),
      h('span', { style: 'flex:1' }),
      gridBtn,
      findBtn,
      replaceBtn,
      undoBtn,
      redoBtn,
    );
    tools.enter(isTool(m) ? m : undefined);
    canvas.style.cursor = m === 'pan' ? 'grab' : m === 'pick' ? 'copy' : 'crosshair';
  }
  setMode('paint');

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

  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      'Drag to paint blocks. Terrain paints edges and corners for you, Building drags out a house of any size, and Select copies blocks to paste or keep as a stamp. In Monsters, click to place the chosen monster and right-click to remove one. Yellow squares are links to other scenes; blue squares are where the character starts.',
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
      { class: 'toolbar', style: 'margin-bottom:8px' },
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
      selectField(
        'Zoom',
        [
          [0.5, '50%'],
          [1, '100%'],
          [2, '200%'],
        ] as [number, string][],
        () => zoom,
        (v) => ((zoom = v), view.set({ zoom: v === 1 ? undefined : v }), draw()),
      ),
      h('button', { onclick: () => void exportImage(), title: 'Save the map, just the level, or one game screen as a picture' }, '🖼 Download map picture'),
    ),
    h(
      'div',
      { class: 'row' },
      h('div', { class: 'stack', style: 'flex:1 1 480px;min-width:0' }, modeBar, scroller, status),
      h('div', { class: 'stack mt-side-col', style: 'flex:0 1 260px' }, tools.panel, h('strong', null, 'Blocks'), picker, h('strong', null, 'Monsters'), monPicker, monCount),
    ),
  );
  rebuild();
  // the map and the pickers give up the height of a file toolbar that wraps onto a second row
  const fieldsBar = scroller.closest('.row')?.previousElementSibling as HTMLElement | null;
  const barSize = new ResizeObserver(() => fieldsBar && host.style.setProperty('--map-tools-h', `${fieldsBar.offsetHeight}px`));
  if (fieldsBar) barSize.observe(fieldsBar);
  // the blocks and monsters give up the height of the tool panel above them
  const panelSize = new ResizeObserver(() => host.style.setProperty('--mt-panel-h', `${tools.panel.hidden ? 0 : tools.panel.offsetHeight + 8}px`));
  panelSize.observe(tools.panel);
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement || t?.closest('dialog')) return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey || e.metaKey) {
      if (k === 'z' || k === 'y') {
        e.preventDefault();
        step(k === 'z' && !e.shiftKey);
      } else if ((k === 'c' || k === 'x') && tools.selection && !window.getSelection()?.toString()) {
        e.preventDefault();
        tools.copy(k === 'x');
      } else if (k === 'v') {
        e.preventDefault();
        tools.paste();
      }
      return;
    }
    if (e.altKey) return;
    if (e.key === 'Escape' && tools.cancel()) return e.preventDefault();
    if ((e.key === 'Delete' || e.key === 'Backspace') && tools.selection && mode === 'select') {
      e.preventDefault();
      return tools.fillSelection();
    }
    if (k === 'g' && !e.shiftKey) return toggleGrid();
    const tool = TOOLS.find(([, , , key]) => key && key.toLowerCase() === k);
    if (tool && !e.shiftKey) {
      setMode(tool[0]);
      rebuildMonsters();
    }
  };
  window.addEventListener('keydown', onKey);
  // Open where the address says, else where the action is: where the character starts, else the first placed monster.
  requestAnimationFrame(() => {
    const urlX = view.num('x');
    const urlY = view.num('y');
    const start = linkMarks().find((m) => m.kind === 'to') ?? map.monsters.find((m) => m.monnum < LASTMON) ?? undefined;
    const at = urlX !== undefined && urlY !== undefined ? { x: urlX, y: urlY } : start ? ('curx' in start ? { x: start.curx, y: start.cury } : start) : undefined;
    if (at) {
      const s = BLEN * zoom;
      scroller.scrollTo({ left: at.x * s - scroller.clientWidth / 2, top: at.y * s - scroller.clientHeight / 2 });
    }
    // from now on, scrolling updates the address (once it settles)
    let settle: ReturnType<typeof setTimeout> | undefined;
    scroller.addEventListener('scroll', () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        const s = BLEN * zoom;
        view.set({ x: Math.round((scroller.scrollLeft + scroller.clientWidth / 2) / s), y: Math.round((scroller.scrollTop + scroller.clientHeight / 2) / s) });
      }, 300);
    });
  });
  return () => {
    window.removeEventListener('keydown', onKey);
    barSize.disconnect();
    panelSize.disconnect();
  };
});
