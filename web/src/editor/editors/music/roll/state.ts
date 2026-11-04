// What the piano roll's cached tiles show of each note, so a change repaints only the ticks
// whose picture changed: a note's start, end, the tick a later note cuts it off at, key,
// velocity, whether it has a note-off, is selected or hovered, and the other tracks' notes.
import { channelNotes } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfEdit';
import { noteEnd, type CmfSong, type Note } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';

/** One note as last painted: its span in ticks and everything else that shows. */
export interface Drawn {
  s: number;
  e: number;
  /** Cut-off tick (this track) or -1 (another track's note). */
  cut: number;
  key: number;
  vel: number;
  /** 1 no note-off, 2 selected, 4 hovered, 8 its velocity bar hovered. */
  flags: number;
}

interface Shown {
  /** This track's notes by start. */
  notes: Note[];
  /** The tick each of this track's notes is cut off at by a later one (its end when not). */
  cuts: Map<Note, number>;
  drawn: Map<Note, Drawn>;
}

/** More changed notes than this repaint everything (an undo, a whole-song edit). */
const MANY = 400;

export function shownNotes(song: CmfSong, track: number, ghosts: boolean, selection: Set<Note>, hover?: { note?: Note; vel?: boolean }): Shown {
  const notes = channelNotes(song, track);
  const cuts = new Map<Note, number>();
  const drawn = new Map<Note, Drawn>();
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    const s = n.on.tick;
    const e = noteEnd(song, n);
    let cut = e;
    for (let j = i + 1; j < notes.length; j++) {
      if (notes[j].on.tick >= e) break;
      if (notes[j].on.tick > s || (notes[j].on.tick === s && notes[j].on.seq > n.on.seq)) {
        cut = notes[j].on.tick;
        break;
      }
    }
    cuts.set(n, cut);
    const hov = hover?.note === n ? (hover.vel ? 8 : 4) : 0;
    const flags = (n.off ? 0 : 1) | (selection.has(n) ? 2 : 0) | hov;
    drawn.set(n, { s, e, cut, key: n.on.a, vel: n.on.b, flags });
  }
  if (ghosts) {
    for (const n of song.notes) {
      if (n.on.ch === track) continue;
      drawn.set(n, { s: n.on.tick, e: noteEnd(song, n), cut: -1, key: n.on.a, vel: 0, flags: 0 });
    }
  }
  return { notes, cuts, drawn };
}

/** The tick spans whose picture changed between two paints, or null to repaint everything. */
export function changedSpans(before: Map<Note, Drawn>, after: Map<Note, Drawn>): [number, number][] | null {
  const out: [number, number][] = [];
  for (const [n, d] of after) {
    const o = before.get(n);
    if (o && o.s === d.s && o.e === d.e && o.cut === d.cut && o.key === d.key && o.vel === d.vel && o.flags === d.flags) continue;
    out.push(o ? [Math.min(o.s, d.s), Math.max(o.e, d.e)] : [d.s, d.e]);
    if (out.length > MANY) return null;
  }
  for (const [n, o] of before) {
    if (after.has(n)) continue;
    out.push([o.s, o.e]);
    if (out.length > MANY) return null;
  }
  return merge(out);
}

/** Sorts spans and joins the ones that overlap or touch. */
function merge(spans: [number, number][]): [number, number][] {
  spans.sort((p, q) => p[0] - q[0]);
  const out: [number, number][] = [];
  for (const sp of spans) {
    const last = out[out.length - 1];
    if (last && sp[0] <= last[1]) last[1] = Math.max(last[1], sp[1]);
    else out.push([sp[0], sp[1]]);
  }
  return out;
}
