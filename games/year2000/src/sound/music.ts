// The soundtrack: eleven FM songs for the Sound Blaster, written as note strings. The
// future, as it sounded in 1992: arpeggiators, pumping octave bass, and a lot of bells.
import { INSTRUMENTS, sbi, type Voice } from '../../../kit/music';
import { tune } from '../../../kit/tune';

const CHORDS: Record<string, string[]> = {
  C: ['C4', 'E4', 'G4'],
  Cm: ['C4', 'Eb4', 'G4'],
  Caug: ['C4', 'E4', 'G#4'],
  D: ['A3', 'D4', 'F#4'],
  D7: ['A3', 'C4', 'F#4'],
  Dm: ['A3', 'D4', 'F4'],
  E: ['G#3', 'B3', 'E4'],
  Em: ['B3', 'E4', 'G4'],
  F: ['A3', 'C4', 'F4'],
  G: ['B3', 'D4', 'G4'],
  Gm: ['Bb3', 'D4', 'G4'],
  A: ['A3', 'C#4', 'E4'],
  Am: ['A3', 'C4', 'E4'],
  Bb: ['Bb3', 'D4', 'F4'],
  Bbaug: ['Bb3', 'D4', 'F#4'],
  B: ['B3', 'D#4', 'F#4'],
  Ab: ['Ab3', 'C4', 'Eb4'],
};
const ROOTS: Record<string, string> = { C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', A: 'A', B: 'B', Bb: 'Bb', Ab: 'Ab' };
const rootOf = (ch: string) => ROOTS[ch.startsWith('Bb') ? 'Bb' : ch.startsWith('Ab') ? 'Ab' : ch[0]];

const SYNTH = sbi({
  modChar: 0x21,
  carChar: 0x21,
  modLevel: 0x18,
  carLevel: 0x00,
  modAD: 0xf2,
  carAD: 0xf4,
  modSR: 0x24,
  carSR: 0x36,
  modWave: 1,
  carWave: 0,
  feedback: 0x0c,
});
const VIBES = sbi({ modChar: 0x06, carChar: 0x01, modLevel: 0x1e, carLevel: 0x00, modAD: 0xf4, carAD: 0xf3, modSR: 0x24, carSR: 0x25, feedback: 0x04 });
const TROMBONE = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1c, carLevel: 0x00, modAD: 0x53, carAD: 0x63, modSR: 0x17, carSR: 0x18, feedback: 0x0c });
const ZAPPY = sbi({
  modChar: 0x24,
  carChar: 0x21,
  modLevel: 0x12,
  carLevel: 0x00,
  modAD: 0xf8,
  carAD: 0xf5,
  modSR: 0x15,
  carSR: 0x45,
  modWave: 2,
  feedback: 0x0e,
});

const v = (channel: number, instrument: Uint8Array, notes: string | string[], velocity = 100, transpose = 0): Voice => ({
  channel,
  instrument,
  notes: Array.isArray(notes) ? notes.join(', ') : notes,
  velocity,
  transpose,
});

/** Three comping voices from one chord per bar; `rhythm` is the lengths in a bar ('h h', 'r e e'...). */
function comp(bars: string[], rhythm: string, inst: Uint8Array, vel = 64, first = 4): Voice[] {
  const out: [string[], string[], string[]] = [[], [], []];
  for (const ch of bars) {
    const notes = CHORDS[ch];
    if (!notes) throw new Error(`No chord ${ch}`);
    for (const len of rhythm.split(' ')) {
      if (len.startsWith('r')) for (const x of out) x.push(`r ${len.slice(1) || 'q'}`);
      else notes.forEach((n, i) => out[i].push(`${n} ${len}`));
    }
  }
  return out.map((n, i) => v(first + i, inst, n.join(', '), vel));
}

/** Bass lines: pumping octave eighths, root-fifth quarters, or one note per half. */
function bass(bars: string[], style: 'octaves' | 'pump' | 'half' | 'whole', octave = 2): string {
  const FIFTH: Record<string, string> = { C: 'G', D: 'A', E: 'B', F: 'C', G: 'D', A: 'E', B: 'F#', Bb: 'F', Ab: 'Eb' };
  return bars
    .map((ch) => {
      const r = rootOf(ch);
      const ro = `${r}${octave}`;
      const up = `${r}${octave + 1}`;
      const fo = `${FIFTH[r]}${octave}`;
      if (style === 'octaves') return Array.from({ length: 4 }, () => `${ro} e, ${up} e`).join(', ');
      if (style === 'pump') return `${ro} q, ${fo} q, ${ro} q, ${fo} q`;
      if (style === 'half') return `${ro} h, ${fo} h`;
      return `${ro} w`;
    })
    .join(', ');
}

/** A broken-chord arpeggio in eighths (up and back), one chord per bar. */
function arp(bars: string[], octave = 1): string {
  return bars
    .map((ch) => {
      const n = CHORDS[ch].map((x) => x.replace(/\d/, (d) => String(Number(d) + octave)));
      return [n[0], n[1], n[2], `${n[0].replace(/\d/, (d) => String(Number(d) + 1))}`, n[2], n[1], n[0], n[1]].map((x) => `${x} e`).join(', ');
    })
    .join(', ');
}

// ------------------------------------------------------------------ title
const TITLE_BARS = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Dm', 'Am', 'Bb', 'G', 'F', 'G', 'Am', 'E'];
const TITLE_MELODY = [
  'A4 e, C5 e, E5 e, A5 e, G5 q, E5 q',
  'F5 q., E5 e, C5 q, A4 q',
  'G4 e, C5 e, E5 e, G5 e, A5 q, G5 q',
  'D5 h, r q, B4 q',
  'A5 e, A5 e, G5 e, A5 e, C6 q, A5 q',
  'F5 e, G5 e, A5 e, C6 e, B5 q, A5 q',
  'G5 q, E5 e, G5 e, C6 q, B5 q',
  'B5 h, D6 h',
  'F5 q, A5 q, D6 q, C6 e, A5 e',
  'C6 q., B5 e, A5 h',
  'D5 e, F5 e, Bb5 e, D6 e, C6 q, Bb5 q',
  'B5 q, G5 q, D5 h',
  'A5 e, G5 e, F5 e, E5 e, F5 q, A5 q',
  'B5 e, A5 e, G5 e, F5 e, G5 q, B5 q',
  'C6 q, B5 q, A5 q, E5 q',
  'G#5 h, B5 h',
];

/** "In The Year 2000" — the title theme. */
export function titleSong(): Uint8Array {
  return tune(126, [
    v(0, SYNTH, TITLE_MELODY, 112),
    v(1, VIBES, TITLE_MELODY, 58, 12),
    v(2, INSTRUMENTS.bass, bass(TITLE_BARS, 'octaves'), 108),
    v(3, INSTRUMENTS.pluck, arp(TITLE_BARS), 62),
    ...comp(TITLE_BARS, 'h h', INSTRUMENTS.pad, 52),
  ]);
}

/** The menu: the theme, slower, on bells and strings. */
export function menuSong(): Uint8Array {
  const bars = TITLE_BARS.slice(0, 8);
  return tune(96, [
    v(0, INSTRUMENTS.bell, TITLE_MELODY.slice(0, 8), 96),
    v(2, INSTRUMENTS.bass, bass(bars, 'half'), 96),
    ...comp(bars, 'w', INSTRUMENTS.strings, 56),
  ]);
}

/** The storyline: wonder, with a Lydian sharp four, because the future is bright. */
export function storySong(): Uint8Array {
  const bars = ['F', 'Em', 'Dm', 'C', 'F', 'Em', 'Dm', 'C'];
  const melody = ['A5 h, G5 q, F5 q', 'G5 h., E5 q', 'F5 h, E5 q, D5 q', 'E5 w', 'C6 h, B5 q, A5 q', 'B5 h., G5 q', 'A5 q, G5 q, F5 q, D5 q', 'C5 w'];
  return tune(84, [
    v(0, VIBES, melody, 100),
    v(1, INSTRUMENTS.bell, melody, 50, 12),
    v(2, INSTRUMENTS.bass, bass(bars, 'whole'), 90),
    v(3, INSTRUMENTS.pluck, arp(bars), 50),
    ...comp(bars, 'w', INSTRUMENTS.strings, 50),
  ]);
}

/** Level 1, "Dome Sweet Dome": a sunny suburban bounce. */
export function suburbSong(): Uint8Array {
  const bars = ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'];
  const melody = [
    'E5 e, G5 e, C6 e, G5 e, A5 q, G5 q',
    'E5 e, C5 e, E5 e, A5 e, G5 h',
    'F5 e, A5 e, C6 e, A5 e, G5 q, F5 q',
    'D5 e, E5 e, F5 e, G5 e, B5 h',
    'C6 e, B5 e, C6 e, G5 e, E5 q, G5 q',
    'A5 e, G5 e, A5 e, C6 e, E6 h',
    'D6 e, C6 e, A5 e, F5 e, D5 q, F5 q',
    'G5 q, B5 q, D6 h',
  ];
  return tune(132, [
    v(0, INSTRUMENTS.bell, melody, 104),
    v(1, INSTRUMENTS.piano, melody, 64, -12),
    v(2, INSTRUMENTS.bass, bass(bars, 'pump'), 104),
    ...comp(bars, 're e re e re e re e', INSTRUMENTS.piano, 58),
  ]);
}

/** Level 2, "The Information Superhighway": rush hour at 150 beats a minute. */
export function highwaySong(): Uint8Array {
  const bars = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Gm', 'A'];
  const melody = [
    'D5 q, A4 q, D5 e, F5 e, A5 q',
    'G5 e, F5 e, E5 e, F5 e, D5 h',
    'Bb4 q, D5 q, F5 q, Bb5 q',
    'A5 e, G5 e, E5 e, C5 e, E5 h',
    'D5 e, D5 e, A5 q, D5 e, D5 e, Bb5 q',
    'A5 e, G5 e, F5 e, E5 e, D5 h',
    'G5 q, Bb5 q, D6 q, Bb5 q',
    'A5 h, C#6 h',
  ];
  return tune(150, [
    v(0, INSTRUMENTS.brass, melody, 108),
    v(1, ZAPPY, melody, 60, 12),
    v(2, INSTRUMENTS.bass, bass(bars, 'octaves'), 110),
    v(3, INSTRUMENTS.pluck, arp(bars), 60),
    ...comp(bars, 're e. e. q q', INSTRUMENTS.organ, 46),
  ]);
}

/** Level 2, "The Cloud Lane": Grandpa's CitiCar at full throttle, an arcade racer in 1976½ gear. */
export function cloudSong(): Uint8Array {
  const bars = ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D7', 'C', 'D', 'Bb', 'C', 'G', 'Em', 'C', 'D'];
  const melody = [
    'G5 e, G5 e, D5 e, G5 e, B5 q, A5 q',
    'G5 e, E5 e, B4 e, E5 e, G5 h',
    'E5 e, G5 e, C6 e, B5 e, A5 q, G5 q',
    'F#5 q, A5 q, D6 h',
    'G5 e, G5 e, D5 e, G5 e, B5 q, D6 q',
    'E6 q., D6 e, B5 h',
    'C6 e, B5 e, A5 e, G5 e, E5 q, A5 q',
    'F#5 h, A5 h',
    'G5 q, E5 q, C5 q, E5 q',
    'F#5 q, A5 q, D6 q, A5 q',
    'F5 q, D5 q, Bb4 q, D5 q',
    'E5 e, G5 e, C6 e, E6 e, G6 q, E6 q',
    'D6 e, B5 e, G5 e, B5 e, D6 q, G6 q',
    'E6 e, D6 e, B5 e, G5 e, E5 h',
    'C6 e, D6 e, E6 e, C6 e, G5 q, C6 q',
    'D6 h, F#5 h',
  ];
  return tune(160, [
    v(0, INSTRUMENTS.brass, melody, 106),
    v(1, VIBES, melody, 54, 12),
    v(2, INSTRUMENTS.bass, bass(bars, 'octaves'), 112),
    v(3, ZAPPY, arp(bars), 52),
    ...comp(bars, 're e re e h', INSTRUMENTS.organ, 44),
  ]);
}

/** Level 3, "Mega Mall 2000": the smoothest muzak ever piped through a robot. */
export function mallSong(): Uint8Array {
  const bars = ['F', 'Dm', 'Gm', 'C', 'F', 'Dm', 'Bb', 'C'];
  const melody = [
    'A5 q., G5 e, F5 q, C5 q',
    'D5 q., E5 e, F5 h',
    'Bb5 q., A5 e, G5 q, D5 q',
    'E5 q, G5 q, C6 h',
    'C6 q., A5 e, F5 q, A5 q',
    'D6 q., C6 e, A5 h',
    'Bb5 e, A5 e, G5 e, F5 e, D5 q, F5 q',
    'E5 h, G5 h',
  ];
  return tune(108, [
    v(0, VIBES, melody, 104),
    v(1, INSTRUMENTS.strings, melody, 44, -12),
    v(2, INSTRUMENTS.bass, bass(bars, 'half'), 96),
    ...comp(bars, 'q. e. e. q', INSTRUMENTS.organ, 48),
  ]);
}

/** Level 4, "Wrong Number": whole tones and a busy signal. */
export function exchangeSong(): Uint8Array {
  const bars = ['Caug', 'Bbaug', 'C', 'D7', 'Caug', 'Bbaug', 'C', 'D7'];
  const melody = [
    'C5 e, D5 e, E5 e, F#5 e, G#5 q, r q',
    'A#5 e, G#5 e, F#5 e, E5 e, D5 h',
    'E5 e, E5 e, r e, E5 e, E5 e, r e, G5 q',
    'F#5 q, D5 q, A4 h',
    'G#5 e, F#5 e, E5 e, D5 e, C5 q, E5 q',
    'D5 e, E5 e, F#5 e, G#5 e, A#5 h',
    'G5 e, G5 e, r e, G5 e, G5 e, r e, E5 q',
    'F#5 q, A5 q, D5 h',
  ];
  return tune(104, [
    v(0, INSTRUMENTS.pluck, melody, 110),
    v(1, INSTRUMENTS.bell, melody, 52, 12),
    v(2, INSTRUMENTS.bass, bass(['C', 'Bb', 'C', 'D', 'C', 'Bb', 'C', 'D'], 'pump'), 100),
    ...comp(bars, 'h h', INSTRUMENTS.pad, 50),
  ]);
}

/** Level 5, "One Small Hop": floating over the Sea of Tranquility. */
export function moonSong(): Uint8Array {
  const bars = ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'];
  const melody = ['B5 h, E6 h', 'G5 h., E5 q', 'D5 q, G5 q, B5 h', 'A5 w', 'B5 q, C6 q, B5 q, G5 q', 'E5 h., G5 q', 'A5 q, C6 q, E6 q, C6 q', 'D#6 w'];
  return tune(76, [
    v(0, INSTRUMENTS.bell, melody, 100),
    v(1, VIBES, melody, 46, -12),
    v(2, INSTRUMENTS.bass, bass(bars, 'whole'), 92),
    v(3, INSTRUMENTS.pluck, arp(bars), 46),
    ...comp(bars, 'w', INSTRUMENTS.pad, 56),
  ]);
}

/** Level 6, "Science Fair Showdown": catch that dog! */
export function fairSong(): Uint8Array {
  const bars = ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'E', 'E'];
  const melody = [
    'A5 e, A5 e, E5 e, A5 e, C6 e, B5 e, A5 e, E5 e',
    'A5 e, B5 e, C6 e, D6 e, E6 q, C6 q',
    'F5 e, A5 e, C6 e, A5 e, F5 e, A5 e, C6 e, F6 e',
    'D6 e, B5 e, G5 e, B5 e, D6 q, G5 q',
    'A5 e, A5 e, E5 e, A5 e, C6 e, B5 e, A5 e, E5 e',
    'C6 e, B5 e, A5 e, G5 e, A5 q, E5 q',
    'G#5 e, B5 e, E6 e, B5 e, G#5 e, B5 e, E6 e, G#6 e',
    'B5 h, E5 h',
  ];
  return tune(160, [
    v(0, SYNTH, melody, 110),
    v(1, ZAPPY, melody, 56, -12),
    v(2, INSTRUMENTS.bass, bass(bars, 'octaves'), 112),
    ...comp(bars, 're e re e re e re e', INSTRUMENTS.brass, 44),
  ]);
}

/** Game won: first prize! (Well, second.) */
export function wonSong(): Uint8Array {
  const bars = ['C', 'G', 'G', 'C', 'C', 'F', 'G', 'C'];
  const melody = [
    'C5 e, E5 e, G5 e, C6 e, G5 e, C6 e, E6 q',
    'D6 q., C6 e, D6 q, E6 q',
    'F6 q, E6 q, D6 q, B5 q',
    'C6 w',
    'E6 e, D6 e, C6 e, G5 e, A5 q, C6 q',
    'F6 q, E6 q, C6 h',
    'B5 e, C6 e, D6 e, E6 e, F6 q, D6 q',
    'C6 w',
  ];
  return tune(120, [
    v(0, INSTRUMENTS.brass, melody, 112),
    v(1, INSTRUMENTS.bell, melody, 60, 12),
    v(2, INSTRUMENTS.bass, bass(bars, 'pump'), 104),
    ...comp(bars, 'q q q q', INSTRUMENTS.brass, 52),
  ]);
}

/** Game lost: wah, wah, wah, waaah. */
export function lostSong(): Uint8Array {
  return tune(66, [
    v(0, TROMBONE, 'G4 h, F#4 h, F4 h, E4 w, r h', 110),
    v(2, INSTRUMENTS.bass, 'C3 h, B2 h, Bb2 h, A2 w, r h', 90),
    v(3, INSTRUMENTS.strings, 'r h, r h, r h, C4 w, r h', 50),
  ]);
}
