// The whole song at a glance: one row per track, the part shown in the piano roll, the
// loop region, the song end and the playhead. Click or drag to move around.
import { h } from '../../core/ui';
import { noteEnd } from '../../../formats/cmfSong';
import { TRACK_COLORS, type MusicDoc } from './doc';
import type { PianoRoll } from './roll';

export class Overview {
  readonly el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private w = 600;
  private ro: ResizeObserver;
  private dragging = false;

  constructor(
    private doc: MusicDoc,
    private roll: PianoRoll,
  ) {
    this.canvas = h('canvas', { class: 'mus-overview-canvas', 'aria-label': 'The whole song: click to jump there' });
    this.g = this.canvas.getContext('2d')!;
    this.el = h('div', { class: 'mus-overview' }, this.canvas);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
    this.canvas.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.canvas.setPointerCapture(e.pointerId);
      this.jump(e, true);
    });
    this.canvas.addEventListener('pointermove', (e) => this.dragging && this.jump(e, false));
    this.canvas.addEventListener('pointerup', () => (this.dragging = false));
    this.canvas.addEventListener('pointercancel', () => (this.dragging = false));
  }

  dispose(): void {
    this.ro.disconnect();
  }

  private get rowH(): number {
    const n = Math.max(1, this.doc.tracks().length);
    return Math.max(5, Math.min(12, Math.floor(96 / n)));
  }

  private get height(): number {
    return Math.max(40, this.doc.tracks().length * this.rowH + 4);
  }

  private get length(): number {
    return Math.max(1, this.doc.song.end.tick);
  }

  private resize(): void {
    this.w = Math.max(200, Math.floor(this.el.getBoundingClientRect().width));
    this.draw();
  }

  private jump(e: PointerEvent, select: boolean): void {
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const t = (x / this.w) * this.length;
    this.roll.scrollTo(t - this.roll.span / 2);
    if (select) {
      const tracks = this.doc.tracks();
      const ch = tracks[Math.floor((y - 2) / this.rowH)];
      if (ch !== undefined && ch !== this.doc.track) {
        this.doc.selectTrack(ch);
        this.roll.centerOnTrack();
      }
    }
  }

  draw(): void {
    const { g, doc } = this;
    const H = this.height;
    const dpr = window.devicePixelRatio || 1;
    if (this.canvas.width !== Math.floor(this.w * dpr) || this.canvas.height !== Math.floor(H * dpr)) {
      this.canvas.width = Math.floor(this.w * dpr);
      this.canvas.height = Math.floor(H * dpr);
      this.canvas.style.width = `${this.w}px`;
      this.canvas.style.height = `${H}px`;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#05061a';
    g.fillRect(0, 0, this.w, H);
    const L = this.length;
    const sx = this.w / L;
    const tracks = doc.tracks();
    const row = new Map(tracks.map((c, i) => [c, i]));
    const rh = this.rowH;
    tracks.forEach((c, i) => {
      if (c === doc.track) {
        g.fillStyle = '#1a1f55';
        g.fillRect(0, 2 + i * rh, this.w, rh);
      }
    });
    // bars
    const bar = doc.beat * 4;
    if (bar * sx >= 4) {
      g.fillStyle = '#121640';
      for (let t = 0; t < L; t += bar) g.fillRect(Math.round(t * sx), 0, 1, H);
    }
    if (doc.loop) {
      g.fillStyle = doc.loopOn ? 'rgba(85,255,255,0.18)' : 'rgba(85,255,255,0.07)';
      g.fillRect(doc.loop[0] * sx, 0, (doc.loop[1] - doc.loop[0]) * sx, H);
    }
    for (const n of doc.song.notes) {
      const i = row.get(n.on.ch);
      if (i === undefined) continue;
      const heard = doc.heard(n.on.ch) && doc.sounds(n.on.ch);
      g.fillStyle = TRACK_COLORS[n.on.ch];
      g.globalAlpha = heard ? 0.9 : 0.25;
      const y = 2 + i * rh + 1 + Math.round((1 - n.on.a / 127) * Math.max(0, rh - 4));
      g.fillRect(n.on.tick * sx, y, Math.max(1, (noteEnd(doc.song, n) - n.on.tick) * sx - 0.5), Math.max(1, Math.min(3, rh - 3)));
    }
    g.globalAlpha = 1;
    // the roll's view
    g.strokeStyle = '#ffd400';
    g.strokeRect(Math.round(this.roll.scrollX * sx) + 0.5, 0.5, Math.max(4, this.roll.span * sx), H - 1);
    if (doc.playhead !== null) {
      g.fillStyle = '#ffd400';
      g.fillRect(Math.round(doc.playhead * sx), 0, 2, H);
    }
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(doc.cursor * sx), 0, 1, 4);
  }
}
