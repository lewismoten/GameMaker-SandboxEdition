// The integrator board's camera: which part of the board shows (x, y: its top-left corner in
// board units) and how far it is zoomed in (z, 0.15 to 4). integrator.ts redraws through
// `redraw` whenever it moves.
import type { Rect } from './board';

export class BoardCamera {
  x = 0;
  y = 0;
  z = 1;
  /** True while the view is still the "show every scene" fit: resizing the board fits it again. */
  fitted = true;

  constructor(
    private readonly board: HTMLCanvasElement,
    private readonly redraw: () => void,
  ) {}

  /** A point on the page, in board units. */
  toBoard(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.board.getBoundingClientRect();
    return { x: this.x + (clientX - r.left) / this.z, y: this.y + (clientY - r.top) / this.z };
  }

  /** Zooms to `z`, keeping the board point under (clientX, clientY), or the middle, where it is. */
  zoomAt(z: number, clientX?: number, clientY?: number): void {
    const r = this.board.getBoundingClientRect();
    const cx = clientX ?? r.left + r.width / 2;
    const cy = clientY ?? r.top + r.height / 2;
    const before = this.toBoard(cx, cy);
    this.fitted = false;
    this.z = Math.max(0.15, Math.min(4, z));
    this.x = before.x - (cx - r.left) / this.z;
    this.y = before.y - (cy - r.top) / this.z;
    this.redraw();
  }

  /** Shows all of `b`, centered. */
  fit(b: Rect): void {
    const w = this.board.clientWidth || 800;
    const hh = this.board.clientHeight || 500;
    const pad = 30;
    this.fitted = true;
    // no bigger than 125%: a game of one or two scenes shouldn't fill the board with giant cards
    this.z = Math.max(0.15, Math.min(1.25, Math.min((w - pad * 2) / b.w, (hh - pad * 2) / b.h)));
    this.x = b.x - (w / this.z - b.w) / 2;
    this.y = b.y - (hh / this.z - b.h) / 2;
    this.redraw();
  }

  /** Scrolls so `r` (a card) is in the middle, unless it is in view already. */
  centerOn(r: Rect): void {
    const w = this.board.clientWidth / this.z;
    const hh = this.board.clientHeight / this.z;
    if (r.x >= this.x && r.y >= this.y && r.x + r.w <= this.x + w && r.y + r.h <= this.y + hh) return;
    this.fitted = false;
    this.x = r.x + r.w / 2 - w / 2;
    this.y = r.y + r.h / 2 - hh / 2;
    this.redraw();
  }

  /** Moves the top-left corner of the view to (x, y), in board units. */
  panTo(x: number, y: number): void {
    this.fitted = false;
    this.x = x;
    this.y = y;
    this.redraw();
  }
}
