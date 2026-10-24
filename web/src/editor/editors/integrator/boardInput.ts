// The integrator board's pointer, wheel and keys: drag a card to move it, drag the
// background to pan, pinch or scroll to zoom, click a card's song button to hear it,
// double-click a level to play it, and + − 0 and the arrow keys (stepping to the nearest
// scene that way). integrator.ts owns the game, the selection and the panels.
import { ADVTYPE, type Game } from '../../../formats/game';
import { S, inRect, type CardButton, type Rect } from './board';
import { clampPos } from './layoutCells';
import type { BoardCamera } from './boardCamera';

/** What the board's input needs from the integrator. */
interface BoardInput {
  board: HTMLCanvasElement;
  cam: BoardCamera;
  game: Game;
  /** The scenes in use, by index. */
  used(): number[];
  selected(): number;
  /** The scene whose card is at a board point, or -1. */
  sceneAt(x: number, y: number): number;
  cardRect(i: number): Rect;
  cardButtons(i: number, r: Rect): CardButton[];
  toggleSong(file: string): void;
  /** A card was pressed: select it. */
  press(i: number): void;
  /** An arrow key stepped to scene i: select it and bring it into view. */
  step(i: number): void;
  /** A card was dragged somewhere else (and let go). */
  cardMoved(): void;
  playFrom(scene: number): void;
  draw(): void;
  /** Shows every scene. */
  fit(): void;
}

/** Listens to the board. */
export function boardInput(ctx: BoardInput): void {
  // pointers: one = drag a card or pan; two = pinch zoom
  const pointers = new Map<number, { x: number; y: number }>();
  let gesture:
    | { type: 'card'; i: number; dx: number; dy: number; sx: number; sy: number; moved: boolean }
    | { type: 'pan'; sx: number; sy: number; cx: number; cy: number }
    | { type: 'pinch'; d: number; z: number }
    | undefined;
  ctx.board.addEventListener('pointerdown', (e) => {
    ctx.board.focus({ preventScroll: true });
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    ctx.board.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      gesture = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), z: ctx.cam.z };
      return;
    }
    const p = ctx.cam.toBoard(e.clientX, e.clientY);
    const i = ctx.sceneAt(p.x, p.y);
    if (i >= 0) {
      const btn = ctx.cardButtons(i, ctx.cardRect(i)).find((b) => inRect(b, p.x, p.y));
      if (btn) {
        void ctx.toggleSong(btn.file);
        gesture = undefined;
        return;
      }
      const pos = ctx.game.scenes[i].pos;
      gesture = { type: 'card', i, dx: p.x - (pos.x + 2) * S, dy: p.y - (pos.y + 2) * S, sx: e.clientX, sy: e.clientY, moved: false };
      ctx.press(i);
    } else gesture = { type: 'pan', sx: e.clientX, sy: e.clientY, cx: ctx.cam.x, cy: ctx.cam.y };
  });
  ctx.board.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!gesture) {
      const p = ctx.cam.toBoard(e.clientX, e.clientY);
      const i = ctx.sceneAt(p.x, p.y);
      ctx.board.style.cursor = i < 0 ? 'grab' : ctx.cardButtons(i, ctx.cardRect(i)).some((b) => inRect(b, p.x, p.y)) ? 'pointer' : 'move';
      return;
    }
    if (gesture.type === 'pinch') {
      const [a, b] = [...pointers.values()];
      if (a && b) ctx.cam.zoomAt((gesture.z * Math.hypot(a.x - b.x, a.y - b.y)) / gesture.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
    } else if (gesture.type === 'pan') {
      ctx.cam.panTo(gesture.cx - (e.clientX - gesture.sx) / ctx.cam.z, gesture.cy - (e.clientY - gesture.sy) / ctx.cam.z);
      ctx.board.style.cursor = 'grabbing';
    } else {
      if (!gesture.moved && Math.hypot(e.clientX - gesture.sx, e.clientY - gesture.sy) < 4) return;
      gesture.moved = true;
      const p = ctx.cam.toBoard(e.clientX, e.clientY);
      ctx.game.scenes[gesture.i].pos = clampPos({ x: (p.x - gesture.dx) / S - 2, y: (p.y - gesture.dy) / S - 2 });
      ctx.draw();
    }
  });
  const endPointer = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (gesture?.type === 'card' && gesture.moved) ctx.cardMoved();
    if (gesture?.type === 'pinch' && pointers.size === 1) {
      const [p] = [...pointers.values()];
      gesture = { type: 'pan', sx: p.x, sy: p.y, cx: ctx.cam.x, cy: ctx.cam.y };
      return;
    }
    gesture = undefined;
  };
  ctx.board.addEventListener('pointerup', endPointer);
  ctx.board.addEventListener('pointercancel', endPointer);
  ctx.board.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX))
        ctx.cam.zoomAt(ctx.cam.z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
      else ctx.cam.panTo(ctx.cam.x + e.deltaX / ctx.cam.z, ctx.cam.y);
    },
    { passive: false },
  );
  ctx.board.addEventListener('dblclick', (e) => {
    const p = ctx.cam.toBoard(e.clientX, e.clientY);
    const i = ctx.sceneAt(p.x, p.y);
    if (i >= 0 && ctx.game.scenes[i].gametype === ADVTYPE) ctx.playFrom(i);
  });
  ctx.board.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') ctx.cam.zoomAt(ctx.cam.z * 1.25);
    else if (e.key === '-') ctx.cam.zoomAt(ctx.cam.z / 1.25);
    else if (e.key === '0') ctx.fit();
    else if (e.key === 'Tab') return;
    else if (e.key.startsWith('Arrow')) {
      // step the selection to the nearest scene in that direction
      const here = ctx.game.scenes[ctx.selected()]?.pos ?? { x: 0, y: 0 };
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key] ?? [0, 0];
      let best = -1;
      let bestD = Infinity;
      for (const i of ctx.used()) {
        const p = ctx.game.scenes[i].pos;
        const dx = p.x - here.x;
        const dy = p.y - here.y;
        const along = dx * dir[0] + dy * dir[1];
        if (i === ctx.selected() || along <= 0) continue;
        const d = along + 2 * Math.abs(dx * dir[1] + dy * dir[0]);
        if (d < bestD) [best, bestD] = [i, d];
      }
      if (best >= 0) ctx.step(best);
    } else return;
    e.preventDefault();
  });
}
