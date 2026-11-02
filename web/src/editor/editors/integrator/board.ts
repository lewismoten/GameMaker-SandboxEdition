// The integrator's board, drawn on a canvas: a card per scene (title, a picture of what the
// player first sees there, its song buttons) at the scene's .GAM integrator position, and
// curved arrows for the links between scenes (one per pair, with a count). Used for the
// live board and for Export PNG.
import type { Project } from '../../core/project';
import { NOSCENE, sceneKind, type Game, type Point, gameTitle } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { WORLD, CARD_UNITS, arrival } from './layoutCells';
import { START_SONGS } from './sceneSlots';
import { isSolidPalette } from '../../core/readablePalette';

/** Board pixels per integrator unit, and the card size on the board. */
export const S = 8;
const CARD = { w: CARD_UNITS.w * S - 8, h: CARD_UNITS.h * S - 6 };
const THUMB = { x: 8, y: 22, w: CARD.w - 16, h: 100 };
const COLORS = { start: '#ffd400', end: '#ff6b61', adventure: '#6cf28a', unused: '#888' } as const;
/** A pass-through scene's frame (a talk page or a fade): not a map to play, so not the playable green. */
const TALK = '#d58cff';
const FONT = 'ui-monospace, Menlo, Consolas, monospace';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** A clickable song button drawn on a card. */
export interface CardButton extends Rect {
  file: string;
  label: string;
}

export const inRect = (r: Rect, x: number, y: number) => x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;

export function roundRect(ctx: CanvasRenderingContext2D, r: Rect, rad: number): void {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, rad);
}

/** Where a line from the center of `r` towards (tx, ty) leaves the rectangle. */
export function edgePoint(r: Rect, tx: number, ty: number, pad = 4): Point {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const t = Math.min(Math.abs((r.w / 2 + pad) / (dx || 1e-9)), Math.abs((r.h / 2 + pad) / (dy || 1e-9)));
  return { x: cx + dx * Math.min(1, t), y: cy + dy * Math.min(1, t) };
}

/** What the board shows besides the game: the selection, the song playing and the scene pictures. */
export interface BoardView {
  /** On one of the editor's boards (boardPaint.ts) instead of the DOS layout: the board draws its own cards and arrows. */
  boards?: { world: Rect; title: string; paint(ctx: CanvasRenderingContext2D, forExport: boolean): void };
  project: Project;
  game: Game;
  selected: number;
  playing: string | undefined;
  screenOf: (name: string | undefined) => HTMLCanvasElement | undefined;
  levelOf: (i: number) => HTMLCanvasElement | undefined;
}

export { arrival } from './layoutCells';

/** The scenes in use (not NOSCENE), in order. */
export const usedScenes = (game: Game) => game.scenes.map((_, i) => i).filter((i) => game.scenes[i].gametype !== NOSCENE);
/** A scene's card on the board: centered on its integrator position (Pos + 2, the middle of its 5x5 box). */
export const cardRect = (game: Game, i: number): Rect => rectAt(game.scenes[i].pos);
/** The card whose scene (or group) sits at integrator position `p`. */
export function rectAt(p: Point): Rect {
  return { x: (p.x + 2) * S - CARD.w / 2, y: (p.y + 2) * S - CARD.h / 2, w: CARD.w, h: CARD.h };
}

/** Buttons on a card: the songs that go with it. */
export function cardButtons(project: Project, game: Game, i: number, r: Rect): CardButton[] {
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

/** A group's card stands for its members: shown as a stack, with the group's name and size. */
export interface GroupFace {
  name: string;
  count: number;
  /** Any member is the selected scene. */
  selected: boolean;
}

export function drawCard(ctx: CanvasRenderingContext2D, i: number, forExport: boolean, v: BoardView, place?: Rect, group?: GroupFace): void {
  const s = v.game.scenes[i];
  const kind = sceneKind(s);
  const r = place ?? cardRect(v.game, i);
  const sel = (group ? group.selected : i === v.selected) && !forExport;
  if (group) {
    // the rest of the stack, peeking out behind
    ctx.fillStyle = '#0d1024';
    ctx.strokeStyle = 'rgba(143,170,255,.55)';
    ctx.lineWidth = 1.5;
    for (const d of [8, 4]) {
      roundRect(ctx, { ...r, x: r.x + d, y: r.y + d }, 7);
      ctx.fill();
      ctx.stroke();
    }
  }
  // a pass-through scene: the hero arrives on one of its own links out, so it leaves at once (a talk page
  // between scenes, or just a fade)
  const at = kind === 'adventure' ? arrival(v.game, i) : undefined;
  const pass = !!at && s.links.some((l) => l.toScene !== NOSCENE && !!v.game.scenes[l.toScene] && l.from.x === at.x && l.from.y === at.y);
  const pal = s.files[0] ? v.project.files.get(s.files[0]) : undefined;
  const page = pass ? (v.screenOf(s.files[9]) ?? v.screenOf(s.files[10])) : undefined;
  const color = pass ? TALK : COLORS[kind];
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
  const title = group
    ? `${group.name} (${group.count})`
    : kind === 'start'
      ? `★ ${s.desc || 'Untitled'}`
      : kind === 'end'
        ? `⚑ ${s.desc || 'Game over'}`
        : `${i}  ${s.desc || '(untitled)'}`;
  ctx.fillText(title, r.x + 6, r.y + 13, r.w - 12);
  // picture
  const box = { x: r.x + THUMB.x, y: r.y + THUMB.y, w: THUMB.w, h: THUMB.h };
  if (kind === 'start') drawThumb(ctx, v.screenOf(s.files[0]) ?? v.screenOf(s.files[2]), box, s.files[0] ? 'Title' : 'Menu');
  else if (kind === 'end') {
    const won = v.screenOf(s.files[0]);
    const lost = v.screenOf(s.files[2]);
    if (won && lost) {
      const half = (box.w - 4) / 2;
      drawThumb(ctx, won, { ...box, w: half }, 'Won');
      drawThumb(ctx, lost, { ...box, x: box.x + half + 4, w: half }, 'Lost');
    } else drawThumb(ctx, won ?? lost, box, won ? 'Won' : lost ? 'Lost' : 'graphic');
  } else if (page) {
    // a pass-through scene's picture (its intro, else its exit) is the message, so show that, not its map
    drawThumb(ctx, page, box, 'Talk');
  } else if (pass && pal && isSolidPalette(pal)) {
    // no picture and a one-color palette: the player only sees a fade
    ctx.fillStyle = '#000';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = '#9aa2b8';
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('fade, passes through', box.x + box.w / 2, box.y + box.h / 2 + 3);
    ctx.textAlign = 'left';
  } else {
    drawThumb(ctx, v.levelOf(i), box);
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
  const foot = group
    ? `${group.count} scenes · click to choose`
    : kind === 'adventure'
      ? (() => {
          const a = at!;
          return `${pass ? (page ? 'talk · ' : 'pass · ') : ''}in at ${a.x},${a.y}`;
        })()
      : kind === 'start'
        ? 'start'
        : 'end';
  ctx.fillText(foot, r.x + 8, r.y + r.h - 8);
  for (const b of cardButtons(v.project, v.game, i, r)) {
    const on = v.playing === b.file;
    ctx.fillStyle = on ? '#ffd400' : '#2a3060';
    roundRect(ctx, b, 4);
    ctx.fill();
    ctx.fillStyle = on ? '#000' : '#cfd6ff';
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillText(`${on ? '■' : '♪'} ${b.label}`, b.x + 4, b.y + 11);
  }
}

/** One arrow on the board: from one card to another (a scene's, a group's or a stub's). */
export interface Edge {
  a: Rect;
  b: Rect;
  /** How many links it stands for. */
  n: number;
  /** Leaves the selected scene / leads into it. */
  out: boolean;
  inn: boolean;
  /** A link inside one card. */
  self: boolean;
}

/** The DOS board's arrows: one per pair of scenes, however many links join them. */
function sceneEdges(forExport: boolean, v: BoardView): Edge[] {
  const pairs = new Map<string, { a: number; b: number; n: number }>();
  for (const i of usedScenes(v.game))
    for (const l of v.game.scenes[i].links) {
      const t = l.toScene;
      if (t === NOSCENE || !v.game.scenes[t] || v.game.scenes[t].gametype === NOSCENE) continue;
      const k = `${i}>${t}`;
      const p = pairs.get(k);
      if (p) p.n++;
      else pairs.set(k, { a: i, b: t, n: 1 });
    }
  return [...pairs.values()].map(({ a, b, n }) => ({
    a: cardRect(v.game, a),
    b: cardRect(v.game, b),
    n,
    out: a === v.selected && !forExport,
    inn: b === v.selected && !forExport,
    self: a === b,
  }));
}

export function drawEdges(ctx: CanvasRenderingContext2D, edges: Edge[], forExport: boolean): void {
  // with lots of links, the selected scene's stand out and the rest fade back
  const busy = edges.length > 40 && !forExport;
  const ordered = [...edges].sort((p, q) => Number(p.out || p.inn) - Number(q.out || q.inn));
  for (const { a: ra, b: rb, n, out, inn, self } of ordered) {
    const color = out ? '#ffd400' : inn ? '#6cf28a' : busy ? 'rgba(143,170,255,.45)' : 'rgba(143,170,255,.75)';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = out || inn ? 2.5 : 1.5;
    if (self) {
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
export function paintBoard(ctx: CanvasRenderingContext2D, view: Rect, forExport: boolean, v: BoardView): void {
  ctx.fillStyle = '#05061a';
  ctx.fillRect(view.x, view.y, view.w, view.h);
  // the DOS integrator's world
  const bw = v.boards?.world ?? WORLD;
  const wr = { x: bw.x * S, y: bw.y * S, w: bw.w * S, h: bw.h * S };
  ctx.fillStyle = '#000048';
  ctx.fillRect(wr.x, wr.y, wr.w, wr.h);
  ctx.fillStyle = 'rgba(127,156,255,.18)';
  for (let x = bw.x; x <= bw.x + bw.w; x += 10) for (let y = bw.y; y <= bw.y + bw.h; y += 10) ctx.fillRect(x * S - 1, y * S - 1, 2, 2);
  ctx.strokeStyle = '#2b3bb0';
  ctx.lineWidth = 2;
  ctx.strokeRect(wr.x, wr.y, wr.w, wr.h);
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillStyle = '#ffd400';
  const count = usedScenes(v.game).length;
  ctx.fillText(v.boards?.title ?? `${gameTitle(v.game) || 'Untitled'} — ${count} scene${count === 1 ? '' : 's'}`, wr.x, wr.y - 10);
  ctx.imageSmoothingEnabled = false;
  if (v.boards) return v.boards.paint(ctx, forExport);
  drawEdges(ctx, sceneEdges(forExport, v), forExport);
  const order = usedScenes(v.game).sort((a, b) => Number(a === v.selected) - Number(b === v.selected));
  for (const i of order) drawCard(ctx, i, forExport, v);
}
