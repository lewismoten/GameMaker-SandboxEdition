// The whole song at a glance: one row per track, the part shown in the piano roll, the
// loop region, the song end and the playhead. Click or drag to move around. The rows and
// notes are cached; a frame copies them and draws the view, playhead and cursor on top.
import { h } from '../../core/ui';
import { noteEnd, type Note } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import type { MusicDoc } from './doc';
import type { PianoRoll } from './roll';

export class Overview {
  readonly el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private w = 600;
  private ro: ResizeObserver;
  private dragging = false;
  /** The rows, bars, loop and notes, painted once and repainted where they change. */
  private cache = document.createElement('canvas');
  private looks = '';
  private drawn = new Map<Note, [number, number, number, number]>();
  /** The height when last drawn (asking the song for its tracks is too slow for every frame). */
  private shownH = 40;

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
    this.cache.width = this.cache.height = 0;
  }

  private get rowH(): number {
    const n = Math.max(1, this.doc.tracks().length);
    return Math.max(5, Math.min(10, Math.floor(64 / n)));
  }

  private get height(): number {
    return Math.max(40, this.doc.tracks().length * this.rowH + 4);
  }

  private get length(): number {
    return Math.max(1, this.doc.song.end.tick);
  }

  private resize(): void {
    const width = this.el.getBoundingClientRect().width;
    if (!width) return; // hidden (another tab is open): keep the cached picture
    this.w = Math.max(200, Math.floor(width));
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

  /** Brings the cached picture up to date with the song, then shows a frame. */
  draw(): void {
    const { doc } = this;
    const H = (this.shownH = this.height);
    const dpr = window.devicePixelRatio || 1;
    const L = this.length;
    const tracks = doc.tracks();
    const looks = [
      this.w,
      H,
      dpr,
      L,
      tracks.join(),
      doc.track,
      doc.beat,
      doc.loop,
      doc.loopOn,
      tracks.map((c) => `${doc.trackColor(c)}${doc.heard(c) && doc.sounds(c)}`).join(),
    ].join('|');
    const drawn = new Map<Note, [number, number, number, number]>();
    for (const n of doc.song.notes) drawn.set(n, [n.on.ch, n.on.tick, noteEnd(doc.song, n), n.on.a]);
    const sx = this.w / L;
    if (looks !== this.looks) {
      const c = this.cache;
      c.width = Math.floor(this.w * dpr);
      c.height = Math.floor(H * dpr);
      this.paint(0, this.w);
    } else {
      // repaint only where notes changed
      const spans: [number, number][] = [];
      const add = (d: number[]) => spans.push([Math.floor(d[1] * sx) - 1, Math.ceil(d[2] * sx) + 2]);
      for (const [n, d] of drawn) {
        const o = this.drawn.get(n);
        if (o && o[0] === d[0] && o[1] === d[1] && o[2] === d[2] && o[3] === d[3]) continue;
        add(d);
        if (o) add(o);
      }
      for (const [n, o] of this.drawn) if (!drawn.has(n)) add(o);
      if (spans.length > 400) this.paint(0, this.w);
      else for (const [a, b] of spans) this.paint(a, b);
    }
    this.looks = looks;
    this.drawn = drawn;
    this.frame();
  }

  /** Shows a frame from the cached picture: the roll's view, the play head and the cursor. */
  frame(): void {
    if (!this.looks) return this.draw();
    const { g, doc } = this;
    const H = this.shownH;
    const dpr = window.devicePixelRatio || 1;
    if (this.canvas.width !== Math.floor(this.w * dpr) || this.canvas.height !== Math.floor(H * dpr)) {
      this.canvas.width = Math.floor(this.w * dpr);
      this.canvas.height = Math.floor(H * dpr);
      this.canvas.style.width = `${this.w}px`;
      this.canvas.style.height = `${H}px`;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.cache, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = this.w / this.length;
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

  /** Paints pixels [a, b) of the cached picture: rows, bars, loop region and notes. */
  private paint(a: number, b: number): void {
    const { doc } = this;
    const g = this.cache.getContext('2d')!;
    const H = this.shownH;
    const dpr = window.devicePixelRatio || 1;
    a = Math.max(0, a);
    b = Math.min(this.w, b);
    if (b <= a) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.save();
    g.beginPath();
    g.rect(a, 0, b - a, H);
    g.clip();
    g.fillStyle = '#05061a';
    g.fillRect(a, 0, b - a, H);
    const L = this.length;
    const sx = this.w / L;
    const t0 = (a - 2) / sx;
    const t1 = (b + 1) / sx;
    const tracks = doc.tracks();
    const row = new Map(tracks.map((c, i) => [c, i]));
    const rh = this.rowH;
    tracks.forEach((c, i) => {
      if (c === doc.track) {
        g.fillStyle = '#1a1f55';
        g.fillRect(a, 2 + i * rh, b - a, rh);
      }
    });
    // bars
    const bar = doc.beat * 4;
    if (bar * sx >= 4) {
      g.fillStyle = '#121640';
      for (let t = Math.max(0, Math.floor(t0 / bar)) * bar; t < Math.min(L, t1); t += bar) g.fillRect(Math.round(t * sx), 0, 1, H);
    }
    if (doc.loop) {
      g.fillStyle = doc.loopOn ? 'rgba(85,255,255,0.18)' : 'rgba(85,255,255,0.07)';
      g.fillRect(doc.loop[0] * sx, 0, (doc.loop[1] - doc.loop[0]) * sx, H);
    }
    const colors = new Map([...row.keys()].map((c) => [c, doc.trackColor(c)]));
    const heard = new Map([...row.keys()].map((c) => [c, doc.heard(c) && doc.sounds(c)]));
    for (const n of doc.song.notes) {
      const i = row.get(n.on.ch);
      if (i === undefined) continue;
      const e = noteEnd(doc.song, n);
      if (e < t0 || n.on.tick > t1) continue;
      g.fillStyle = colors.get(n.on.ch)!;
      g.globalAlpha = heard.get(n.on.ch) ? 0.9 : 0.25;
      const y = 2 + i * rh + 1 + Math.round((1 - n.on.a / 127) * Math.max(0, rh - 4));
      g.fillRect(n.on.tick * sx, y, Math.max(1, (e - n.on.tick) * sx - 0.5), Math.max(1, Math.min(3, rh - 3)));
    }
    g.globalAlpha = 1;
    g.restore();
  }
}
