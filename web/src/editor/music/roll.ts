// The piano roll: one track's notes (time across, pitch up) with a ruler for the play
// position, loop region and song end, a lane of instrument changes, a keyboard to try notes,
// and a velocity lane under the notes (how loud each note plays: SBFMDRV scales the
// instrument's carrier level by it).
import { h, toast } from '../ui';
import {
  addNote,
  channelNotes,
  deleteNotes,
  noteEnd,
  programChanges,
  removeEvent,
  setEnd,
  setNote,
  setProgramAt,
  setVelocity,
  clampVelocity,
  type Ev,
  type Note,
} from '../../formats/cmfEdit';
import { TRACK_COLORS, type MusicDoc } from './doc';

const KEYW = 46;
const RULER = 18;
const LANE = 16;
const HEAD = RULER + LANE;
/** Height of the velocity lane at the bottom. */
const VEL = 64;
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK = [1, 3, 6, 8, 10];

export const noteName = (k: number) => `${NAMES[k % 12]}${Math.floor(k / 12) - 1}`;

type Drag =
  | { kind: 'move'; notes: Note[]; orig: Map<Note, { start: number; len: number; key: number }>; t0: number; k0: number; grab: Note; changed: boolean }
  | { kind: 'resize'; notes: Note[]; orig: Map<Note, { start: number; len: number; key: number }>; t0: number; grab: Note; changed: boolean }
  | { kind: 'marquee'; x0: number; y0: number; x1: number; y1: number; base: Set<Note> }
  | { kind: 'erase'; changed: boolean }
  | { kind: 'pan'; x0: number; y0: number; sx: number; top: number }
  | { kind: 'ruler'; t0: number; moved: boolean }
  | { kind: 'end'; changed: boolean }
  | { kind: 'vel'; notes: Note[]; orig: Map<Note, number>; y0: number; grab?: Note; relative: boolean; lastX: number; changed: boolean };

export class PianoRoll {
  readonly el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private popup?: HTMLElement;
  private w = 600;
  private hgt = 320;
  scrollX = 0;
  topKey = 84;
  zoom = 1;
  rowH = 10;
  private drag?: Drag;
  private lastMove?: string;
  private hover?: { note?: Note; edge?: boolean; vel?: boolean };
  private ro: ResizeObserver;

  constructor(private doc: MusicDoc) {
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

  private get visibleRows(): number {
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
  private get velTop(): number {
    return this.hgt - VEL;
  }

  /** y of a velocity's bar top in the lane. */
  private velY(v: number): number {
    return this.hgt - 4 - (v / 127) * (VEL - 12);
  }

  private velOf(y: number): number {
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

  private resize(): void {
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

  draw(): void {
    const { g, doc } = this;
    const song = doc.song;
    const W = this.w;
    const H = this.hgt;
    const beat = doc.beat;
    const color = TRACK_COLORS[doc.track];
    g.save();
    g.font = '10px ui-monospace, Menlo, Consolas, monospace';
    g.textBaseline = 'middle';
    g.fillStyle = '#05061a';
    g.fillRect(0, 0, W, H);

    // rows
    const rows = this.visibleRows + 1;
    for (let i = 0; i < rows; i++) {
      const k = this.topKey - i;
      if (k < 0) break;
      const y = this.yOf(k);
      g.fillStyle = BLACK.includes(k % 12) ? '#080a24' : '#0d1030';
      g.fillRect(KEYW, y, W - KEYW, this.rowH);
      if (k % 12 === 0) {
        g.fillStyle = '#1c2050';
        g.fillRect(KEYW, y + this.rowH - 1, W - KEYW, 1);
      }
    }

    // beat and bar lines
    const t0 = this.scrollX;
    const t1 = this.tOf(W);
    const sub = doc.snap;
    if (sub * this.zoom >= 6 && sub < beat) {
      g.fillStyle = '#121640';
      for (let t = Math.ceil(t0 / sub) * sub; t < t1; t += sub) g.fillRect(Math.round(this.xOf(t)), HEAD, 1, H - HEAD);
    }
    const beatStep = beat * this.zoom >= 8 ? beat : beat * 4 * this.zoom >= 8 ? beat * 4 : beat * 16;
    for (let t = Math.ceil(t0 / beatStep) * beatStep; t < t1; t += beatStep) {
      const bar = Math.round(t / beat) % 4 === 0;
      g.fillStyle = bar ? '#2e3680' : '#1a1f55';
      g.fillRect(Math.round(this.xOf(t)), HEAD, 1, H - HEAD);
    }

    // after the end: the song repeats
    const endX = this.xOf(song.end.tick);
    if (endX < W) {
      g.fillStyle = 'rgba(255,85,85,0.08)';
      g.fillRect(Math.max(KEYW, endX), HEAD, W, H - HEAD);
    }

    // loop region
    if (doc.loop && doc.loopOn) {
      const a = this.xOf(doc.loop[0]);
      const b = this.xOf(doc.loop[1]);
      g.fillStyle = 'rgba(85,255,255,0.06)';
      g.fillRect(Math.max(KEYW, a), HEAD, Math.max(0, b - Math.max(KEYW, a)), H - HEAD);
    }

    g.save();
    g.beginPath();
    g.rect(KEYW, HEAD, W - KEYW, this.velTop - HEAD);
    g.clip();

    // other tracks, faint
    if (doc.ghosts) {
      g.fillStyle = 'rgba(160,170,220,0.16)';
      for (const n of song.notes) {
        if (n.on.ch === doc.track) continue;
        const s = n.on.tick;
        const e = noteEnd(song, n);
        if (e < t0 || s > t1) continue;
        const k = n.on.a;
        if (k > this.topKey || k < this.topKey - rows) continue;
        g.fillRect(this.xOf(s), this.yOf(k) + 2, Math.max(1, (e - s) * this.zoom), this.rowH - 4);
      }
    }

    // this track's notes; the part a later note cuts off is drawn hatched
    const notes = channelNotes(song, doc.track);
    const silent = !doc.sounds(doc.track);
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const s = n.on.tick;
      const e = noteEnd(song, n);
      if (e < t0 || s > t1) continue;
      const k = n.on.a;
      if (k > this.topKey + 1 || k < this.topKey - rows) continue;
      let cut = e;
      for (let j = i + 1; j < notes.length; j++) {
        if (notes[j].on.tick >= e) break;
        if (notes[j].on.tick > s || (notes[j].on.tick === s && notes[j].on.seq > n.on.seq)) {
          cut = notes[j].on.tick;
          break;
        }
      }
      const x = this.xOf(s);
      const y = this.yOf(k);
      const wAll = Math.max(2, (e - s) * this.zoom);
      const wHeard = Math.max(2, (cut - s) * this.zoom);
      const sel = doc.selection.has(n);
      // shaded by velocity: soft notes are dim, loud ones bright
      const shade = 0.3 + (0.7 * n.on.b) / 127;
      g.globalAlpha = silent ? 0.35 : 1;
      if (cut < e) {
        g.strokeStyle = color;
        g.globalAlpha *= 0.5;
        g.strokeRect(x + wHeard + 0.5, y + 2.5, wAll - wHeard - 1, this.rowH - 5);
        g.globalAlpha = silent ? 0.35 : 1;
      }
      g.fillStyle = color;
      g.globalAlpha *= shade;
      g.fillRect(x, y + 1, wHeard, this.rowH - 2);
      g.globalAlpha = silent ? 0.35 : 1;
      g.fillRect(x, y + 1, 2, this.rowH - 2);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(x, y + this.rowH - 3, wHeard, 2);
      if (!n.off) {
        // no note-off: it rings until cut or the song repeats
        g.fillStyle = '#ffffff';
        g.fillRect(x + wHeard - 2, y + 1, 2, this.rowH - 2);
      }
      if (sel) {
        g.strokeStyle = '#ffffff';
        g.lineWidth = 2;
        g.strokeRect(x + 1, y + 1, wAll - 2, this.rowH - 2);
        g.lineWidth = 1;
      } else if (this.hover?.note === n) {
        g.strokeStyle = 'rgba(255,255,255,0.7)';
        g.strokeRect(x + 0.5, y + 0.5, wAll - 1, this.rowH - 1);
      }
      if (this.rowH >= 10 && wHeard > 28) {
        g.fillStyle = shade < 0.6 ? '#fff' : '#000';
        g.fillText(noteName(k), x + 3, y + this.rowH / 2);
      }
      g.globalAlpha = 1;
    }

    // marquee
    if (this.drag?.kind === 'marquee') {
      const d = this.drag;
      g.strokeStyle = '#ffd400';
      g.setLineDash([4, 3]);
      g.strokeRect(Math.min(d.x0, d.x1) + 0.5, Math.min(d.y0, d.y1) + 0.5, Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0));
      g.setLineDash([]);
    }
    g.restore();

    if (!doc.tracks().includes(doc.track)) {
      g.fillStyle = '#ffd400';
      g.fillText('No tracks yet: press ＋ Add track to start a melody or a drum part.', KEYW + 14, HEAD + 19);
    } else if (silent) {
      g.fillStyle = 'rgba(5,6,26,0.75)';
      g.fillRect(KEYW + 8, HEAD + 8, Math.min(W - KEYW - 16, 520), 22);
      g.fillStyle = '#ff8888';
      g.fillText(
        doc.track === 9 || doc.track === 10
          ? 'Game-Maker never plays channel ' + (doc.track + 1) + ': these notes are silent.'
          : doc.rhythm
            ? 'With the drum kit on, only tracks 1-6 and the drums play: these notes are silent.'
            : 'This is a drum channel: turn on the drum kit (Song settings) to hear it.',
        KEYW + 14,
        HEAD + 19,
      );
    }

    this.drawKeys(rows);
    this.drawRuler(t0, t1);
    this.drawLane(t0, t1);
    this.drawVelocity(notes, t0, t1, silent);

    // cursor (where play starts) and playhead
    const cx = this.xOf(doc.cursor);
    if (cx >= KEYW && cx <= W) {
      g.strokeStyle = 'rgba(255,255,255,0.6)';
      g.setLineDash([3, 3]);
      g.beginPath();
      g.moveTo(Math.round(cx) + 0.5, RULER);
      g.lineTo(Math.round(cx) + 0.5, H);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.moveTo(cx - 5, 0);
      g.lineTo(cx + 5, 0);
      g.lineTo(cx, 7);
      g.fill();
    }
    if (endX >= KEYW && endX <= W) {
      g.fillStyle = '#ff5555';
      g.fillRect(Math.round(endX) - 1, 0, 2, H);
      g.fillRect(Math.round(endX) - 1, 0, 30, 12);
      g.fillStyle = '#000';
      g.fillText('END', Math.round(endX) + 3, 6);
    }
    if (doc.playhead !== null) {
      const px = this.xOf(doc.playhead);
      if (px >= KEYW && px <= W) {
        g.fillStyle = '#ffd400';
        g.fillRect(Math.round(px), 0, 2, H);
      }
    }
    g.restore();
  }

  private drawKeys(rows: number): void {
    const g = this.g;
    g.fillStyle = '#000';
    g.fillRect(0, HEAD, KEYW, this.hgt - HEAD);
    for (let i = 0; i < rows; i++) {
      const k = this.topKey - i;
      if (k < 0) break;
      const y = this.yOf(k);
      const black = BLACK.includes(k % 12);
      g.fillStyle = black ? '#1a1a1a' : '#e8e8e8';
      g.fillRect(black ? 0 : 0, y, black ? KEYW - 14 : KEYW - 1, this.rowH - 1);
      if (this.hover?.note === undefined && this.hoverKey === k) {
        g.fillStyle = TRACK_COLORS[this.doc.track];
        g.fillRect(KEYW - 6, y, 5, this.rowH - 1);
      }
      if (k % 12 === 0 && this.rowH >= 7) {
        g.fillStyle = '#000080';
        g.fillText(noteName(k), KEYW - 26, y + this.rowH / 2);
      }
    }
  }

  private hoverKey = -1;

  private drawRuler(t0: number, t1: number): void {
    const { g, doc } = this;
    const beat = doc.beat;
    g.fillStyle = '#000080';
    g.fillRect(0, 0, this.w, RULER);
    if (doc.loop) {
      const a = Math.max(KEYW, this.xOf(doc.loop[0]));
      const b = this.xOf(doc.loop[1]);
      g.fillStyle = doc.loopOn ? 'rgba(85,255,255,0.55)' : 'rgba(85,255,255,0.2)';
      g.fillRect(a, 3, Math.max(0, b - a), RULER - 6);
    }
    const barTicks = beat * 4;
    const every = Math.max(1, Math.ceil(36 / (barTicks * this.zoom)));
    g.fillStyle = '#ffd400';
    for (let bar = Math.floor(t0 / barTicks); bar * barTicks < t1; bar++) {
      if (bar % every) continue;
      const x = this.xOf(bar * barTicks);
      if (x < KEYW) continue;
      g.fillRect(Math.round(x), RULER - 6, 1, 6);
      g.fillText(String(bar + 1), Math.round(x) + 3, RULER / 2);
    }
    g.fillStyle = '#000';
    g.fillRect(0, 0, KEYW, HEAD);
    g.fillStyle = '#ffd400';
    g.fillText('BAR', 6, RULER / 2);
    g.fillStyle = '#9aa2d8';
    g.fillText('INST', 6, RULER + LANE / 2);
  }

  private drawLane(t0: number, t1: number): void {
    const { g, doc } = this;
    g.fillStyle = '#0a0c26';
    g.fillRect(KEYW, RULER, this.w - KEYW, LANE);
    g.fillStyle = '#1c2050';
    g.fillRect(KEYW, HEAD - 1, this.w - KEYW, 1);
    for (const e of programChanges(doc.song, doc.track)) {
      if (e.tick < t0 - 100 / this.zoom || e.tick > t1) continue;
      const x = this.xOf(e.tick);
      if (x < KEYW - 2) continue;
      const label = `♪${e.a + 1}`;
      const w = g.measureText(label).width + 8;
      g.fillStyle = doc.song.instruments[e.a] ? TRACK_COLORS[doc.track] : '#ff5555';
      g.fillRect(x, RULER + 2, w, LANE - 4);
      g.fillStyle = '#000';
      g.fillText(label, x + 4, RULER + LANE / 2);
    }
    // the drum kit switching on or off part way through (at the start it is a song setting)
    for (const e of doc.song.events) {
      if (e.type !== 'mode' || e.tick === 0 || e.tick < t0 || e.tick > t1) continue;
      const x = this.xOf(e.tick);
      g.fillStyle = '#ffffff';
      g.fillRect(Math.round(x), RULER, 1, LANE);
      g.fillText(e.a ? 'DRUMS ON' : 'DRUMS OFF', x + 3, RULER + LANE / 2);
    }
  }

  private drawVelocity(notes: Note[], t0: number, t1: number, silent: boolean): void {
    const { g, doc } = this;
    const W = this.w;
    const H = this.hgt;
    const top = this.velTop;
    const color = TRACK_COLORS[doc.track];
    g.fillStyle = '#000';
    g.fillRect(0, top, W, VEL);
    g.fillStyle = '#070920';
    g.fillRect(KEYW, top + 2, W - KEYW, VEL - 2);
    g.fillStyle = '#2e3680';
    g.fillRect(0, top, W, 2);
    // guides at 127, 64 and 1
    for (const v of [127, 64]) {
      g.fillStyle = v === 127 ? '#1c2050' : '#141838';
      g.fillRect(KEYW, Math.round(this.velY(v)), W - KEYW, 1);
    }
    const beat = doc.beat;
    const beatStep = beat * this.zoom >= 8 ? beat : beat * 4 * this.zoom >= 8 ? beat * 4 : beat * 16;
    g.fillStyle = '#12163a';
    for (let t = Math.ceil(t0 / beatStep) * beatStep; t < t1; t += beatStep) g.fillRect(Math.round(this.xOf(t)), top + 2, 1, VEL - 2);
    g.fillStyle = '#9aa2d8';
    g.fillText('VEL', 6, top + VEL / 2);
    g.fillStyle = '#5c64a0';
    g.textAlign = 'right';
    g.fillText('127', KEYW - 4, top + 9);
    g.fillText('1', KEYW - 4, H - 8);
    g.textAlign = 'left';
    g.save();
    g.beginPath();
    g.rect(KEYW, top + 2, W - KEYW, VEL - 2);
    g.clip();
    const d = this.drag?.kind === 'vel' ? this.drag : undefined;
    let label: { x: number; y: number; v: number } | undefined;
    // selected bars on top
    const order = [...notes].sort((a, b) => Number(doc.selection.has(a)) - Number(doc.selection.has(b)));
    for (const n of order) {
      const s = n.on.tick;
      if (s < t0 - 4 / this.zoom || s > t1) continue;
      const x = Math.round(this.xOf(s));
      const y = Math.round(this.velY(n.on.b));
      const sel = doc.selection.has(n);
      const hot = this.hover?.vel && this.hover.note === n;
      g.globalAlpha = silent ? 0.4 : 1;
      g.fillStyle = sel ? '#ffffff' : color;
      g.globalAlpha *= sel || hot ? 1 : 0.4 + (0.6 * n.on.b) / 127;
      g.fillRect(x, y, 2, H - 4 - y);
      g.fillRect(x - 2, y - 1, 7, 3);
      g.globalAlpha = 1;
      if (hot || (d && (d.grab === n || (d.changed && d.notes.includes(n) && d.notes.length === 1)))) label = { x, y, v: n.on.b };
    }
    if (d?.grab && d.relative) label = { x: Math.round(this.xOf(d.grab.on.tick)), y: Math.round(this.velY(d.grab.on.b)), v: d.grab.on.b };
    if (label) {
      const text = String(label.v);
      const tw = g.measureText(text).width + 6;
      const lx = Math.min(W - tw - 2, label.x + 6);
      const ly = Math.max(top + 4, label.y - 14);
      g.fillStyle = '#ffd400';
      g.fillRect(lx, ly, tw, 12);
      g.fillStyle = '#000';
      g.fillText(text, lx + 3, ly + 6);
    }
    g.restore();
  }

  // ---- hit testing ----

  private pos(e: PointerEvent | MouseEvent | WheelEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private noteAt(x: number, y: number): { note: Note; edge: boolean } | undefined {
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
  private velAt(x: number): Note | undefined {
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

  private programAt(x: number): Ev | undefined {
    const g = this.g;
    for (const e of programChanges(this.doc.song, this.doc.track)) {
      const ex = this.xOf(e.tick);
      if (x >= ex - 2 && x <= ex + g.measureText(`♪${e.a + 1}`).width + 10) return e;
    }
    return undefined;
  }

  // ---- pointer ----

  private down(e: PointerEvent): void {
    this.closePopup();
    this.focus();
    const { x, y } = this.pos(e);
    const doc = this.doc;
    const song = doc.song;
    if (e.button === 2) return;
    const panning = doc.tool === 'pan' || e.button === 1;
    if (panning) {
      this.drag = { kind: 'pan', x0: x, y0: y, sx: this.scrollX, top: this.topKey };
      this.canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (y < RULER) {
      if (x < KEYW) return;
      const endX = this.xOf(song.end.tick);
      this.canvas.setPointerCapture(e.pointerId);
      if (Math.abs(x - endX) <= 6 || (x >= endX && x <= endX + 30)) {
        doc.begin();
        this.drag = { kind: 'end', changed: false };
        return;
      }
      this.drag = { kind: 'ruler', t0: doc.quantize(this.tOf(x)), moved: false };
      return;
    }
    if (y < HEAD) {
      if (x < KEYW) return;
      const ev = this.programAt(x);
      if (ev) this.programPopup(ev, x);
      else {
        const t = doc.quantize(this.tOf(x));
        doc.begin();
        const added = setProgramAt(song, doc.track, t, programAtTick(doc, t));
        doc.commit();
        this.programPopup(added, x);
      }
      return;
    }
    if (y >= this.velTop) {
      if (x < KEYW || !doc.tracks().includes(doc.track)) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.velDown(x, y, e.shiftKey || e.metaKey || e.ctrlKey);
      return;
    }
    if (x < KEYW) {
      const k = this.keyOf(y);
      void doc.audition(doc.track, k);
      return;
    }
    if (!doc.tracks().includes(doc.track)) {
      toast('Add a track first (＋ Add track).');
      return;
    }
    this.canvas.setPointerCapture(e.pointerId);
    const hit = this.noteAt(x, y);
    if (doc.tool === 'erase') {
      doc.begin();
      this.drag = { kind: 'erase', changed: false };
      this.eraseAt(x, y);
      return;
    }
    if (hit) {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        if (doc.selection.has(hit.note)) doc.selection.delete(hit.note);
        else doc.selection.add(hit.note);
        doc.emit('view');
        return;
      }
      if (!doc.selection.has(hit.note)) {
        doc.selection.clear();
        doc.selection.add(hit.note);
      }
      const notes = [...doc.selection];
      const orig = new Map(notes.map((n) => [n, { start: n.on.tick, len: noteEnd(song, n) - n.on.tick, key: n.on.a }]));
      doc.begin();
      const t = this.tOf(x);
      if (hit.edge) this.drag = { kind: 'resize', notes, orig, t0: t, grab: hit.note, changed: false };
      else this.drag = { kind: 'move', notes, orig, t0: t, k0: this.keyOf(y), grab: hit.note, changed: false };
      doc.emit('view');
      return;
    }
    if (doc.tool === 'select' || e.shiftKey) {
      this.drag = { kind: 'marquee', x0: x, y0: y, x1: x, y1: y, base: e.shiftKey ? new Set(doc.selection) : new Set() };
      if (!e.shiftKey) doc.selection.clear();
      doc.emit('view');
      return;
    }
    // draw a new note; dragging sets its length
    const start = doc.snapBeats ? Math.floor(this.tOf(x) / doc.snap) * doc.snap : Math.round(this.tOf(x));
    const key = this.keyOf(y);
    doc.begin();
    const n = addNote(song, doc.track, key, Math.max(0, start), doc.noteLen, doc.velocity);
    doc.selection.clear();
    doc.selection.add(n);
    this.drag = { kind: 'resize', notes: [n], orig: new Map([[n, { start: n.on.tick, len: doc.noteLen, key }]]), t0: this.tOf(x), grab: n, changed: true };
    void doc.audition(doc.track, key);
    doc.emit('view');
  }

  private move(e: PointerEvent): void {
    const { x, y } = this.pos(e);
    const doc = this.doc;
    const d = this.drag;
    if (!d) {
      const inVel = y >= this.velTop;
      const velNote = inVel && x >= KEYW ? this.velAt(x) : undefined;
      const hit: { note: Note; edge: boolean; vel?: boolean } | undefined = inVel
        ? velNote
          ? { note: velNote, edge: false, vel: true }
          : undefined
        : this.noteAt(x, y);
      const k = x < KEYW && y >= HEAD && !inVel ? this.keyOf(y) : -1;
      if (hit?.note !== this.hover?.note || hit?.edge !== this.hover?.edge || !!hit?.vel !== !!this.hover?.vel || k !== this.hoverKey) {
        this.hover = hit;
        this.hoverKey = k;
        this.draw();
      }
      this.canvas.style.cursor = inVel
        ? x < KEYW
          ? 'default'
          : velNote
            ? 'ns-resize'
            : 'crosshair'
        : y < RULER
          ? 'col-resize'
          : y < HEAD
            ? 'pointer'
            : x < KEYW
              ? 'pointer'
              : doc.tool === 'pan'
                ? 'grab'
                : hit
                  ? hit.edge
                    ? 'ew-resize'
                    : 'move'
                  : doc.tool === 'erase'
                    ? 'not-allowed'
                    : 'crosshair';
      return;
    }
    const song = doc.song;
    switch (d.kind) {
      case 'pan':
        this.scrollX = Math.max(0, d.sx - (x - d.x0) / this.zoom);
        this.setTopKey(d.top + Math.round((y - d.y0) / this.rowH));
        doc.emit('view');
        return;
      case 'ruler': {
        const t = doc.quantize(this.tOf(x));
        if (t !== d.t0) {
          d.moved = true;
          doc.loop = [Math.min(t, d.t0), Math.max(t, d.t0)];
          doc.loopOn = true;
          doc.emit('view');
        }
        return;
      }
      case 'end':
        setEnd(song, doc.quantize(this.tOf(x)));
        d.changed = true;
        doc.emit('view');
        return;
      case 'vel':
        this.velMove(d, x, y);
        return;
      case 'erase':
        this.eraseAt(x, y);
        return;
      case 'marquee': {
        d.x1 = x;
        d.y1 = y;
        const ta = this.tOf(Math.min(d.x0, x));
        const tb = this.tOf(Math.max(d.x0, x));
        const ka = this.keyOf(Math.max(d.y0, y));
        const kb = this.keyOf(Math.min(d.y0, y));
        doc.selection = new Set(d.base);
        for (const n of channelNotes(song, doc.track)) if (n.on.a >= ka && n.on.a <= kb && n.on.tick <= tb && noteEnd(song, n) >= ta) doc.selection.add(n);
        doc.emit('view');
        return;
      }
      case 'move': {
        const g = d.orig.get(d.grab)!;
        const raw = g.start + (this.tOf(x) - d.t0);
        let dt = (doc.snapBeats ? doc.quantize(raw) : Math.round(raw)) - g.start;
        let dk = this.keyOf(y) - d.k0;
        for (const o of d.orig.values()) {
          dt = Math.max(dt, -o.start);
          dk = Math.max(-o.key, Math.min(127 - o.key, dk));
        }
        const last = [...d.orig.values()].map((o) => `${o.start + dt}:${o.key + dk}`).join();
        if (this.lastMove === last) return;
        this.lastMove = last;
        const pitchChanged = d.notes.some((n) => n.on.a !== d.orig.get(n)!.key + dk);
        for (const n of d.notes) {
          const o = d.orig.get(n)!;
          setNote(song, n, o.start + dt, o.len, o.key + dk);
        }
        d.changed = true;
        if (pitchChanged) void doc.audition(doc.track, d.grab.on.a);
        doc.emit('view');
        return;
      }
      case 'resize': {
        const g = d.orig.get(d.grab)!;
        const rawEnd = g.start + g.len + (this.tOf(x) - d.t0);
        const end = doc.snapBeats ? doc.quantize(rawEnd) : Math.round(rawEnd);
        const dl = end - (g.start + g.len);
        for (const n of d.notes) {
          const o = d.orig.get(n)!;
          setNote(song, n, o.start, Math.max(doc.snapBeats ? doc.snap : 1, o.len + dl), o.key);
        }
        d.changed = true;
        doc.emit('view');
        return;
      }
    }
  }

  private up(e: PointerEvent): void {
    const d = this.drag;
    this.drag = undefined;
    this.lastMove = undefined;
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    if (!d) return;
    const doc = this.doc;
    switch (d.kind) {
      case 'ruler':
        if (!d.moved) {
          doc.cursor = d.t0;
          if (doc.playing) void doc.play(d.t0);
        } else if (doc.playing) doc.remix();
        doc.emit('view');
        return;
      case 'vel':
        if (d.changed) {
          const n = d.grab ?? d.notes[d.notes.length - 1];
          if (n) {
            doc.velocity = n.on.b;
            if (d.grab) void doc.audition(doc.track, n.on.a, programAtTick(doc, n.on.tick), 50, n.on.b);
          }
          doc.commit();
        } else doc.undoDiscard();
        return;
      case 'move':
      case 'resize':
      case 'erase':
      case 'end':
        if (d.changed) {
          if (d.kind === 'resize' && d.notes.length === 1) doc.noteLen = noteEnd(doc.song, d.notes[0]) - d.notes[0].on.tick;
          doc.commit();
        } else doc.undoDiscard();
        return;
      case 'marquee':
        doc.emit('view');
        return;
    }
  }

  // ---- velocity lane ----

  private velDown(x: number, y: number, add: boolean): void {
    const doc = this.doc;
    const hit = this.velAt(x);
    doc.begin();
    if (hit) {
      if (add) {
        if (!doc.selection.has(hit)) doc.selection.add(hit);
      } else if (!doc.selection.has(hit)) {
        doc.selection.clear();
        doc.selection.add(hit);
      }
      // several selected: drag them all up or down together; one: set it where the pointer is
      const notes = doc.selection.size > 1 ? [...doc.selection] : [hit];
      const relative = notes.length > 1;
      this.drag = { kind: 'vel', notes, orig: new Map(notes.map((n) => [n, n.on.b])), y0: y, grab: hit, relative, lastX: x, changed: false };
      if (!relative) this.velMove(this.drag, x, y);
      doc.emit('view');
      return;
    }
    // empty space: paint the bars the pointer passes over (only selected ones, if any)
    this.drag = { kind: 'vel', notes: [], orig: new Map(), y0: y, relative: false, lastX: x, changed: false };
    this.velMove(this.drag, x, y);
  }

  private velMove(d: Extract<Drag, { kind: 'vel' }>, x: number, y: number): void {
    const doc = this.doc;
    if (d.grab) {
      if (d.relative) {
        const dv = Math.round(((d.y0 - y) / (VEL - 12)) * 127);
        for (const n of d.notes) setVelocity([n], d.orig.get(n)! + dv);
      } else setVelocity(d.notes, this.velOf(y));
      d.changed = true;
      doc.emit('view');
      return;
    }
    const ta = this.tOf(Math.min(d.lastX, x) - 3);
    const tb = this.tOf(Math.max(d.lastX, x) + 3);
    d.lastX = x;
    const v = this.velOf(y);
    const only = doc.selection.size ? doc.selection : undefined;
    for (const n of channelNotes(doc.song, doc.track)) {
      if (n.on.tick < ta || n.on.tick > tb || (only && !only.has(n))) continue;
      setVelocity([n], v);
      if (!d.notes.includes(n)) d.notes.push(n);
      d.changed = true;
    }
    doc.emit('view');
  }

  private eraseAt(x: number, y: number): void {
    const hit = this.noteAt(x, y);
    const d = this.drag;
    if (!hit || d?.kind !== 'erase') return;
    deleteNotes(this.doc.song, [hit.note]);
    this.doc.selection.delete(hit.note);
    d.changed = true;
    this.doc.emit('view');
  }

  private dbl(e: MouseEvent): void {
    const { x, y } = this.pos(e);
    const hit = this.noteAt(x, y);
    if (!hit) return;
    this.doc.edit(() => deleteNotes(this.doc.song, [hit.note]));
    this.doc.selection.delete(hit.note);
  }

  private context(e: MouseEvent): void {
    const { x, y } = this.pos(e);
    const hit = this.noteAt(x, y);
    if (!hit) return;
    e.preventDefault();
    this.doc.edit(() => deleteNotes(this.doc.song, [hit.note]));
    this.doc.selection.delete(hit.note);
  }

  private wheel(e: WheelEvent): void {
    e.preventDefault();
    const { x } = this.pos(e);
    if (e.ctrlKey || e.metaKey) {
      this.setZoom(this.zoom * Math.pow(1.0015, -e.deltaY), Math.max(KEYW, x));
      return;
    }
    const dx = e.shiftKey ? e.deltaY : e.deltaX;
    const dy = e.shiftKey ? 0 : e.deltaY;
    if (dx) this.scrollX = Math.max(0, this.scrollX + dx / this.zoom);
    if (dy) this.setTopKey(this.topKey - dy / this.rowH / 1.5);
    this.doc.emit('view');
  }

  private key(e: KeyboardEvent): void {
    const doc = this.doc;
    const song = doc.song;
    const mod = e.ctrlKey || e.metaKey;
    const sel = [...doc.selection];
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!sel.length) return;
      e.preventDefault();
      doc.edit(() => deleteNotes(song, sel));
      doc.selection.clear();
      return;
    }
    if (mod && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      doc.selection = new Set(channelNotes(song, doc.track));
      doc.emit('view');
      return;
    }
    if (mod && e.key.toLowerCase() === 'c') {
      this.copy();
      return;
    }
    if (mod && e.key.toLowerCase() === 'x') {
      this.copy();
      doc.edit(() => deleteNotes(song, sel));
      doc.selection.clear();
      return;
    }
    if (mod && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      this.paste(doc.cursor);
      return;
    }
    if (mod && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      if (!sel.length) return;
      this.copy();
      const end = Math.max(...sel.map((n) => noteEnd(song, n)));
      const start = Math.min(...sel.map((n) => n.on.tick));
      this.paste(start + Math.max(doc.snap, Math.ceil((end - start) / doc.snap) * doc.snap));
      return;
    }
    if (e.key === 'Escape') {
      doc.selection.clear();
      doc.emit('view');
      return;
    }
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && sel.length) {
      // Alt+Up/Down: louder or softer (Shift: by 10)
      e.preventDefault();
      const dv = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1);
      doc.edit(() => {
        for (const n of sel) setVelocity([n], n.on.b + dv);
      });
      doc.velocity = sel[0].on.b;
      doc.emit('view');
      return;
    }
    const arrows: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const a = arrows[e.key];
    if (a && sel.length) {
      e.preventDefault();
      const dt = a[0] * doc.snap;
      const dk = a[1] * (e.shiftKey ? 12 : 1);
      if (sel.some((n) => n.on.tick + dt < 0 || n.on.a + dk < 0 || n.on.a + dk > 127)) return;
      doc.edit(() => {
        for (const n of sel) setNote(song, n, n.on.tick + dt, noteEnd(song, n) - n.on.tick, n.on.a + dk);
      });
      if (dk) void doc.audition(doc.track, sel[0].on.a);
      this.reveal(sel);
    }
  }

  /** Scrolls so the notes are in view. */
  reveal(notes: Note[]): void {
    if (!notes.length) return;
    const keys = notes.map((n) => n.on.a);
    const hi = Math.max(...keys);
    const lo = Math.min(...keys);
    if (hi > this.topKey || lo < this.topKey - this.visibleRows + 1) this.setTopKey((hi + lo) / 2 + this.visibleRows / 2);
    const start = Math.min(...notes.map((n) => n.on.tick));
    if (start < this.scrollX || start > this.scrollX + this.span * 0.9) this.scrollX = Math.max(0, start - this.span * 0.1);
    this.doc.emit('view');
  }

  copy(): void {
    const sel = [...this.doc.selection];
    if (!sel.length) return;
    const start = Math.min(...sel.map((n) => n.on.tick));
    this.doc.clipboard = sel.map((n) => ({ dt: n.on.tick - start, len: noteEnd(this.doc.song, n) - n.on.tick, key: n.on.a, vel: n.on.b }));
  }

  paste(at: number): void {
    const doc = this.doc;
    if (!doc.clipboard.length) return;
    doc.edit(() => {
      doc.selection.clear();
      for (const c of doc.clipboard) doc.selection.add(addNote(doc.song, doc.track, c.key, at + c.dt, c.len, c.vel));
    });
    this.reveal([...doc.selection]);
  }

  // ---- instrument change popup ----

  private closePopup(): void {
    this.popup?.remove();
    this.popup = undefined;
  }

  private programPopup(ev: Ev, x: number): void {
    this.closePopup();
    const doc = this.doc;
    const insts = doc.song.instruments;
    const sel = h(
      'select',
      { 'aria-label': 'Instrument' },
      ...insts.map((_, i) => h('option', { value: String(i), selected: i === ev.a }, `Instrument ${i + 1}`)),
      ev.a >= insts.length ? h('option', { value: String(ev.a), selected: true }, `Instrument ${ev.a + 1} (missing)`) : null,
    );
    sel.addEventListener('change', () => {
      doc.edit(() => (ev.a = Number(sel.value)));
      void doc.audition(doc.track, 60, ev.a);
    });
    this.popup = h(
      'div',
      { class: 'mus-popup', style: `left:${Math.min(x, this.w - 220)}px;top:${HEAD + 2}px` },
      h('strong', null, `Change instrument at bar ${doc.barBeat(ev.tick)}`),
      sel,
      h(
        'div',
        { class: 'toolbar' },
        h(
          'button',
          {
            class: 'danger',
            onclick: () => {
              doc.edit(() => removeEvent(doc.song, ev));
              this.closePopup();
            },
          },
          'Remove',
        ),
        h('button', { onclick: () => this.closePopup() }, 'Done'),
      ),
    );
    this.el.append(this.popup);
    sel.focus();
  }
}

function programAtTick(doc: MusicDoc, t: number): number {
  let p = doc.track;
  for (const e of programChanges(doc.song, doc.track)) if (e.tick <= t) p = e.a;
  return p;
}
