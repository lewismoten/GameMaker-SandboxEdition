// The soundtrack: FM songs for the Sound Blaster in the style of a 1996 3D demo: shimmering
// arpeggios, warm pads, a pulsing bass and a lead on top. Songs are chords (one a bar) plus a
// melody written bar by bar; the arpeggio, bass and pad are worked out from the chords.
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const nm = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const ROOTS: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

/** Chord tones (MIDI) of e.g. "Am", "Fmaj7", "G7", "Dsus4", "Cadd9", around octave 4. */
function chord(name: string): number[] {
  const m = /^([A-G](?:#|b)?)(.*)$/.exec(name);
  if (!m) throw new Error(`Bad chord ${name}`);
  const r = 60 + ROOTS[m[1]];
  const q = m[2];
  const third = q.startsWith('m') && !q.startsWith('maj') ? 3 : q.startsWith('sus4') ? 5 : q.startsWith('sus2') ? 2 : 4;
  const tones = [r, r + third, r + 7];
  if (q.includes('maj7')) tones.push(r + 11);
  else if (q.includes('7')) tones.push(r + 10);
  if (q.includes('add9')) tones.push(r + 14);
  return tones;
}

const LEN: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
const beats = (bar: string) =>
  bar
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .reduce((n, t) => {
      const dotted = t.endsWith('.');
      const k = dotted ? t.slice(-2, -1) : t.slice(-1);
      return n + LEN[k] * (dotted ? 1.5 : 1);
    }, 0);

/** Bars of melody, checked: every bar is four beats. */
function melody(bars: string[]): string {
  bars.forEach((b, i) => {
    if (Math.abs(beats(b) - 4) > 1e-6) throw new Error(`Melody bar ${i + 1} has ${beats(b)} beats: ${b}`);
  });
  return bars.join(', ');
}

/** Sixteenth-note arpeggio up and down the chord, `oct` octaves up. */
function arp(chords: string[], oct = 1, shape: 'up' | 'updown' | 'eighths' = 'updown'): string {
  return chords
    .map((c) => {
      const t = chord(c).map((n) => n + 12 * oct);
      const seq = shape === 'up' ? [...t, t[0] + 12] : [...t, t[0] + 12, ...[...t].reverse().slice(1, -1)];
      const n = shape === 'eighths' ? 8 : 16;
      const len = shape === 'eighths' ? 'e' : 's';
      return Array.from({ length: n }, (_, i) => `${nm(seq[i % seq.length])} ${len}`).join(', ');
    })
    .join(', ');
}

/** Bass: root eighths with an octave hop ('pulse'), roots on the beat ('beat') or a held root ('hold'). */
function bass(chords: string[], style: 'pulse' | 'beat' | 'hold' = 'pulse'): string {
  return chords
    .map((c) => {
      const r = chord(c)[0] - 24;
      if (style === 'hold') return `${nm(r)} w`;
      if (style === 'beat') return `${nm(r)} q, ${nm(r + 7)} q, ${nm(r)} q, ${nm(r + 12)} q`;
      return [r, r, r + 12, r, r, r + 12, r + 7, r + 12].map((n) => `${nm(n)} e`).join(', ');
    })
    .join(', ');
}

/** A held chord a bar, one voice a chord tone (three voices). */
function pad(chords: string[], oct = 0, rhythm = 'w'): [string, string, string] {
  const out: [string[], string[], string[]] = [[], [], []];
  for (const c of chords) {
    const t = chord(c).map((n) => n + 12 * oct);
    for (let v = 0; v < 3; v++)
      for (const len of rhythm.split(' ')) out[v].push(len.startsWith('r') ? `r ${len.slice(1)}` : `${nm(t[v])} ${len}`);
  }
  return out.map((v) => v.join(', ')) as [string, string, string];
}

const SYNTH = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1a, carLevel: 0x00, modAD: 0xf2, carAD: 0xf3, modSR: 0x24, carSR: 0x26, modWave: 1, feedback: 0x0c });
const GLASS = sbi({ modChar: 0x05, carChar: 0x01, modLevel: 0x1c, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x34, carSR: 0x25, feedback: 0x06 });
const DRUM = sbi({ modChar: 0x00, carChar: 0x00, modLevel: 0x0b, carLevel: 0x00, modAD: 0xf8, carAD: 0xf6, modSR: 0x88, carSR: 0x88, feedback: 0x0e });
const HAT = sbi({ modChar: 0x0f, carChar: 0x0e, modLevel: 0x00, carLevel: 0x08, modAD: 0xf9, carAD: 0xf8, modSR: 0xf9, carSR: 0xf8, feedback: 0x0e });

const v = (channel: number, instrument: Uint8Array, notes: string, velocity = 100, transpose = 0): Voice => ({ channel, instrument, notes, velocity, transpose });

/** A kick on 1 and 3, a snare-ish hit on 2 and 4 (an FM thump and a noisy tick). */
const kick = (bars: number) => Array.from({ length: bars }, () => 'C2 q, r q, C2 e, C2 e, r q').join(', ');
const hats = (bars: number) => Array.from({ length: bars }, () => 'r e, C7 e, r e, C7 e, r e, C7 e, r e, C7 e').join(', ');

interface Spec {
  bpm: number;
  chords: string[];
  tune: string[];
  lead?: Uint8Array;
  arp?: 'up' | 'updown' | 'eighths' | 'none';
  bass?: 'pulse' | 'beat' | 'hold';
  drums?: boolean;
  padOct?: number;
}

function build(s: Spec): Uint8Array {
  if (s.tune.length !== s.chords.length) throw new Error(`Melody has ${s.tune.length} bars, chords ${s.chords.length}`);
  const voices: Voice[] = [v(0, s.lead ?? INSTRUMENTS.lead, melody(s.tune), 112)];
  if (s.arp !== 'none') voices.push(v(1, GLASS, arp(s.chords, 1, s.arp ?? 'updown'), 62));
  voices.push(v(2, INSTRUMENTS.bass, bass(s.chords, s.bass ?? 'pulse'), 108));
  pad(s.chords, s.padOct ?? 0).forEach((n, i) => voices.push(v(3 + i, INSTRUMENTS.pad, n, 58)));
  if (s.drums) {
    voices.push(v(6, DRUM, kick(s.chords.length), 100));
    voices.push(v(7, HAT, hats(s.chords.length), 50));
  }
  voices.push(v(8, SYNTH, melody(s.tune), 46, -12));
  return song(s.bpm, voices);
}

/** "Depth Perception": the title theme, A minor rising to C. */
function titleSong(): Uint8Array {
  return build({
    bpm: 118,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'E', 'F', 'G', 'Em', 'Am', 'F', 'G', 'Csus4', 'C'],
    tune: [
      'A4 q, C5 q, E5 q., D5 e',
      'C5 h, A4 q, F4 q',
      'G4 q, C5 q, E5 q, G5 q',
      'F5 q., E5 e, D5 h',
      'E5 q, A5 q, G5 q., E5 e',
      'F5 h, C5 q, A4 q',
      'G4 e, A4 e, C5 e, E5 e, G5 q, E5 q',
      'G#4 w',
      'A4 q, C5 q, F5 q, A5 q',
      'G5 q., F5 e, D5 q, B4 q',
      'E5 q, G5 q, B5 q, G5 q',
      'A5 h, E5 h',
      'F5 q, A5 q, C6 q., A5 e',
      'B5 q, G5 q, D5 q, B4 q',
      'C5 e, F5 e, G5 e, C6 e, F5 h',
      'E5 w',
    ],
    drums: true,
  });
}

/** The menu: the theme as a slow, glassy pad. */
function menuSong(): Uint8Array {
  return build({
    bpm: 84,
    chords: ['Amadd9', 'Fmaj7', 'Cadd9', 'G', 'Amadd9', 'Fmaj7', 'Dm7', 'E7'],
    tune: ['E5 h., C5 q', 'A4 w', 'G4 q, C5 q, E5 h', 'D5 w', 'E5 h., A5 q', 'G5 h, F5 q, E5 q', 'D5 q, F5 q, A5 q, C6 q', 'B5 w'],
    lead: GLASS,
    arp: 'up',
    bass: 'hold',
  });
}

/** The story: a mystery in the render farm at midnight. */
function storySong(): Uint8Array {
  return build({
    bpm: 92,
    chords: ['Dm', 'Bb', 'Gm', 'A7', 'Dm', 'Bb', 'Gm', 'A'],
    tune: ['D5 q., E5 e, F5 h', 'D5 h, Bb4 h', 'G4 q, Bb4 q, D5 q, G5 q', 'E5 w', 'F5 q., G5 e, A5 h', 'Bb5 h, F5 h', 'G5 q, F5 q, E5 q, D5 q', 'C#5 w'],
    arp: 'eighths',
    bass: 'beat',
  });
}

/** The Checkerboard: bright and bouncy, C major. */
function checkerSong(): Uint8Array {
  return build({
    bpm: 132,
    chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Em', 'F', 'C', 'Dm', 'G', 'C', 'G'],
    tune: [
      'E5 e, G5 e, C6 q, G5 q, E5 q',
      'D5 e, G5 e, B5 q, G5 q, D5 q',
      'C5 e, E5 e, A5 q, E5 q, C5 q',
      'F5 q, A5 q, C6 h',
      'G5 e, E5 e, C5 q, E5 e, G5 e, C6 q',
      'B5 q, A5 q, G5 h',
      'A5 e, G5 e, F5 q, A5 e, G5 e, F5 q',
      'D5 q, E5 q, F5 q, G5 q',
      'A5 q, C6 q, E6 q, C6 q',
      'B5 q, G5 q, E5 q, G5 q',
      'A5 q, F5 q, C5 q, F5 q',
      'E5 q, G5 q, C6 h',
      'F5 e, E5 e, D5 q, F5 e, A5 e, D6 q',
      'B5 e, A5 e, G5 q, B5 e, C6 e, D6 q',
      'E6 q, C6 q, G5 q, E5 q',
      'D5 h, G4 h',
    ],
    drums: true,
  });
}

/** The Glass Garden: dreamy, E major with a lift. */
function glassSong(): Uint8Array {
  return build({
    bpm: 100,
    chords: ['Emaj7', 'C#m7', 'Amaj7', 'B', 'Emaj7', 'G#m', 'Amaj7', 'Bsus4'],
    tune: ['G#5 q, B5 q, D#6 h', 'C#6 q, B5 q, G#5 h', 'A5 q, C#6 q, E6 q, C#6 q', 'B5 w', 'E6 q., D#6 e, B5 h', 'B5 q, G#5 q, D#5 h', 'E5 q, A5 q, C#6 q, E6 q', 'F#5 w'],
    lead: GLASS,
    arp: 'up',
    bass: 'beat',
  });
}

/** The Hall of Mirrors: an eerie waltz-time feel in D minor (in fours, lopsided). */
function mirrorSong(): Uint8Array {
  return build({
    bpm: 108,
    chords: ['Dm', 'Dm', 'Gm', 'A7', 'Bb', 'Gm', 'Em', 'A7'],
    tune: ['D5 q, F5 q, A5 q, D6 q', 'C#6 q, A5 q, F5 q, E5 q', 'D5 q, G5 q, Bb5 q, D6 q', 'C#6 h, A5 h', 'Bb5 q, D6 q, F6 q, D6 q', 'Bb5 q, G5 q, D5 q, Bb4 q', 'G5 q, E5 q, B4 q, G4 q', 'A4 w'],
    arp: 'updown',
    bass: 'beat',
  });
}

/** Fractal Peaks: wide open, F major, a little heroic. */
function peaksSong(): Uint8Array {
  return build({
    bpm: 120,
    chords: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'Dm', 'Am', 'Bb', 'F', 'Gm', 'C', 'F', 'C'],
    tune: [
      'C5 q, F5 q, A5 h',
      'G5 q, E5 q, C5 h',
      'D5 q, F5 q, A5 q, D6 q',
      'C6 h, Bb5 h',
      'A5 q., G5 e, F5 q, A5 q',
      'G5 h, E5 h',
      'F5 q, D5 q, Bb4 q, D5 q',
      'C5 w',
      'D5 q, F5 q, A5 q, F5 q',
      'E5 q, A5 q, C6 q, A5 q',
      'Bb5 q, D6 q, F6 q, D6 q',
      'C6 h, A5 h',
      'Bb5 q, G5 q, D5 q, G5 q',
      'C6 q, Bb5 q, G5 q, E5 q',
      'F5 h, A5 h',
      'G5 w',
    ],
    drums: true,
  });
}

/** Teapot Temple: jaunty, G major, a tea-time march. */
function teapotSong(): Uint8Array {
  return build({
    bpm: 126,
    chords: ['G', 'D7', 'G', 'C', 'G', 'Em', 'A7', 'D7'],
    tune: ['B4 e, D5 e, G5 q, B5 q, G5 q', 'A5 e, F#5 e, D5 q, C5 q, A4 q', 'B4 e, D5 e, G5 q, B5 e, A5 e, G5 q', 'E5 q, G5 q, C6 h', 'D6 q, B5 q, G5 q, D5 q', 'E5 q, G5 q, B5 q, G5 q', 'C#5 q, E5 q, A5 q, G5 q', 'F#5 q, A5 q, D6 h'],
    arp: 'eighths',
    bass: 'beat',
    lead: INSTRUMENTS.brass,
  });
}

/** The Vanishing Point: driving, E minor; Count Polygon is near. */
function vanishSong(): Uint8Array {
  return build({
    bpm: 144,
    chords: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'Am', 'B7', 'C', 'D', 'Em', 'Em', 'Am', 'C', 'B7', 'B7'],
    tune: [
      'E5 e, E5 e, G5 e, E5 e, B5 q, A5 q',
      'G5 q, F#5 q, E5 h',
      'E5 e, E5 e, G5 e, C6 e, B5 q, G5 q',
      'A5 q, F#5 q, D5 h',
      'B5 e, B5 e, E6 e, B5 e, G5 q, E5 q',
      'F#5 q, G5 q, B5 h',
      'C6 q, A5 q, E5 q, C6 q',
      'B5 h, D#5 h',
      'E5 q, G5 q, C6 q, E6 q',
      'D6 q, A5 q, F#5 q, D5 q',
      'E5 q, B5 q, E6 h',
      'G5 q, F#5 q, E5 h',
      'A5 e, C6 e, E6 q, C6 q, A5 q',
      'G5 e, C6 e, E6 q, G6 q, E6 q',
      'D#6 q, B5 q, F#5 q, D#5 q',
      'B4 w',
    ],
    drums: true,
    bass: 'pulse',
  });
}

/** The render finishes: a fanfare. */
function wonSong(): Uint8Array {
  return build({
    bpm: 112,
    chords: ['C', 'F', 'G', 'C', 'Am', 'F', 'G7', 'C'],
    tune: ['C5 q, E5 q, G5 q, C6 q', 'A5 q, C6 q, F6 h', 'D6 q, B5 q, G5 q, D6 q', 'E6 w', 'C6 q, A5 q, E5 q, A5 q', 'F5 q, A5 q, C6 h', 'B5 q, D6 q, F6 q, D6 q', 'C6 w'],
    lead: INSTRUMENTS.brass,
    drums: true,
  });
}

/** Out of light: a slow fall. */
function lostSong(): Uint8Array {
  return build({
    bpm: 72,
    chords: ['Am', 'F', 'Dm', 'E'],
    tune: ['E5 h, C5 h', 'A4 h, F4 h', 'D4 q, F4 q, A4 h', 'G#4 w'],
    lead: GLASS,
    arp: 'up',
    bass: 'hold',
  });
}

/** Every song on the disk, by file name (without .cmf). */
export const SONGS: Record<string, () => Uint8Array> = {
  title: titleSong,
  menu: menuSong,
  story: storySong,
  checker: checkerSong,
  glass: glassSong,
  mirror: mirrorSong,
  peaks: peaksSong,
  teapot: teapotSong,
  vanish: vanishSong,
  won: wonSong,
  lost: lostSong,
};
