// The piano roll's canvas and view: zoom and scroll, converting between ticks/keys/velocities
// and pixels, and finding what is under the pointer.
// The piano roll is one class split into layers, each extending the one before:
//   view -> draw (painting the roll) -> pointer (mouse and touch editing) -> PianoRoll
//   (keys, clipboard and the instrument popup, in roll.ts).
import { h } from '../../../core/ui';
import { channelNotes, programChanges, clampVelocity } from '../../../../formats/cmfEdit';
import { noteEnd, type Ev, type Note } from '../../../../formats/cmfSong';
import { type MusicDoc } from '../doc';
import { KEYW, HEAD, VEL, Drag } from './layout';

export abstract class RollView {
  // Defined by a later layer (see the chain in the header comment).
  abstract draw(): void;
  protected abstract down(e: PointerEvent): void;
  protected abstract move(e: PointerEvent): void;
  protected abstract up(e: PointerEvent): void;
  protected abstract dbl(e: MouseEvent): void;
  protected abstract context(e: MouseEvent): void;
  protected abstract wheel(e: WheelEvent): void;
  protected abstract key(e: KeyboardEvent): void;

  readonly el: HTMLElement;
  protected canvas: HTMLCanvasElement;
  protected g: CanvasRenderingContext2D;
  protected popup?: HTMLElement;
  protected w = 600;
  protected hgt = 320;
  scrollX = 0;
  topKey = 84;
  zoom = 1;
  rowH = 10;
  protected drag?: Drag;
  protected lastMove?: string;
  protected hover?: { note?: Note; edge?: boolean; vel?: boolean };
  protected ro: ResizeObserver;

  constructor(protected doc: MusicDoc) {
    this.canvas = h('canvas', { class: 'mus-roll-canvas', tabIndex: 0, 'aria-label': 'Piano roll: notes of the selected track' });
    this.g = this.canvas.getContext('2d')!;
    this.el = h('div', { class: 'mus-roll' }, this.canvas);
    this.zoom = 40 / doc.beat;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
    this.canvas.addEventListener('pointerdown', (e) => this.down(e));
    this.canvas.addEventListener('pointermove', (e) => this.move(e));
    this.canvas.addEventListener('pointerup', (e) => this.up(e));
    this.canvas.addEventListener('pointercancel', (e) => this.up(e));
    this.canvas.addEventListener('dblclick', (e) => this.dbl(e));
    this.canvas.addEventListener('contextmenu', (e) => this.context(e));
    this.canvas.addEventListener('wheel', (e) => this.wheel(e), { passive: false });
    this.canvas.addEventListener('keydown', (e) => this.key(e));
    this.canvas.addEventListener('pointerleave', () => {
      this.hover = undefined;
      this.draw();
    });
    this.centerOnTrack();
  }

  dispose(): void {
    this.ro.disconnect();
  }

  focus(): void {
    this.canvas.focus({ preventScroll: true });
  }

  // ---- geometry ----

  protected get visibleRows(): number {
    return Math.max(1, Math.floor((this.hgt - HEAD - VEL) / this.rowH));
  }

  xOf(t: number): number {
    return KEYW + (t - this.scrollX) * this.zoom;
  }

  tOf(x: number): number {
    return (x - KEYW) / this.zoom + this.scrollX;
  }

  yOf(key: number): number {
    return HEAD + (this.topKey - key) * this.rowH;
  }

  keyOf(y: number): number {
    return Math.max(0, Math.min(127, this.topKey - Math.floor((y - HEAD) / this.rowH)));
  }

  /** Top of the velocity lane. */
  protected get velTop(): number {
    return this.hgt - VEL;
  }

  /** y of a velocity's bar top in the lane. */
  protected velY(v: number): number {
    return this.hgt - 4 - (v / 127) * (VEL - 12);
  }

  protected velOf(y: number): number {
    return clampVelocity(((this.hgt - 4 - y) / (VEL - 12)) * 127);
  }

  /** Visible span in ticks. */
  get span(): number {
    return (this.w - KEYW) / this.zoom;
  }

  setZoom(z: number, anchorX = KEYW + (this.w - KEYW) / 2): void {
    const t = this.tOf(anchorX);
    this.zoom = Math.max(0.01, Math.min(16, z));
    this.scrollX = Math.max(0, t - (anchorX - KEYW) / this.zoom);
    this.doc.emit('view');
  }

  scrollTo(tick: number): void {
    this.scrollX = Math.max(0, tick);
    this.doc.emit('view');
  }

  setTopKey(k: number): void {
    this.topKey = Math.max(this.visibleRows - 1, Math.min(127, Math.round(k)));
  }

  centerOnTrack(): void {
    const notes = channelNotes(this.doc.song, this.doc.track);
    if (!notes.length) {
      this.setTopKey(72 + this.visibleRows / 2);
      return;
    }
    let lo = 127;
    let hi = 0;
    for (const n of notes) {
      lo = Math.min(lo, n.on.a);
      hi = Math.max(hi, n.on.a);
    }
    this.setTopKey((lo + hi) / 2 + this.visibleRows / 2);
  }

  protected resize(): void {
    const r = this.el.getBoundingClientRect();
    this.w = Math.max(200, Math.floor(r.width));
    this.hgt = Math.max(160 + VEL, Math.floor(r.height));
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.hgt * dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.hgt}px`;
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.setTopKey(this.topKey);
    this.draw();
  }

  // ---- drawing ----

  protected hoverKey = -1;

  protected pos(e: PointerEvent | MouseEvent | WheelEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  protected noteAt(x: number, y: number): { note: Note; edge: boolean } | undefined {
    if (x < KEYW || y < HEAD || y >= this.velTop) return undefined;
    const t = this.tOf(x);
    const k = this.keyOf(y);
    const notes = channelNotes(this.doc.song, this.doc.track);
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      if (n.on.a !== k) continue;
      const s = n.on.tick;
      const e = noteEnd(this.doc.song, n);
      const ex = this.xOf(e);
      if (t >= s && (t <= e || x <= ex + 2)) return { note: n, edge: x >= ex - Math.min(6, (e - s) * this.zoom * 0.35) };
    }
    return undefined;
  }

  /** The velocity bar nearest x (within a few pixels), selected bars first. */
  protected velAt(x: number): Note | undefined {
    let best: Note | undefined;
    let dist = 5;
    for (const n of channelNotes(this.doc.song, this.doc.track)) {
      const dx = Math.abs(this.xOf(n.on.tick) + 1 - x);
      if (dx < dist || (dx === dist && best && !this.doc.selection.has(best) && this.doc.selection.has(n))) {
        best = n;
        dist = dx;
      }
    }
    return best;
  }

  protected programAt(x: number): Ev | undefined {
    const g = this.g;
    for (const e of programChanges(this.doc.song, this.doc.track)) {
      const ex = this.xOf(e.tick);
      if (x >= ex - 2 && x <= ex + g.measureText(`♪${e.a + 1}`).width + 10) return e;
    }
    return undefined;
  }

  // ---- pointer ----
}
