// The soundtrack: FM songs for the Sound Blaster. One tune, "Final Curtain", in D minor,
// turns up everywhere: a slow swing on the title, strings for the story, muted brass
// over a walking bass for Act One, a cold organ for 2 AM, a clock ticking in the green
// room, drums of a sort at dawn, and in D major for the curtain call.
import { INSTRUMENTS, sbi, song } from '../../../kit/music';
import { v } from '../../../kit/tune';

const CHORDS: Record<string, string[]> = {
  Dm: ['D4', 'F4', 'A4'],
  Dm7: ['C4', 'F4', 'A4'],
  Gm: ['D4', 'G4', 'Bb4'],
  A7: ['C#4', 'G4', 'A4'],
  A: ['C#4', 'E4', 'A4'],
  Bb: ['D4', 'F4', 'Bb4'],
  Eb: ['Eb4', 'G4', 'Bb4'],
  C: ['E4', 'G4', 'C5'],
  F: ['F4', 'A4', 'C5'],
  D: ['D4', 'F#4', 'A4'],
  G: ['D4', 'G4', 'B4'],
  Em: ['E4', 'G4', 'B4'],
  E7: ['D4', 'G#4', 'B4'],
};
const ROOT: Record<string, [string, string]> = {
  Dm: ['D', 'A'],
  Dm7: ['D', 'A'],
  Gm: ['G', 'D'],
  A7: ['A', 'E'],
  A: ['A', 'E'],
  Bb: ['Bb', 'F'],
  Eb: ['Eb', 'Bb'],
  C: ['C', 'G'],
  F: ['F', 'C'],
  D: ['D', 'A'],
  G: ['G', 'D'],
  Em: ['E', 'B'],
  E7: ['E', 'B'],
};

/** Three voices of chords, `rhythm` lengths per bar ('r' prefix = rest). */
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

function bass(bars: string[], style: 'walk' | 'half' | 'whole' | 'pulse', octave = 2): string {
  return bars
    .map((ch) => {
      const [r, f] = ROOT[ch];
      const ro = `${r}${octave}`;
      const ord = 'CDEFGAB';
      const fo = `${f}${ord.indexOf(f[0]) < ord.indexOf(r[0]) ? octave + 1 : octave}`;
      if (style === 'whole') return `${ro} w`;
      if (style === 'half') return `${ro} h, ${fo} h`;
      if (style === 'pulse') return `${ro} e, ${ro} e, ${ro} e, ${ro} e, ${ro} e, ${ro} e, ${fo} e, ${fo} e`;
      return `${ro} q, ${fo} q, ${r}${octave + 1} q, ${fo} q`;
    })
    .join(', ');
}

const PROG = ['Dm', 'Dm', 'Gm', 'A7', 'Dm', 'Bb', 'Gm', 'A7'];
const THEME =
  'A4 q., F4 e, E4 q, D4 q, A4 h, r q, G4 e, A4 e, Bb4 q., A4 e, G4 q, F4 q, E4 h., r q, ' +
  'F4 q., E4 e, D4 q, F4 q, Bb4 h, A4 q, G4 q, G4 q, Bb4 q, A4 q, C#5 q, D5 h., r q';

const muted = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1e, carLevel: 0x04, modAD: 0x71, carAD: 0x82, modSR: 0x9e, carSR: 0x8e, feedback: 0x0a });
const clock = sbi({ modChar: 0x05, carChar: 0x01, modLevel: 0x10, carLevel: 0x08, modAD: 0xfa, carAD: 0xf9, modSR: 0x88, carSR: 0x88, feedback: 0x0e });
const drum = sbi({ modChar: 0x00, carChar: 0x00, modLevel: 0x0f, carLevel: 0x00, modAD: 0xf9, carAD: 0xf7, modSR: 0x6b, carSR: 0x5a, feedback: 0x0c });

function titleSong(): Uint8Array {
  const [a, b, c] = comp(PROG, 're q. re q.', 0);
  return song(84, [
    v(0, INSTRUMENTS.lead, THEME, 110),
    v(1, INSTRUMENTS.bass, bass(PROG, 'walk')),
    v(2, INSTRUMENTS.piano, a, 70),
    v(3, INSTRUMENTS.piano, b, 70),
    v(4, INSTRUMENTS.piano, c, 70),
  ]);
}

function menuSong(): Uint8Array {
  const bars = ['Dm', 'Gm', 'Dm', 'A7'];
  const [a, b, c] = comp(bars, 'h h');
  return song(72, [
    v(0, INSTRUMENTS.pad, a, 70),
    v(1, INSTRUMENTS.pad, b, 70),
    v(2, INSTRUMENTS.pad, c, 70),
    v(3, INSTRUMENTS.bass, bass(bars, 'half')),
    v(4, INSTRUMENTS.bell, 'A5 h, r h, F5 h, r h, A5 q, G5 q, F5 q, E5 q, C#5 w', 70),
  ]);
}

function storySong(): Uint8Array {
  const [a, b, c] = comp(PROG, 'w', -1);
  return song(66, [
    v(0, INSTRUMENTS.strings, THEME, 105),
    v(1, INSTRUMENTS.strings, a, 65),
    v(2, INSTRUMENTS.strings, b, 65),
    v(3, INSTRUMENTS.strings, c, 65),
    v(4, INSTRUMENTS.bass, bass(PROG, 'whole')),
  ]);
}

/** Act One: a walking bass, piano stabs and the theme on a muted trumpet, then a bridge. */
function act1Song(): Uint8Array {
  const prog = [...PROG, 'Bb', 'Eb', 'Dm', 'A7'];
  const [a, b, c] = comp(prog, 'r q e. r s r h');
  const bridge = 'D5 q, C5 e, Bb4 e, A4 h, G4 q, F4 e, Eb4 e, D4 h, F4 q., G4 e, A4 q, D5 q, C#5 w';
  return song(104, [
    v(0, muted, THEME + ', ' + bridge, 105),
    v(1, INSTRUMENTS.bass, bass(prog, 'walk')),
    v(2, INSTRUMENTS.piano, a, 64),
    v(3, INSTRUMENTS.piano, b, 64),
    v(4, INSTRUMENTS.piano, c, 64),
    v(5, drum, prog.map(() => 'C3 e, C3 s, C3 s, r q, C3 e, C3 s, C3 s, r q').join(', '), 50),
  ]);
}

/** Act Two: 2 AM. An organ moves a half step and back; a bell answers. */
function act2Song(): Uint8Array {
  const bars = ['Dm', 'Eb', 'Dm', 'Eb', 'Gm', 'A7', 'Dm', 'Dm'];
  const [a, b, c] = comp(bars, 'w', -1);
  return song(60, [
    v(0, INSTRUMENTS.organ, a, 60),
    v(1, INSTRUMENTS.organ, b, 60),
    v(2, INSTRUMENTS.organ, c, 60),
    v(3, INSTRUMENTS.bass, bass(bars, 'whole', 1), 90),
    v(4, INSTRUMENTS.bell, 'r h, A5 q, r q, r w, r h, Bb5 q, r q, r w, D6 q, r q, C#6 q, r q, E5 h, r h, A5 w, r w', 64),
  ]);
}

/** The green room: a clock on the mantel, and the tune very quietly underneath. */
function parlorSong(): Uint8Array {
  const bars = ['Dm', 'Gm', 'Dm', 'A7'];
  const [a, b, c] = comp(bars, 'w');
  return song(80, [
    v(0, clock, bars.map(() => 'E5 q, B4 q, E5 q, B4 q').join(', '), 70),
    v(1, INSTRUMENTS.pad, a, 46),
    v(2, INSTRUMENTS.pad, b, 46),
    v(3, INSTRUMENTS.pad, c, 46),
    v(4, INSTRUMENTS.pluck, 'A4 h., r q, F4 h., r q, A4 q, G4 q, F4 q, E4 q, C#4 h., r q', 60),
  ]);
}

/** Dawn on the stage: the theme over pounding eighths. */
function dawnSong(): Uint8Array {
  const [a, b, c] = comp(PROG, 'e e e e e e e e', -1);
  return song(96, [
    v(0, INSTRUMENTS.brass, THEME, 110),
    v(1, INSTRUMENTS.bass, bass(PROG, 'pulse', 1)),
    v(2, INSTRUMENTS.strings, a, 54),
    v(3, INSTRUMENTS.strings, b, 54),
    v(4, INSTRUMENTS.strings, c, 54),
    v(5, drum, PROG.map(() => 'C3 q, r q, C3 q, C3 e, C3 e').join(', '), 70),
  ]);
}

/** The curtain call: the theme in D major. */
function wonSong(): Uint8Array {
  const prog = ['D', 'D', 'G', 'A', 'D', 'G', 'Em', 'A'];
  const tune = THEME.replace(/F4/g, 'F#4').replace(/Bb4/g, 'B4').replace(/C#5/g, 'C#5');
  const [a, b, c] = comp(prog, 'q q q q');
  return song(112, [
    v(0, INSTRUMENTS.brass, tune, 115),
    v(1, INSTRUMENTS.bass, bass(prog, 'walk')),
    v(2, INSTRUMENTS.piano, a, 70),
    v(3, INSTRUMENTS.piano, b, 70),
    v(4, INSTRUMENTS.piano, c, 70),
  ]);
}

function lostSong(): Uint8Array {
  const bars = ['Dm', 'Bb', 'Gm', 'A7'];
  const [a, b, c] = comp(bars, 'w', -1);
  return song(54, [
    v(0, INSTRUMENTS.bell, 'A4 h, F4 h, D4 h, Bb3 h, G3 h, Bb3 h, A3 w', 80),
    v(1, INSTRUMENTS.strings, a, 54),
    v(2, INSTRUMENTS.strings, b, 54),
    v(3, INSTRUMENTS.strings, c, 54),
    v(4, INSTRUMENTS.bass, bass(bars, 'whole', 1)),
  ]);
}

export function buildMusic(): Record<string, Uint8Array> {
  return {
    'title.cmf': titleSong(),
    'menu.cmf': menuSong(),
    'story.cmf': storySong(),
    'act1.cmf': act1Song(),
    'act2.cmf': act2Song(),
    'parlor.cmf': parlorSong(),
    'dawn.cmf': dawnSong(),
    'won.cmf': wonSong(),
    'lost.cmf': lostSong(),
  };
}
