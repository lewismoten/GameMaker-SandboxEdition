// Listening to a song while it is edited: a copy with some channels muted, starting part way
// in, or looping a region (buildPreview), and a short song that plays one note on one
// instrument (auditionSong). Both are real CMF music, so they play through the same PlayIt
// code as the games.
import { DEFAULT_VELOCITY, clampVelocity } from './cmfEdit';
import { type Ev, type Note, type CmfSong, RHYTHM_CHANNELS, noteEnd, streamEvents, writeSong } from './cmfSong';

// ---- preview ---------------------------------------------------------------------------

export interface PreviewPart {
  from: number;
  to: number;
  /** Silence before this part. */
  gap: number;
  /** Re-establish instruments, mode and held notes at the start (when cut in the middle). */
  prelude: boolean;
}

export interface Preview {
  bytes: Uint8Array;
  /** Length of one pass of the preview in ticks. */
  length: number;
  /** Song tick (or -1 in a gap) for a tick since the preview started. */
  songTick: (t: number) => number;
}

/**
 * A copy of the song to listen to: some channels muted, starting from a point, or looping a
 * region. Built from the same events, so it plays through the same PlayIt code.
 */
export function buildPreview(song: CmfSong, opts: { muted?: Set<number>; from?: number; loop?: [number, number] } = {}): Preview {
  const muted = opts.muted ?? new Set<number>();
  const end = Math.max(1, song.end.tick);
  const parts: PreviewPart[] = [];
  if (opts.loop) {
    const [a, b] = opts.loop;
    const from = Math.max(a, Math.min(opts.from ?? a, b - 1));
    if (from > a) parts.push({ from, to: b, gap: 0, prelude: true });
    parts.push({ from: a, to: b, gap: 0, prelude: true });
  } else {
    const from = Math.max(0, Math.min(opts.from ?? 0, end - 1));
    if (from > 0) {
      parts.push({ from, to: end, gap: 0, prelude: true });
      // then the whole song a few times, as the game would repeat it
      let total = end - from;
      for (let i = 0; i < 12 && total < 146 * 300; i++) {
        parts.push({ from: 0, to: end, gap: song.leadIn, prelude: false });
        total += end + song.leadIn;
      }
    } else parts.push({ from: 0, to: end, gap: 0, prelude: false });
  }

  const evs = streamEvents(song);
  const out: CmfSong = {
    ...song,
    notes: [],
    events: [],
    end: { tick: 0, bytes: [] },
    leadIn: 0,
    leadInBytes: undefined,
    counter: 0,
    hadEvents: new Array(16).fill(true),
  };
  let seq = 0;
  const push = (e: Omit<Ev, 'seq'>) => out.events.push({ ...e, seq: seq++, status: undefined, delta: undefined } as Ev);
  let t0 = 0;
  const starts: number[] = [];
  for (const p of parts) {
    t0 += p.gap;
    starts.push(t0);
    const shift = t0 - p.from;
    if (p.prelude) {
      let rhythm: Ev | undefined;
      const programs = new Map<number, number>();
      for (const e of evs) {
        if (e.tick > p.from || (e.tick === p.from && e.type === 'on')) break;
        if (e.type === 'mode') rhythm = e;
        if (e.type === 'program') programs.set(e.ch, e.a);
      }
      push({ type: 'mode', tick: t0, ch: rhythm?.ch ?? 0, a: rhythm ? rhythm.a : 0, b: 0 });
      for (let c = 0; c < 16; c++) push({ type: 'program', tick: t0, ch: c, a: programs.get(c) ?? c, b: 0 });
      // notes already sounding at the cut start again
      const held = new Map<number, Note>();
      for (const n of song.notes) {
        if (muted.has(n.on.ch) || n.on.tick >= p.from || noteEnd(song, n) <= p.from) continue;
        const h = held.get(n.on.ch);
        if (!h || n.on.tick > h.on.tick) held.set(n.on.ch, n);
      }
      for (const n of held.values()) {
        push({ type: 'on', tick: t0, ch: n.on.ch, a: n.on.a, b: n.on.b });
        if (n.off && n.off.tick < p.to) push({ type: 'off', tick: n.off.tick + shift, ch: n.on.ch, a: n.on.a, b: 0 });
      }
    }
    for (const e of evs) {
      if (e.tick < p.from || e.tick >= p.to) continue;
      if (e.type === 'raw') continue;
      if (e.type === 'on' && muted.has(e.ch)) continue;
      push({ type: e.type, tick: e.tick + shift, ch: e.ch, a: e.a, b: e.b, fn: e.fn, bytes: e.bytes });
    }
    // notes still sounding when the part ends stop there
    for (const n of song.notes)
      if (n.on.tick < p.to && noteEnd(song, n) > p.to && !muted.has(n.on.ch)) push({ type: 'off', tick: p.to + shift, ch: n.on.ch, a: n.on.a, b: 0 });
    t0 += p.to - p.from;
  }
  out.events.sort((x, y) => x.tick - y.tick || x.seq - y.seq);
  out.end = { tick: t0, bytes: [] };
  out.clockTicks = song.clockTicks;
  const length = t0;
  // Played from the top, the preview repeats as the game does: after the beginning silence.
  const whole = parts.length === 1 && !opts.loop && parts[0].from === 0;
  if (whole) out.leadIn = song.leadIn;
  const songTick = (t: number) => {
    if (whole && t >= length) {
      const u = (t - length) % (length + song.leadIn);
      return u < song.leadIn ? -1 : u - song.leadIn;
    }
    t = ((t % length) + length) % length;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (t >= starts[i]) return Math.min(parts[i].to, parts[i].from + (t - starts[i]));
      if (t >= starts[i] - parts[i].gap) return -1;
    }
    return parts[0].from;
  };
  return { bytes: writeSong(out), length, songTick };
}

/** A tiny song that plays one note with an instrument (for "try it"). */
export function auditionSong(song: CmfSong, ch: number, program: number, key: number, ticks = 70, vel = DEFAULT_VELOCITY): Uint8Array {
  const rhythm = RHYTHM_CHANNELS.includes(ch);
  const s: CmfSong = {
    ...song,
    notes: [],
    events: [],
    end: { tick: ticks + 600, bytes: [] },
    leadIn: 0,
    leadInBytes: undefined,
    counter: 0,
    hadEvents: new Array(16).fill(true),
  };
  s.events.push({ type: 'mode', tick: 0, seq: 0, ch: 0, a: rhythm ? 1 : 0, b: 0 });
  s.events.push({ type: 'program', tick: 0, seq: 1, ch, a: program, b: 0 });
  s.events.push({ type: 'on', tick: 0, seq: 2, ch, a: key, b: clampVelocity(vel) });
  s.events.push({ type: 'off', tick: ticks, seq: 3, ch, a: key, b: 0 });
  return writeSong(s);
}
