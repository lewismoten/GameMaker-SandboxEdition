// What the piano roll's cached tiles show of each note, so a change repaints only the ticks
// whose picture changed: a note's start, end, the tick a later note cuts it off at, key,
// velocity, whether it has a note-off, is selected or hovered, and the other tracks' notes.
import { channelNotes } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfEdit';
import { noteEnd, type CmfSong, type Note } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';

/** One note as last painted: its span in ticks and everything else that shows. */
export interface Drawn {
  s: number;
  e: number;
  look: string;
}

export interface Shown {
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
    const hov = hover?.note === n ? (hover.vel ? 2 : 1) : 0;
    drawn.set(n, { s, e, look: `${cut} ${n.on.a} ${n.on.b} ${n.off ? 1 : 0} ${selection.has(n) ? 1 : 0} ${hov}` });
  }
  if (ghosts) {
    for (const n of song.notes) {
      if (n.on.ch === track) continue;
      drawn.set(n, { s: n.on.tick, e: noteEnd(song, n), look: `g${n.on.a}` });
    }
  }
  return { notes, cuts, drawn };
}

/** The tick spans whose picture changed between two paints, or null to repaint everything. */
export function changedSpans(before: Map<Note, Drawn>, after: Map<Note, Drawn>): [number, number][] | null {
  const out: [number, number][] = [];
  for (const [n, d] of after) {
    const o = before.get(n);
    if (o && o.s === d.s && o.e === d.e && o.look === d.look) continue;
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
