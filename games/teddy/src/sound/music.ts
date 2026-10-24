// The soundtrack: ten short FM songs for the Sound Blaster. "Teddy's Theme" runs through
// most of them (bouncy on the title, sleepy for the story, a full circus march at the
// Klown Klub). Each voice is its own OPL2 channel; chords spread across three channels.
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';
import { THEME_A, THEME_B } from '../../../kit/teddyTheme';

const CHORDS: Record<string, string[]> = {
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
  Eb: ['Eb4', 'G4', 'Bb4'],
  Ab: ['Eb4', 'Ab4', 'C5'],
  Bdim: ['D4', 'F4', 'B4'],
};
const ROOT: Record<string, string> = { C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', A: 'A', B: 'B', Bb: 'Bb', Eb: 'Eb', Ab: 'Ab' };
const rootOf = (ch: string) => ROOT[/^[A-G]b/.test(ch) ? ch.slice(0, 2) : ch[0]];
const FIFTH: Record<string, string> = { C: 'G', D: 'A', E: 'B', F: 'C', G: 'D', A: 'E', B: 'F#', Bb: 'F', Eb: 'Bb', Ab: 'Eb' };
const ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Three comping voices from one chord per bar; `rhythm` lists lengths ('r' = rest). */
function comp(bars: string[], rhythm: string, octave = 0): [string, string, string] {
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
function bass(bars: string[], style: 'oompah' | 'walk' | 'half' | 'whole' | 'gallop' = 'oompah', octave = 2): string {
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
function tune(bpm: number, voices: Voice[]): Uint8Array {
  const beats = voices.map((x) => beatsOf(x.notes));
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
const join = (...parts: string[]) => parts.filter(Boolean).join(', ');
const times = (n: number, s: string) => Array(n).fill(s).join(', ');

// Instruments.
const CALLIOPE = sbi({
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
const WHISTLE = sbi({ modChar: 0x61, carChar: 0x61, modLevel: 0x26, carLevel: 0x00, modAD: 0x65, carAD: 0x75, modSR: 0x06, carSR: 0x06, feedback: 0x0e });
const TUBA = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x19, carLevel: 0x00, modAD: 0x83, carAD: 0x85, modSR: 0x37, carSR: 0x47, feedback: 0x0c });
const TOY = sbi({ modChar: 0x07, carChar: 0x03, modLevel: 0x1f, carLevel: 0x02, modAD: 0xf7, carAD: 0xf4, modSR: 0x44, carSR: 0x35, feedback: 0x08 });
const BANJO = sbi({ modChar: 0x03, carChar: 0x01, modLevel: 0x18, carLevel: 0x00, modAD: 0xfa, carAD: 0xf8, modSR: 0x47, carSR: 0x57, feedback: 0x0c });
const TROMBONE = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1c, carLevel: 0x00, modAD: 0x53, carAD: 0x63, modSR: 0x29, carSR: 0x29, feedback: 0x0e });
const SNAP = sbi({ modChar: 0x0f, carChar: 0x01, modLevel: 0x00, carLevel: 0x00, modAD: 0xf8, carAD: 0xf9, modSR: 0x07, carSR: 0x08, feedback: 0x0e });
const { piano, bass: BASS, strings, brass, lead, bell, organ, pad, pluck } = INSTRUMENTS;

/** A soft snare-ish tick on beats 2 and 4. */
const backbeat = (bars: number) => times(bars, 'r q, C4 q, r q, C4 q');

/** Title: the theme as a bouncy march, then the bridge. */
export function titleSong(): Uint8Array {
  const chords = ['C', 'G7', 'F', 'C', 'C', 'G7', 'Dm', 'C', 'C', 'Am', 'Dm', 'G7', 'C', 'F', 'G7', 'C'];
  const mel = join(THEME_A, THEME_A.replace('C5 h', 'C5 q, G4 q'), THEME_B, THEME_B.replace('C5 h', 'C5 q, r q'));
  const [a, b, c] = comp(chords, 're e re e re e re e', -1);
  return tune(144, [
    v(0, CALLIOPE, mel, 110),
    v(1, piano, a, 70),
    v(2, piano, b, 70),
    v(3, piano, c, 70),
    v(4, TUBA, bass(chords, 'oompah'), 120),
    v(5, SNAP, backbeat(16), 60),
  ]);
}

/** Menu: the theme on a music box. */
export function menuSong(): Uint8Array {
  const chords = ['C', 'G7', 'F', 'C', 'C', 'Am', 'Dm', 'G7'];
  const [a, b, c] = comp(chords, 'h h', -1);
  return tune(112, [v(0, TOY, THEME_A + ', ' + THEME_B, 105), v(1, pad, a, 55), v(2, pad, b, 55), v(3, pad, c, 55), v(4, BASS, bass(chords, 'half'), 100)]);
}

/** The storyline: slow and fond, Doc Leo's lullaby. */
export function storySong(): Uint8Array {
  const chords = ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C7', 'F'];
  const mel = 'A4 h, C5 q, A4 q, F4 h., r q, G4 h, Bb4 q, G4 q, E4 h., r q, A4 q, C5 q, F5 q, E5 q, D5 h, C5 h, Bb4 q, A4 q, G4 q, Bb4 q, A4 h, G4 h, F4 w';
  const [a, b, c] = comp(chords, 'q q q q', -1);
  return tune(84, [v(0, WHISTLE, mel, 100), v(1, strings, a, 55), v(2, strings, b, 55), v(3, strings, c, 55), v(4, BASS, bass(chords, 'whole'), 90)]);
}

/** Level 1, the backyard: a sunny banjo shuffle on the theme. */
export function backyardSong(): Uint8Array {
  const chords = ['C', 'G7', 'F', 'C', 'C', 'Am', 'Dm', 'G7', 'F', 'C', 'D7', 'G7', 'C', 'F', 'G7', 'C'];
  const bridge = 'A4 q, C5 e, A4 e, F4 q, A4 q, G4 q, E4 e, G4 e, C5 h, F#4 q, A4 e, C5 e, D5 q, C5 q, B4 q, A4 e, B4 e, G4 h';
  const mel = join(THEME_A, THEME_B.replace('C5 h', 'G4 h'), bridge, THEME_B);
  const [a, b, c] = comp(chords, 're e re e re e re e', -1);
  return tune(132, [
    v(0, WHISTLE, mel, 100),
    v(1, BANJO, a, 75),
    v(2, BANJO, b, 75),
    v(3, BANJO, c, 75),
    v(4, BASS, bass(chords, 'oompah'), 110),
    v(5, SNAP, backbeat(16), 45),
  ]);
}

/** Level 2, Maple Street: a strolling walking bass in F. */
export function streetSong(): Uint8Array {
  const chords = ['F', 'Dm', 'Bb', 'C7', 'F', 'G7', 'C', 'C7', 'Bb', 'F', 'G7', 'C7', 'F', 'Bb', 'C7', 'F'];
  const a1 = 'C5 q, A4 e, C5 e, F5 q, E5 e, D5 e, C5 q, A4 q, D5 q, F5 q, Bb4 q, D5 e, F5 e, G5 h, E5 q, C5 q, G4 q, C5 q';
  const a2 = 'C5 q, A4 e, C5 e, F5 q, A5 q, G5 e, F5 e, D5 q, B4 q, G4 q, A4 e, B4 e, C5 q, E5 q, G5 q, C5 h, r h';
  const b1 = 'D5 q, D5 e, F5 e, Bb5 q, A5 q, A5 q, F5 e, A5 e, C6 h, B5 e, A5 e, G5 e, F5 e, E5 q, D5 q, E5 q, G5 q, C5 q, E5 q';
  const b2 = 'F5 q, A4 e, C5 e, F5 q, E5 q, D5 q, Bb4 e, D5 e, F5 h, E5 q, C5 e, D5 e, E5 q, G5 q, F5 h, r h';
  const [a, b, c] = comp(chords, 'r q q e e', -1);
  return tune(120, [
    v(0, brass, join(a1, a2, b1, b2), 95),
    v(1, piano, a, 70),
    v(2, piano, b, 70),
    v(3, piano, c, 70),
    v(4, BASS, bass(chords, 'walk'), 110),
    v(5, SNAP, backbeat(16), 45),
  ]);
}

/** Level 3, the park: a light flute tune in G. */
export function parkSong(): Uint8Array {
  const chords = ['G', 'Em', 'C', 'D7', 'G', 'Em', 'Am', 'D7', 'C', 'G', 'Am', 'D7', 'G', 'C', 'D7', 'G'];
  const m1 = 'D5 e, G5 e, B5 q, A5 e, G5 e, E5 q, G5 e, E5 e, B4 h., C5 e, E5 e, G5 q, F#5 e, E5 e, D5 q, A4 e, B4 e, C5 e, D5 e, F#5 h';
  const m2 = 'D5 e, G5 e, B5 q, A5 e, G5 e, E5 q, G5 e, E5 e, B4 h., A4 e, C5 e, E5 q, D5 e, C5 e, A4 q, D5 q, F#4 q, A4 q, C5 q';
  const m3 = 'E5 q, G5 e, E5 e, C5 q, E5 q, D5 e, G5 e, B5 q, G5 h, A5 q, G5 e, E5 e, C5 q, A4 q, D5 e, E5 e, F#5 e, A5 e, D5 h';
  const m4 = 'B4 q, D5 e, G5 e, B5 q, A5 q, G5 q, E5 e, C5 e, E5 h, D5 q, F#5 e, A5 e, C6 q, F#5 q, G5 h, r h';
  const [a, b, c] = comp(chords, 'q q q q', -1);
  return tune(126, [
    v(0, WHISTLE, join(m1, m2, m3, m4), 100),
    v(1, pluck, a, 60),
    v(2, pluck, b, 60),
    v(3, pluck, c, 60),
    v(4, BASS, bass(chords, 'half'), 100),
  ]);
}

/** Level 4, downtown: a swinging big-city vamp in A minor. */
export function citySong(): Uint8Array {
  const chords = ['Am', 'Dm', 'E7', 'Am', 'Am', 'Dm', 'E7', 'Am', 'F', 'C', 'Dm', 'E7', 'Am', 'Dm', 'E7', 'Am'];
  const m1 = 'A4 e, C5 e, E5 e, A5 e, G5 q, E5 q, F5 e, E5 e, D5 e, F5 e, A5 h, G#5 q, B5 q, D6 q, B5 q, A5 h, r h';
  const m2 = 'E5 e, E5 e, r e, E5 e, C5 q, A4 q, D5 e, D5 e, r e, D5 e, F5 q, A5 q, G#5 e, F5 e, E5 e, D5 e, B4 q, G#4 q, A4 h, r h';
  // The bridge borrows Teddy's Theme's hop (games/kit/teddyTheme.ts), in F.
  const m3 = 'A4 e, C5 e, F5 q, D5 e, C5 e, A4 q, C5 e, E5 e, G5 e, C6 e, G5 h, F5 e, D5 e, A4 e, D5 e, F5 q, A5 q, G#5 e, B5 e, E5 e, G#5 e, B5 h';
  const m4 = 'A5 q, G5 e, E5 e, C5 q, A4 q, F5 q, D5 e, A4 e, F4 q, D5 q, E5 e, G#5 e, B5 e, G#5 e, E5 q, D5 q, A4 h, r h';
  const [a, b, c] = comp(chords, 're e q re e q', -1);
  return tune(138, [
    v(0, brass, join(m1, m2, m3, m4), 100),
    v(1, organ, a, 55),
    v(2, organ, b, 55),
    v(3, organ, c, 55),
    v(4, BASS, bass(chords, 'walk'), 115),
    v(5, SNAP, backbeat(16), 55),
  ]);
}

/** Level 5, the Klown Klub: the theme as a breakneck circus march. */
export function klubSong(): Uint8Array {
  const chords = ['C', 'C', 'G7', 'G7', 'G7', 'G7', 'C', 'C', 'C', 'C7', 'F', 'Fm', 'C', 'G7', 'C', 'C'];
  const run = 'G4 e, G#4 e, A4 e, A#4 e, B4 e, C5 e, C#5 e, D5 e';
  const m1 = join('E5 q, E5 e, D#5 e, E5 q, G5 q', 'C5 q, G4 q, E4 q, G4 q', 'F5 q, F5 e, E5 e, F5 q, A5 q', 'D5 q, B4 q, G4 q, B4 q');
  const m2 = join('D5 q, D5 e, C#5 e, D5 q, F5 q', 'B4 q, G4 q, F4 q, G4 q', 'C5 e, D5 e, E5 e, F5 e, G5 q, E5 q', 'C5 h, r h');
  const m3 = join('G5 q, G5 e, F#5 e, G5 q, E5 q', 'Bb5 q, A5 q, G5 q, E5 q', 'F5 q, A5 q, C6 q, A5 q', 'Ab5 q, F5 q, C5 q, Ab4 q');
  const m4 = join('G5 q, E5 q, C5 q, E5 q', run, 'C6 q, G5 q, E5 q, G5 q', 'C6 h, r h');
  const [a, b, c] = comp(chords, 'r q q q', -1);
  return tune(168, [
    v(0, CALLIOPE, join(m1, m2, m3, m4), 110),
    v(1, organ, a, 60),
    v(2, organ, b, 60),
    v(3, organ, c, 60),
    v(4, TUBA, bass(chords, 'oompah'), 120),
    v(5, SNAP, backbeat(16), 60),
    v(6, bell, join(times(15, 'r w'), 'C6 q, G5 q, C6 h'), 70),
  ]);
}

/** Game won: a fanfare, then the theme in full. */
export function wonSong(): Uint8Array {
  const chords = ['C', 'F', 'C', 'G7', 'F', 'C', 'C', 'G7', 'Dm', 'G7', 'C', 'C'];
  const fan = 'C5 e, C5 e, C5 e, E5 e, G5 q, C6 q, A5 e, A5 e, A5 e, C6 e, G5 h';
  const mel = join(fan, THEME_A, THEME_B, 'C5 q, E5 q, G5 q, C6 q, C6 w');
  const [a, b, c] = comp(chords, 'q q q q', -1);
  return tune(132, [
    v(0, brass, mel, 105),
    v(1, strings, a, 60),
    v(2, strings, b, 60),
    v(3, strings, c, 60),
    v(4, TUBA, bass(chords, 'oompah'), 115),
    v(5, SNAP, backbeat(12), 55),
  ]);
}

/** Game lost: a sleepy trombone, and the sad-clown "wah wah wah waaah". */
export function lostSong(): Uint8Array {
  const mel = 'C5 h, A4 q, F4 q, G4 h., r q, G4 q., r e, F#4 q., r e, F4 q., r e, E4 q., r e, E4 w, r w';
  const chords = ['F', 'G7', 'C', 'C', 'C', 'C'];
  const [a, b, c] = comp(chords, 'w', -1);
  return tune(80, [v(0, TROMBONE, mel, 110), v(1, pad, a, 50), v(2, pad, b, 50), v(3, pad, c, 50), v(4, BASS, bass(chords, 'whole'), 90)]);
}

void lead;
