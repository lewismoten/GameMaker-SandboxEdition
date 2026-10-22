// The soundtrack: short FM songs for the Sound Blaster. "Keep It Brief", the library's theme,
// is a tune of exactly one hundred notes... give or take. The reading room has it on a music
// box; every wing plays it its own way (a calliope for Clown Alley, a mad organ for the
// Laboratory, a shanty for the Docks...), and the title, story and ending dress it up.
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';

const CHORDS: Record<string, string[]> = {
  F: ['F4', 'A4', 'C5'],
  Bb: ['D4', 'F4', 'Bb4'],
  C: ['E4', 'G4', 'C5'],
  C7: ['E4', 'G4', 'Bb4'],
  Dm: ['D4', 'F4', 'A4'],
  Gm: ['D4', 'G4', 'Bb4'],
  Am: ['E4', 'A4', 'C5'],
  A7: ['E4', 'G4', 'C#5'],
  D7: ['D4', 'F#4', 'C5'],
  G7: ['D4', 'F4', 'B4'],
};
const ROOT: Record<string, string> = { F: 'F', Bb: 'Bb', C: 'C', C7: 'C', Dm: 'D', Gm: 'G', Am: 'A', A7: 'A', D7: 'D', G7: 'G' };
const FIFTH: Record<string, string> = { F: 'C', Bb: 'F', C: 'G', D: 'A', G: 'D', A: 'E' };

function comp(bars: string[], rhythm: string, octave = 0): [string, string, string] {
  const out: [string[], string[], string[]] = [[], [], []];
  for (const ch of bars)
    for (const len of rhythm.split(' ')) {
      if (len.startsWith('r')) for (const v of out) v.push(`r ${len.slice(1) || 'q'}`);
      else CHORDS[ch].forEach((n, i) => out[i].push(`${n.slice(0, -1)}${Number(n.slice(-1)) + octave} ${len}`));
    }
  return out.map((v) => v.join(', ')) as [string, string, string];
}

function bass(bars: string[], style: 'oompah' | 'walk' | 'whole' | 'half'): string {
  return bars
    .map((ch) => {
      const r = ROOT[ch];
      const f = FIFTH[r];
      if (style === 'whole') return `${r}2 w`;
      if (style === 'half') return `${r}2 h, ${f}2 h`;
      if (style === 'walk') return `${r}2 q, ${f}2 q, ${r}3 q, ${f}2 q`;
      return `${r}2 q, r q, ${f}2 q, r q`;
    })
    .join(', ');
}

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
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

const v = (channel: number, instrument: Uint8Array, notes: string, velocity = 100, transpose = 0): Voice => ({ channel, instrument, notes, velocity, transpose });
const times = (n: number, s: string) => Array(n).fill(s).join(', ');

const CALLIOPE = sbi({ modChar: 0x24, carChar: 0x21, modLevel: 0x1e, carLevel: 0x00, modAD: 0xf4, carAD: 0xf4, modSR: 0x24, carSR: 0x24, modWave: 0, feedback: 0x0e });
const TICK = sbi({ modChar: 0x0f, carChar: 0x01, modLevel: 0x00, carLevel: 0x00, modAD: 0xf8, carAD: 0xf9, modSR: 0x07, carSR: 0x08, feedback: 0x0e });
const VIBES = sbi({ modChar: 0x04, carChar: 0x01, modLevel: 0x1c, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x34, carSR: 0x25, feedback: 0x06 });
const ACCORDION = sbi({ modChar: 0x22, carChar: 0x21, modLevel: 0x14, carLevel: 0x00, modAD: 0x83, carAD: 0x72, modSR: 0x17, carSR: 0x17, feedback: 0x0c });
const SYNTH = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x16, carLevel: 0x00, modAD: 0xb1, carAD: 0xa1, modSR: 0x2e, carSR: 0x2e, modWave: 2, feedback: 0x0e });
const { piano, bass: BASS, strings, brass, bell, organ, pad, pluck, lead } = INSTRUMENTS;

// Keep It Brief: the theme (8 bars) and its answer (8 bars), in F.
const THEME =
  'C5 e, F5 e, A5 q, G5 e, F5 e, E5 q, F5 e, G5 e, A5 e, Bb5 e, C6 h, Bb5 e, A5 e, G5 q, E5 e, F5 e, G5 q, A5 e, G5 e, F5 q, F5 h, ' +
  'C5 e, F5 e, A5 q, G5 e, F5 e, E5 q, D5 e, E5 e, F5 e, G5 e, A5 h, Bb5 q, G5 q, C6 q, E5 q, F5 h., r q';
const THEME_CH = ['F', 'C7', 'F', 'Bb', 'C7', 'F', 'Gm', 'F'];
const ANSWER =
  'D5 q, F5 e, A5 e, D6 q, C6 q, Bb5 e, A5 e, G5 e, F5 e, G5 h, C5 q, E5 e, G5 e, C6 q, Bb5 q, A5 e, G5 e, F5 e, E5 e, F5 h, ' +
  'D5 q, F5 e, A5 e, D6 q, C6 q, Bb5 q, D5 q, G5 q, Bb5 q, A5 q, F5 q, C5 q, E5 q, F5 h., r q';
const ANSWER_CH = ['Dm', 'Gm', 'C7', 'F', 'Dm', 'Gm', 'C7', 'F'];
const BOTH_CH = [...THEME_CH, ...ANSWER_CH];
const BOTH = `${THEME}, ${ANSWER}`;

/** Title: the theme, brassy, with a tick-tock like a tally counter. */
export function titleSong(): Uint8Array {
  const [a, b, c] = comp(BOTH_CH, 're e re e re e re e', -1);
  return tune(132, [v(0, brass, BOTH, 105), v(1, piano, a, 60), v(2, piano, b, 60), v(3, piano, c, 60), v(4, BASS, bass(BOTH_CH, 'oompah'), 110), v(5, TICK, times(16, 'C4 q, r q, C4 q, r q'), 50)]);
}

/** Menu and the reading room: the theme on a music box, softly (it is a library). */
export function menuSong(): Uint8Array {
  const [a, b, c] = comp(THEME_CH, 'h h', -1);
  return tune(104, [v(0, bell, THEME, 95), v(1, pad, a, 45), v(2, pad, b, 45), v(3, pad, c, 45), v(4, BASS, bass(THEME_CH, 'half'), 85)]);
}

/** The storyline: slow strings under a vibraphone. */
export function storySong(): Uint8Array {
  const [a, b, c] = comp(BOTH_CH, 'w', -1);
  return tune(84, [v(0, VIBES, BOTH, 100), v(1, strings, a, 55), v(2, strings, b, 55), v(3, strings, c, 55), v(4, BASS, bass(BOTH_CH, 'whole'), 85)]);
}

/** The reading room: the music box, with a walking bass on tiptoe. */
export function librarySong(): Uint8Array {
  const [a, b, c] = comp(BOTH_CH, 'r q. e q', -1);
  return tune(100, [v(0, bell, BOTH, 90), v(1, pad, a, 40), v(2, pad, b, 40), v(3, pad, c, 40), v(4, BASS, bass(BOTH_CH, 'walk'), 80)]);
}

/** Each wing's version of the theme. */
export function wingSong(id: string): Uint8Array {
  switch (id) {
    case 'clown': {
      const [a, b, c] = comp(BOTH_CH, 'r q q q', -1);
      return tune(150, [v(0, CALLIOPE, BOTH, 105), v(1, organ, a, 55), v(2, organ, b, 55), v(3, organ, c, 55), v(4, BASS, bass(BOTH_CH, 'oompah'), 115), v(5, TICK, times(16, 'C4 q, r q, C4 q, r q'), 45)]);
    }
    case 'lab': {
      const [a, b, c] = comp(BOTH_CH, 'h h', -1);
      return tune(92, [v(0, organ, BOTH, 100, -12), v(1, pad, a, 55, -12), v(2, pad, b, 55, -12), v(3, pad, c, 55, -12), v(4, BASS, bass(BOTH_CH, 'whole'), 95)]);
    }
    case 'docks': {
      const [a, b, c] = comp(BOTH_CH, 'q. e h', -1);
      return tune(120, [v(0, ACCORDION, BOTH, 105, -3), v(1, ACCORDION, a, 50, -3), v(2, ACCORDION, b, 50, -3), v(3, ACCORDION, c, 50, -3), v(4, BASS, bass(BOTH_CH, 'oompah'), 105, -3)]);
    }
    case 'yard': {
      const [a, b, c] = comp(BOTH_CH, 're e re e re e re e', -1);
      return tune(126, [v(0, pluck, BOTH, 105, 2), v(1, pluck, a, 55, 2), v(2, pluck, b, 55, 2), v(3, pluck, c, 55, 2), v(4, BASS, bass(BOTH_CH, 'half'), 100, 2)]);
    }
    case 'living': {
      const [a, b, c] = comp(BOTH_CH, 'r q. e q', -1);
      return tune(112, [v(0, VIBES, BOTH, 100), v(1, organ, a, 45), v(2, organ, b, 45), v(3, organ, c, 45), v(4, BASS, bass(BOTH_CH, 'walk'), 100), v(5, TICK, times(16, 'r q, C4 q, r q, C4 q'), 40)]);
    }
    case 'after': {
      const [a, b, c] = comp(BOTH_CH, 'w', -1);
      return tune(72, [v(0, piano, BOTH, 95, -5), v(1, strings, a, 45, -5), v(2, strings, b, 45, -5), v(3, strings, c, 45, -5), v(4, BASS, bass(BOTH_CH, 'whole'), 80, -5)]);
    }
    case 'other': {
      const [a, b, c] = comp(BOTH_CH, 'h h', -1);
      return tune(96, [v(0, lead, BOTH, 95, 7), v(1, pad, a, 50, 7), v(2, pad, b, 50, 7), v(3, pad, c, 50, 7), v(4, BASS, bass(BOTH_CH, 'half'), 90, 7)]);
    }
    default: {
      const [a, b, c] = comp(BOTH_CH, 're e re e re e re e', -1);
      return tune(138, [v(0, SYNTH, BOTH, 105), v(1, SYNTH, a, 45), v(2, SYNTH, b, 45), v(3, SYNTH, c, 45), v(4, BASS, bass(BOTH_CH, 'oompah'), 110), v(5, TICK, times(16, 'C4 q, C4 q, C4 q, C4 q'), 45)]);
    }
  }
}

/** The ending: a fanfare, then the theme in full. */
export function wonSong(): Uint8Array {
  const fan = 'C5 e, C5 e, C5 e, F5 e, A5 q, C6 q, Bb5 e, Bb5 e, Bb5 e, D6 e, C6 h';
  const ch = ['F', 'Bb', ...BOTH_CH, 'F'];
  const [a, b, c] = comp(ch, 'q q q q', -1);
  return tune(126, [v(0, brass, `${fan}, ${BOTH}, F6 w`, 105), v(1, strings, a, 60), v(2, strings, b, 60), v(3, strings, c, 60), v(4, BASS, bass(ch, 'oompah'), 110)]);
}

/** Lost: never heard, as nothing in the library can hurt Joe. Here anyway, being thorough. */
export function lostSong(): Uint8Array {
  const mel = 'A5 h, F5 q, D5 q, E5 h., r q, C#5 w, D5 w';
  const ch = ['Dm', 'Gm', 'A7', 'Dm'];
  const [a, b, c] = comp(ch, 'w', -1);
  return tune(72, [v(0, VIBES, mel, 100), v(1, pad, a, 50), v(2, pad, b, 50), v(3, pad, c, 50), v(4, BASS, bass(ch, 'whole'), 85)]);
}
