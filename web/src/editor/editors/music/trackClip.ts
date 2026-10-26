// Copying one track (a MIDI channel) out of a song and pasting it into another: its notes with
// their timing and velocities, its instruments (the SBI bytes of every program it plays), its
// program changes and the other channel events the model keeps. A drum (rhythm mode's
// channels 12-16) stays that drum when it can. No DOM: the clipboard is in trackClipboard.ts.
import { addNote, channelNotes, extendEnd, programChanges, setProgramAt, setStartMode, startMode, startProgram } from '../../../formats/cmfEdit';
import { DRUM_NAMES, RHYTHM_CHANNELS, type CmfSong } from '../../../formats/cmfSong';
import { presetById } from '../../../audio/oplPresets';

export interface TrackClip {
  v: 1;
  /** The file it came from, as stored (lower case). */
  from: string;
  /** Its name in that song (the instrument's preset, or the drum). */
  name: string;
  /** The source song's beat, to land on the same beats in a song with another beat. */
  ticksPerBeat: number;
  /** The channel it was on. */
  ch: number;
  /** Its rhythm-mode channel (11..15) when it was a drum. */
  drum?: number;
  /** [start, length (null: no note-off, it sounds until cut or the song repeats), key, velocity]. */
  notes: [number, number | null, number, number][];
  /** [tick, index into instruments]: the first is the instrument it starts with, at 0. */
  programs: [number, number][];
  /** The 16-byte SBI records it plays (null when the song had no instrument there). */
  instruments: (number[] | null)[];
  /** Other channel events (aftertouch, controllers, pitch bend), whole, with the status byte's channel. */
  raw: [number, number[]][];
}

/** Copies channel ch of a song. */
export function copyTrack(song: CmfSong, ch: number, from: string, name: string): TrackClip {
  const rhythm = startMode(song);
  const notes = channelNotes(song, ch);
  const first = notes[0]?.on;
  const slots: number[] = [];
  const slot = (p: number) => {
    const i = slots.indexOf(p);
    return i >= 0 ? i : slots.push(p) - 1;
  };
  const programs: [number, number][] = [[0, slot(startProgram(song, ch))]];
  // changes before the first note are the start instrument (startProgram already chose it)
  for (const e of programChanges(song, ch))
    if (first && (e.tick > first.tick || (e.tick === first.tick && e.seq > first.seq))) programs.push([e.tick, slot(e.a)]);
  const raw: [number, number[]][] = song.events
    .filter((e) => e.type === 'raw' && e.ch === ch && e.bytes && e.bytes[0] >= 0xa0 && e.bytes[0] < 0xf0)
    .sort((x, y) => x.tick - y.tick || x.seq - y.seq)
    .map((e) => [e.tick, [...e.bytes!]]);
  return {
    v: 1,
    from,
    name,
    ticksPerBeat: beatOf(song),
    ch,
    drum: rhythm && RHYTHM_CHANNELS.includes(ch) ? ch : undefined,
    notes: notes.map((n) => [n.on.tick, n.off ? n.off.tick - n.on.tick : null, n.on.a, n.on.b]),
    programs,
    instruments: slots.map((p) => (song.instruments[p] ? [...song.instruments[p].subarray(0, 16)] : null)),
    raw,
  };
}

/** The beat the editor counts in (doc.ts beat). */
const beatOf = (song: CmfSong) => Math.max(1, song.ticksPerBeat || 48);

export interface Pasted {
  /** The channel it went on. */
  ch: number;
  /** The timing was multiplied by this to land on the same beats (1 when the beats match). */
  scale: number;
  /** The song had no drum kit: it was turned on for this drum. */
  drumKitOn?: boolean;
  /** A drum that came in as a melody track (the song has no drum kit and can't take one). */
  drumAsMelody?: boolean;
  /** The song got longer to fit it. */
  longer?: boolean;
  /** No instrument came with it, so it plays the piano. */
  piano?: boolean;
}

const drumLabel = (ch: number) => DRUM_NAMES[ch].toLowerCase();

/**
 * Adds a copied track to a song on a free channel (`taken` are the channels already holding
 * a track). Returns what happened, or why it can't (the song is then unchanged).
 */
export function pasteTrack(song: CmfSong, clip: TrackClip, taken: Iterable<number>): Pasted | { error: string } {
  const used = new Set(taken);
  const rhythm = startMode(song);
  const melodyFree = () => {
    for (let c = 0; c < (rhythm ? 6 : 9); c++) if (!used.has(c)) return c;
    return undefined;
  };
  let ch: number | undefined;
  let drumKitOn = false;
  let drumAsMelody = false;
  if (clip.drum !== undefined) {
    if (rhythm) {
      if (used.has(clip.drum)) return { error: `This song already has a ${drumLabel(clip.drum)} track, and the drum kit has only one.` };
      ch = clip.drum;
    } else if (![6, 7, 8, ...RHYTHM_CHANNELS].some((c) => used.has(c))) {
      // tracks 7-9 are empty, so the drum kit costs this song nothing
      ch = clip.drum;
      drumKitOn = true;
    } else {
      ch = melodyFree();
      drumAsMelody = true;
    }
  } else ch = melodyFree();
  if (ch === undefined)
    return { error: rhythm ? 'This song has no free track: all 6 melody tracks are in use.' : 'This song has no free track: all 9 tracks are in use.' };

  // the instruments go on the end of the song's list (sharing one would tie their sounds together),
  // or, when it is full, onto an instrument with the same bytes
  const sbis = clip.instruments.map((b) => (b ? Uint8Array.from(b) : null));
  const piano = sbis.some((b) => !b);
  const fresh = sbis.map((b) => b ?? presetById('piano')!.patch.slice());
  const same = (a: Uint8Array, b: Uint8Array) => a.length >= 16 && b.length >= 16 && a.subarray(0, 16).every((x, i) => x === b[i]);
  let room = 128 - song.instruments.length;
  const plan = fresh.map((b) => {
    if (room > 0) {
      room--;
      return b;
    }
    const i = song.instruments.findIndex((x) => same(x, b));
    return i >= 0 ? i : null;
  });
  if (plan.includes(null)) return { error: 'This song already has 128 instruments, the most a song can have. Remove one in the Instruments tab first.' };

  // from here the song changes
  const index = plan.map((p) => (typeof p === 'number' ? p : song.instruments.push(p!) - 1));
  if (drumKitOn) setStartMode(song, true);
  const scale = beatOf(song) / Math.max(1, clip.ticksPerBeat || 48);
  const at = (t: number) => Math.max(0, Math.round(t * scale));
  const before = song.end.tick;
  for (const [t, s] of clip.programs) setProgramAt(song, ch, at(t), index[s] ?? index[0]);
  for (const [t, bytes] of clip.raw)
    song.events.push({ type: 'raw', tick: at(t), seq: ++song.counter, ch, a: 0, b: 0, bytes: [(bytes[0] & 0xf0) | ch, ...bytes.slice(1)] });
  for (const [t, len, key, vel] of clip.notes) {
    const start = at(t);
    if (len === null) song.notes.push({ on: { type: 'on', tick: start, seq: 1e9 + ++song.counter, ch, a: key & 0x7f, b: Math.max(1, Math.min(127, vel)) } });
    else addNote(song, ch, key & 0x7f, start, Math.max(1, at(t + len) - start), vel);
  }
  extendEnd(song);
  return { ch, scale, drumKitOn, drumAsMelody, longer: song.end.tick > before, piano };
}

/** Checks a clip read back from storage. */
export function isTrackClip(x: unknown): x is TrackClip {
  const c = x as TrackClip;
  const nums = (a: unknown) => Array.isArray(a) && a.every((n) => typeof n === 'number' || n === null);
  return (
    !!c &&
    c.v === 1 &&
    typeof c.from === 'string' &&
    typeof c.name === 'string' &&
    typeof c.ticksPerBeat === 'number' &&
    typeof c.ch === 'number' &&
    Array.isArray(c.notes) &&
    c.notes.every((n) => nums(n) && n.length === 4) &&
    Array.isArray(c.instruments) &&
    c.instruments.every((b) => b === null || (nums(b) && b.length === 16)) &&
    Array.isArray(c.programs) &&
    c.programs.length > 0 &&
    c.programs.every((p) => nums(p) && p.length === 2 && p[1] >= 0 && p[1] < c.instruments.length) &&
    Array.isArray(c.raw) &&
    c.raw.every((r) => Array.isArray(r) && typeof r[0] === 'number' && nums(r[1]) && r[1].length > 0)
  );
}
