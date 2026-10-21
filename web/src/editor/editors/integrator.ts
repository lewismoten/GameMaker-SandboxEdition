// Integrator (GRATOR.EXE): the game's scenes, the files each uses, and the links between them.
// The scenes are cards on a zoomable board: each shows what the player first sees there
// (a level's map around the block the hero arrives on, the title screen, the won/lost
// screens). Card positions are the .GAM's integrator coordinates, so the DOS integrator
// shows the same arrangement.
import './integrator.css';
import { registerEditor } from './index';
import { h, clear, selectField, textField, numberField, modal, confirmDialog, download, toast } from '../ui';
import { blockImages } from '../draw';
import type { FileKind, Project } from '../project';
import { fileField } from '../filePicker';
import { GameFiles } from '../../project/files';
import { mountPlayer, type PlayerHandle } from '../../player/player';
import {
  ADVTYPE,
  ENDTYPE,
  GRAPHIC_EXTS,
  MAXSCENELINKS,
  NOSCENE,
  SCENEDESCLEN,
  STARTTYPE,
  emptyScene,
  serializeGame,
  fileSlotsFor,
  sceneKind,
  slotExtensions,
  type Game,
  type Point,
  type Scene,
} from '../../formats/game';
import { BACKBL, newBlockSet, parseBlocks } from '../../formats/blocks';
import { MLEN, MWID, newMap, parseMap, serializeMap } from '../../formats/map';
import { defaultPalette, parsePalette } from '../../formats/palette';
import { WORLD, CARD_UNITS, arrangements, clampPos, spreadOut, type Arrangement } from '../integratorLayout';
import { graphicShot, levelShot } from '../integratorArt';
import { audio } from './mediaShared';

/** Board pixels per integrator unit, and the card size on the board. */
const S = 8;
const CARD = { w: CARD_UNITS.w * S - 8, h: CARD_UNITS.h * S - 6 };
const THUMB = { x: 8, y: 22, w: CARD.w - 16, h: 100 };
const COLORS = { start: '#ffd400', end: '#ff6b61', adventure: '#6cf28a', unused: '#888' } as const;
const FONT = 'ui-monospace, Menlo, Consolas, monospace';

/** Between-scene screens, by scene kind and slot. */
const START_SCREENS: [number, string][] = [
  [0, 'Title'],
  [2, 'Menu'],
  [4, 'Storyline'],
  [6, 'Instructions'],
  [7, 'Credits'],
  [8, 'High scores'],
  [9, 'Load game'],
  [10, 'Save game'],
];
const START_SONGS: [number, string][] = [
  [1, 'Title song'],
  [3, 'Menu song'],
  [5, 'Storyline song'],
];
const END_SCREENS: [number, string][] = [
  [0, 'Game won'],
  [2, 'Game lost'],
];
const END_SONGS: [number, string][] = [
  [1, 'Game won song'],
  [3, 'Game lost song'],
];

/** Lets the user click a map cell of a scene. */
async function pickOnMap(project: Project, game: Game, scene: number, current: Point, title: string): Promise<Point | undefined> {
  const s = game.scenes[scene];
  const mapBytes = s?.files[1] && project.files.get(s.files[1]);
  if (!mapBytes)
    return modal<Point>(title, (close) => [
      h('p', null, 'That scene has no map yet.'),
      h('div', { class: 'buttons' }, h('button', { onclick: () => close(undefined) }, 'OK')),
    ]);
  const map = parseMap(mapBytes);
  const bbl = s.files[2] && project.files.get(s.files[2]);
  const blocks = bbl ? parseBlocks(bbl, BACKBL) : newBlockSet('bbl');
  const pal = s.files[0] && project.files.get(s.files[0]) ? parsePalette(project.files.get(s.files[0])!) : defaultPalette();
  const imgs = blockImages(blocks, pal);
  const cell = 8;
  const canvas = h('canvas', { width: MLEN * cell, height: MWID * cell, class: 'pixel', style: 'max-width:100%;cursor:crosshair' });
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) ctx.drawImage(imgs[map.blocks[y * MLEN + x]] ?? imgs[0], x * cell, y * cell, cell, cell);
  ctx.strokeStyle = '#ffd400';
  ctx.lineWidth = 2;
  ctx.strokeRect(current.x * cell, current.y * cell, cell, cell);
  const label = h('div', { class: 'meta' }, `Current: (${current.x}, ${current.y})`);
  return modal<Point>(title, (close) => {
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      label.textContent = `(${Math.floor(((e.clientX - r.left) / r.width) * MLEN)}, ${Math.floor(((e.clientY - r.top) / r.height) * MWID)})`;
    });
    canvas.addEventListener('click', (e) => {
      const r = canvas.getBoundingClientRect();
      close({ x: Math.floor(((e.clientX - r.left) / r.width) * MLEN), y: Math.floor(((e.clientY - r.top) / r.height) * MWID) });
    });
    return [
      h('div', { style: 'max-height:70vh;overflow:auto' }, canvas),
      label,
      h('div', { class: 'buttons' }, h('button', { onclick: () => close(undefined) }, 'Cancel')),
    ];
  });
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** A clickable song button drawn on a card. */
interface CardButton extends Rect {
  file: string;
  label: string;
}

const inRect = (r: Rect, x: number, y: number) => x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, rad: number): void {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, rad);
}

/** Where a line from the centre of `r` towards (tx, ty) leaves the rectangle. */
function edgePoint(r: Rect, tx: number, ty: number, pad = 4): Point {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const t = Math.min(Math.abs((r.w / 2 + pad) / (dx || 1e-9)), Math.abs((r.h / 2 + pad) / (dy || 1e-9)));
  return { x: cx + dx * Math.min(1, t), y: cy + dy * Math.min(1, t) };
}

registerEditor(['gam'], (host, project) => {
  const game = project.game();
  let selected = 0;
  let playing: string | undefined;
  let undoPositions: Map<number, Point> | undefined;
  /** Auto-arrange's layouts, best first, while the user steps through them. */
  let arranged: { list: Arrangement[]; k: number } | undefined;
  const save = () => project.saveGame(game);

  // ---- pictures --------------------------------------------------------------------
  const shots = new Map<string, HTMLCanvasElement | undefined>();
  const cached = (key: string, make: () => HTMLCanvasElement | undefined) => {
    if (!shots.has(key)) shots.set(key, make());
    return shots.get(key);
  };
  const screenOf = (name: string | undefined) => (name ? cached(`g:${name.toLowerCase()}`, () => graphicShot(project.files, name)) : undefined);
  /** Where the hero arrives in a scene: the "to" block of the first scene that links to it. */
  const arrival = (i: number): Point => {
    for (const s of game.scenes) {
      if (s.gametype === NOSCENE) continue;
      const l = s.links.find((x) => x.toScene === i);
      if (l) return l.to;
    }
    return { x: MLEN >> 1, y: MWID >> 1 };
  };
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
  const used = () => game.scenes.map((_, i) => i).filter((i) => game.scenes[i].gametype !== NOSCENE);
  const cardRect = (i: number): Rect => {
    const p = game.scenes[i].pos;
    return { x: (p.x + 2) * S - CARD.w / 2, y: (p.y + 2) * S - CARD.h / 2, w: CARD.w, h: CARD.h };
  };
  const boardBounds = (): Rect => {
    const rs = used().map(cardRect);
    const world = { x: WORLD.x * S, y: WORLD.y * S, w: WORLD.w * S, h: WORLD.h * S };
    const x0 = Math.min(world.x, ...rs.map((r) => r.x));
    const y0 = Math.min(world.y, ...rs.map((r) => r.y));
    const x1 = Math.max(world.x + world.w, ...rs.map((r) => r.x + r.w));
    const y1 = Math.max(world.y + world.h, ...rs.map((r) => r.y + r.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };

  /** Buttons on a card: the songs that go with it. */
  function cardButtons(i: number, r: Rect): CardButton[] {
    const s = game.scenes[i];
    const kind = sceneKind(s);
    const songs: [number, string][] =
      kind === 'start'
        ? START_SONGS.slice(0, 2).map(([k, l]) => [k, l.split(' ')[0]])
        : kind === 'end'
          ? [
              [1, 'Won'],
              [3, 'Lost'],
            ]
          : [[8, 'Music']];
    const out: CardButton[] = [];
    let x = r.x + r.w - 8;
    for (const [slot, label] of [...songs].reverse()) {
      const file = s.files[slot];
      if (!file || !project.files.has(file)) continue;
      const w = 14 + label.length * 6.6;
      x -= w;
      out.push({ x, y: r.y + r.h - 20, w, h: 15, file, label });
      x -= 4;
    }
    return out;
  }

  function drawThumb(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement | undefined, box: Rect, label?: string): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    if (img) {
      const k = Math.min(box.w / img.width, box.h / img.height);
      const w = img.width * k;
      const hh = img.height * k;
      ctx.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - hh) / 2, w, hh);
    } else {
      ctx.fillStyle = '#556';
      ctx.font = `10px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(label ? `no ${label.toLowerCase()}` : 'no map yet', box.x + box.w / 2, box.y + box.h / 2 + 3);
      ctx.textAlign = 'left';
    }
    if (label && img) {
      ctx.font = `bold 9px ${FONT}`;
      const tw = ctx.measureText(label).width + 6;
      ctx.fillStyle = 'rgba(0,0,0,.7)';
      ctx.fillRect(box.x, box.y + box.h - 12, tw, 12);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, box.x + 3, box.y + box.h - 3);
    }
  }

  function drawCard(ctx: CanvasRenderingContext2D, i: number, forExport: boolean): void {
    const s = game.scenes[i];
    const kind = sceneKind(s);
    const r = cardRect(i);
    const sel = i === selected && !forExport;
    const color = COLORS[kind];
    ctx.save();
    ctx.shadowColor = sel ? color : 'rgba(0,0,0,.6)';
    ctx.shadowBlur = sel ? 18 : 8;
    ctx.shadowOffsetY = sel ? 0 : 3;
    roundRect(ctx, r, 7);
    ctx.fillStyle = '#12152b';
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = sel ? 3 : 1.5;
    ctx.strokeStyle = color;
    roundRect(ctx, r, 7);
    ctx.stroke();
    // title bar
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, 18, [7, 7, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = `bold 11px ${FONT}`;
    ctx.textBaseline = 'alphabetic';
    const title = kind === 'start' ? `★ ${s.desc || 'Untitled'}` : kind === 'end' ? `⚑ ${s.desc || 'Game over'}` : `${i}  ${s.desc || '(untitled)'}`;
    ctx.fillText(title, r.x + 6, r.y + 13, r.w - 12);
    // picture
    const box = { x: r.x + THUMB.x, y: r.y + THUMB.y, w: THUMB.w, h: THUMB.h };
    if (kind === 'start') drawThumb(ctx, screenOf(s.files[0]) ?? screenOf(s.files[2]), box, s.files[0] ? 'Title' : 'Menu');
    else if (kind === 'end') {
      const won = screenOf(s.files[0]);
      const lost = screenOf(s.files[2]);
      if (won && lost) {
        const half = (box.w - 4) / 2;
        drawThumb(ctx, won, { ...box, w: half }, 'Won');
        drawThumb(ctx, lost, { ...box, x: box.x + half + 4, w: half }, 'Lost');
      } else drawThumb(ctx, won ?? lost, box, won ? 'Won' : lost ? 'Lost' : 'graphic');
    } else {
      drawThumb(ctx, levelOf(i), box);
      if (s.files[1]) {
        // the arrival block
        const bw = box.w / 8;
        const bh = box.h / 5;
        ctx.strokeStyle = '#ffd400';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(box.x + 4 * bw, box.y + 2 * bh, bw, bh);
        ctx.setLineDash([]);
      }
    }
    // footer
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = '#9aa2b8';
    const foot =
      kind === 'adventure'
        ? (() => {
            const a = arrival(i);
            return `in at ${a.x},${a.y}`;
          })()
        : kind === 'start'
          ? 'start'
          : 'end';
    ctx.fillText(foot, r.x + 8, r.y + r.h - 8);
    for (const b of cardButtons(i, r)) {
      const on = playing === b.file;
      ctx.fillStyle = on ? '#ffd400' : '#2a3060';
      roundRect(ctx, b, 4);
      ctx.fill();
      ctx.fillStyle = on ? '#000' : '#cfd6ff';
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillText(`${on ? '■' : '♪'} ${b.label}`, b.x + 4, b.y + 11);
    }
  }

  function drawLinks(ctx: CanvasRenderingContext2D, forExport: boolean): void {
    // one arrow per pair of scenes, however many links join them
    const pairs = new Map<string, { a: number; b: number; n: number }>();
    for (const i of used())
      for (const l of game.scenes[i].links) {
        const t = l.toScene;
        if (t === NOSCENE || !game.scenes[t] || game.scenes[t].gametype === NOSCENE) continue;
        const k = `${i}>${t}`;
        const p = pairs.get(k);
        if (p) p.n++;
        else pairs.set(k, { a: i, b: t, n: 1 });
      }
    // with lots of links, the selected scene's stand out and the rest fade back
    const busy = pairs.size > 40 && !forExport;
    const ordered = [...pairs.values()].sort((p, q) => Number(p.a === selected || p.b === selected) - Number(q.a === selected || q.b === selected));
    for (const { a, b, n } of ordered) {
      const ra = cardRect(a);
      const rb = cardRect(b);
      const out = a === selected && !forExport;
      const inn = b === selected && !forExport;
      const color = out ? '#ffd400' : inn ? '#6cf28a' : busy ? 'rgba(143,170,255,.45)' : 'rgba(143,170,255,.75)';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = out || inn ? 2.5 : 1.5;
      if (a === b) {
        // a link inside the same map: a loop on the card's corner
        ctx.beginPath();
        ctx.arc(ra.x + ra.w, ra.y + 9, 11, Math.PI * 0.9, Math.PI * 2.4);
        ctx.stroke();
        continue;
      }
      const ca = { x: ra.x + ra.w / 2, y: ra.y + ra.h / 2 };
      const cb = { x: rb.x + rb.w / 2, y: rb.y + rb.h / 2 };
      // bend to the right of the direction of travel, so links both ways don't overlap
      const dx = cb.x - ca.x;
      const dy = cb.y - ca.y;
      const len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(40, len * 0.15);
      const ctrl = { x: (ca.x + cb.x) / 2 - (dy / len) * bend, y: (ca.y + cb.y) / 2 + (dx / len) * bend };
      const p0 = edgePoint(ra, ctrl.x, ctrl.y);
      const p1 = edgePoint(rb, ctrl.x, ctrl.y, 6);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, p1.x, p1.y);
      ctx.stroke();
      const ang = Math.atan2(p1.y - ctrl.y, p1.x - ctrl.x);
      const hl = out || inn ? 12 : 10;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1.x - hl * Math.cos(ang - 0.4), p1.y - hl * Math.sin(ang - 0.4));
      ctx.lineTo(p1.x - hl * Math.cos(ang + 0.4), p1.y - hl * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
      if (n > 1) {
        const mx = 0.25 * p0.x + 0.5 * ctrl.x + 0.25 * p1.x;
        const my = 0.25 * p0.y + 0.5 * ctrl.y + 0.25 * p1.y;
        ctx.font = `bold 10px ${FONT}`;
        const t = `×${n}`;
        const tw = ctx.measureText(t).width + 8;
        ctx.fillStyle = '#0b0d1e';
        ctx.beginPath();
        ctx.roundRect(mx - tw / 2, my - 8, tw, 15, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(t, mx, my + 3);
        ctx.textAlign = 'left';
      }
    }
  }

  /** Draws the whole board in board coordinates (the caller sets the transform). */
  function paintBoard(ctx: CanvasRenderingContext2D, view: Rect, forExport: boolean): void {
    ctx.fillStyle = '#05061a';
    ctx.fillRect(view.x, view.y, view.w, view.h);
    // the DOS integrator's world
    const wr = { x: WORLD.x * S, y: WORLD.y * S, w: WORLD.w * S, h: WORLD.h * S };
    ctx.fillStyle = '#000048';
    ctx.fillRect(wr.x, wr.y, wr.w, wr.h);
    ctx.fillStyle = 'rgba(127,156,255,.18)';
    for (let x = WORLD.x; x <= WORLD.x + WORLD.w; x += 10) for (let y = WORLD.y; y <= WORLD.y + WORLD.h; y += 10) ctx.fillRect(x * S - 1, y * S - 1, 2, 2);
    ctx.strokeStyle = '#2b3bb0';
    ctx.lineWidth = 2;
    ctx.strokeRect(wr.x, wr.y, wr.w, wr.h);
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = '#ffd400';
    const count = used().length;
    ctx.fillText(`${game.scenes[0]?.desc || 'Untitled'} — ${count} scene${count === 1 ? '' : 's'}`, wr.x, wr.y - 10);
    ctx.imageSmoothingEnabled = false;
    drawLinks(ctx, forExport);
    const order = used().sort((a, b) => Number(a === selected) - Number(b === selected));
    for (const i of order) drawCard(ctx, i, forExport);
  }

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
    cam.z = Math.max(0.15, Math.min(2, Math.min((w - pad * 2) / b.w, (hh - pad * 2) / b.h)));
    cam.x = b.x - (w / cam.z - b.w) / 2;
    cam.y = b.y - (hh / cam.z - b.h) / 2;
    draw();
  }
  function centerOn(i: number): void {
    const r = cardRect(i);
    const w = board.clientWidth / cam.z;
    const hh = board.clientHeight / cam.z;
    if (r.x >= cam.x && r.y >= cam.y && r.x + r.w <= cam.x + w && r.y + r.h <= cam.y + hh) return;
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
      undoPositions = undefined;
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
  const resize = new ResizeObserver(() => draw());
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
  function relayout(positions: Map<number, Point>, keepArranged = false): void {
    if (!keepArranged) arranged = undefined;
    if (!undoPositions || !keepArranged) undoPositions = new Map(used().map((i) => [i, { ...game.scenes[i].pos }]));
    for (const [i, p] of positions) game.scenes[i].pos = p;
    save();
    renderTools();
    fit();
  }
  function renderTools(): void {
    const crowded = overlapping();
    clear(
      tools,
      h('button', { class: 'primary', onclick: addScene }, '+ Add level scene'),
      h(
        'button',
        {
          class: crowded ? 'grator-attention' : undefined,
          title: `${crowded ? `${crowded} scenes are hiding one another. ` : ''}Move the cards apart so none hides another, keeping your arrangement`,
          onclick: () => relayout(spreadOut(game)),
        },
        '✥ Spread out',
      ),
      h(
        'button',
        {
          title: arranged
            ? 'Try the next best layout'
            : 'Lay the scenes out as a map of the game: the start first, each scene next to the one that leads there, the end last (press again for other layouts)',
          onclick: () => {
            if (arranged) arranged.k = (arranged.k + 1) % arranged.list.length;
            else arranged = { list: arrangements(game), k: 0 };
            relayout(arranged.list[arranged.k].positions, true);
          },
        },
        arranged && arranged.list.length > 1 ? `⇄ Another layout ${arranged.k + 1}/${arranged.list.length}` : '⇄ Auto-arrange',
      ),
      undoPositions
        ? h(
            'button',
            {
              title: 'Put the scenes back where they were',
              onclick: () => {
                for (const [i, p] of undoPositions!) if (game.scenes[i]) game.scenes[i].pos = p;
                undoPositions = undefined;
                arranged = undefined;
                save();
                renderTools();
                fit();
              },
            },
            '↶ Undo',
          )
        : null,
      h('span', { class: 'grator-spacer' }),
      h('button', { title: 'Zoom out (-)', 'aria-label': 'Zoom out', onclick: () => zoomAt(cam.z / 1.25) }, '−'),
      zoomLabel,
      h('button', { title: 'Zoom in (+)', 'aria-label': 'Zoom in', onclick: () => zoomAt(cam.z * 1.25) }, '+'),
      h('button', { title: 'Show every scene (0)', onclick: fit }, '⤢ Fit'),
      h('button', { title: 'Download a picture of all the scenes and links', onclick: () => void exportPng() }, '⬇ PNG'),
    );
  }

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
  let sideTab: 'screens' | 'music' = store.get('gm-grator-tab') === 'music' ? 'music' : 'screens';
  const side = h('aside', { class: 'grator-side', 'aria-label': 'Screens and music' });
  const sideBody = h('div', { class: 'grator-side-body' });
  const grator = h('div', { class: 'grator' });
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
    'aria-label': 'Drag to resize the screens and music panel',
    title: 'Drag to resize the panel (or use the arrow keys)',
    tabIndex: 0,
    'aria-valuemin': 160,
    'aria-valuemax': 640,
    'aria-valuenow': savedWidth >= 160 && savedWidth <= 640 ? savedWidth : 250,
  });
  const setSideW = (w: number) => {
    grator.style.setProperty('--grator-side-w', `${w}px`);
    store.set('gm-grator-side-w', String(w));
    handle.setAttribute('aria-valuenow', String(Math.round(w)));
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
  handle.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setSideW(Math.max(160, Math.min(640, side.getBoundingClientRect().width + (e.key === 'ArrowLeft' ? 20 : -20))));
  });
  function renderSide(): void {
    const screens: { label: string; file: string; scene: number }[] = [];
    const songs: { label: string; file: string; scene: number }[] = [];
    game.scenes.forEach((s, i) => {
      const kind = sceneKind(s);
      const add = (list: typeof screens, slots: [number, string][], prefix = '') => {
        for (const [slot, label] of slots) if (s.files[slot]) list.push({ label: prefix + label, file: s.files[slot], scene: i });
      };
      if (kind === 'start') (add(screens, START_SCREENS), add(songs, START_SONGS));
      else if (kind === 'end') (add(screens, END_SCREENS), add(songs, END_SONGS));
      else if (kind === 'adventure') {
        const name = s.desc || `Level ${i}`;
        add(
          screens,
          [
            [9, ' intro'],
            [10, ' exit'],
          ],
          name,
        );
        add(songs, [[8, '']], name);
      }
    });
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
    if (collapsed) {
      clear(
        side,
        h(
          'button',
          { class: 'grator-side-open', title: 'Show the screens and music panel', 'aria-expanded': 'false', onclick: () => setCollapsed(false) },
          h('span', { 'aria-hidden': 'true' }, '‹'),
          h('span', { class: 'grator-side-open-label' }, `Screens ${screens.length} · Music ${songs.length}`),
        ),
      );
      return;
    }
    const tab = (id: typeof sideTab, label: string, n: number) =>
      h(
        'button',
        {
          role: 'tab',
          id: `grator-tab-${id}`,
          class: `grator-tab${sideTab === id ? ' on' : ''}`,
          'aria-selected': String(sideTab === id),
          'aria-controls': 'grator-side-body',
          onclick: () => {
            sideTab = id;
            store.set('gm-grator-tab', id);
            renderSide();
          },
        },
        label,
        h('span', { class: 'grator-count' }, String(n)),
      );
    sideBody.id = 'grator-side-body';
    sideBody.setAttribute('role', 'tabpanel');
    sideBody.setAttribute('aria-labelledby', `grator-tab-${sideTab}`);
    clear(
      sideBody,
      sideTab === 'screens'
        ? screens.length
          ? h(
              'div',
              { class: 'grator-screens' },
              ...screens.map((g) => {
                const shot = screenOf(g.file);
                const fig = h('figure', { class: 'grator-screen', title: `${g.label}: ${g.file}` });
                const pic = h('button', { class: 'grator-screen-pic', 'aria-label': `Show the scene that uses ${g.file}`, onclick: () => pick(g.scene) });
                if (shot) {
                  const c = h('canvas', { class: 'pixel', width: shot.width, height: shot.height });
                  c.getContext('2d')!.drawImage(shot, 0, 0);
                  pic.append(c);
                } else pic.append(h('span', { class: 'grator-noshot' }, g.file));
                fig.append(pic, h('figcaption', null, h('b', null, g.label), h('span', null, g.file.toLowerCase(), ' ', edit(g.file))));
                return fig;
              }),
            )
          : h('p', { class: 'hint' }, 'No title, menu or between-level screens yet.')
        : songs.length
          ? h(
              'ul',
              { class: 'grator-songs' },
              ...songs.map((m) =>
                h(
                  'li',
                  null,
                  project.files.has(m.file) ? songButton(m.file) : h('span', { class: 'grator-play' }, '·'),
                  h('button', { class: 'linklike', onclick: () => pick(m.scene), title: 'Show the scene' }, h('b', null, m.label)),
                  h('span', { class: 'meta' }, m.file.toLowerCase()),
                ),
              ),
            )
          : h('p', { class: 'hint' }, 'No Sound Blaster music yet.'),
    );
    clear(
      side,
      h(
        'div',
        { class: 'grator-side-head' },
        h(
          'div',
          { class: 'grator-tabs', role: 'tablist', 'aria-label': 'Side panel' },
          tab('screens', 'Screens', screens.length),
          tab('music', 'Music', songs.length),
        ),
        h(
          'button',
          {
            class: 'grator-side-close',
            title: 'Hide this panel (more room for the board)',
            'aria-label': 'Hide the screens and music panel',
            'aria-expanded': 'true',
            onclick: () => setCollapsed(true),
          },
          '›',
        ),
      ),
      sideBody,
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
    const copy = structuredClone(game);
    // where the hero arrives: a link into this level, else where the game starts, else the middle
    const into = game.scenes.flatMap((x) => x.links).find((l) => l.toScene === scene);
    const start = copy.scenes[0].links[0];
    copy.scenes[0].links[0] = {
      toScene: scene,
      from: start?.from ?? { x: 0, y: 0 },
      to: into?.to ?? (start?.toScene === scene ? start.to : { x: 50, y: 50 }),
    };
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
    const pointField = (p: Point, label: string, sceneForMap: number) =>
      h(
        'span',
        { class: 'row', style: 'gap:4px;align-items:center;flex-wrap:nowrap' },
        numberField(
          `${label} x`,
          () => p.x,
          (v) => ((p.x = v), changed()),
          { min: 0, max: MLEN - 1 },
        ),
        numberField(
          'y',
          () => p.y,
          (v) => ((p.y = v), changed()),
          { min: 0, max: MWID - 1 },
        ),
        h(
          'button',
          {
            title: 'Pick on the map',
            onclick: async () => {
              const pick = await pickOnMap(project, game, sceneForMap, p, `${label}: click a map block`);
              if (pick) {
                p.x = pick.x;
                p.y = pick.y;
                changed();
                renderPanel();
              }
            },
          },
          '⌖',
        ),
      );

    clear(
      panel,
      h(
        'div',
        { class: 'panel stack' },
        h(
          'h3',
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
        h('h3', { style: 'margin-top:0' }, 'Files'),
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
            h('h3', { style: 'margin-top:0' }, 'Scrolling'),
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
        : h(
            'div',
            { class: 'panel' },
            h('h3', { style: 'margin-top:0' }, kind === 'start' ? 'Where the game starts' : 'Links to other scenes'),
            h(
              'p',
              { class: 'hint' },
              kind === 'start'
                ? 'Link 1 picks the first level and the block where the character starts in it.'
                : 'When the character touches the “from” block, play continues in the linked scene at its “to” block. Link to “Game Won” to end the game.',
            ),
            h(
              'div',
              { class: 'grator-links' },
              h(
                'table',
                { class: 'data' },
                h(
                  'thead',
                  null,
                  h(
                    'tr',
                    null,
                    h('th', null, '#'),
                    h('th', null, 'Go to scene'),
                    kind === 'start' ? null : h('th', null, 'From block (this map)'),
                    h('th', null, 'To block (its map)'),
                  ),
                ),
                h(
                  'tbody',
                  null,
                  ...s.links.slice(0, kind === 'start' ? 1 : MAXSCENELINKS).map((l, i) =>
                    h(
                      'tr',
                      null,
                      h('td', null, i + 1),
                      h(
                        'td',
                        null,
                        selectField(
                          '',
                          sceneOptions(),
                          () => l.toScene,
                          (v) => ((l.toScene = v), save(), draw(), renderPanel()),
                          `Link ${i + 1} goes to`,
                        ),
                      ),
                      kind === 'start' ? null : h('td', null, l.toScene === NOSCENE ? '' : pointField(l.from, 'From', selected)),
                      h('td', null, l.toScene === NOSCENE ? '' : pointField(l.to, 'To', l.toScene)),
                    ),
                  ),
                ),
              ),
            ),
          ),
    );
  }

  const missing = !game.scenes.some((s) => s.gametype === STARTTYPE) || !game.scenes.some((s) => s.gametype === ENDTYPE);
  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      missing
        ? 'This game is missing its start or end scene.'
        : 'Each card is a scene, showing what the player sees on arriving. Drag cards to arrange them, drag the background to pan, scroll or pinch to zoom. Click a card to edit it; double-click a level to play it. Arrows are links (gold: from the selected scene, green: into it).',
    ),
    (grator.append(h('div', { class: 'grator-main' }, tools, h('div', { class: 'grator-board-wrap' }, board)), handle, side), grator),
    panel,
  );
  renderTools();
  renderSide();
  renderPanel();
  requestAnimationFrame(fit);
  return () => {
    stopWatching();
    resize.disconnect();
    if (raf) cancelAnimationFrame(raf);
    audio.stopSong();
  };
});
