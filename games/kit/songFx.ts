// Tricks that push a Creative Music File past what its event list seems to allow, for the Bard
// of Bizarre games' arrangements (kit/song.ts writes the bars; this adds to the same Writer).
// Every trick is made only of events PLAYGAME's sequencer (SBMUSIC.C's PlayIt, ported in
// web/src/audio/cmfPlayer.ts) and Creative's FM driver understand: note on/off with velocity,
// program change, the rhythm mode switch (controller 0x67) and the marker (controller 0x66).
// PLAYGAME ignores pitch bend and CMF's transpose controllers (0x68/0x69), so nothing here
// uses them.
//
//   - Automation by program change. SBFMDRV loads an instrument's registers the moment a
//     program change arrives, even under a note that is sounding, and the instrument table can
//     hold 128 patches. A run of copies of one patch that differ only in their levels, changed
//     every few ticks under a held chord, is a swell (the carrier's level: louder) or a filter
//     sweep (the modulator's level: brighter) that CMF has no controller for: swell().
//   - More than 16 timbres: every later patch is another instrument at 16 and up (patch()).
//   - A seventh melodic voice: in rhythm mode the bass drum is a whole two-operator voice whose
//     pitch follows its note number, so with a long, sustaining patch it plays a sub bass line
//     (an 808 boom, a decade early) and frees a melodic channel: boom(). The tom-tom's pitch
//     follows its note too (tuned toms, a timpani roll: drumRoll() with notes).
//   - Chords on one channel: fast arpeggios (the chiptune trick), and a harp that spreads a
//     chord round several channels so each note keeps ringing on its release: arp(), harp().
//   - Slides: CMF has no pitch bend, so a glide is a run of semitone steps a couple of ticks
//     apart (each step retriggers on a fast attack, so it sounds like one note bending): slide()
//     and phrase()'s "~" scoop and "\" fall.
//   - A choir out of two voices: the same notes on two channels whose patches differ only in
//     the vibrato bit, so one wavers 14 cents against the other and they beat like a section
//     (detuned() makes the twin); waveforms 1 to 3 (the driver enables waveform select).
//   - Echoes and stutters: the line again on another channel later and softer, or one note
//     retriggered on its own channel, softer each time: echo(), stutter().
//   - Dynamics: velocity scales the carrier's level (SBFMDRV's formula), so crescendos are
//     ramps of velocity (ramp()); dramatic pauses are just bars with nothing in them.
//   - Markers (controller 0x66) at each section: PLAYGAME skips them, and the preview tools
//     find the sections by them (markers()).
import { midi } from './music';
import type { Writer } from './song';

/** Rhythm mode drum channels: bass drum (its own voice, FM channel 6), snare, tom-tom, cymbal, hi-hat. */
export const DRUM = { kick: 11, snare: 12, tom: 13, cymbal: 14, hat: 15 } as const;

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 1 / 3, x: 1 / 6 };

/** One note of a phrase: MIDI (null for a rest), its length in beats, and how it moves. */
export interface Tone {
  n: number | null;
  beats: number;
  /** Slide up into the note from this many semitones below. */
  scoop: number;
  /** Fall away this many semitones as it ends. */
  fall: number;
  /** Velocity added (an accent) or taken away. */
  accent: number;
  /** Tied on from the note before (no new attack). */
  tie: boolean;
}

/**
 * Notes as text, as in kit/music but with triplets ("t", a third of a beat, "x" a sixth) and
 * marks: "~C5 q" scoops up into the note, "C5 q\" falls off it, "C5 q!" accents it, "C5 q-"
 * plays it softer, "_ q" holds the note before for longer.
 */
export function tones(s: string): Tone[] {
  const out: Tone[] = [];
  for (const raw of s.split(',').map((t) => t.trim()).filter(Boolean)) {
    const m = /^(~+)?(\S+)\s+([whqestx])(\.?)(\\+)?([!-]*)$/.exec(raw);
    if (!m) throw new Error(`Bad note "${raw}"`);
    const beats = LEN[m[3]] * (m[4] ? 1.5 : 1);
    const accent = [...m[6]].reduce((a, c) => a + (c === '!' ? 14 : -18), 0);
    if (m[2] === '_') {
      const last = out[out.length - 1];
      if (!last) throw new Error('A hold with nothing to hold');
      out.push({ n: last.n, beats, scoop: 0, fall: m[5] ? m[5].length * 2 : 0, accent: 0, tie: true });
      continue;
    }
    out.push({ n: midi(m[2]), beats, scoop: m[1] ? m[1].length * 2 : 0, fall: m[5] ? m[5].length * 2 : 0, accent, tie: false });
  }
  return out;
}

/** How long a phrase is, in beats. */
export const beatsOf = (s: string): number => tones(s).reduce((a, t) => a + t.beats, 0);

/** A patch with its levels changed (total level 0 loudest .. 63 silent; the key scaling bits are kept). */
export function leveled(inst: Uint8Array, o: { mod?: number; car?: number }): Uint8Array {
  const p = Uint8Array.from(inst);
  if (o.mod !== undefined) p[2] = (p[2] & 0xc0) | Math.max(0, Math.min(63, Math.round(o.mod)));
  if (o.car !== undefined) p[3] = (p[3] & 0xc0) | Math.max(0, Math.min(63, Math.round(o.car)));
  return p;
}

/** The twin of a patch with vibrato on both operators (or off, if it had it): play both for a choir. */
export function detuned(inst: Uint8Array): Uint8Array {
  const p = Uint8Array.from(inst);
  p[0] ^= 0x40;
  p[1] ^= 0x40;
  return p;
}

/** A patch with its waveforms set (0 sine, 1 half sine, 2 absolute sine, 3 pulse sine). */
export function waved(inst: Uint8Array, mod: number, car: number): Uint8Array {
  const p = Uint8Array.from(inst);
  p[8] = mod & 3;
  p[9] = car & 3;
  return p;
}

/** `steps` copies of a patch whose levels move from `from` to `to` (each { mod, car }), for swell(). */
export function sweep(inst: Uint8Array, steps: number, from: { mod?: number; car?: number }, to: { mod?: number; car?: number }): Uint8Array[] {
  const lerp = (a: number | undefined, b: number | undefined, t: number) => (a === undefined || b === undefined ? undefined : a + (b - a) * t);
  return Array.from({ length: steps }, (_, k) => {
    const t = steps === 1 ? 1 : k / (steps - 1);
    return leveled(inst, { mod: lerp(from.mod, to.mod, t), car: lerp(from.car, to.car, t) });
  });
}

/** Velocity from `from` to `to` at t (0..1). */
export const ramp = (from: number, to: number, t: number): number => Math.max(1, Math.min(127, Math.round(from + (to - from) * Math.max(0, Math.min(1, t)))));

export class Fx {
  /** The patch each channel has now (after its program changes). */
  private now = new Map<number, Uint8Array>();
  /** Where each section starts (beat), for the preview tools. */
  readonly sections: { at: number; name: string }[] = [];

  constructor(readonly w: Writer) {}

  private tick(beats: number): number {
    return Math.round(beats * this.w.tpb);
  }

  /** The channel's opening patch (instrument n for channel n, loaded before the first note). */
  open(ch: number, inst: Uint8Array): this {
    this.w.instruments[ch] = inst;
    this.now.set(ch, inst);
    return this;
  }

  /** The instrument number of a patch: a channel's own opening patch, or one of the extra ones from 16 up (128 at most). */
  patch(inst: Uint8Array): number {
    const ins = this.w.instruments;
    for (let k = 0; k < ins.length; k++) if (ins[k] && (ins[k] === inst || same(ins[k], inst))) return k;
    const k = Math.max(16, ins.length);
    if (k >= 128) throw new Error('A CMF holds 128 instruments');
    ins[k] = inst;
    return k;
  }

  /** A program change at beat `at` (nothing if the channel already has the patch). */
  program(ch: number, at: number, inst: Uint8Array): this {
    const cur = this.now.get(ch);
    if (cur && (cur === inst || same(cur, inst))) return this;
    this.w.events.push({ tick: this.tick(at), data: [0xc0 | ch, this.patch(inst)] });
    this.now.set(ch, inst);
    return this;
  }

  /** A section's start: a CMF marker (controller 0x66, value = its number) that PLAYGAME skips. */
  marker(at: number, name: string): this {
    this.sections.push({ at, name });
    this.w.events.push({ tick: this.tick(at), data: [0xb0, 0x66, Math.min(127, this.sections.length)] });
    return this;
  }

  /** One note, `len` beats from `at` (legato: the part of it held before letting go). */
  note(ch: number, at: number, len: number, n: number, vel: number, legato = 0.92): this {
    this.w.note(ch, at, len, n, Math.max(1, Math.min(127, Math.round(vel))), legato);
    return this;
  }

  /**
   * A phrase from beat `at` on one channel (see tones()): scoops slide up into their note in
   * two-tick steps, falls slide away at the end, ties hold on. Returns its length in beats.
   */
  phrase(ch: number, at: number, s: string, vel: number, shift = 0, legato = 0.92): number {
    const ts = tones(s);
    let t = at;
    for (let i = 0; i < ts.length; i++) {
      const tone = ts[i];
      if (tone.n === null || tone.tie) {
        t += tone.beats;
        continue;
      }
      // how long it sounds, ties included
      let len = tone.beats;
      let fall = tone.fall;
      for (let j = i + 1; j < ts.length && ts[j].tie; j++) {
        len += ts[j].beats;
        fall = ts[j].fall || fall;
      }
      const n = tone.n + shift;
      const v = vel + tone.accent;
      let start = t;
      if (tone.scoop) start = this.slide(ch, t, n - tone.scoop, n - 1, 2, v - 10);
      const fallBeats = fall ? (fall * 2) / this.w.tpb : 0;
      const body = Math.max(1 / this.w.tpb, t + len * legato - start - fallBeats);
      if (fall) this.note(ch, start, body + 1 / this.w.tpb, n, v, 1);
      else this.note(ch, start, t + len - start, n, v, legato);
      if (fall) this.slide(ch, start + body + 1 / this.w.tpb, n - 1, n - fall, 2, v - 20);
      t += tone.beats;
    }
    return t - at;
  }

  /** Semitone steps from `from` to `to`, `ticks` timer ticks each, on one channel; returns the beat it ends on. */
  slide(ch: number, at: number, from: number, to: number, ticks: number, vel: number): number {
    const dir = to >= from ? 1 : -1;
    const step = ticks / this.w.tpb;
    let t = at;
    for (let n = from; dir > 0 ? n <= to : n >= to; n += dir) {
      this.note(ch, t, step, n, vel, 1);
      t += step;
    }
    return t;
  }

  /** The same notes on two channels at once, the second with the twin patch (a two-voice choir). */
  choir(chA: number, chB: number, at: number, s: string, vel: number, shift = 0): number {
    this.phrase(chA, at, s, vel, shift);
    return this.phrase(chB, at, s, vel - 8, shift);
  }

  /** Program changes on `chs` stepping through `patches` evenly over `beats` from `at` (a swell or a filter sweep). */
  swell(chs: number[], at: number, beats: number, patches: Uint8Array[]): this {
    patches.forEach((p, k) => {
      const t = at + (patches.length === 1 ? 0 : (beats * k) / (patches.length - 1));
      for (const ch of chs) this.program(ch, t, p);
    });
    return this;
  }

  /** A chord on one channel: its notes in turn, one every `every` beats, for `beats` ('up', 'down', 'updown'). */
  arp(ch: number, at: number, beats: number, notes: number[], every: number, vel: number, shape: 'up' | 'down' | 'updown' = 'up'): this {
    const order = shape === 'up' ? notes : shape === 'down' ? [...notes].reverse() : [...notes, ...notes.slice(1, -1).reverse()];
    const count = Math.round(beats / every);
    for (let k = 0; k < count; k++) this.note(ch, at + k * every, every, order[k % order.length], vel, 0.95);
    return this;
  }

  /** A chord spread round several channels, a note every `every` beats; each rings on until its channel's next note (a harp). */
  harp(chs: number[], at: number, beats: number, notes: number[], every: number, vel: number | ((k: number) => number)): this {
    const count = Math.round(beats / every);
    for (let k = 0; k < count; k++) {
      const until = Math.min(count, k + chs.length) * every;
      const v = typeof vel === 'number' ? vel : vel(k);
      this.note(chs[k % chs.length], at + k * every, until - k * every, notes[k % notes.length], v, 0.97);
    }
    return this;
  }

  /** The phrase again on `ch`, `delay` beats later, `times` times, each softer (an echo). */
  echo(ch: number, at: number, s: string, vel: number, delay: number, times = 1, decay = 0.6, shift = 0): this {
    for (let k = 1; k <= times; k++) this.phrase(ch, at + delay * k, s, vel * decay ** k, shift, 0.7);
    return this;
  }

  /** One note retriggered on its own channel `times` times, `gap` beats apart, each softer. */
  stutter(ch: number, at: number, n: number, times: number, gap: number, vel: number, decay = 0.72): this {
    for (let k = 0; k < times; k++) this.note(ch, at + k * gap, gap, n, vel * decay ** k, 0.8);
    return this;
  }

  /** The bass drum as a pitched voice (its patch from boomPatch). */
  boom(at: number, len: number, n: number, vel: number): this {
    return this.note(DRUM.kick, at, len, n, vel, 0.9);
  }

  /** A drum hit every `every` beats for `beats`, velocity ramping (a roll); tuned drums (tom, kick) walk through `notes`. */
  drumRoll(drum: number, at: number, beats: number, every: number, velFrom: number, velTo: number, notes: number[] = [drum === DRUM.tom ? 48 : drum === DRUM.cymbal ? 72 : 55]): this {
    const count = Math.round(beats / every);
    for (let k = 0; k < count; k++) this.note(drum, at + k * every, Math.min(every, 0.5), notes[k % notes.length], ramp(velFrom, velTo, count === 1 ? 1 : k / (count - 1)), 0.6);
    return this;
  }

  /** Puts every drum channel back on its opening patch and the song's length in bars, then writes the CMF. */
  cmf(bars: number): Uint8Array {
    this.w.bar = bars;
    for (const ch of [11, 12, 13, 14, 15]) {
      const first = this.w.instruments[ch];
      if (first) this.program(ch, bars * 4, first);
    }
    // Writer.cmf puts the melodic channels back on their opening patches.
    return this.w.cmf();
  }
}

const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

/** The bass drum as a sub bass: a sine that sustains while the note is held and rings out. */
export function boomPatch(o: { decay?: number; release?: number; growl?: number } = {}): Uint8Array {
  const growl = o.growl ?? 0x20;
  return Uint8Array.from([0x21, 0x21, growl, 0x00, 0xf4, 0xf0 | (o.decay ?? 3), 0x0f, 0x10 | (o.release ?? 6), 0, 0, 0x04, 0, 0, 0, 0, 0]);
}
