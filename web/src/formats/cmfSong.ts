// An editable model of a Creative Music File, read the way Game-Maker plays it: reading and
// writing it (readSong, writeSong), and tracing what PlayIt does with the bytes (traceMusic).
// The edits are in cmfEdit.ts, the previews in cmfPreview.ts.
//
// PLAYGAME's PlayIt() (code/GM/SBMUSIC.C, ported in audio/cmfPlayer.ts) only acts on:
//  - note on / note off (0x9n / 0x8n, or 0x9n with velocity 0). The note-on velocity goes to
//    Creative's SBFMDRV (sbfd_note_on), which scales the instrument's carrier level by it, so
//    it sets how loud each note plays (1 quietest .. 127 as loud as the instrument; see
//    velocityLevel), and is edited like any other note property,
//  - program change (0xCn): loads an SBI instrument into the channel's FM voice,
//  - controller 0x67 (0xBn 67 v): melody mode (9 voices) or rhythm mode (6 voices + 5 drums
//    on MIDI channels 11..15),
//  - the delta times, counted in 1/145.6 s timer ticks (the header's tempo fields are ignored),
//  - the end marker (or anything else 0xF1..0xFF), where the song repeats.
// Running status is honoured only for notes (the status of the last 0x8n/0x9n byte), so a data
// byte that follows a controller is played as a note; this model decodes it the same way.
// Everything else (pitch bend, aftertouch, other controllers, sysex) is kept as raw bytes.
//
// Times in the model are ticks from the first event: PlayIt skips the first delta the first
// time through ("beginning silence") but waits it out each time the song repeats (leadIn).
// Every event remembers its place in the original stream (seq) and how it was written, so an
// unedited song is written back byte for byte.
import { isCmf } from './cmf';

export type EvType = 'on' | 'off' | 'program' | 'mode' | 'raw';

/** One event of the stream. */
export interface Ev {
  type: EvType;
  tick: number;
  /** Order among events at the same tick (original stream order; new events go around them). */
  seq: number;
  /** MIDI channel 0..15. */
  ch: number;
  /** on/off: note number; program: instrument number; mode: 0 = melody, otherwise rhythm. */
  a: number;
  /** on: velocity 1..127 (how loud; 0 would be a note off); off: the release byte (kept as read). */
  b: number;
  /** off: written as 0x8n (8) or as 0x9n with velocity 0 (9). */
  fn?: 8 | 9;
  /** notes: whether the original wrote a status byte (undefined for new events). */
  status?: boolean;
  /** A stray 0x8n/0x9n status byte written just before a non-note event. */
  prefix?: number;
  /** raw: the whole event. */
  bytes?: number[];
  /** The original encoding of the delta time before this event. */
  delta?: number[];
}

export interface Note {
  on: Ev;
  /** No off event: the note sounds until it is cut or the song repeats. */
  off?: Ev;
}

export interface CmfSong {
  /** Everything before the instruments (header, title strings); fields are rewritten on save. */
  header: Uint8Array;
  ticksPerBeat: number;
  clockTicks: number;
  channelUsed: Uint8Array;
  /** Which channels had events when read (to keep channelUsed as it was). */
  hadEvents: boolean[];
  /** 16-byte SBI records; instrument n starts on channel n. */
  instruments: Uint8Array[];
  /** Bytes between the instruments and the music (normally none). */
  gap: Uint8Array;
  /** Silence before the song starts again when it repeats (the first delta). */
  leadIn: number;
  leadInBytes?: number[];
  notes: Note[];
  /** program, mode, raw and stray off events. */
  events: Ev[];
  /** Where the song repeats. */
  end: { tick: number; delta?: number[]; bytes: number[] };
  /** Counter for ordering new events. */
  counter: number;
}

export const RHYTHM_CHANNELS = [11, 12, 13, 14, 15];
export const DRUM_NAMES: Record<number, string> = { 11: 'Bass drum', 12: 'Snare drum', 13: 'Tom-tom', 14: 'Cymbal', 15: 'Hi-hat' };

function varLen(n: number): number[] {
  const out = [n & 0x7f];
  for (n = Math.floor(n / 128); n > 0; n = Math.floor(n / 128)) out.unshift((n & 0x7f) | 0x80);
  return out;
}

/** getpaws(): a variable length number. */
function readVar(m: Uint8Array, o: number): { value: number; next: number } {
  let value = m[o] ?? 0;
  if (value & 0x80) {
    value &= 0x7f;
    let c: number;
    do {
      o++;
      c = m[o] ?? 0;
      value = value * 128 + (c & 0x7f);
    } while (c & 0x80 && o < m.length);
  }
  return { value, next: o + 1 };
}

const decodeVar = (bytes: number[] | undefined): number | undefined => (bytes ? readVar(Uint8Array.from(bytes), 0).value : undefined);

export function noteEnd(song: CmfSong, n: Note): number {
  return n.off ? n.off.tick : song.end.tick;
}

/** Reads a CMF the way PlayIt() does. */
export function readSong(bytes: Uint8Array): CmfSong {
  if (!isCmf(bytes)) throw new Error('Not a CMF file');
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (o: number) => (o + 1 < bytes.length ? dv.getUint16(o, true) : 0);
  const instBlk = u16(6);
  const musicBlk = u16(8);
  const instNum = u16(36);
  const headerLen = Math.max(40, Math.min(instBlk, bytes.length));
  const header = bytes.slice(0, headerLen);
  const instruments: Uint8Array[] = [];
  for (let i = 0; i < instNum; i++) {
    const inst = new Uint8Array(16);
    inst.set(bytes.subarray(instBlk + i * 16, instBlk + i * 16 + 16));
    instruments.push(inst);
  }
  const instEnd = instBlk + instNum * 16;
  const gap = musicBlk > instEnd ? bytes.slice(instEnd, musicBlk) : new Uint8Array(0);
  const m = bytes.subarray(Math.max(musicBlk, instEnd));
  const song: CmfSong = {
    header,
    ticksPerBeat: u16(10),
    clockTicks: u16(12),
    channelUsed: bytes.slice(20, 36),
    hadEvents: new Array(16).fill(false),
    instruments,
    gap,
    leadIn: 0,
    notes: [],
    events: [],
    end: { tick: 0, bytes: [] },
    counter: 0,
  };
  if (m.length === 0) return song;

  const all: Ev[] = [];
  let o = 0;
  const lead = readVar(m, 0);
  song.leadIn = lead.value;
  song.leadInBytes = [...m.subarray(0, lead.next)];
  o = lead.next;
  let tick = 0;
  let funct = 8;
  let channel = 0;
  let delta: number[] | undefined;
  let seq = 0;
  for (;;) {
    const start = o;
    if (o >= m.length) {
      song.end = { tick, delta, bytes: [] };
      break;
    }
    let status = false;
    let prefix: number | undefined;
    const s = m[o];
    if ((s & 0xf0) === 0x90 || (s & 0xf0) === 0x80) {
      channel = s & 0x0f;
      funct = s >> 4;
      o++;
      status = true;
      prefix = s;
    }
    const a = m[o];
    let ev: Ev | undefined;
    if (o >= m.length) ev = undefined;
    else if (a < 0x80) {
      if (o + 1 >= m.length) ev = undefined;
      else {
        const vel = m[o + 1];
        ev =
          funct === 8 || vel === 0
            ? { type: 'off', tick, seq, ch: channel, a, b: vel, fn: funct as 8 | 9, status }
            : { type: 'on', tick, seq, ch: channel, a, b: vel, status };
        o += 2;
      }
    } else {
      const hi = a & 0xf0;
      const take = (n: number) => {
        const out = [...m.subarray(o, o + n)];
        o += n;
        return out;
      };
      if (hi === 0xb0 && m[o + 1] === 0x67 && o + 2 < m.length) {
        ev = { type: 'mode', tick, seq, ch: a & 0x0f, a: m[o + 2], b: 0 };
        o += 3;
      } else if (hi === 0xc0 && o + 1 < m.length) {
        ev = { type: 'program', tick, seq, ch: a & 0x0f, a: m[o + 1], b: 0 };
        o += 2;
      } else if ((hi === 0xa0 || hi === 0xb0 || hi === 0xe0) && o + 2 < m.length) ev = { type: 'raw', tick, seq, ch: a & 0x0f, a: 0, b: 0, bytes: take(3) };
      else if (hi === 0xd0 && o + 1 < m.length) ev = { type: 'raw', tick, seq, ch: a & 0x0f, a: 0, b: 0, bytes: take(2) };
      else if ((a === 0xf0 || a === 0xf7) && o + 1 < m.length) {
        const len = readVar(m, o + 1);
        const stop = len.next + len.value + 1;
        if (stop <= m.length) ev = { type: 'raw', tick, seq, ch: 0, a: 0, b: 0, bytes: take(stop - o) };
      }
      if (ev && status) ev.prefix = prefix;
    }
    if (!ev) {
      // End of song (FF 2F, or anything PlayIt restarts on).
      song.end = { tick, delta, bytes: [...m.subarray(start)] };
      break;
    }
    ev.delta = delta;
    all.push(ev);
    seq++;
    if (o >= m.length) {
      song.end = { tick, bytes: [] };
      break;
    }
    const d = readVar(m, o);
    delta = [...m.subarray(o, d.next)];
    tick += d.value;
    o = d.next;
  }

  // Pair note offs with their ons (first in, first out per channel and note).
  const open = new Map<number, Note[]>();
  for (const ev of all) {
    song.hadEvents[ev.ch] = true;
    if (ev.type === 'on') {
      const n: Note = { on: ev };
      song.notes.push(n);
      const k = ev.ch * 128 + ev.a;
      const q = open.get(k);
      if (q) q.push(n);
      else open.set(k, [n]);
    } else if (ev.type === 'off') {
      const n = open.get(ev.ch * 128 + ev.a)?.shift();
      if (n) n.off = ev;
      else song.events.push(ev);
    } else song.events.push(ev);
  }
  song.counter = seq;
  return song;
}

/** All events in stream order. */
export function streamEvents(song: CmfSong): Ev[] {
  const evs: Ev[] = [...song.events];
  for (const n of song.notes) {
    evs.push(n.on);
    if (n.off) {
      if (n.off.tick < n.on.tick) n.off.tick = n.on.tick;
      if (n.off.tick === n.on.tick && n.off.seq < n.on.seq) n.off.seq = n.on.seq + 0.5;
      evs.push(n.off);
    }
  }
  return evs.sort((x, y) => x.tick - y.tick || x.seq - y.seq);
}

/** Writes the song back to a CMF file. */
export function writeSong(song: CmfSong): Uint8Array {
  const evs = streamEvents(song);
  // PlayIt skips the first delta, so the first event always plays at the start: when the
  // first one comes later, a note-off for a note nobody plays holds the place at tick 0.
  if (evs.length && evs[0].tick > 0) evs.unshift({ type: 'off', tick: 0, seq: -Infinity, ch: 0, a: 0, b: 0, fn: 8 });
  const last = evs.length ? evs[evs.length - 1].tick : 0;
  let endTick = Math.max(song.end.tick, last);
  let leadIn = song.leadIn;
  // A song with no time in it would make PlayIt spin forever inside one timer tick.
  if (endTick + leadIn === 0 && (evs.length || song.end.bytes.length)) {
    if (evs.length) endTick = 1;
    else leadIn = 1;
  }
  const deltaBytes = (value: number, orig: number[] | undefined) => (orig && decodeVar(orig) === value ? orig : varLen(value));

  const music: number[] = [];
  const hasMusic = evs.length || song.end.bytes.length || song.leadInBytes;
  if (hasMusic) music.push(...deltaBytes(leadIn, song.leadInBytes));
  let funct = -1;
  let channel = -1;
  let prev = 0;
  evs.forEach((ev, i) => {
    if (i > 0) music.push(...deltaBytes(ev.tick - prev, ev.delta));
    prev = ev.tick;
    if (ev.type === 'on' || ev.type === 'off') {
      let fn: number;
      let vel = ev.b;
      if (ev.type === 'on') fn = 9;
      else {
        fn = ev.fn ?? (funct === 8 && channel === ev.ch ? 8 : 9);
        if (fn === 9) vel = 0;
      }
      const known = funct >= 0;
      const need = !known || funct !== fn || channel !== ev.ch;
      if (ev.status === true || (need && (known || ev.status !== false))) music.push((fn << 4) | ev.ch);
      funct = fn;
      channel = ev.ch;
      music.push(ev.a & 0x7f, vel & 0xff);
      return;
    }
    if (ev.prefix !== undefined) {
      music.push(ev.prefix);
      funct = ev.prefix >> 4;
      channel = ev.prefix & 0x0f;
    }
    if (ev.type === 'program') music.push(0xc0 | ev.ch, ev.a & 0xff);
    else if (ev.type === 'mode') music.push(0xb0 | ev.ch, 0x67, ev.a & 0xff);
    else music.push(...(ev.bytes ?? []));
  });
  if (hasMusic) {
    const endDelta = endTick - last;
    if (!evs.length) {
      music.push(...(song.end.bytes.length ? song.end.bytes : [0xff, 0x2f, 0x00]));
    } else if (song.end.bytes.length === 0 && endDelta === (decodeVar(song.end.delta) ?? 0)) {
      if (song.end.delta) music.push(...song.end.delta);
    } else {
      music.push(...deltaBytes(endDelta, song.end.delta));
      music.push(...(song.end.bytes.length ? song.end.bytes : [0xff, 0x2f, 0x00]));
    }
  }

  const H = song.header.length;
  const instruments = song.instruments.slice(0, 128);
  const musicBlk = H + instruments.length * 16 + song.gap.length;
  const out = new Uint8Array(musicBlk + music.length);
  out.set(song.header);
  const dv = new DataView(out.buffer);
  dv.setUint16(6, H, true);
  dv.setUint16(8, musicBlk, true);
  dv.setUint16(10, Math.max(1, Math.min(0xffff, Math.round(song.ticksPerBeat))), true);
  dv.setUint16(12, song.clockTicks, true);
  const now = new Array(16).fill(false);
  for (const ev of evs) now[ev.ch] = true;
  for (let c = 0; c < 16; c++) out[20 + c] = now[c] === song.hadEvents[c] ? song.channelUsed[c] : now[c] ? 1 : 0;
  dv.setUint16(36, instruments.length, true);
  instruments.forEach((inst, i) => out.set(inst.subarray(0, 16), H + i * 16));
  out.set(song.gap, H + instruments.length * 16);
  out.set(music, musicBlk);
  return out;
}

// ---- what PlayIt does ----------------------------------------------------------------

/**
 * The driver calls PlayIt() makes over `ticks` timer ticks, as "tick:call" strings
 * (on/off/program/mode/restart). With `velocity`, note-ons end in "@velocity" (how loud
 * SBFMDRV plays them). Two songs that give the same trace with velocities sound the same.
 */
export function traceMusic(music: Uint8Array, ticks: number, velocity = false): string[] {
  const out: string[] = [];
  let offset = 0;
  let wait = 0;
  let channel = 0;
  let funct = 8;
  const at = (i: number) => music[i] ?? 0xff;
  const paws = () => {
    const r = readVar(music, offset);
    offset = r.next;
    return r.value;
  };
  if (!music.length) return out;
  for (let t = 0; t < ticks; t++) {
    if (offset === 0) {
      wait = 1;
      paws();
    }
    wait--;
    let guard = 0;
    while (wait <= 0) {
      if (guard++ > 100000) {
        out.push(`${t}:hang`);
        return out;
      }
      // No position check: PlayIt repeats only at an end marker. Past the end of the data the
      // read gives 0xFF (as in audio/cmfPlayer.ts), which restarts like the marker does.
      const s = at(offset);
      if ((s & 0xf0) === 0x90 || (s & 0xf0) === 0x80) {
        channel = s & 0x0f;
        funct = s >> 4;
        offset++;
      }
      const a = at(offset);
      if (a < 0x80) {
        const vel = at(offset + 1);
        const off = funct === 8 || vel === 0;
        out.push(`${t}:${off ? 'off' : 'on'} ${channel} ${a}${velocity && !off ? `@${vel}` : ''}`);
        offset += 2;
      } else {
        const hi = a & 0xf0;
        if (hi === 0xa0 || hi === 0xe0) offset += 3;
        else if (hi === 0xb0) {
          if (at(offset + 1) === 0x67) out.push(`${t}:mode ${at(offset + 2)}`);
          offset += 3;
        } else if (hi === 0xc0) {
          out.push(`${t}:program ${a & 0x0f} ${at(offset + 1)}`);
          offset += 2;
        } else if (hi === 0xd0) offset += 2;
        else if (a === 0xf0 || a === 0xf7) {
          offset++;
          offset += paws();
          offset++;
        } else {
          out.push(`${t}:restart`);
          offset = 0;
        }
      }
      wait = paws();
    }
  }
  return out;
}

/** The music block of a CMF file. */
export function musicOf(bytes: Uint8Array): Uint8Array {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return bytes.subarray(dv.getUint16(8, true));
}
