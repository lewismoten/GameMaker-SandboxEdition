// Painting the piano roll's scrolling content into one cached tile: rows, beat and bar lines,
// the part after the song end, the loop region, other tracks faint, this track's notes (the
// part a later note cuts off hatched), the ruler, the instrument lane and the velocity bars.
// A tile holds a stretch of the song in world pixels (tick × zoom); x = 0 is its left edge.
// The keyboard, the play head and everything that follows the pointer are drawn by draw.ts.
import { programChanges } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfEdit';
import { noteEnd, type CmfSong, type Note } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import type { MusicDoc } from '../doc';
import { RULER, LANE, HEAD, VEL, BLACK, noteName } from './layout';

/** What a tile paint needs to know (taken from the roll when it is painted). */
export interface Scene {
  doc: MusicDoc;
  song: CmfSong;
  zoom: number;
  rowH: number;
  topKey: number;
  /** Rows painted (the visible ones and one more). */
  rows: number;
  hgt: number;
  /** This track's notes by start, with the tick each is cut off at. */
  notes: Note[];
  cuts: Map<Note, number>;
  color: string;
  silent: boolean;
  hover?: { note?: Note; vel?: boolean };
}

export const FONT = '10px ui-monospace, Menlo, Consolas, monospace';

/** The steps of the beat lines at this zoom. */
function beatStepOf(beat: number, zoom: number): number {
  return beat * zoom >= 8 ? beat : beat * 4 * zoom >= 8 ? beat * 4 : beat * 16;
}

/**
 * Paints world pixels [ox + a, ox + b) of the roll into g (already scaled for the screen),
 * clipped to that stretch.
 */
export function paintStretch(g: CanvasRenderingContext2D, sc: Scene, ox: number, a: number, b: number): void {
  const { doc, song, zoom, rowH, topKey, hgt: H } = sc;
  const velTop = H - VEL;
  const X = (t: number) => t * zoom - ox;
  const Y = (k: number) => HEAD + (topKey - k) * rowH;
  // ticks covered, with room for what sticks out (labels, bar heads)
  const t0 = (ox + a) / zoom;
  const t1 = (ox + b) / zoom;
  const W = b - a;
  // setting a font is slow: once per tile canvas (until it is resized)
  if (g.textBaseline !== 'middle') {
    g.font = FONT;
    g.textBaseline = 'middle';
  }
  g.save();
  g.beginPath();
  g.rect(a, 0, W, H);
  g.clip();
  g.fillStyle = '#05061a';
  g.fillRect(a, 0, W, H);

  // rows
  for (let i = 0; i < sc.rows; i++) {
    const k = topKey - i;
    if (k < 0) break;
    const y = Y(k);
    g.fillStyle = BLACK.includes(k % 12) ? '#080a24' : '#0d1030';
    g.fillRect(a, y, W, rowH);
    if (k % 12 === 0) {
      g.fillStyle = '#1c2050';
      g.fillRect(a, y + rowH - 1, W, 1);
    }
  }

  // beat and bar lines
  const beat = doc.beat;
  const sub = doc.snap;
  if (sub * zoom >= 6 && sub < beat) {
    g.fillStyle = '#121640';
    for (let t = Math.ceil((t0 - 1 / zoom) / sub) * sub; t < t1 + 1 / zoom; t += sub) g.fillRect(Math.round(X(t)), HEAD, 1, H - HEAD);
  }
  const beatStep = beatStepOf(beat, zoom);
  for (let t = Math.ceil((t0 - 1 / zoom) / beatStep) * beatStep; t < t1 + 1 / zoom; t += beatStep) {
    const bar = Math.round(t / beat) % 4 === 0;
    g.fillStyle = bar ? '#2e3680' : '#1a1f55';
    g.fillRect(Math.round(X(t)), HEAD, 1, H - HEAD);
  }

  // after the end: the song repeats
  const endX = X(song.end.tick);
  if (endX < b) {
    g.fillStyle = 'rgba(255,85,85,0.08)';
    g.fillRect(Math.max(a, endX), HEAD, b - Math.max(a, endX), H - HEAD);
  }

  // loop region
  if (doc.loop && doc.loopOn) {
    const la = Math.max(a, X(doc.loop[0]));
    const lb = Math.min(b, X(doc.loop[1]));
    g.fillStyle = 'rgba(85,255,255,0.06)';
    if (lb > la) g.fillRect(la, HEAD, lb - la, H - HEAD);
  }

  g.save();
  g.beginPath();
  g.rect(a, HEAD, W, velTop - HEAD);
  g.clip();
  paintNotes(g, sc, X, Y, t0 - 4 / zoom, t1 + 4 / zoom);
  g.restore();

  paintRuler(g, sc, X, a, b, t0, t1);
  paintLane(g, sc, X, a, b, t0, t1);
  paintVelocity(g, sc, X, a, b, t0, t1);
  g.restore();
}

function paintNotes(g: CanvasRenderingContext2D, sc: Scene, X: (t: number) => number, Y: (k: number) => number, t0: number, t1: number): void {
  const { doc, song, zoom, rowH, topKey, rows, color, silent } = sc;
  // other tracks, faint
  if (doc.ghosts) {
    g.fillStyle = 'rgba(160,170,220,0.16)';
    for (const n of song.notes) {
      if (n.on.ch === doc.track) continue;
      const s = n.on.tick;
      const e = noteEnd(song, n);
      if (e < t0 || s > t1) continue;
      const k = n.on.a;
      if (k > topKey || k < topKey - rows) continue;
      g.fillRect(X(s), Y(k) + 2, Math.max(1, (e - s) * zoom), rowH - 4);
    }
  }
  // this track's notes; the part a later note cuts off is drawn hatched
  for (const n of sc.notes) {
    const s = n.on.tick;
    const e = noteEnd(song, n);
    if (e < t0 || s > t1) continue;
    const k = n.on.a;
    if (k > topKey + 1 || k < topKey - rows) continue;
    const cut = sc.cuts.get(n) ?? e;
    const x = X(s);
    const y = Y(k);
    const wAll = Math.max(2, (e - s) * zoom);
    const wHeard = Math.max(2, (cut - s) * zoom);
    const sel = doc.selection.has(n);
    // shaded by velocity: soft notes are dim, loud ones bright
    const shade = 0.3 + (0.7 * n.on.b) / 127;
    g.globalAlpha = silent ? 0.35 : 1;
    if (cut < e) {
      g.strokeStyle = color;
      g.globalAlpha *= 0.5;
      g.strokeRect(x + wHeard + 0.5, y + 2.5, wAll - wHeard - 1, rowH - 5);
      g.globalAlpha = silent ? 0.35 : 1;
    }
    g.fillStyle = color;
    g.globalAlpha *= shade;
    g.fillRect(x, y + 1, wHeard, rowH - 2);
    g.globalAlpha = silent ? 0.35 : 1;
    g.fillRect(x, y + 1, 2, rowH - 2);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(x, y + rowH - 3, wHeard, 2);
    if (!n.off) {
      // no note-off: it rings until cut or the song repeats
      g.fillStyle = '#ffffff';
      g.fillRect(x + wHeard - 2, y + 1, 2, rowH - 2);
    }
    if (sel) {
      g.strokeStyle = '#ffffff';
      g.lineWidth = 2;
      g.strokeRect(x + 1, y + 1, wAll - 2, rowH - 2);
      g.lineWidth = 1;
    } else if (sc.hover?.note === n) {
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      g.strokeRect(x + 0.5, y + 0.5, wAll - 1, rowH - 1);
    }
    if (rowH >= 10 && wHeard > 28) {
      g.fillStyle = shade < 0.6 ? '#fff' : '#000';
      g.fillText(noteName(k), x + 3, y + rowH / 2);
    }
    g.globalAlpha = 1;
  }
}

function paintRuler(g: CanvasRenderingContext2D, sc: Scene, X: (t: number) => number, a: number, b: number, t0: number, t1: number): void {
  const { doc, zoom } = sc;
  g.fillStyle = '#000080';
  g.fillRect(a, 0, b - a, RULER);
  if (doc.loop) {
    const la = Math.max(a, X(doc.loop[0]));
    const lb = Math.min(b, X(doc.loop[1]));
    g.fillStyle = doc.loopOn ? 'rgba(85,255,255,0.55)' : 'rgba(85,255,255,0.2)';
    if (lb > la) g.fillRect(la, 3, lb - la, RULER - 6);
  }
  const barTicks = doc.beat * 4;
  const every = Math.max(1, Math.ceil(36 / (barTicks * zoom)));
  g.fillStyle = '#ffd400';
  for (let bar = Math.max(0, Math.floor((t0 - 40 / zoom) / barTicks)); bar * barTicks < t1 + 1 / zoom; bar++) {
    if (bar % every) continue;
    const x = X(bar * barTicks);
    g.fillRect(Math.round(x), RULER - 6, 1, 6);
    g.fillText(String(bar + 1), Math.round(x) + 3, RULER / 2);
  }
}

function paintLane(g: CanvasRenderingContext2D, sc: Scene, X: (t: number) => number, a: number, b: number, t0: number, t1: number): void {
  const { doc, zoom } = sc;
  g.fillStyle = '#0a0c26';
  g.fillRect(a, RULER, b - a, LANE);
  g.fillStyle = '#1c2050';
  g.fillRect(a, HEAD - 1, b - a, 1);
  for (const e of programChanges(doc.song, doc.track)) {
    if (e.tick < t0 - 100 / zoom || e.tick > t1) continue;
    const x = X(e.tick);
    const label = `♪${e.a + 1}`;
    const w = g.measureText(label).width + 8;
    g.fillStyle = doc.song.instruments[e.a] ? sc.color : '#ff5555';
    g.fillRect(x, RULER + 2, w, LANE - 4);
    g.fillStyle = '#000';
    g.fillText(label, x + 4, RULER + LANE / 2);
  }
  // the drum kit switching on or off part way through (at the start it is a song setting)
  for (const e of doc.song.events) {
    if (e.type !== 'mode' || e.tick === 0 || e.tick < t0 - 80 / zoom || e.tick > t1) continue;
    const x = X(e.tick);
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(x), RULER, 1, LANE);
    g.fillText(e.a ? 'DRUMS ON' : 'DRUMS OFF', x + 3, RULER + LANE / 2);
  }
}

function paintVelocity(g: CanvasRenderingContext2D, sc: Scene, X: (t: number) => number, a: number, b: number, t0: number, t1: number): void {
  const { doc, zoom, hgt: H, color, silent } = sc;
  const top = H - VEL;
  const W = b - a;
  const velY = (v: number) => H - 4 - (v / 127) * (VEL - 12);
  g.fillStyle = '#000';
  g.fillRect(a, top, W, VEL);
  g.fillStyle = '#070920';
  g.fillRect(a, top + 2, W, VEL - 2);
  g.fillStyle = '#2e3680';
  g.fillRect(a, top, W, 2);
  // guides at 127, 64 and 1
  for (const v of [127, 64]) {
    g.fillStyle = v === 127 ? '#1c2050' : '#141838';
    g.fillRect(a, Math.round(velY(v)), W, 1);
  }
  const beatStep = beatStepOf(doc.beat, zoom);
  g.fillStyle = '#12163a';
  for (let t = Math.ceil((t0 - 1 / zoom) / beatStep) * beatStep; t < t1 + 1 / zoom; t += beatStep) g.fillRect(Math.round(X(t)), top + 2, 1, VEL - 2);
  g.save();
  g.beginPath();
  g.rect(a, top + 2, W, VEL - 2);
  g.clip();
  // selected bars on top
  const shown = sc.notes.filter((n) => n.on.tick >= t0 - 6 / zoom && n.on.tick <= t1 + 3 / zoom);
  const order = shown.sort((p, q) => Number(doc.selection.has(p)) - Number(doc.selection.has(q)));
  for (const n of order) {
    const x = Math.round(X(n.on.tick));
    const y = Math.round(velY(n.on.b));
    const sel = doc.selection.has(n);
    const hot = sc.hover?.vel && sc.hover.note === n;
    g.globalAlpha = silent ? 0.4 : 1;
    g.fillStyle = sel ? '#ffffff' : color;
    g.globalAlpha *= sel || hot ? 1 : 0.4 + (0.6 * n.on.b) / 127;
    g.fillRect(x, y, 2, H - 4 - y);
    g.fillRect(x - 2, y - 1, 7, 3);
    g.globalAlpha = 1;
  }
  g.restore();
}
