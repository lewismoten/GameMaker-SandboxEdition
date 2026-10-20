// The monster path editor: draw a monster's path (or attack path) with the mouse right on a
// map of a scene that uses the monster set, pick the picture (orientation) and speed for each
// stretch, and watch the monster walk it exactly as playgame moves it.
import './monsterPath.css';
import { h, clear, modal, toast } from '../ui';
import { blockImages, paintBlock } from '../draw';
import type { Project } from '../project';
import { BACKBL, BLEN, MONBL, parseBlocks, type Block } from '../../formats/blocks';
import { MLEN, MWID, parseMap, type GameMap } from '../../formats/map';
import { MAXMARCH, type Monster } from '../../formats/monster';
import { parsePalette, type Palette } from '../../formats/palette';
import { normalize } from '../../project/files';
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

export const ORIENTS: [number, string][] = [
  [0, 'Normal'],
  [1, 'Turned right'],
  [2, 'Upside down'],
  [3, 'Turned left'],
  [4, 'Mirrored'],
  [5, 'Mirrored, turned right'],
  [6, 'Flipped'],
  [7, 'Mirrored, turned left'],
];

const SCALE = 2; // canvas pixels per block pixel
const CELL = BLEN * SCALE;
const MAX_SPEED = 50;
const TICK_MS = 1000 / 18.2;

interface MapChoice {
  label: string;
  map?: string;
  bbl?: string;
  pal?: string;
}

export interface PathEditorOptions {
  project: Project;
  monFile: string;
  monsters: Monster[];
  index: () => number;
  mblk: () => Block[];
  palette: () => Palette;
  /** Called after every change to the monster (marks it used and saves). */
  onEdit: () => void;
}

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

  // ---- Maps: the scenes that use this monster set -------------------------------------
  function mapChoices(): MapChoice[] {
    const game = project.game();
    const out: MapChoice[] = [];
    const n = normalize(o.monFile);
    game.scenes.forEach((s, i) => {
      if (normalize(s.files[3] || '') !== n || !s.files[1] || !project.files.has(s.files[1])) return;
      out.push({ label: `${s.desc || `Scene ${i + 1}`} — ${s.files[1].toUpperCase()}`, map: s.files[1], bbl: s.files[2], pal: s.files[0] });
    });
    if (!out.length) {
      const bbl = project.files.byExtension('bbl')[0];
      for (const m of project.files.byExtension('map')) out.push({ label: m.toUpperCase(), map: m, bbl });
    }
    out.push({ label: 'No map (plain grid)' });
    return out;
  }
  let choices = mapChoices();

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
  const stage = h('div', { class: 'mpath-stage' }, canvas, pop);
  const readout = h('div', { class: 'mpath-readout' });
  const tabsEl = h('div', { class: 'mpath-tabs', role: 'tablist' });
  const toolbar = h('div', { class: 'mpath-toolbar' });
  const notice = h('div', { class: 'mpath-notice' });
  const side = h('div', { class: 'mpath-side' });
  const numbers = h('details', { class: 'mpath-numbers' });
  const el = h(
    'section',
    { class: 'panel mpath' },
    tabsEl,
    toolbar,
    notice,
    h('div', { class: 'mpath-body' }, h('div', { class: 'mpath-left' }, stage, readout), side),
    numbers,
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

  // ---- Drawing ----------------------------------------------------------------------------
  function buildMapLayer(): void {
    const b = box();
    const c = document.createElement('canvas');
    c.width = b.w * BLEN;
    c.height = b.h * BLEN;
    const g = c.getContext('2d')!;
    g.fillStyle = '#000';
    g.fillRect(0, 0, c.width, c.height);
    if (map && mapImgs.length) {
      for (let cy = 0; cy < b.h; cy++)
        for (let cx = 0; cx < b.w; cx++) {
          const mx = (((start.x + b.x0 + cx) % MLEN) + MLEN) % MLEN;
          const my = (((start.y + b.y0 + cy) % MWID) + MWID) % MWID;
          const img = mapImgs[map.blocks[my * MLEN + mx]];
          if (img) g.drawImage(img, cx * BLEN, cy * BLEN);
        }
    } else {
      g.fillStyle = '#0a0a2a';
      g.fillRect(0, 0, c.width, c.height);
    }
    mapLayer = c;
  }

  /** Canvas pixel centre of a spot given in blocks from the origin. */
  const cx = (x: number) => (x - box().x0) * CELL + CELL / 2;
  const cy = (y: number) => (y - box().y0) * CELL + CELL / 2;

  function arrow(x1: number, y1: number, x2: number, y2: number, color: string, dashed = false): void {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.setLineDash(dashed ? [8, 8] : []);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > CELL * 0.6) {
      const a = Math.atan2(y2 - y1, x2 - x1);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(mx + Math.cos(a) * 9, my + Math.sin(a) * 9);
      ctx.lineTo(mx + Math.cos(a + 2.5) * 10, my + Math.sin(a + 2.5) * 10);
      ctx.lineTo(mx + Math.cos(a - 2.5) * 10, my + Math.sin(a - 2.5) * 10);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fill();
    }
    ctx.restore();
  }

  function badge(x: number, y: number, text: string, bgc: string, fg = '#000'): void {
    ctx.font = 'bold 13px ui-monospace, Menlo, Consolas, monospace';
    const w = Math.max(16, ctx.measureText(text).width + 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 1, y - 1, w + 2, 18);
    ctx.fillStyle = bgc;
    ctx.fillRect(x, y, w, 16);
    ctx.fillStyle = fg;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + 8.5);
  }

  function draw(): void {
    const b = box();
    if (canvas.width !== b.w * CELL) canvas.width = b.w * CELL;
    if (canvas.height !== b.h * CELL) canvas.height = b.h * CELL;
    canvas.style.aspectRatio = `${b.w} / ${b.h}`;
    if (!mapLayer || mapLayer.width !== b.w * BLEN) buildMapLayer();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mapLayer!, 0, 0, canvas.width, canvas.height);
    const k = kind();
    const disabled = tab === 1 && mon().activate === 0;

    // Faint grid so corners clearly snap to blocks.
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < b.w; i++) (ctx.moveTo(i * CELL + 0.5, 0), ctx.lineTo(i * CELL + 0.5, canvas.height));
    for (let i = 1; i < b.h; i++) (ctx.moveTo(0, i * CELL + 0.5), ctx.lineTo(canvas.width, i * CELL + 0.5));
    ctx.stroke();

    if (disabled) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // The 8x5-block range in which the character triggers (and keeps up) an attack.
    if (k === 'chase') {
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255,80,80,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx(-7) - CELL / 2, cy(-4) - CELL / 2, 15 * CELL, 9 * CELL);
      ctx.restore();
    }

    const list = corners(path(), k);
    // Lines and arrows.
    let px = 0;
    let py = 0;
    list.forEach((c, n) => {
      const sel = c.i === selected;
      const from = n === 0 && k === 'chase' ? undefined : { x: px, y: py };
      if (from) arrow(cx(from.x), cy(from.y), cx(c.x), cy(c.y), sel ? '#00e0ff' : '#ffd400');
      px = c.x;
      py = c.y;
    });
    // Where the next lap goes: corners are measured from wherever the lap starts.
    if (list.length && k !== 'chase') {
      const lastC = list[list.length - 1];
      if (lastC.x !== 0 || lastC.y !== 0) arrow(cx(lastC.x), cy(lastC.y), cx(lastC.x + list[0].x), cy(lastC.y + list[0].y), 'rgba(255,212,0,0.55)', true);
    }

    // The origin: the start block, or the character for chase paths.
    const ox = cx(0) - CELL / 2;
    const oy = cy(0) - CELL / 2;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(ox + 1.5, oy + 1.5, CELL - 3, CELL - 3);
    ctx.strokeStyle = k === 'chase' ? '#ff5050' : '#40ff60';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox + 2, oy + 2, CELL - 4, CELL - 4);
    badge(ox + 2, oy + CELL - 18, k === 'chase' ? '☺' : 'S', k === 'chase' ? '#ff5050' : '#40ff60');

    // Corners: the monster's picture as it heads there.
    ants = (ants + 1) % 16;
    list.forEach((c, n) => {
      const x = cx(c.x) - CELL / 2;
      const y = cy(c.y) - CELL / 2;
      const s = sprite(firstPic(), c.orient);
      ctx.globalAlpha = c.i === selected ? 0.95 : 0.6;
      if (s) ctx.drawImage(s, x, y, CELL, CELL);
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.lineWidth = 2;
      if (c.i === selected) {
        ctx.setLineDash([5, 3]);
        ctx.lineDashOffset = -ants;
        ctx.strokeStyle = '#00e0ff';
      } else ctx.strokeStyle = 'rgba(255,212,0,0.9)';
      ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
      ctx.restore();
      badge(x + 1, y + 1, String(n + 1), c.i === selected ? '#00e0ff' : '#ffd400');
    });

    if (hover) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx(hover.x) - CELL / 2 + 0.5, cy(hover.y) - CELL / 2 + 0.5, CELL - 1, CELL - 1);
    }

    // The walking monster.
    if (walker && list.length) {
      const pic = walker.frame < mon().pic.length ? (mon().pic[walker.frame]?.[0] ?? -1) : -1;
      const s = sprite(pic, walker.orient);
      const wx = (walker.bx - start.x - b.x0) * CELL + walker.px * SCALE;
      const wy = (walker.by - start.y - b.y0) * CELL + walker.py * SCALE;
      if (s) ctx.drawImage(s, wx, wy, CELL, CELL);
    }
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
    renderSide();
    renderNumbers();
    dirty = true;
  }

  function cellAt(e: PointerEvent | MouseEvent): { x: number; y: number } {
    const r = canvas.getBoundingClientRect();
    const b = box();
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

  function segmentAt(e: PointerEvent): Corner | undefined {
    const r = canvas.getBoundingClientRect();
    const b = box();
    const bx = ((e.clientX - r.left) / r.width) * b.w + b.x0 - 0.5;
    const by = ((e.clientY - r.top) / r.height) * b.h + b.y0 - 0.5;
    let best: Corner | undefined;
    let bestD = 0.45;
    let p = { x: 0, y: 0 };
    corners(path(), kind()).forEach((c, n) => {
      if (!(n === 0 && kind() === 'chase')) {
        const vx = c.x - p.x;
        const vy = c.y - p.y;
        const l2 = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((bx - p.x) * vx + (by - p.y) * vy) / l2));
        const d = Math.hypot(bx - (p.x + t * vx), by - (p.y + t * vy));
        if (d < bestD) ((bestD = d), (best = c));
      }
      p = c;
    });
    return best;
  }

  let drag: { i: number; moved: boolean; added: boolean; from: { x: number; y: number } } | undefined;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (tab === 1 && mon().activate === 0) return;
    canvas.focus();
    hidePop();
    const spot = cellAt(e);
    const hit = cornerAt(spot) ?? segmentAt(e);
    if (hit) {
      selected = hit.i;
      drag = { i: hit.i, moved: false, added: false, from: spot };
      // Segments select without dragging.
      if (hit.x !== spot.x || hit.y !== spot.y) drag = undefined;
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
    const c = corners(path(), kind()).find((x) => x.i === i);
    if (!c) return;
    const b = box();
    const left = ((c.x - b.x0 + 1) / b.w) * 100;
    const top = ((c.y - b.y0 + 1) / b.h) * 100;
    clear(
      pop,
      h(
        'div',
        { class: 'mpath-pop-head' },
        h('strong', null, `Corner ${corners(path(), kind()).indexOf(c) + 1}`),
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
            mapLayer = undefined;
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
        h('div', { class: 'mpath-row' }, startSel, map && h('button', { onclick: pickStart, title: 'Pick the start block on the whole map' }, 'Pick on map…')),
      ),
      h(
        'button',
        { class: playing ? 'primary mpath-play' : 'mpath-play', onclick: togglePlay, title: 'Play or pause the preview (Space)' },
        playing ? '❚❚ Pause' : '▶ Play',
      ),
      h('button', { onclick: restartWalker, title: 'Start the walk over' }, '↺ Restart'),
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
                  mapLayer = undefined;
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
          h('h4', null, `Corner ${list.indexOf(cur) + 1}`, h('small', null, ` ${cur.x >= 0 ? '+' : ''}${cur.x}, ${cur.y >= 0 ? '+' : ''}${cur.y}`)),
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
    const k = kind();
    const p = path();
    const list = corners(p, k);
    const num = (get: () => number, set: (v: number) => void, min: number, max: number) => {
      const i = h('input', { type: 'number', value: String(get()), min, max });
      i.addEventListener('change', () => {
        const v = Math.max(min, Math.min(max, Math.round(Number(i.value) || 0)));
        i.value = String(v);
        set(v);
        changed();
        draw();
      });
      return i;
    };
    const b = box();
    const open = numbers.open;
    clear(
      numbers,
      h('summary', null, 'Exact numbers'),
      list.length
        ? h(
            'table',
            { class: 'data' },
            h(
              'thead',
              null,
              h('tr', null, h('th', null, '#'), h('th', null, 'Across'), h('th', null, 'Down'), h('th', null, 'Speed'), h('th', null, 'Picture')),
            ),
            h(
              'tbody',
              null,
              ...list.map((c, n) => {
                const sel = h('select', null, ...ORIENTS.map(([v, l]) => h('option', { value: String(v), selected: v === c.orient }, l)));
                sel.addEventListener('change', () => {
                  p[c.i].orient = Number(sel.value);
                  changed();
                });
                return h(
                  'tr',
                  null,
                  h('td', null, n + 1),
                  h(
                    'td',
                    null,
                    num(
                      () => c.x,
                      (v) => moveCorner(p, k, c.i, v, corners(p, k).find((x) => x.i === c.i)!.y),
                      b.x0,
                      b.x0 + b.w - 1,
                    ),
                  ),
                  h(
                    'td',
                    null,
                    num(
                      () => c.y,
                      (v) => moveCorner(p, k, c.i, corners(p, k).find((x) => x.i === c.i)!.x, v),
                      b.y0,
                      b.y0 + b.h - 1,
                    ),
                  ),
                  h(
                    'td',
                    null,
                    num(
                      () => c.speed,
                      (v) => (p[c.i].pic = v),
                      1,
                      MAX_SPEED,
                    ),
                  ),
                  h('td', null, sel),
                );
              }),
            ),
          )
        : h('p', { class: 'hint' }, 'No corners yet.'),
    );
    numbers.open = open;
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
    choices = mapChoices();
    if (mapIdx >= choices.length) mapIdx = 0;
    if (!map && choices[mapIdx]?.map) loadMap();
    defaultStart();
    if (lastIndex !== o.index()) {
      lastIndex = o.index();
      if (tab === 1 && pathLength(mon().march[1]) === 0 && mon().activate === 0) tab = 0;
      selected = corners(path(), kind())[0]?.i ?? -1;
      hidePop();
    }
    mapLayer = undefined;
    renderAll();
  }

  loadMap();
  refresh();
  raf = requestAnimationFrame(loop);
  return { el, refresh, destroy: () => cancelAnimationFrame(raf) };
}
