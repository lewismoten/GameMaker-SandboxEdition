// The soundtrack: thirteen short FM songs for the Sound Blaster. "Teddy's Theme" from the
// first adventure runs through Teddy's songs, and Gwinn has a theme of her own now (a
// sneaky minor tune that can't sit still) for her MEANWHILE... levels. Main Street plays
// Yankee Doodle on a fife for Founders' Day. Each voice is its own OPL2 channel; chords
// spread across three channels.
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';

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

// Teddy's Theme: 8 bars in C.
const THEME_A = 'G4 e, C5 e, E5 e, G5 e, E5 q, C5 q, D5 e, E5 e, F5 e, D5 e, G4 h, A4 e, C5 e, F5 e, A5 e, G5 q, E5 q, D5 e, C5 e, D5 e, E5 e, C5 h';
const THEME_B = 'E5 q, E5 e, F5 e, G5 q, C6 q, B5 e, A5 e, G5 e, F5 e, E5 h, D5 q, D5 e, E5 e, F5 q, A5 q, G5 e, F5 e, E5 e, D5 e, C5 h';

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

// Gwinn's Theme: 8 bars in A minor, all elbows.
const GWINN_A = 'A4 e, C5 e, E5 e, A5 e, G5 q, E5 q, F5 e, E5 e, D5 e, F5 e, E5 h, A4 e, C5 e, E5 e, A5 e, B5 q, G#5 q, A5 q, E5 q, A4 h';
const GWINN_B = 'D5 q, F5 e, A5 e, D6 q, A5 q, C6 e, B5 e, A5 e, G5 e, A5 h, F5 q, E5 e, D5 e, E5 q, G#5 q, A5 h., r q';
const GWINN_CHORDS = ['Am', 'Dm', 'Am', 'E7', 'Dm', 'Am', 'E7', 'Am'];
const THEME_CHORDS = ['C', 'G7', 'F', 'C', 'C', 'Am', 'Dm', 'G7'];

/** Level 1, Doc Leo's house at dawn: the theme on a music box, slow and sleepy, then waking up. */
export function houseSong(): Uint8Array {
  const chords = [...THEME_CHORDS, ...THEME_CHORDS];
  const mel = join(THEME_A, THEME_B, THEME_A, THEME_B.replace('C5 h', 'C5 q, G4 q'));
  const [a, b, c] = comp(chords, 'q re e q re e', -1);
  return tune(108, [
    v(0, TOY, mel, 105),
    v(1, piano, a, 60),
    v(2, piano, b, 60),
    v(3, piano, c, 60),
    v(4, BASS, bass(chords, 'half'), 95),
    v(5, bell, join(times(7, 'r w'), 'C6 h, G5 h', times(7, 'r w'), 'E6 h, C6 h'), 60),
  ]);
}

/** Level 2, Main Street on Founders' Day: Yankee Doodle on a fife and drum, then the theme. */
export function mainSong(): Uint8Array {
  const yankee = join(
    'C5 e, C5 e, D5 e, E5 e, C5 e, E5 e, D5 e, G4 e',
    'C5 e, C5 e, D5 e, E5 e, C5 q, B4 q',
    'C5 e, C5 e, D5 e, E5 e, F5 e, E5 e, D5 e, C5 e',
    'B4 e, G4 e, A4 e, B4 e, C5 q, C5 q',
    'A4 e., B4 s, A4 e, G4 e, A4 e, B4 e, C5 q',
    'G4 e., A4 s, G4 e, F4 e, E4 q, G4 q',
    'A4 e., B4 s, A4 e, G4 e, A4 e, B4 e, C5 e, A4 e',
    'G4 e, C5 e, B4 e, D5 e, C5 q, C5 q',
  );
  const chords = ['C', 'G7', 'C', 'G7', 'F', 'C', 'F', 'C', ...THEME_CHORDS];
  const [a, b, c] = comp(chords, 'q q q q', -1);
  return tune(132, [
    v(0, WHISTLE, join(yankee, THEME_A, THEME_B), 110),
    v(1, brass, a, 55),
    v(2, brass, b, 55),
    v(3, brass, c, 55),
    v(4, TUBA, bass(chords, 'oompah'), 110),
    v(5, SNAP, times(16, 'C4 e, C4 e, r e, C4 e, C4 q, C4 q'), 70),
  ]);
}

/** Level 3, Gwinn's night out: her theme, sneaking along a walking bass. */
export function nightSong(): Uint8Array {
  const chords = [...GWINN_CHORDS, ...GWINN_CHORDS];
  const [a, b, c] = comp(chords, 're e re e re e re e', -1);
  return tune(116, [
    v(0, lead, join(GWINN_A, GWINN_B, GWINN_A, GWINN_B), 95),
    v(1, organ, a, 50),
    v(2, organ, b, 50),
    v(3, organ, c, 50),
    v(4, BASS, bass(chords, 'walk'), 110),
    v(5, SNAP, backbeat(16), 40),
  ]);
}

/** Level 4, the river: the theme rolling along in G over rippling arpeggios. */
export function riverSong(): Uint8Array {
  const chords = ['G', 'Em', 'C', 'D7', 'G', 'Em', 'Am', 'D7', 'C', 'G', 'Am', 'D7', 'G', 'C', 'D7', 'G'];
  const rip = (ch: string) => {
    const [x, y, z] = CHORDS[ch];
    return `${x} e, ${y} e, ${z} e, ${y} e, ${x} e, ${y} e, ${z} e, ${y} e`;
  };
  const mel = join(
    'D5 h, B4 h, G5 h, E5 h, E5 q, G5 q, C6 h, A5 h, F#5 h',
    'D5 h, B4 h, G5 h, B5 h, A5 q, G5 q, E5 h, D5 h., r q',
    'E5 h, C5 h, G5 h, D5 h, A5 q, G5 q, E5 h, F#5 h, A5 h',
    'B5 h, G5 h, C6 h, E5 h, D5 q, F#5 q, A5 h, G5 h., r q',
  );
  return tune(104, [v(0, WHISTLE, mel, 100), v(1, pluck, chords.map(rip).join(', '), 70), v(4, BASS, bass(chords, 'whole'), 95)]);
}

/** Level 5, Gwinn on the farm: her theme as a breakneck banjo hoedown. */
export function farmSong(): Uint8Array {
  const chords = [...GWINN_CHORDS, ...GWINN_CHORDS];
  const [a, b, c] = comp(chords, 're e re e re e re e', -1);
  return tune(168, [
    v(0, WHISTLE, join(GWINN_A, GWINN_B, GWINN_A, GWINN_B), 105),
    v(1, BANJO, a, 75),
    v(2, BANJO, b, 75),
    v(3, BANJO, c, 75),
    v(4, BASS, bass(chords, 'gallop'), 110),
    v(5, SNAP, backbeat(16), 55),
  ]);
}

/** Level 6, the corn maze: plucked and puzzled, in D minor, wandering and turning back. */
export function mazeSong(): Uint8Array {
  const chords = ['Dm', 'Dm', 'Bb', 'A7', 'Dm', 'Dm', 'Bb', 'A7', 'F', 'C', 'Bb', 'A7', 'Dm', 'Bb', 'A7', 'Dm'];
  const m1 = 'D5 q, F5 e, E5 e, D5 q, A4 q, D5 e, E5 e, F5 e, G5 e, A5 h, Bb5 q, A5 e, G5 e, F5 q, D5 q, E5 e, C#5 e, A4 e, C#5 e, E5 h';
  const m2 = 'D5 q, F5 e, E5 e, D5 q, A4 q, F5 e, G5 e, A5 e, D6 e, C6 h, Bb5 q, G5 e, Bb5 e, D6 q, Bb5 q, A5 q, E5 q, C#5 h';
  const m3 = 'C5 q, F5 e, A5 e, C6 q, A5 q, G5 q, E5 e, G5 e, C6 h, Bb5 q, A5 e, G5 e, F5 q, D5 q, E5 e, G5 e, C#6 e, A5 e, E5 h';
  const m4 = 'F5 q, E5 e, D5 e, A4 q, D5 q, Bb4 q, D5 e, F5 e, Bb5 h, A5 q, G5 e, F5 e, E5 q, C#5 q, D5 h, r h';
  const [a, b, c] = comp(chords, 'q r q r', -1);
  return tune(104, [v(0, pluck, join(m1, m2, m3, m4), 100), v(1, pad, a, 50), v(2, pad, b, 50), v(3, pad, c, 50), v(4, BASS, bass(chords, 'half'), 95)]);
}

/** Level 7, the midway: a carnival on the calliope, chromatic runs and all. */
export function midwaySong(): Uint8Array {
  const chords = ['C', 'C', 'G7', 'G7', 'G7', 'G7', 'C', 'C', 'F', 'F', 'C', 'A7', 'D7', 'G7', 'C', 'C'];
  const m1 = join(
    'E5 e, D#5 e, E5 e, G5 e, C6 q, G5 q',
    'E5 e, D#5 e, E5 e, G5 e, C6 q, E6 q',
    'D6 e, C#6 e, D6 e, B5 e, G5 q, F5 q',
    'D5 e, C#5 e, D5 e, F5 e, B5 h',
  );
  const m2 = join('D6 e, C#6 e, D6 e, B5 e, G5 q, F5 q', 'D5 e, F5 e, G5 e, B5 e, D6 q, B5 q', 'C6 e, B5 e, C6 e, G5 e, E5 q, C5 q', 'E5 q, G5 q, C6 h');
  const m3 = join(
    'A5 e, G#5 e, A5 e, C6 e, F6 q, C6 q',
    'A5 e, G5 e, F5 e, A5 e, C6 h',
    'G5 e, F#5 e, G5 e, C6 e, E6 q, G5 q',
    'C#6 e, A5 e, E5 e, C#5 e, A4 h',
  );
  const m4 = join('D5 e, F#5 e, A5 e, D6 e, C6 q, A5 q', 'G5 e, F5 e, D5 e, B4 e, G4 q, B4 q', 'C5 e, E5 e, G5 e, C6 e, E6 q, C6 q', 'C6 h, r h');
  const [a, b, c] = comp(chords, 'r q q q', -1);
  return tune(150, [
    v(0, CALLIOPE, join(m1, m2, m3, m4), 110),
    v(1, organ, a, 60),
    v(2, organ, b, 60),
    v(3, organ, c, 60),
    v(4, TUBA, bass(chords, 'oompah'), 120),
    v(5, SNAP, backbeat(16), 55),
  ]);
}

/** Level 8, the dog show: a fanfare, Teddy's Theme, then Gwinn's, side by side at last. */
export function showSong(): Uint8Array {
  const chords = ['C', 'F', 'C', 'G7', ...THEME_CHORDS, ...GWINN_CHORDS, 'F', 'G7', 'C', 'C'];
  const fan = 'C5 e, C5 e, C5 e, E5 e, G5 q, C6 q, A5 e, A5 e, A5 e, C6 e, F5 h, G5 e, G5 e, G5 e, B5 e, D6 q, B5 q, G5 h, G4 h';
  const mel = join(fan, THEME_A, THEME_B, GWINN_A, GWINN_B, 'A5 q, F5 q, C5 q, F5 q, G5 q, B5 q, D6 q, B5 q, C6 w, C6 h, r h');
  const [a, b, c] = comp(chords, 'q q q q', -1);
  return tune(138, [
    v(0, brass, mel, 105),
    v(1, strings, a, 60),
    v(2, strings, b, 60),
    v(3, strings, c, 60),
    v(4, TUBA, bass(chords, 'oompah'), 115),
    v(5, SNAP, backbeat(24), 55),
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
