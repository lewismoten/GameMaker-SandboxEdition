// Showing the piano roll. The scrolling content (grid, notes, ruler, instrument lane,
// velocity bars; paint.ts) lives in cached tiles (tiles.ts) and the keyboard column in one
// more; a frame copies those and draws the cursor, song end, play head and what follows the
// pointer on top. draw() first brings the caches up to date: a change of zoom, rows, track,
// colors, loop or the like repaints every tile, a note change only the ticks it touched
// (state.ts). frame() alone, for each playback tick, never repaints the content.
import { programChanges } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfEdit';
import { type Note } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { KEYW, RULER, LANE, HEAD, VEL, BLACK, noteName } from './layout';
import { FONT, paintStretch, type Scene } from './paint';
import { changedSpans, shownNotes, type Drawn } from './state';
import { TILE, Tiles } from './tiles';
import { RollView } from './view';

/** World pixels around a changed span that are repainted too (velocity bar heads, outlines). */
const PAD = 8;

export abstract class RollDraw extends RollView {
  private scene?: Scene;
  private tiles = new Tiles((g, ox, a, b) => paintStretch(g, this.scene!, ox, a, b));
  private looks = '';
  private drawn = new Map<Note, Drawn>();
  private endTick = 0;
  private keys = document.createElement('canvas');
  private keysLook = '';
  /** Whether the selected track is one of the song's tracks (asked once per change). */
  private listed = true;

  /** Brings the cached picture up to date with the song and view, then shows a frame. */
  draw(): void {
    this.sync();
    this.frame();
  }

  /** Shows a frame from the cached picture: for the play head and following playback. */
  frame(): void {
    if (!this.scene) this.sync();
    const { g, doc } = this;
    const W = this.w;
    const dpr = window.devicePixelRatio || 1;
    const zx = this.scrollX * this.zoom;
    const i0 = Math.max(0, Math.floor(zx / TILE));
    const i1 = Math.floor((zx + W - KEYW) / TILE);
    const tiles = this.tiles.span(i0, i1);
    if (doc.playing) this.tiles.prefetch(i1 + 1);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    // whole device pixels, so tiles meet without seams and stay crisp
    const off = Math.round((KEYW - zx) * dpr);
    const step = Math.round(TILE * dpr);
    tiles.forEach((c, j) => g.drawImage(c, off + (i0 + j) * step, 0));
    this.paintKeys(dpr);
    g.drawImage(this.keys, 0, 0);
    g.restore();
    this.drawOverlays();
  }

  /** Repaints what changed since the last paint (everything when unsure). */
  private sync(): void {
    const { doc } = this;
    const song = doc.song;
    const dpr = window.devicePixelRatio || 1;
    const shown = shownNotes(song, doc.track, doc.ghosts, doc.selection, this.hover);
    const color = doc.trackColor(doc.track);
    const silent = !doc.sounds(doc.track);
    this.listed = doc.tracks().includes(doc.track);
    this.scene = {
      doc,
      song,
      zoom: this.zoom,
      rowH: this.rowH,
      topKey: this.topKey,
      rows: this.visibleRows + 1,
      hgt: this.hgt,
      notes: shown.notes,
      cuts: shown.cuts,
      color,
      silent,
      hover: this.hover,
    };
    const lane = programChanges(song, doc.track)
      .map((e) => `${e.tick}:${e.a}:${song.instruments[e.a] ? 1 : 0}`)
      .join();
    const modes = song.events
      .filter((e) => e.type === 'mode')
      .map((e) => `${e.tick}:${e.a}`)
      .join();
    const looks = [
      this.zoom,
      this.rowH,
      this.topKey,
      this.hgt,
      dpr,
      doc.track,
      color,
      silent,
      doc.ghosts,
      doc.beat,
      doc.snap,
      doc.loop,
      doc.loopOn,
      lane,
      modes,
    ].join('|');
    const spans = looks === this.looks ? changedSpans(this.drawn, shown.drawn) : null;
    if (!spans) this.tiles.reset(dpr, this.hgt);
    else {
      if (song.end.tick !== this.endTick) spans.push([Math.min(song.end.tick, this.endTick), Infinity]);
      for (const [s, e] of spans) this.tiles.repaint(s * this.zoom - PAD, e * this.zoom + PAD);
    }
    this.looks = looks;
    this.drawn = shown.drawn;
    this.endTick = song.end.tick;
  }

  /** The keyboard and the lane names down the left, cached until they change. */
  private paintKeys(dpr: number): void {
    const hot = this.hover?.note === undefined ? this.hoverKey : -1;
    const color = this.scene!.color;
    const look = [this.topKey, this.rowH, this.hgt, dpr, hot, color].join('|');
    if (look === this.keysLook) return;
    this.keysLook = look;
    const c = this.keys;
    c.width = Math.round(KEYW * dpr);
    c.height = Math.round(this.hgt * dpr);
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.font = FONT;
    g.textBaseline = 'middle';
    const H = this.hgt;
    g.fillStyle = '#000';
    g.fillRect(0, HEAD, KEYW, H - HEAD);
    const rows = this.visibleRows + 1;
    for (let i = 0; i < rows; i++) {
      const k = this.topKey - i;
      if (k < 0) break;
      const y = this.yOf(k);
      const black = BLACK.includes(k % 12);
      g.fillStyle = black ? '#1a1a1a' : '#e8e8e8';
      g.fillRect(0, y, black ? KEYW - 14 : KEYW - 1, this.rowH - 1);
      if (hot === k) {
        g.fillStyle = color;
        g.fillRect(KEYW - 6, y, 5, this.rowH - 1);
      }
      if (k % 12 === 0 && this.rowH >= 7) {
        g.fillStyle = '#000080';
        g.fillText(noteName(k), KEYW - 26, y + this.rowH / 2);
      }
    }
    // the ruler's and instrument lane's names
    g.fillStyle = '#000';
    g.fillRect(0, 0, KEYW, HEAD);
    g.fillStyle = '#ffd400';
    g.fillText('BAR', 6, RULER / 2);
    g.fillStyle = '#9aa2d8';
    g.fillText('INST', 6, RULER + LANE / 2);
    // the velocity lane's name and scale
    const top = this.velTop;
    g.fillStyle = '#000';
    g.fillRect(0, top, KEYW, VEL);
    g.fillStyle = '#2e3680';
    g.fillRect(0, top, KEYW, 2);
    g.fillStyle = '#9aa2d8';
    g.fillText('VEL', 6, top + VEL / 2);
    g.fillStyle = '#5c64a0';
    g.textAlign = 'right';
    g.fillText('127', KEYW - 4, top + 9);
    g.fillText('1', KEYW - 4, H - 8);
  }

  /** The marquee, notices, the velocity being set, the cursor, the song end and the play head. */
  private drawOverlays(): void {
    const { g, doc } = this;
    const W = this.w;
    const H = this.hgt;
    const silent = this.scene!.silent;
    // setting a font is slow, so only when the canvas was reset (a resize)
    if (g.textBaseline !== 'middle') {
      g.font = FONT;
      g.textBaseline = 'middle';
    }
    g.save();
    if (this.drag?.kind === 'marquee') {
      const d = this.drag;
      g.save();
      g.beginPath();
      g.rect(KEYW, HEAD, W - KEYW, this.velTop - HEAD);
      g.clip();
      g.strokeStyle = '#ffd400';
      g.setLineDash([4, 3]);
      g.strokeRect(Math.min(d.x0, d.x1) + 0.5, Math.min(d.y0, d.y1) + 0.5, Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0));
      g.setLineDash([]);
      g.restore();
    }
    if (!this.listed) {
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
    this.drawVelocityLabel();

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
    const endX = this.xOf(doc.song.end.tick);
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

  /** The number over the velocity bar being hovered or dragged. */
  private drawVelocityLabel(): void {
    const { g, doc } = this;
    const W = this.w;
    const top = this.velTop;
    const d = this.drag?.kind === 'vel' ? this.drag : undefined;
    const t0 = this.scrollX;
    const t1 = this.tOf(W);
    let note: Note | undefined;
    if (d?.grab && d.relative) note = d.grab;
    else {
      const picks: Note[] = [];
      if (this.hover?.vel && this.hover.note) picks.push(this.hover.note);
      if (d?.grab) picks.push(d.grab);
      if (d?.changed && d.notes.length === 1) picks.push(d.notes[0]);
      // as the bars are painted: selected ones last, then by start; the last one painted wins
      const notes = this.scene!.notes;
      const rank = (n: Note) => (doc.selection.has(n) ? notes.length : 0) + notes.indexOf(n);
      for (const n of picks) {
        if (n.on.ch !== doc.track || n.on.tick < t0 - 4 / this.zoom || n.on.tick > t1) continue;
        if (!note || rank(n) > rank(note)) note = n;
      }
    }
    if (!note) return;
    const x = Math.round(this.xOf(note.on.tick));
    const y = Math.round(this.velY(note.on.b));
    g.save();
    g.beginPath();
    g.rect(KEYW, top + 2, W - KEYW, VEL - 2);
    g.clip();
    const text = String(note.on.b);
    const tw = g.measureText(text).width + 6;
    const lx = Math.min(W - tw - 2, x + 6);
    const ly = Math.max(top + 4, y - 14);
    g.fillStyle = '#ffd400';
    g.fillRect(lx, ly, tw, 12);
    g.fillStyle = '#000';
    g.fillText(text, lx + 3, ly + 6);
    g.restore();
  }

  override dispose(): void {
    super.dispose();
    this.tiles.dispose();
    this.keys.width = this.keys.height = 0;
  }
}
