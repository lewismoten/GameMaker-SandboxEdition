// The tools every song is written with: chords spread over three comping voices, bass lines,
// note-string lengths checked so loops stay in step, and the FM instruments (the sequel's,
// plus a few new ones). Each voice is its own OPL2 channel.
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';

export const CHORDS: Record<string, string[]> = {
  C: ['E4', 'G4', 'C5'],
  C7: ['E4', 'G4', 'Bb4'],
  Cm: ['Eb4', 'G4', 'C5'],
  D7: ['F#4', 'A4', 'C5'],
  Dm: ['D4', 'F4', 'A4'],
  Dm7: ['F4', 'A4', 'C5'],
  E7: ['E4', 'G#4', 'D5'],
  Em: ['E4', 'G4', 'B4'],
  F: ['F4', 'A4', 'C5'],
  Fm: ['F4', 'Ab4', 'C5'],
  G: ['D4', 'G4', 'B4'],
  G7: ['D4', 'F4', 'B4'],
  A7: ['E4', 'G4', 'C#5'],
  Am: ['E4', 'A4', 'C5'],
  Bb: ['D4', 'F4', 'Bb4'],
  Gm: ['D4', 'G4', 'Bb4'],
  F7: ['Eb4', 'A4', 'C5'],
  Eb: ['Eb4', 'G4', 'Bb4'],
  Ab: ['Eb4', 'Ab4', 'C5'],
  Bdim: ['D4', 'F4', 'B4'],
};
const ROOT: Record<string, string> = { C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', A: 'A', B: 'B', Bb: 'Bb', Eb: 'Eb', Ab: 'Ab' };
const rootOf = (ch: string) => ROOT[/^[A-G]b/.test(ch) ? ch.slice(0, 2) : ch[0]];
const FIFTH: Record<string, string> = { C: 'G', D: 'A', E: 'B', F: 'C', G: 'D', A: 'E', B: 'F#', Bb: 'F', Eb: 'Bb', Ab: 'Eb' };
const ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Three comping voices from one chord per bar; `rhythm` lists lengths ('r' = rest). */
export function comp(bars: string[], rhythm: string, octave = 0): [string, string, string] {
  const out: [string[], string[], string[]] = [[], [], []];
  for (const ch of bars) {
    const notes = CHORDS[ch];
    if (!notes) throw new Error(`No chord ${ch}`);
    for (const len of rhythm.split(' ')) {
      if (len.startsWith('r')) for (const v of out) v.push(`r ${len.slice(1) || 'q'}`);
      else notes.forEach((n, i) => out[i].push(`${n.slice(0, -1)}${Number(n.slice(-1)) + octave} ${len}`));
    }
  }
  return out.map((v) => v.join(', ')) as [string, string, string];
}

/** Bass: 'oompah' root-fifth on 1 and 3, 'walk' four to the bar, 'half', 'whole'. */
export function bass(bars: string[], style: 'oompah' | 'walk' | 'half' | 'whole' | 'gallop' = 'oompah', octave = 2): string {
  return bars
    .map((ch) => {
      const r = rootOf(ch);
      const f = FIFTH[r];
      const ro = `${r}${octave}`;
      const fifthUp = ORDER.indexOf(f[0]) < ORDER.indexOf(r[0]);
      const fo = `${f}${fifthUp ? octave + 1 : octave}`;
      if (style === 'whole') return `${ro} w`;
      if (style === 'half') return `${ro} h, ${fo} h`;
      if (style === 'walk') return `${ro} q, ${fo} q, ${r}${octave + 1} q, ${fo} q`;
      if (style === 'gallop') return `${ro} e, r e, ${fo} e, r e, ${ro} e, r e, ${fo} e, ${fo} e`;
      return `${ro} q, r q, ${fo} q, r q`;
    })
    .join(', ');
}

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 1 / 3 };
const beatsOf = (notes: string) =>
  notes
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .reduce((n, t) => n + LEN[t.endsWith('.') ? t.slice(-2, -1) : t.slice(-1)] * (t.endsWith('.') ? 1.5 : 1), 0);

/** song(), after checking every voice lasts the same number of beats (so loops stay in step). */
export function tune(bpm: number, voices: Voice[]): Uint8Array {
  const beats = voices.map((x) => beatsOf(x.notes));
  if (beats.some((b) => Math.abs(b - beats[0]) > 1e-6)) throw new Error(`Voices differ in length: ${beats.join(' ')}`);
  return song(bpm, voices);
}

export const v = (channel: number, instrument: Uint8Array, notes: string, velocity = 100, transpose = 0): Voice => ({
  channel,
  instrument,
  notes,
  velocity,
  transpose,
});
export const join = (...parts: string[]) => parts.filter(Boolean).join(', ');
export const times = (n: number, s: string) => Array(n).fill(s).join(', ');

// Instruments.
export const CALLIOPE = sbi({
  modChar: 0x22,
  carChar: 0x21,
  modLevel: 0x1a,
  carLevel: 0x00,
  modAD: 0xf6,
  carAD: 0xf6,
  modSR: 0x15,
  carSR: 0x16,
  modWave: 0,
  carWave: 0,
  feedback: 0x0a,
});
export const WHISTLE = sbi({
  modChar: 0x61,
  carChar: 0x61,
  modLevel: 0x26,
  carLevel: 0x00,
  modAD: 0x65,
  carAD: 0x75,
  modSR: 0x06,
  carSR: 0x06,
  feedback: 0x0e,
});
export const TUBA = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x19, carLevel: 0x00, modAD: 0x83, carAD: 0x85, modSR: 0x37, carSR: 0x47, feedback: 0x0c });
export const TOY = sbi({ modChar: 0x07, carChar: 0x03, modLevel: 0x1f, carLevel: 0x02, modAD: 0xf7, carAD: 0xf4, modSR: 0x44, carSR: 0x35, feedback: 0x08 });
export const BANJO = sbi({ modChar: 0x03, carChar: 0x01, modLevel: 0x18, carLevel: 0x00, modAD: 0xfa, carAD: 0xf8, modSR: 0x47, carSR: 0x57, feedback: 0x0c });
export const TROMBONE = sbi({
  modChar: 0x21,
  carChar: 0x21,
  modLevel: 0x1c,
  carLevel: 0x00,
  modAD: 0x53,
  carAD: 0x63,
  modSR: 0x29,
  carSR: 0x29,
  feedback: 0x0e,
});
export const SNAP = sbi({ modChar: 0x0f, carChar: 0x01, modLevel: 0x00, carLevel: 0x00, modAD: 0xf8, carAD: 0xf9, modSR: 0x07, carSR: 0x08, feedback: 0x0e });
export const { piano, bass: BASS, strings, brass, lead, bell, organ, pad, pluck } = INSTRUMENTS;

/** A soft snare-ish tick on beats 2 and 4. */
export const backbeat = (bars: number) => times(bars, 'r q, C4 q, r q, C4 q');

/** Title: the theme as a bouncy march, then the bridge. */
