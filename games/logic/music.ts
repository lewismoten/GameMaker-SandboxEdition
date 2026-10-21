// The soundtrack: nine short FM songs for the Sound Blaster. "Ohm Sweet Ohm", Watt's
// theme, runs through the title, menu, story and ending; each room of the house gets its
// own tune (a jaunty kitchen, a lounge-lizard living room, a garage-band shuffle and a
// spooky attic). Each voice is its own OPL2 channel; chords spread across three channels.
import { INSTRUMENTS, sbi, song, type Voice } from '../kit/music';

const CHORDS: Record<string, string[]> = {
  C: ['E4', 'G4', 'C5'],
  C7: ['E4', 'G4', 'Bb4'],
  Dm: ['D4', 'F4', 'A4'],
  E7: ['E4', 'G#4', 'D5'],
  F: ['F4', 'A4', 'C5'],
  G: ['D4', 'G4', 'B4'],
  G7: ['D4', 'F4', 'B4'],
  Gm: ['D4', 'G4', 'Bb4'],
  A7: ['E4', 'G4', 'C#5'],
  Am: ['E4', 'A4', 'C5'],
  Bb: ['D4', 'F4', 'Bb4'],
};
const FIFTH: Record<string, string> = { C: 'G', D: 'A', E: 'B', F: 'C', G: 'D', A: 'E', B: 'F#', Bb: 'F' };
const ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const rootOf = (ch: string) => (/^[A-G]b/.test(ch) ? ch.slice(0, 2) : ch[0]);

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

/** Bass lines: 'oompah', 'walk' (four to the bar), 'half', 'whole', 'shuffle'. */
function bass(bars: string[], style: 'oompah' | 'walk' | 'half' | 'whole' | 'shuffle', octave = 2): string {
  return bars
    .map((ch) => {
      const r = rootOf(ch);
      const f = FIFTH[r];
      const ro = `${r}${octave}`;
      const fo = `${f}${ORDER.indexOf(f[0]) < ORDER.indexOf(r[0]) ? octave + 1 : octave}`;
      if (style === 'whole') return `${ro} w`;
      if (style === 'half') return `${ro} h, ${fo} h`;
      if (style === 'walk') return `${ro} q, ${fo} q, ${r}${octave + 1} q, ${fo} q`;
      if (style === 'shuffle') return `${ro} q., ${ro} e, ${fo} q., ${ro} e`;
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

const v = (channel: number, instrument: Uint8Array, notes: string, velocity = 100): Voice => ({ channel, instrument, notes, velocity });
const join = (...parts: string[]) => parts.filter(Boolean).join(', ');
const times = (n: number, s: string) => Array(n).fill(s).join(', ');

const ROBOT = sbi({
  modChar: 0x22,
  carChar: 0x21,
  modLevel: 0x18,
  carLevel: 0x00,
  modAD: 0xf6,
  carAD: 0xf6,
  modSR: 0x26,
  carSR: 0x16,
  modWave: 1,
  feedback: 0x0c,
});
const TICK = sbi({ modChar: 0x0f, carChar: 0x01, modLevel: 0x00, carLevel: 0x00, modAD: 0xf8, carAD: 0xf9, modSR: 0x07, carSR: 0x08, feedback: 0x0e });
const VIBES = sbi({ modChar: 0x04, carChar: 0x01, modLevel: 0x1c, carLevel: 0x00, modAD: 0xf6, carAD: 0xf4, modSR: 0x34, carSR: 0x25, feedback: 0x06 });
const GUITAR = sbi({
  modChar: 0x01,
  carChar: 0x01,
  modLevel: 0x0c,
  carLevel: 0x00,
  modAD: 0xf8,
  carAD: 0xf6,
  modSR: 0x44,
  carSR: 0x45,
  modWave: 1,
  feedback: 0x0e,
});
const SAW = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x16, carLevel: 0x00, modAD: 0x81, carAD: 0x71, modSR: 0x9e, carSR: 0xae, feedback: 0x0e });
const { piano, bass: BASS, strings, brass, bell, organ, pad, pluck } = INSTRUMENTS;

const backbeat = (bars: number) => times(bars, 'r q, C4 q, r q, C4 q');

// Ohm Sweet Ohm: the theme (8 bars) and its bridge (8 bars), in C.
const THEME =
  'E5 e, G5 e, C6 q, B5 e, A5 e, G5 q, E5 e, G5 e, A5 e, G5 e, E5 h, D5 e, E5 e, F5 q, A5 q, G5 e, F5 e, E5 q, D5 q, C5 h, ' +
  'E5 e, G5 e, C6 q, B5 e, A5 e, G5 q, A5 e, B5 e, C6 e, A5 e, G5 h, F5 e, E5 e, D5 q, G5 q, B4 q, C5 h., r q';
const THEME_CH = ['C', 'Am', 'F', 'C', 'C', 'F', 'G7', 'C'];
const BRIDGE =
  'A5 q, G5 e, F5 e, E5 q, C5 q, D5 e, E5 e, F5 e, G5 e, A5 h, G5 q, F5 e, E5 e, D5 q, B4 q, C5 e, D5 e, E5 e, G5 e, C6 h, ' +
  'A5 q, G5 e, F5 e, E5 q, C5 q, D5 e, F5 e, A5 e, C6 e, B5 h, C6 q, B5 e, A5 e, G5 q, D5 q, C5 h, r h';
const BRIDGE_CH = ['F', 'Dm', 'G7', 'C', 'F', 'G', 'G7', 'C'];

/** Title: the theme, bright and bleepy. */
export function titleSong(): Uint8Array {
  const ch = [...THEME_CH, ...BRIDGE_CH];
  const [a, b, c] = comp(ch, 're e re e re e re e', -1);
  return tune(144, [
    v(0, ROBOT, join(THEME, BRIDGE), 110),
    v(1, piano, a, 65),
    v(2, piano, b, 65),
    v(3, piano, c, 65),
    v(4, BASS, bass(ch, 'oompah'), 115),
    v(5, TICK, backbeat(16), 55),
  ]);
}

/** Menu: the theme on a music box. */
export function menuSong(): Uint8Array {
  const [a, b, c] = comp(THEME_CH, 'h h', -1);
  return tune(112, [v(0, bell, THEME, 100), v(1, pad, a, 50), v(2, pad, b, 50), v(3, pad, c, 50), v(4, BASS, bass(THEME_CH, 'half'), 95)]);
}

/** The storyline: slow and warm. */
export function storySong(): Uint8Array {
  const [a, b, c] = comp(THEME_CH, 'w', -1);
  return tune(80, [v(0, VIBES, THEME, 100), v(1, strings, a, 55), v(2, strings, b, 55), v(3, strings, c, 55), v(4, BASS, bass(THEME_CH, 'whole'), 85)]);
}

/** The kitchen: a jaunty plucked version of the theme. */
export function kitchenSong(): Uint8Array {
  const ch = [...THEME_CH, ...BRIDGE_CH];
  const [a, b, c] = comp(ch, 're q. re q.', -1);
  return tune(132, [
    v(0, pluck, join(THEME, BRIDGE), 105),
    v(1, piano, a, 60),
    v(2, piano, b, 60),
    v(3, piano, c, 60),
    v(4, BASS, bass(ch, 'oompah'), 110),
    v(5, TICK, backbeat(16), 45),
  ]);
}

/** The living room: lounge music in F, vibraphone over a walking bass. */
export function livingSong(): Uint8Array {
  const ch = ['F', 'Bb', 'C7', 'F', 'Dm', 'C7', 'C7', 'F'];
  const m =
    'F5 q, A5 e, F5 e, C5 q, A4 q, Bb4 q, D5 e, F5 e, A5 h, G5 q, E5 e, C5 e, Bb4 q, G4 q, A4 e, C5 e, F5 e, A5 e, G5 h, ' +
    'F5 q, A5 e, F5 e, D5 q, Bb4 q, G5 q, Bb5 e, G5 e, E5 q, C5 q, D5 e, E5 e, F5 e, G5 e, A5 q, G5 q, F5 h., r q';
  const both = [...ch, ...ch];
  const [a, b, c] = comp(both, 'r q. e q', -1);
  return tune(116, [
    v(0, VIBES, join(m, m), 100),
    v(1, organ, a, 50),
    v(2, organ, b, 50),
    v(3, organ, c, 50),
    v(4, BASS, bass(both, 'walk'), 105),
    v(5, TICK, backbeat(16), 40),
  ]);
}

/** The garage: a garage-band shuffle in A minor. */
export function garageSong(): Uint8Array {
  const ch = ['Am', 'Am', 'Dm', 'E7', 'Am', 'Am', 'E7', 'Am'];
  const m =
    'A4 e, A4 e, C5 e, A4 e, D5 e, A4 e, E5 q, G5 e, E5 e, D5 e, C5 e, A4 h, D5 e, D5 e, F5 e, D5 e, G5 e, D5 e, A5 q, G5 e, F5 e, E5 e, D5 e, E5 h, ' +
    'A4 e, A4 e, C5 e, A4 e, D5 e, A4 e, E5 q, G5 e, E5 e, D5 e, C5 e, A4 h, F5 q, E5 q, D5 q, B4 q, A4 h, r h';
  const both = [...ch, ...ch];
  const [a, b, c] = comp(both, 're e re e re e re e', -1);
  return tune(138, [
    v(0, GUITAR, join(m, m), 110),
    v(1, SAW, a, 55),
    v(2, SAW, b, 55),
    v(3, SAW, c, 55),
    v(4, BASS, bass(both, 'shuffle'), 115),
    v(5, TICK, backbeat(16), 60),
  ]);
}

/** The attic: dusty and a little spooky, in D minor. */
export function atticSong(): Uint8Array {
  const ch = ['Dm', 'A7', 'Dm', 'Bb', 'Dm', 'Gm', 'A7', 'Dm'];
  const m = 'D5 q, F5 q, A5 h, G5 q, F5 q, E5 h, F5 q, E5 q, D5 q, A4 q, Bb4 q, C5 q, D5 h, D5 q, F5 q, A5 h, Bb5 q, A5 q, G5 h, E5 q, G5 q, C#5 q, E5 q, D5 w';
  const [a, b, c] = comp(ch, 'h h', -1);
  return tune(96, [v(0, bell, m, 95), v(1, pad, a, 55), v(2, pad, b, 55), v(3, pad, c, 55), v(4, BASS, bass(ch, 'whole'), 90)]);
}

/** Game won: a fanfare, then the theme in full. */
export function wonSong(): Uint8Array {
  const fan = 'C5 e, C5 e, C5 e, E5 e, G5 q, C6 q, A5 e, A5 e, A5 e, C6 e, G5 h';
  const ch = ['C', 'F', ...THEME_CH, ...BRIDGE_CH, 'C'];
  const [a, b, c] = comp(ch, 'q q q q', -1);
  return tune(132, [
    v(0, brass, join(fan, THEME, BRIDGE, 'C6 w'), 105),
    v(1, strings, a, 60),
    v(2, strings, b, 60),
    v(3, strings, c, 60),
    v(4, BASS, bass(ch, 'oompah'), 110),
    v(5, TICK, backbeat(19), 50),
  ]);
}

/** Game lost: a sad little robot winding down. */
export function lostSong(): Uint8Array {
  const mel = 'E5 h, C5 q, A4 q, B4 h., r q, G#4 q., r e, G4 q., r e, F#4 q., r e, F4 q., r e, E4 w';
  const ch = ['Am', 'E7', 'Dm', 'E7', 'Am'];
  const [a, b, c] = comp(ch, 'w', -1);
  return tune(72, [v(0, ROBOT, mel, 105), v(1, pad, a, 50), v(2, pad, b, 50), v(3, pad, c, 50), v(4, BASS, bass(ch, 'whole'), 85)]);
}
