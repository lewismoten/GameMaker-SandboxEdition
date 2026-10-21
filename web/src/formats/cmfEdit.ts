// Editing a Creative Music File song (the model in cmfSong.ts): adding, moving and deleting
// notes, velocities (how loud SBFMDRV plays each note), instruments (program changes), the
// melody/rhythm mode, the song end, and clearing out events PlayIt ignores. New events get
// an order (seq) around the song's own, so a song that is not edited is written back byte
// for byte.
import { type Ev, type Note, type CmfSong, RHYTHM_CHANNELS, readSong, streamEvents, writeSong } from './cmfSong';

// ---- editing ------------------------------------------------------------------------

/** Order for new events at a tick: offs first, then mode and program changes, then the song's own events, then new notes. */
const ORDER = { off: -1e9, mode: -6e8, program: -5e8, on: 1e9 } as const;

function newSeq(song: CmfSong, kind: keyof typeof ORDER): number {
  return ORDER[kind] + ++song.counter;
}

export function cloneSong(song: CmfSong): CmfSong {
  return readSong(writeSong(song));
}

/** Notes on one channel, by start. */
export function channelNotes(song: CmfSong, ch: number): Note[] {
  return song.notes.filter((n) => n.on.ch === ch).sort((x, y) => x.on.tick - y.on.tick || x.on.seq - y.on.seq);
}

export function addNote(song: CmfSong, ch: number, key: number, start: number, len: number, vel = DEFAULT_VELOCITY): Note {
  const on: Ev = { type: 'on', tick: Math.max(0, Math.round(start)), seq: newSeq(song, 'on'), ch, a: key, b: clampVelocity(vel) };
  const off: Ev = { type: 'off', tick: on.tick + Math.max(1, Math.round(len)), seq: newSeq(song, 'off'), ch, a: key, b: 0 };
  const n = { on, off };
  song.notes.push(n);
  extendEnd(song);
  return n;
}

export const DEFAULT_VELOCITY = 100;

/** Clamps a velocity to what a note-on can carry (0 would turn the note off). */
export function clampVelocity(v: number): number {
  return Math.max(1, Math.min(127, Math.round(Number.isFinite(v) ? v : DEFAULT_VELOCITY)));
}

/** Sets how loud notes play (1..127). Unchanged notes keep their bytes. */
export function setVelocity(notes: Iterable<Note>, v: number): void {
  const vel = clampVelocity(v);
  for (const n of notes) n.on.b = vel;
}

/** Scales velocities by a factor (and/or adds an offset), clamped to 1..127. */
export function scaleVelocities(notes: Iterable<Note>, factor: number, add = 0): number {
  let changed = 0;
  for (const n of notes) {
    const vel = clampVelocity(n.on.b * factor + add);
    if (vel !== n.on.b) changed++;
    n.on.b = vel;
  }
  return changed;
}

/**
 * The carrier's total level (TL, 0 loudest .. 63 silent) SBFMDRV plays a note at, for the
 * instrument's own TL: 63 - floor((velocity + 128) * (63 - TL) / 256). Velocity 127 keeps
 * the level nearly as written; velocity 1 is about half as loud in TL steps.
 */
export function velocityLevel(velocity: number, tl: number): number {
  return 63 - Math.floor(((Math.min(127, velocity) + 128) * (63 - (tl & 0x3f))) / 256);
}

/** Moves and/or resizes a note (start, length in ticks, note number). */
export function setNote(song: CmfSong, n: Note, start: number, len: number, key: number): void {
  start = Math.max(0, Math.round(start));
  len = Math.max(1, Math.round(len));
  const moved = start !== n.on.tick;
  if (moved) {
    n.on.tick = start;
    n.on.seq = newSeq(song, 'on');
    n.on.status = undefined;
  }
  if (key !== n.on.a) {
    n.on.a = key;
    n.on.status = undefined;
  }
  const end = start + len;
  if (!n.off) n.off = { type: 'off', tick: end, seq: newSeq(song, 'off'), ch: n.on.ch, a: key, b: 0 };
  else if (n.off.tick !== end || moved || n.off.a !== key) {
    n.off.tick = end;
    n.off.seq = newSeq(song, 'off');
    n.off.status = undefined;
    n.off.fn = undefined;
    n.off.b = 0;
  }
  n.off.a = key;
  extendEnd(song);
}

export function deleteNotes(song: CmfSong, notes: Iterable<Note>): void {
  const gone = new Set(notes);
  song.notes = song.notes.filter((n) => !gone.has(n));
}

/** The song end never comes before the last event. */
export function extendEnd(song: CmfSong): void {
  let last = 0;
  for (const n of song.notes) last = Math.max(last, n.off ? n.off.tick : n.on.tick);
  for (const e of song.events) last = Math.max(last, e.tick);
  song.end.tick = Math.max(song.end.tick, last);
}

export function lastEventTick(song: CmfSong): number {
  let last = 0;
  for (const n of song.notes) last = Math.max(last, n.off ? n.off.tick : n.on.tick);
  for (const e of song.events) last = Math.max(last, e.tick);
  return last;
}

/** Moves where the song repeats (never before the last event). */
export function setEnd(song: CmfSong, tick: number): void {
  song.end.tick = Math.max(lastEventTick(song), Math.round(tick), 1);
}

/** Mode in effect at the start (before any note). */
export function startMode(song: CmfSong): boolean {
  const first = streamEvents(song).find((e) => e.type === 'mode' || e.type === 'on');
  return !!first && first.type === 'mode' && first.a !== 0;
}

export function modeChanges(song: CmfSong): Ev[] {
  return song.events.filter((e) => e.type === 'mode').sort((x, y) => x.tick - y.tick || x.seq - y.seq);
}

/** Sets melody (false) or rhythm (true) mode from the start of the song. */
export function setStartMode(song: CmfSong, rhythm: boolean): void {
  const evs = streamEvents(song);
  const firstOn = evs.find((e) => e.type === 'on');
  const before = evs.filter((e) => e.type === 'mode' && (!firstOn || e.tick < firstOn.tick || (e.tick === firstOn.tick && e.seq < firstOn.seq)));
  if (before.length) before[before.length - 1].a = rhythm ? 1 : 0;
  else song.events.push({ type: 'mode', tick: 0, seq: newSeq(song, 'mode'), ch: 0, a: rhythm ? 1 : 0, b: 0 });
}

/** Instrument changes on a channel, by time. */
export function programChanges(song: CmfSong, ch: number): Ev[] {
  return song.events.filter((e) => e.type === 'program' && e.ch === ch).sort((x, y) => x.tick - y.tick || x.seq - y.seq);
}

/** The instrument a channel starts with (its first note's instrument). */
export function startProgram(song: CmfSong, ch: number): number {
  const notes = channelNotes(song, ch);
  const first = notes[0]?.on;
  let p = ch;
  for (const e of programChanges(song, ch)) {
    if (first && (e.tick > first.tick || (e.tick === first.tick && e.seq > first.seq))) break;
    p = e.a;
  }
  return p;
}

/** The instrument a channel uses at a time. */
export function programAt(song: CmfSong, ch: number, tick: number): number {
  let p = ch;
  for (const e of programChanges(song, ch)) {
    if (e.tick > tick) break;
    p = e.a;
  }
  return p;
}

/** Picks the instrument a channel starts with. */
export function setStartProgram(song: CmfSong, ch: number, program: number): void {
  const first = channelNotes(song, ch)[0]?.on;
  const before = programChanges(song, ch).filter((e) => !first || e.tick < first.tick || (e.tick === first.tick && e.seq < first.seq));
  if (before.length) before[before.length - 1].a = program;
  else song.events.push({ type: 'program', tick: 0, seq: newSeq(song, 'program'), ch, a: program, b: 0 });
}

/** Adds (or changes) an instrument change on a channel at a time. */
export function setProgramAt(song: CmfSong, ch: number, tick: number, program: number): Ev {
  tick = Math.max(0, Math.round(tick));
  const same = song.events.find((e) => e.type === 'program' && e.ch === ch && e.tick === tick);
  if (same) {
    same.a = program;
    return same;
  }
  const ev: Ev = { type: 'program', tick, seq: newSeq(song, 'program'), ch, a: program, b: 0 };
  song.events.push(ev);
  extendEnd(song);
  return ev;
}

export function removeEvent(song: CmfSong, ev: Ev): void {
  song.events = song.events.filter((e) => e !== ev);
}

/** Channels that have notes or instrument changes. */
export function usedChannels(song: CmfSong): number[] {
  const used = new Set<number>();
  for (const n of song.notes) used.add(n.on.ch);
  for (const e of song.events) if (e.type === 'program' || e.type === 'raw') used.add(e.ch);
  return [...used].sort((a, b) => a - b);
}

/** Removes a channel's notes and events (mode switches stay: they affect the whole song). */
export function removeChannel(song: CmfSong, ch: number): void {
  song.notes = song.notes.filter((n) => n.on.ch !== ch);
  song.events = song.events.filter((e) => e.type === 'mode' || e.ch !== ch);
}

/** Changes the speed: every time is multiplied by factor (the beat length too). */
export function scaleTime(song: CmfSong, factor: number): void {
  const f = (t: number) => Math.round(t * factor);
  for (const n of song.notes) {
    const start = f(n.on.tick);
    n.on.tick = start;
    if (n.off) n.off.tick = Math.max(start + 1, f(n.off.tick));
  }
  for (const e of song.events) e.tick = f(e.tick);
  song.end.tick = f(song.end.tick);
  song.leadIn = f(song.leadIn);
  song.ticksPerBeat = Math.max(1, f(song.ticksPerBeat));
  extendEnd(song);
}

/** Removes events PlayIt ignores (pitch bend, other controllers, stray note-offs...). */
export function stripIgnored(song: CmfSong): number {
  const before = song.events.length;
  // A note byte written without a status depends on the notes before it (even across the
  // repeat), so those stay, as do events carrying a stray status byte.
  song.events = song.events.filter((e) => e.type === 'program' || e.type === 'mode' || e.prefix !== undefined || (e.type === 'off' && e.status === false));
  return before - song.events.length;
}

export function ignoredCount(song: CmfSong): number {
  return song.events.filter((e) => (e.type === 'raw' && e.prefix === undefined) || (e.type === 'off' && e.status !== false)).length;
}

/**
 * Which FM voice a channel sounds on, given the mode: melody mode has voices 0..8 on
 * channels 0..8; rhythm mode has 0..5 and drums on 11..15. Other channels are silent.
 */
export function channelSounds(ch: number, rhythm: boolean): boolean {
  return rhythm ? ch < 6 || RHYTHM_CHANNELS.includes(ch) : ch < 9;
}
