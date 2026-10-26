// Composing Sound Blaster (OPL2 FM) music and writing it as a .CMF song (shared by the
// web song maker and games/kit).
// Notes are written as text, e.g. "C4 q, E4 q, G4 h, r q" (q=quarter, e=eighth, h=half,
// w=whole, s=sixteenth, dotted with "."), one string per voice.
import { encodeCmf, type CmfEvent } from '../formats/cmf';

/** An SBI instrument from its operator settings (modulator, carrier). */
export function sbi(o: {
  modChar: number;
  carChar: number;
  modLevel: number;
  carLevel: number;
  modAD: number;
  carAD: number;
  modSR: number;
  carSR: number;
  modWave?: number;
  carWave?: number;
  feedback: number;
}): Uint8Array {
  return Uint8Array.from([
    o.modChar,
    o.carChar,
    o.modLevel,
    o.carLevel,
    o.modAD,
    o.carAD,
    o.modSR,
    o.carSR,
    o.modWave ?? 0,
    o.carWave ?? 0,
    o.feedback,
    0,
    0,
    0,
    0,
    0,
  ]);
}

/**
 * A few classic FM patches, written for this project. (The piano and the brass were once
 * AdLib's STANDARD.BNK PIANO1 and BRASS1 register values; they are now our own.)
 */
export const INSTRUMENTS = {
  piano: sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x5a, carLevel: 0x00, modAD: 0xf2, carAD: 0xf3, modSR: 0x63, carSR: 0x65, feedback: 0x08 }),
  bass: sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x1a, carLevel: 0x00, modAD: 0xf6, carAD: 0xf5, modSR: 0x54, carSR: 0x45, feedback: 0x08 }),
  strings: sbi({ modChar: 0x61, carChar: 0x21, modLevel: 0x1d, carLevel: 0x00, modAD: 0x74, carAD: 0x63, modSR: 0x13, carSR: 0x15, feedback: 0x0e }),
  brass: sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1a, carLevel: 0x00, modAD: 0x63, carAD: 0x74, modSR: 0x28, carSR: 0x17, feedback: 0x0c }),
  lead: sbi({ modChar: 0x22, carChar: 0x21, modLevel: 0x1b, carLevel: 0x00, modAD: 0xf4, carAD: 0xf4, modSR: 0x44, carSR: 0x24, modWave: 2, feedback: 0x0c }),
  bell: sbi({ modChar: 0x07, carChar: 0x01, modLevel: 0x23, carLevel: 0x00, modAD: 0xf5, carAD: 0xf3, modSR: 0x22, carSR: 0x13, feedback: 0x04 }),
  organ: sbi({ modChar: 0x32, carChar: 0x31, modLevel: 0x44, carLevel: 0x00, modAD: 0xf0, carAD: 0xf0, modSR: 0x0f, carSR: 0x0f, feedback: 0x01 }),
  pad: sbi({ modChar: 0xa1, carChar: 0x21, modLevel: 0x29, carLevel: 0x00, modAD: 0x43, carAD: 0x52, modSR: 0x05, carSR: 0x04, modWave: 1, feedback: 0x0a }),
  pluck: sbi({ modChar: 0x03, carChar: 0x01, modLevel: 0x1e, carLevel: 0x00, modAD: 0xf8, carAD: 0xf6, modSR: 0x35, carSR: 0x55, feedback: 0x0c }),
};

const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 1 / 3 };

/** "C#4" → MIDI 61; "r" → rest. */
export function midi(name: string): number | null {
  if (/^r$/i.test(name)) return null;
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

export interface Voice {
  /** MIDI channel 0..8 (each gets its own instrument). */
  channel: number;
  instrument: Uint8Array;
  /** "C4 q, E4 e., r e, [C4 E4 G4] h" — brackets play a chord, its notes on this channel and the next ones (leave them free). */
  notes: string;
  velocity?: number;
  /** Shift every note by semitones. */
  transpose?: number;
}

/**
 * Writes the song. `bpm` sets the speed; Game-Maker plays 146 ticks a second. Songs loop
 * when they end, as PLAYGAME restarts them.
 */
export function song(bpm: number, voices: Voice[]): Uint8Array {
  const ticksPerBeat = Math.round((146 * 60) / bpm);
  const instruments: Uint8Array[] = [];
  const events: CmfEvent[] = [];
  const chordChannels = new Map<number, Uint8Array>();
  for (const v of voices) {
    instruments[v.channel] = v.instrument;
    let t = 0;
    for (const raw of v.notes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const m = /^(.+?)\s+([whqest])(\.?)$/.exec(raw);
      if (!m) throw new Error(`Bad note "${raw}"`);
      const len = LEN[m[2]] * (m[3] ? 1.5 : 1) * ticksPerBeat;
      const names = m[1].replace(/[[\]]/g, ' ').trim().split(/\s+/);
      // An FM channel is one voice: a chord's notes go on this channel and the ones after it.
      names.forEach((name, k) => {
        const n = midi(name);
        if (n === null) return;
        const ch = Math.min(15, v.channel + k);
        if (k > 0) chordChannels.set(ch, v.instrument);
        const note = n + (v.transpose ?? 0);
        events.push({ tick: t, data: [0x90 | ch, note, v.velocity ?? 100] });
        events.push({ tick: t + len * 0.92, data: [0x80 | ch, note, 0] });
      });
      t += len;
    }
  }
  for (const [c, inst] of chordChannels) instruments[c] ??= inst;
  for (let c = 0; c < 16; c++) instruments[c] ??= INSTRUMENTS.piano;
  return encodeCmf({ instruments, events, ticksPerBeat });
}

/**
 * A new, empty song: piano on every channel and one silent bar at `bpm` (a song with nothing
 * in it at all would end the moment it starts, and PLAYGAME restarts a song when it ends).
 */
export function blankSong(bpm = 120): Uint8Array {
  const ticksPerBeat = Math.round((146 * 60) / bpm);
  const instruments = Array.from({ length: 16 }, () => INSTRUMENTS.piano);
  // the bar's end, marked by setting channel 1's volume to where it already is
  return encodeCmf({ instruments, events: [{ tick: 4 * ticksPerBeat, data: [0xb0, 7, 100] }], ticksPerBeat });
}
