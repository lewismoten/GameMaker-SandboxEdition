// The soundtrack: nine short FM songs for the Sound Blaster, written as note strings.
// Each voice is its own OPL2 channel, so chords are spread across three channels.
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';

const CHORDS: Record<string, string[]> = {
  C: ['C4', 'E4', 'G4'],
  Cmaj7: ['E4', 'G4', 'B4'],
  C7: ['E4', 'G4', 'Bb4'],
  G: ['B3', 'D4', 'G4'],
  G7: ['B3', 'F4', 'G4'],
  Am: ['A3', 'C4', 'E4'],
  F: ['A3', 'C4', 'F4'],
  Fm: ['Ab3', 'C4', 'F4'],
  Dm: ['A3', 'D4', 'F4'],
  D7: ['A3', 'C4', 'F#4'],
  Em: ['B3', 'E4', 'G4'],
  E: ['G#3', 'B3', 'E4'],
  E7: ['G#3', 'D4', 'E4'],
  A7: ['G3', 'C#4', 'E4'],
  Bb: ['Bb3', 'D4', 'F4'],
  Eb: ['Bb3', 'Eb4', 'G4'],
  Ab: ['Ab3', 'C4', 'Eb4'],
  Gm: ['Bb3', 'D4', 'G4'],
  Cm: ['C4', 'Eb4', 'G4'],
};
const ROOT: Record<string, string> = { C: 'C', G: 'G', A: 'A', F: 'F', D: 'D', E: 'E', B: 'Bb', Bb: 'Bb', Eb: 'Eb', Ab: 'Ab' };
const rootOf = (ch: string) => ROOT[ch.startsWith('Bb') ? 'Bb' : ch.startsWith('Eb') ? 'Eb' : ch.startsWith('Ab') ? 'Ab' : ch[0]];
const FIFTH: Record<string, string> = { C: 'G', G: 'D', A: 'E', F: 'C', D: 'A', E: 'B', Bb: 'F', Eb: 'Bb', Ab: 'Eb' };

/** Three comping voices from one chord per bar; `rhythm` is the lengths in a bar ('h h', 'q q q q', 'r q q q'...). */
function comp(bars: string[], rhythm: string): [string, string, string] {
  const out: [string[], string[], string[]] = [[], [], []];
  for (const ch of bars) {
    const notes = CHORDS[ch];
    if (!notes) throw new Error(`No chord ${ch}`);
    for (const len of rhythm.split(' ')) {
      if (len.startsWith('r')) for (const v of out) v.push(`r ${len.slice(1) || 'q'}`);
      else notes.forEach((n, i) => out[i].push(`${n} ${len}`));
    }
  }
  return out.map((v) => v.join(', ')) as [string, string, string];
}

/** Root-fifth bass, one note per beat (or 'walk' up the chord). */
function bass(bars: string[], style: 'pump' | 'half' | 'walk' = 'pump', octave = 2): string {
  return bars
    .map((ch) => {
      const r = rootOf(ch);
      const f = FIFTH[r];
      const ro = `${r}${octave}`;
      const fo = `${f}${f < r && f !== 'Bb' ? octave + 1 : octave}`;
      if (style === 'half') return `${ro} h, ${fo} h`;
      if (style === 'walk') return `${ro} q, ${fo} q, ${r}${octave + 1} q, ${fo} q`;
      return `${ro} q, ${fo} q, ${ro} q, ${fo} q`;
    })
    .join(', ');
}

const SLEIGH = sbi({ modChar: 0x0e, carChar: 0x01, modLevel: 0x00, carLevel: 0x08, modAD: 0xf8, carAD: 0xf6, modSR: 0x05, carSR: 0x26, feedback: 0x0e });
const CELESTA = sbi({ modChar: 0x05, carChar: 0x01, modLevel: 0x1c, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x34, carSR: 0x25, feedback: 0x06 });
const FLUTE = sbi({ modChar: 0x61, carChar: 0x61, modLevel: 0x24, carLevel: 0x00, modAD: 0x54, carAD: 0x75, modSR: 0x06, carSR: 0x06, feedback: 0x0e });
const COMP = sbi({ modChar: 0x01, carChar: 0x01, modLevel: 0x55, carLevel: 0x08, modAD: 0xf2, carAD: 0xd3, modSR: 0x63, carSR: 0x74, feedback: 0x08 });

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
/** song(), after checking every voice lasts the same number of beats (so the loop stays in step). */
function tune(bpm: number, voices: Voice[]): Uint8Array {
  const beats = voices.map((x) =>
    x.notes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .reduce((n, t) => n + LEN[t.slice(-1) === '.' ? t.slice(-2, -1) : t.slice(-1)] * (t.endsWith('.') ? 1.5 : 1), 0),
  );
  if (beats.some((b) => Math.abs(b - beats[0]) > 1e-6)) throw new Error(`Voices differ in length: ${beats.join(' ')}`);
  return song(bpm, voices);
}

const v = (channel: number, instrument: Uint8Array, notes: string, velocity = 100, transpose = 0): Voice => ({
  channel,
  instrument,
  notes,
  velocity,
  transpose,
});
const chordVoices = (bars: string[], rhythm: string, inst: Uint8Array, vel = 70, first = 3): Voice[] =>
  comp(bars, rhythm).map((n, i) => v(first + i, inst, n, vel));
/** Sleigh-bell shakes on the off beats. */
const bells = (bars: number, ch = 7) => v(ch, SLEIGH, Array.from({ length: bars }, () => 'r e, A6 e, r e, A6 e, r e, A6 e, r e, A6 e').join(', '), 45);

/** "Snowbound" — the title theme. */
export function titleSong(): Uint8Array {
  const melody = [
    'E5 e, G5 e, C6 q, B5 e, G5 e, A5 q',
    'G5 e, E5 e, F5 e, D5 e, E5 h',
    'E5 e, G5 e, C6 q, D6 e, C6 e, B5 q',
    'A5 e, B5 e, G5 e, F5 e, E5 h',
    'F5 q, A5 q, G5 e, F5 e, E5 q',
    'D5 e, E5 e, F5 e, G5 e, A5 h',
    'G5 e, C6 e, B5 e, A5 e, G5 q, E5 q',
    'D5 q, G5 q, C5 h',
    // bridge: down to A minor, the snow gets deeper
    'A5 q., G5 e, E5 q, C5 q',
    'D5 e, E5 e, F5 e, E5 e, D5 h',
    'G5 q., F5 e, D5 q, B4 q',
    'C5 e, D5 e, E5 e, D5 e, C5 h',
    'A5 e, A5 e, A5 e, B5 e, C6 q, A5 q',
    'G5 e, G5 e, G5 e, A5 e, B5 q, G5 q',
    'F5 e, G5 e, A5 e, B5 e, C6 e, D6 e, E6 q',
    'D6 q, B5 q, C6 h',
  ].join(', ');
  const bars = ['C', 'C', 'Am', 'G', 'F', 'Dm', 'C', 'G', 'Am', 'Dm', 'G', 'C', 'F', 'Em', 'Dm', 'G'];
  return tune(132, [
    v(0, FLUTE, melody, 110),
    v(1, CELESTA, melody, 60, 12),
    v(2, INSTRUMENTS.bass, bass(bars, 'walk'), 105),
    ...chordVoices(bars, 're e re e re e re e', COMP, 62),
    bells(16),
  ]);
}

/** The menu: the theme slowed into a fireside waltz. */
export function menuSong(): Uint8Array {
  const melody = [
    'E5 h, G5 q',
    'C6 h, B5 q',
    'A5 q, G5 q, E5 q',
    'G5 h.',
    'F5 h, A5 q',
    'G5 q, F5 q, E5 q',
    'D5 q, E5 q, F5 q',
    'E5 h.',
    'E5 h, G5 q',
    'C6 h, D6 q',
    'C6 q, B5 q, A5 q',
    'G5 h.',
    'F5 q, A5 q, C6 q',
    'B5 q, A5 q, G5 q',
    'D5 q, F5 q, B5 q',
    'C6 h.',
  ].join(', ');
  const bars = ['C', 'Am', 'F', 'C', 'Dm', 'G', 'G7', 'C', 'C', 'Am', 'F', 'C', 'F', 'C', 'G7', 'C'];
  return tune(108, [
    v(0, INSTRUMENTS.piano, melody, 100),
    v(1, INSTRUMENTS.strings, melody, 50, -12),
    v(2, INSTRUMENTS.bass, bars.map((c) => `${rootOf(c)}2 h.`).join(', '), 95),
    ...chordVoices(bars, 'r q q', CELESTA, 48),
  ]);
}

/** The newspaper storyline: a bouncy rag. */
export function storySong(): Uint8Array {
  const melody = [
    'C5 e, E5 e, G5 e, A5 e, G5 e, E5 e, C5 q',
    'D5 e, F5 e, A5 e, B5 e, A5 e, F5 e, D5 q',
    'E5 e, G5 e, C6 e, E6 e, D6 e, C6 e, A5 e, G5 e',
    'F5 e, A5 e, G5 e, E5 e, D5 h',
    'C5 e, E5 e, G5 e, A5 e, G5 e, E5 e, C5 q',
    'D5 e, F5 e, A5 e, B5 e, A5 e, F5 e, D5 q',
    'E5 e, G5 e, F5 e, A5 e, G5 e, B5 e, D6 e, B5 e',
    'C6 q, G5 q, C5 h',
  ].join(', ');
  const bars = ['C', 'Dm', 'C', 'G7', 'C', 'Dm', 'G7', 'C'];
  return tune(150, [
    v(0, INSTRUMENTS.piano, melody, 110),
    v(1, INSTRUMENTS.bass, bass(bars, 'pump'), 100),
    ...chordVoices(bars, 'r q r q', INSTRUMENTS.piano, 60, 2).map((x) => ({ ...x, channel: x.channel })),
  ]);
}

/** Gale Street, 7 AM: plucked and cheerful, a kid with a plan. */
export function pineSong(): Uint8Array {
  const melody = [
    'G4 e, C5 e, E5 e, G5 e, E5 q, C5 q',
    'A4 e, C5 e, F5 e, A5 e, G5 h',
    'G4 e, B4 e, D5 e, G5 e, F5 q, D5 q',
    'E5 e, D5 e, C5 e, D5 e, E5 h',
    'G4 e, C5 e, E5 e, G5 e, A5 q, G5 q',
    'F5 e, E5 e, D5 e, C5 e, A5 h',
    'G5 e, F5 e, E5 e, D5 e, C5 q, E5 q',
    'D5 q, B4 q, C5 h',
  ].join(', ');
  const counter = ['r h, C6 q, B5 q', 'A5 h, B5 h', 'r h, B5 q, A5 q', 'G5 w', 'r h, C6 q, D6 q', 'C6 h, A5 h', 'G5 h, E5 q, G5 q', 'F5 h, E5 h'].join(', ');
  const bars = ['C', 'F', 'G', 'C', 'C', 'F', 'C', 'G'];
  return tune(120, [
    v(0, INSTRUMENTS.pluck, melody, 115),
    v(1, CELESTA, counter, 55),
    v(2, INSTRUMENTS.bass, bass(bars, 'pump'), 100),
    ...chordVoices(bars, 're e re e re e re e', INSTRUMENTS.pluck, 55),
    bells(8),
  ]);
}

/** Jamie Street sled run: a galop at full tilt. */
export function hillSong(): Uint8Array {
  const melody = [
    'G5 e, G5 e, G5 e, E5 e, C5 q, C5 q',
    'D5 e, E5 e, F5 e, D5 e, G5 h',
    'G5 e, G5 e, G5 e, E5 e, C6 q, C6 q',
    'B5 e, A5 e, G5 e, F5 e, E5 h',
    'A5 e, A5 e, A5 e, F5 e, D5 q, D5 q',
    'G5 e, G5 e, G5 e, E5 e, C5 q, C5 q',
    'F5 e, E5 e, D5 e, E5 e, F5 e, G5 e, A5 e, B5 e',
    'C6 q, G5 q, C6 q, r q',
  ].join(', ');
  const bars = ['C', 'G', 'C', 'G', 'Dm', 'C', 'G7', 'C'];
  return tune(168, [
    v(0, INSTRUMENTS.brass, melody, 105),
    v(1, INSTRUMENTS.lead, melody, 55, -12),
    v(2, INSTRUMENTS.bass, bass(bars, 'pump'), 110),
    ...chordVoices(bars, 're e re e re e re e', COMP, 60),
    bells(8),
  ]);
}

/** Bowden Drive at dusk: strolling, a little jazzy. */
export function mainSong(): Uint8Array {
  const melody = [
    'E5 q, D5 e, C5 e, D5 q, E5 q',
    'G5 q., E5 e, D5 h',
    'C5 q, A4 e, C5 e, D5 q, C5 q',
    'A4 h., r q',
    'F5 q, E5 e, D5 e, E5 q, F5 q',
    'A5 q., G5 e, E5 h',
    'D5 q, E5 e, F5 e, E5 q, D5 q',
    'C5 h., r q',
  ].join(', ');
  const bars = ['Cmaj7', 'Em', 'Am', 'D7', 'F', 'C', 'Dm', 'G7'];
  return tune(112, [
    v(0, INSTRUMENTS.organ, melody, 95),
    v(1, CELESTA, melody, 45, 12),
    v(2, INSTRUMENTS.bass, bass(bars, 'walk'), 100),
    ...chordVoices(bars, 'r q. e q', INSTRUMENTS.piano, 55),
  ]);
}

/** LaVale Mall at night: snow under the lamps, minor and hushed. */
export function mallSong(): Uint8Array {
  const melody = [
    'A4 q, C5 q, E5 q, A5 q',
    'G5 h., E5 q',
    'F5 q, E5 q, D5 q, C5 q',
    'E5 w',
    'A4 q, C5 q, E5 q, A5 q',
    'B5 h., G5 q',
    'A5 q, G5 q, F5 q, D5 q',
    'E5 h, E5 h',
    'F5 q, A5 q, C6 q, A5 q',
    'G5 q, E5 q, C5 h',
    'D5 q, F5 q, A5 q, F5 q',
    'E5 w',
  ].join(', ');
  const bars = ['Am', 'Em', 'F', 'E', 'Am', 'G', 'F', 'E7', 'F', 'C', 'Dm', 'E'];
  return tune(92, [
    v(0, CELESTA, melody, 100),
    v(1, FLUTE, melody, 50, -12),
    v(2, INSTRUMENTS.bass, bass(bars, 'half'), 95),
    ...chordVoices(bars, 'w', INSTRUMENTS.pad, 58),
  ]);
}

/** Game won: the theme as a fanfare. */
export function wonSong(): Uint8Array {
  const melody = [
    'C5 e, E5 e, G5 e, C6 e, E6 q, C6 q',
    'D6 e, C6 e, B5 e, A5 e, G5 h',
    'A5 e, B5 e, C6 e, D6 e, E6 q, F6 q',
    'G6 q, E6 q, C6 h',
    'F5 e, A5 e, C6 e, F6 e, E6 q, C6 q',
    'D6 e, B5 e, G5 e, B5 e, D6 h',
    'E6 e, D6 e, C6 e, B5 e, A5 q, B5 q',
    'C6 h, C6 q, r q',
  ].join(', ');
  const bars = ['C', 'G', 'F', 'C', 'F', 'G', 'Am', 'C'];
  return tune(126, [
    v(0, INSTRUMENTS.brass, melody, 115),
    v(1, INSTRUMENTS.bell, melody, 60),
    v(2, INSTRUMENTS.bass, bass(bars, 'walk'), 105),
    ...chordVoices(bars, 'q q q q', INSTRUMENTS.strings, 60),
    bells(8),
  ]);
}

/** Game lost: snowed in with a cold. */
export function lostSong(): Uint8Array {
  const melody = ['E5 h, D5 q, C5 q', 'B4 h, A4 h', 'C5 q, B4 q, A4 q, G#4 q', 'A4 w'].join(', ');
  const bars = ['Am', 'Dm', 'E7', 'Am'];
  return tune(72, [v(0, INSTRUMENTS.strings, melody, 95), v(1, INSTRUMENTS.bass, bass(bars, 'half'), 90), ...chordVoices(bars, 'w', INSTRUMENTS.pad, 50, 2)]);
}
