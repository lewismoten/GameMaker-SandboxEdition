// The soundtrack: driving FM songs for the Sound Blaster. Each song is a hand-written
// lead over a chord progression, with a pumping bass, a sixteenth-note arpeggio, and drums
// made from noisy FM patches (kick, snare and hi-hat on their own channels).
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';

const CHORDS: Record<string, string[]> = {
  Am: ['A', 'C', 'E'],
  A: ['A', 'C#', 'E'],
  Bb: ['Bb', 'D', 'F'],
  Bm: ['B', 'D', 'F#'],
  B: ['B', 'D#', 'F#'],
  C: ['C', 'E', 'G'],
  Cm: ['C', 'Eb', 'G'],
  D: ['D', 'F#', 'A'],
  Dm: ['D', 'F', 'A'],
  E: ['E', 'G#', 'B'],
  Em: ['E', 'G', 'B'],
  Eb: ['Eb', 'G', 'Bb'],
  F: ['F', 'A', 'C'],
  Fm: ['F', 'Ab', 'C'],
  'F#m': ['F#', 'A', 'C#'],
  'F#': ['F#', 'A#', 'C#'],
  G: ['G', 'B', 'D'],
  Gm: ['G', 'Bb', 'D'],
  Ab: ['Ab', 'C', 'Eb'],
};
const NOTE_ORDER = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const pitch = (n: string) => NOTE_ORDER.indexOf({ Db: 'C#', 'D#': 'Eb', Gb: 'F#', 'G#': 'Ab', 'A#': 'Bb' }[n] ?? n);

/** Chord tones climbing from `octave`: tone k of the chord (k may run past 2 into the next octave). */
function tone(chord: string, k: number, octave: number): string {
  const c = CHORDS[chord];
  if (!c) throw new Error(`No chord ${chord}`);
  const root = pitch(c[0]);
  const n = c[k % 3];
  const up = Math.floor(k / 3) + (pitch(n) < root ? 1 : 0);
  return `${n}${octave + up}`;
}

const join = (...parts: string[]) => parts.filter(Boolean).join(', ');
const times = (n: number, s: string) => Array(n).fill(s).join(', ');

/** Sixteenth-note arpeggio, one chord per bar, following `shape` (chord-tone indexes). */
function arp(chords: string[], octave = 4, shape = [0, 1, 2, 3, 2, 1, 0, 1], len = 's'): string {
  const per = len === 's' ? 16 : 8;
  return chords.map((ch) => Array.from({ length: per }, (_, i) => `${tone(ch, shape[i % shape.length], octave)} ${len}`).join(', ')).join(', ');
}

/** Bass: 'pump' (eighths, root and octave), 'drive' (straight root eighths), 'half', 'gallop'. */
function bass(chords: string[], style: 'pump' | 'drive' | 'half' | 'gallop' | 'walk' = 'pump', octave = 2): string {
  return chords
    .map((ch) => {
      const r = CHORDS[ch][0];
      const f = tone(ch, 2, octave);
      if (style === 'pump') return times(4, `${r}${octave} e, ${r}${octave + 1} e`);
      if (style === 'drive') return times(8, `${r}${octave} e`);
      if (style === 'half') return `${r}${octave} h, ${f} h`;
      if (style === 'walk') return `${r}${octave} q, ${tone(ch, 1, octave)} q, ${f} q, ${r}${octave + 1} q`;
      return times(2, `${r}${octave} e, ${r}${octave} s, ${r}${octave} s, ${f} e, ${r}${octave + 1} e`);
    })
    .join(', ');
}

/** Drum lines for `bars` bars: [kick, snare, hat]. */
function drums(bars: number, style: 'rock' | 'four' | 'half' | 'none' = 'rock'): [string, string, string] {
  if (style === 'none') return [times(bars, 'r w'), times(bars, 'r w'), times(bars, 'r w')];
  const kick = style === 'four' ? 'C2 q, C2 q, C2 q, C2 q' : style === 'half' ? 'C2 h, r h' : 'C2 q, r e, C2 e, C2 q, r q';
  const snare = style === 'half' ? 'r h, D4 h' : 'r q, D4 q, r q, D4 q';
  const hat = style === 'half' ? 'C6 q, C6 q, C6 q, C6 q' : times(8, 'C6 e');
  return [times(bars, kick), times(bars, snare), times(bars, hat)];
}

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 1 / 3 };
const beatsOf = (notes: string) =>
  notes
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .reduce((n, t) => n + LEN[t.endsWith('.') ? t.slice(-2, -1) : t.slice(-1)] * (t.endsWith('.') ? 1.5 : 1), 0);

function tune(bpm: number, voices: Voice[]): Uint8Array {
  const beats = voices.map((x) => beatsOf(x.notes));
  if (beats.some((b) => Math.abs(b - beats[0]) > 1e-6)) throw new Error(`Voices differ in length: ${beats.join(' ')}`);
  return song(bpm, voices);
}

const v = (channel: number, instrument: Uint8Array, notes: string, velocity = 100): Voice => ({ channel, instrument, notes, velocity });

// Instruments
const KICK = sbi({ modChar: 0x00, carChar: 0x00, modLevel: 0x0b, carLevel: 0x00, modAD: 0xf8, carAD: 0xf7, modSR: 0x77, carSR: 0x7a, feedback: 0x08 });
const SNARE = sbi({ modChar: 0x0f, carChar: 0x01, modLevel: 0x00, carLevel: 0x00, modAD: 0xf8, carAD: 0xf8, modSR: 0x07, carSR: 0x07, feedback: 0x0e });
const HAT = sbi({ modChar: 0x0f, carChar: 0x0f, modLevel: 0x04, carLevel: 0x04, modAD: 0xfb, carAD: 0xfb, modSR: 0x0a, carSR: 0x0a, feedback: 0x0e });
const SAW = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x14, carLevel: 0x00, modAD: 0xf2, carAD: 0xf2, modSR: 0x24, carSR: 0x26, feedback: 0x0e });
const SYNBASS = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x16, carLevel: 0x00, modAD: 0xf5, carAD: 0xf4, modSR: 0x47, carSR: 0x48, feedback: 0x0c });
const CHIP = sbi({
  modChar: 0x22,
  carChar: 0x21,
  modLevel: 0x24,
  carLevel: 0x04,
  modAD: 0xf8,
  carAD: 0xf6,
  modSR: 0x26,
  carSR: 0x36,
  modWave: 2,
  carWave: 0,
  feedback: 0x06,
});
const { bass: BASS, strings, brass, lead, bell, pad, pluck } = INSTRUMENTS;

interface Plan {
  bpm: number;
  chords: string[];
  melody: string;
  lead?: Uint8Array;
  bassStyle?: Parameters<typeof bass>[1];
  drum?: Parameters<typeof drums>[1];
  arpShape?: number[];
  arpInst?: Uint8Array;
  arpOctave?: number;
  padInst?: Uint8Array;
  counter?: string;
}

/** A song from a plan: lead, arpeggio, bass, drums (and a held pad chord if asked). */
function make(p: Plan): Uint8Array {
  const n = p.chords.length;
  const [k, s, h] = drums(n, p.drum ?? 'rock');
  const voices: Voice[] = [
    v(0, p.lead ?? SAW, p.melody, 110),
    v(1, p.arpInst ?? CHIP, arp(p.chords, p.arpOctave ?? 4, p.arpShape), 62),
    v(2, p.bassStyle === 'half' ? BASS : SYNBASS, bass(p.chords, p.bassStyle ?? 'pump'), 112),
    v(3, KICK, k, 120),
    v(4, SNARE, s, 92),
    v(5, HAT, h, 50),
  ];
  if (p.padInst) voices.push(v(6, p.padInst, p.chords.map((c) => `${tone(c, 0, 4)} w`).join(', '), 55));
  if (p.counter) voices.push(v(7, strings, p.counter, 70));
  return tune(p.bpm, voices);
}

// ------------------------------------------------------------------ the songs

/** The theme: heroic, A minor. */
const THEME = join(
  'A4 e, C5 e, E5 e, A5 e, G5 q, E5 q',
  'F5 q., E5 e, C5 q, A4 q',
  'G4 e, C5 e, E5 e, G5 e, F5 q, E5 q',
  'D5 h, B4 h',
  'A4 e, C5 e, E5 e, A5 e, B5 q, C6 q',
  'A5 q., G5 e, F5 q, A5 q',
  'G5 q, F5 e, E5 e, D5 q, B4 q',
  'E5 h, Ab4 h',
);
const THEME_B = join(
  'C6 q, B5 e, A5 e, G5 q, E5 q',
  'F5 e, G5 e, A5 e, C6 e, A5 h',
  'G5 q, F5 e, E5 e, D5 q, C5 q',
  'B4 e, C5 e, D5 e, E5 e, G5 h',
  'C6 q, B5 e, A5 e, G5 q, E5 q',
  'F5 e, G5 e, A5 e, C6 e, D6 h',
  'B5 q, Ab5 e, B5 e, D6 q, B5 q',
  'A5 w',
);
const THEME_CHORDS = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'];
const B_CHORDS = ['Am', 'F', 'G', 'C', 'Am', 'F', 'E', 'Am'];

export function titleSong(): Uint8Array {
  return make({ bpm: 156, chords: [...THEME_CHORDS, ...B_CHORDS], melody: join(THEME, THEME_B), lead: brass, padInst: pad });
}

export function menuSong(): Uint8Array {
  return make({
    bpm: 120,
    chords: THEME_CHORDS,
    melody: THEME,
    lead: bell,
    drum: 'half',
    bassStyle: 'half',
    arpShape: [0, 2, 1, 3],
    arpInst: pluck,
    padInst: pad,
  });
}

export function storySong(): Uint8Array {
  const chords = ['Dm', 'Bb', 'C', 'Am', 'Dm', 'Bb', 'Gm', 'A'];
  const mel = join('D5 h, F5 q, E5 q', 'D5 h., A4 q', 'C5 h, E5 q, G5 q', 'E5 w', 'D5 h, F5 q, A5 q', 'Bb5 h, A5 q, G5 q', 'F5 q, E5 q, D5 q, Bb4 q', 'C#5 w');
  return make({
    bpm: 88,
    chords,
    melody: mel,
    lead: bell,
    drum: 'none',
    bassStyle: 'half',
    arpShape: [0, 1, 2, 1],
    arpInst: pluck,
    arpOctave: 3,
    padInst: strings,
  });
}

/** Stage 1: the motherboard, E minor, driving. */
export function boardSong(): Uint8Array {
  const chords = ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B', 'Am', 'C', 'G', 'D', 'Em', 'C', 'B', 'Em'];
  const mel = join(
    'E5 e, E5 e, B4 e, E5 e, G5 q, F#5 q',
    'E5 e, D5 e, B4 q, G4 h',
    'C5 e, E5 e, G5 e, C6 e, B5 q, G5 q',
    'A5 q, F#5 q, D5 h',
    'E5 e, E5 e, B4 e, E5 e, G5 q, B5 q',
    'A5 e, G5 e, F#5 e, G5 e, E5 h',
    'C5 q, E5 q, G5 q, C6 q',
    'B5 h, D#5 h',
    'A5 q, C6 e, B5 e, A5 q, E5 q',
    'G5 q, E5 e, G5 e, C6 h',
    'B5 q, G5 e, D5 e, B4 q, D5 q',
    'F#5 h, A5 h',
    'B5 e, A5 e, G5 e, F#5 e, E5 q, B4 q',
    'C5 e, E5 e, G5 e, C6 e, B5 q, A5 q',
    'F#5 q, D#5 q, B4 q, F#5 q',
    'E5 w',
  );
  return make({ bpm: 150, chords, melody: mel, lead: SAW });
}

/** Stage 2: memory, C minor, clicking staccato. */
export function ramSong(): Uint8Array {
  const chords = ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Ab', 'G', 'Fm', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'G', 'Cm'];
  const mel = join(
    'C5 e, r e, Eb5 e, r e, G5 e, Eb5 e, C5 e, G4 e',
    'C5 e, D5 e, Eb5 e, F5 e, G5 q, r q',
    'Ab5 e, r e, G5 e, r e, Eb5 e, C5 e, Ab4 e, C5 e',
    'Bb4 e, D5 e, F5 e, Bb5 e, Ab5 q, F5 q',
    'C5 e, r e, Eb5 e, r e, G5 e, Eb5 e, C5 e, G4 e',
    'C6 e, Bb5 e, G5 e, Eb5 e, G5 q, r q',
    'Ab5 q, G5 e, F5 e, Eb5 q, C5 q',
    'D5 h, B4 h',
    'F5 e, Ab5 e, C6 e, Ab5 e, F5 q, C5 q',
    'Eb5 e, Ab5 e, C6 e, Eb6 e, C6 h',
    'Bb5 q, G5 e, Eb5 e, Bb4 q, Eb5 q',
    'D5 e, F5 e, Bb5 e, D6 e, Bb5 h',
    'C6 q, G5 e, Eb5 e, C5 q, Eb5 q',
    'Ab5 q, Eb5 e, C5 e, Ab4 q, C5 q',
    'B4 e, D5 e, G5 e, B5 e, D6 q, B5 q',
    'C6 w',
  );
  return make({ bpm: 156, chords, melody: mel, lead: lead, arpShape: [0, 2, 4, 2, 1, 3, 5, 3], bassStyle: 'drive' });
}

/** Stage 3: the sound card, G minor funk. */
export function soundSong(): Uint8Array {
  const chords = ['Gm', 'Gm', 'Cm', 'D', 'Gm', 'Gm', 'Eb', 'D', 'Cm', 'Gm', 'Cm', 'D', 'Eb', 'F', 'D', 'Gm'];
  const riff = 'G4 e, r s, G4 s, Bb4 e, C5 e, r e, D5 e, F5 e, D5 e';
  const mel = join(
    riff,
    'G5 q, F5 e, D5 e, F5 q, G5 q',
    'C5 e, r s, C5 s, Eb5 e, F5 e, r e, G5 e, Bb5 e, G5 e',
    'F#5 h, A5 h',
    riff,
    'Bb5 q, A5 e, G5 e, F5 q, D5 q',
    'Eb5 e, G5 e, Bb5 e, Eb6 e, D6 q, Bb5 q',
    'A5 q, F#5 q, D5 h',
    'Eb5 q, G5 q, C6 q, Bb5 q',
    'G5 e, F5 e, D5 e, Bb4 e, G4 h',
    'C5 e, Eb5 e, G5 e, C6 e, Bb5 e, G5 e, Eb5 e, C5 e',
    'D5 q, F#5 q, A5 q, D6 q',
    'Eb6 q, D6 e, C6 e, Bb5 q, G5 q',
    'F5 q, A5 e, C6 e, F6 q, C6 q',
    'D6 q, C6 e, A5 e, F#5 q, D5 q',
    'G5 w',
  );
  return make({ bpm: 138, chords, melody: mel, lead: CHIP, arpInst: pluck, bassStyle: 'gallop', arpShape: [0, 1, 2, 1] });
}

/** Stage 4: the hard disk, B minor, spinning. */
export function diskSong(): Uint8Array {
  const chords = ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'F#', 'F#', 'Em', 'G', 'D', 'A', 'Bm', 'G', 'F#', 'Bm'];
  const spin = (a: string, b: string, c: string, d: string) => `${a} s, ${b} s, ${c} s, ${d} s`;
  const mel = join(
    `${spin('B4', 'D5', 'F#5', 'B5')}, ${spin('A5', 'F#5', 'D5', 'B4')}, F#5 h`,
    'G5 q, B5 q, D6 q, B5 q',
    `${spin('D5', 'F#5', 'A5', 'D6')}, ${spin('C#6', 'A5', 'F#5', 'D5')}, A5 h`,
    'E5 q, A5 q, C#6 q, A5 q',
    `${spin('B4', 'D5', 'F#5', 'B5')}, ${spin('A5', 'F#5', 'D5', 'B4')}, F#5 h`,
    'G5 q., A5 e, B5 q, D6 q',
    'C#6 q, A#5 q, F#5 q, C#5 q',
    'F#5 h, A#5 h',
    'G5 e, B5 e, E6 e, B5 e, G5 q, E5 q',
    'D5 e, G5 e, B5 e, D6 e, B5 h',
    'A5 q, F#5 e, D5 e, F#5 q, A5 q',
    'E5 e, A5 e, C#6 e, E6 e, C#6 h',
    'D6 q, B5 e, F#5 e, D5 q, F#5 q',
    'G5 q, B5 e, D6 e, G6 q, D6 q',
    'C#6 q, A#5 e, F#5 e, C#6 q, E6 q',
    'D6 h, B5 h',
  );
  return make({ bpm: 162, chords, melody: mel, lead: SAW, arpShape: [0, 1, 2, 3, 4, 3, 2, 1] });
}

/** Stage 5: the CPU, D minor, fastest of all. */
export function cpuSong(): Uint8Array {
  const chords = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A', 'Gm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'A', 'Dm'];
  const mel = join(
    'D5 e, A5 e, F5 e, D5 e, A5 e, F5 e, D6 q',
    'C6 e, A5 e, F5 e, A5 e, D5 h',
    'Bb4 e, D5 e, F5 e, Bb5 e, A5 q, F5 q',
    'G5 e, E5 e, C5 e, E5 e, G5 h',
    'D5 e, A5 e, F5 e, D5 e, A5 e, F5 e, D6 q',
    'E6 e, D6 e, C6 e, A5 e, F5 h',
    'D6 q, Bb5 e, F5 e, D5 q, F5 q',
    'E5 h, C#5 h',
    'G5 e, Bb5 e, D6 e, G6 e, F6 q, D6 q',
    'F5 e, Bb5 e, D6 e, F6 e, D6 h',
    'C6 q, A5 e, F5 e, C5 q, F5 q',
    'E5 e, G5 e, C6 e, E6 e, C6 h',
    'D6 e, C6 e, A5 e, F5 e, D5 q, F5 q',
    'Bb5 e, A5 e, G5 e, F5 e, D5 q, Bb4 q',
    'A4 e, C#5 e, E5 e, A5 e, C#6 q, E6 q',
    'D6 w',
  );
  return make({ bpm: 170, chords, melody: mel, lead: brass, arpShape: [0, 2, 1, 3, 2, 4, 3, 5], bassStyle: 'drive' });
}

/** The bosses: menacing, chromatic. */
export function bossSong(): Uint8Array {
  const chords = ['Em', 'F', 'Em', 'F', 'Em', 'F', 'G', 'F#m'];
  const mel = join(
    'E5 q, E5 e, F5 e, E5 q, B4 q',
    'F5 q, F5 e, G5 e, F5 q, C5 q',
    'E5 e, G5 e, B5 e, G5 e, E5 e, B4 e, G4 e, B4 e',
    'F5 e, A5 e, C6 e, A5 e, F5 e, C5 e, A4 e, C5 e',
    'B5 q., A5 e, G5 q, E5 q',
    'C6 q., B5 e, A5 q, F5 q',
    'D6 e, B5 e, G5 e, D5 e, B5 e, G5 e, D5 e, B4 e',
    'C#6 h, F#5 h',
  );
  return make({ bpm: 164, chords, melody: mel, lead: SAW, bassStyle: 'gallop', drum: 'four' });
}

/** GLITCH: the final boss. */
export function glitchSong(): Uint8Array {
  const chords = ['Dm', 'Eb', 'Dm', 'Eb', 'Bb', 'A', 'Dm', 'A'];
  const mel = join(
    'D5 s, D5 s, D6 e, D5 s, D5 s, C6 e, D5 s, D5 s, A5 e, F5 q',
    'Eb5 s, Eb5 s, Eb6 e, Eb5 s, Eb5 s, D6 e, Eb5 s, Eb5 s, Bb5 e, G5 q',
    'D5 e, F5 e, A5 e, D6 e, C#6 e, A5 e, F5 e, D5 e',
    'Eb5 e, G5 e, Bb5 e, Eb6 e, D6 e, Bb5 e, G5 e, Eb5 e',
    'Bb5 q, D6 q, F6 q, D6 q',
    'C#6 q, E6 q, A6 q, E6 q',
    'D6 e, A5 e, F5 e, D5 e, A5 e, F5 e, D5 e, A4 e',
    'C#5 h, E5 h',
  );
  return make({ bpm: 176, chords, melody: mel, lead: CHIP, bassStyle: 'drive', drum: 'four', padInst: strings });
}

export function wonSong(): Uint8Array {
  const chords = ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'];
  const mel = join(
    'C5 e, E5 e, G5 e, C6 e, G5 q, E5 q',
    'F5 e, A5 e, C6 e, F6 e, C6 h',
    'B5 q, G5 e, B5 e, D6 q, B5 q',
    'C6 h., r q',
    'A5 q, C6 e, A5 e, E5 q, A5 q',
    'F5 q, A5 e, C6 e, F6 q, C6 q',
    'D6 q, B5 e, G5 e, D6 q, F6 q',
    'E6 w',
  );
  return make({ bpm: 132, chords, melody: mel, lead: brass, padInst: strings });
}

export function lostSong(): Uint8Array {
  const chords = ['Am', 'F', 'Dm', 'E', 'Am', 'F', 'E', 'Am'];
  const mel = join('E5 h, C5 q, A4 q', 'F5 h, C5 h', 'D5 h, F5 q, A4 q', 'Ab4 w', 'A4 h, C5 q, E5 q', 'F5 h, A5 h', 'Ab5 q, E5 q, B4 q, D5 q', 'A4 w');
  return make({
    bpm: 76,
    chords,
    melody: mel,
    lead: bell,
    drum: 'none',
    bassStyle: 'half',
    arpShape: [0, 1, 2, 1],
    arpInst: pluck,
    arpOctave: 3,
    padInst: pad,
  });
}

export const SONGS: Record<string, () => Uint8Array> = {
  'title.cmf': titleSong,
  'menu.cmf': menuSong,
  'story.cmf': storySong,
  'board.cmf': boardSong,
  'ram.cmf': ramSong,
  'sound.cmf': soundSong,
  'disk.cmf': diskSong,
  'cpu.cmf': cpuSong,
  'boss.cmf': bossSong,
  'glitch.cmf': glitchSong,
  'won.cmf': wonSong,
  'lost.cmf': lostSong,
};
