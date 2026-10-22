// Painting the piano roll: the grid and notes of the selected track (other tracks faint
// behind), the keyboard, the ruler with loop region, song end and play head, the lane of
// instrument changes, and the velocity bars.
import { channelNotes, programChanges } from '../../../../formats/cmfEdit';
import { noteEnd, type Note } from '../../../../formats/cmfSong';
import { TRACK_COLORS } from '../doc';
import { KEYW, RULER, LANE, HEAD, VEL, BLACK, noteName } from './layout';
import { RollView } from './view';

export abstract class RollDraw extends RollView {
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

  protected drawKeys(rows: number): void {
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

  protected drawRuler(t0: number, t1: number): void {
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

  protected drawLane(t0: number, t1: number): void {
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

  protected drawVelocity(notes: Note[], t0: number, t1: number, silent: boolean): void {
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
}
