// The soundtrack: FM songs for the Sound Blaster in the manner of a 1996 RPG — a heraldic
// fanfare, a lute's village jig, a marching overworld theme, an ostinato for each dungeon,
// Deadline Keep's ticking, a jaunty drive across the Flats, and the Round Tuit made whole.
import { INSTRUMENTS, sbi, song, type Voice } from '../../../kit/music';

const LUTE = sbi({ modChar: 0x03, carChar: 0x01, modLevel: 0x16, carLevel: 0x00, modAD: 0xf7, carAD: 0xf5, modSR: 0x34, carSR: 0x45, feedback: 0x0a });
const RECORDER = sbi({ modChar: 0x61, carChar: 0x21, modLevel: 0x2a, carLevel: 0x00, modAD: 0x75, carAD: 0x65, modSR: 0x15, carSR: 0x16, feedback: 0x02 });
const HARP = sbi({ modChar: 0x02, carChar: 0x01, modLevel: 0x20, carLevel: 0x00, modAD: 0xf6, carAD: 0xf3, modSR: 0x43, carSR: 0x34, feedback: 0x06 });
const HORN = sbi({ modChar: 0x21, carChar: 0x21, modLevel: 0x1a, carLevel: 0x00, modAD: 0x62, carAD: 0x72, modSR: 0x24, carSR: 0x25, feedback: 0x0c });
const KAZOO = sbi({
  modChar: 0x22,
  carChar: 0x21,
  modLevel: 0x12,
  carLevel: 0x00,
  modAD: 0xb5,
  carAD: 0xa5,
  modSR: 0x14,
  carSR: 0x15,
  modWave: 1,
  carWave: 1,
  feedback: 0x0e,
});
const TICK = sbi({ modChar: 0x0f, carChar: 0x01, modLevel: 0x00, carLevel: 0x06, modAD: 0xfa, carAD: 0xf9, modSR: 0x09, carSR: 0x0a, feedback: 0x0e });
const DRUM = sbi({ modChar: 0x00, carChar: 0x00, modLevel: 0x08, carLevel: 0x00, modAD: 0xf8, carAD: 0xf6, modSR: 0x47, carSR: 0x68, feedback: 0x0e });

const CH: Record<string, string[]> = {
  D: ['A3', 'D4', 'F#4'],
  G: ['B3', 'D4', 'G4'],
  A: ['A3', 'C#4', 'E4'],
  A7: ['G3', 'C#4', 'E4'],
  Bm: ['B3', 'D4', 'F#4'],
  Em: ['B3', 'E4', 'G4'],
  F: ['A3', 'C4', 'F4'],
  C: ['G3', 'C4', 'E4'],
  Am: ['A3', 'C4', 'E4'],
  Dm: ['A3', 'D4', 'F4'],
  E: ['G#3', 'B3', 'E4'],
  Bb: ['Bb3', 'D4', 'F4'],
  Gm: ['Bb3', 'D4', 'G4'],
  Cm: ['C4', 'Eb4', 'G4'],
  Ab: ['Ab3', 'C4', 'Eb4'],
  Eb: ['Bb3', 'Eb4', 'G4'],
};
const ROOT: Record<string, string> = {
  D: 'D',
  G: 'G',
  A: 'A',
  A7: 'A',
  Bm: 'B',
  Em: 'E',
  F: 'F',
  C: 'C',
  Am: 'A',
  Dm: 'D',
  E: 'E',
  Bb: 'Bb',
  Gm: 'G',
  Cm: 'C',
  Ab: 'Ab',
  Eb: 'Eb',
};

/** Three voices holding (or strumming) one chord per bar to `rhythm` ('w', 'h h', 'q q q q', 'r q q q'). */
function comp(bars: string[], rhythm: string): string[] {
  const out: string[][] = [[], [], []];
  for (const b of bars) {
    const ns = CH[b];
    if (!ns) throw new Error(`No chord ${b}`);
    for (const len of rhythm.split(' ')) {
      if (len.startsWith('r')) for (const v of out) v.push(`r ${len.slice(1) || 'q'}`);
      else ns.forEach((n, i) => out[i].push(`${n} ${len}`));
    }
  }
  return out.map((v) => v.join(', '));
}

/** A bass line: root on the beat, `pattern` of [interval steps from the root in semitones]. */
function bass(bars: string[], beats: string, octave = 2): string {
  const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const idx = (r: string) => NOTES.indexOf(r === 'Bb' ? 'Bb' : r === 'Ab' ? 'Ab' : r === 'Eb' ? 'Eb' : r);
  return bars
    .map((b) => {
      const r = ROOT[b];
      return beats
        .split(' ')
        .map((tok) => {
          const [step, len] = tok.split(':');
          if (step === 'r') return `r ${len}`;
          const n = idx(r) + Number(step);
          return `${NOTES[((n % 12) + 12) % 12]}${octave + Math.floor(n / 12)} ${len}`;
        })
        .join(', ');
    })
    .join(', ');
}

const voices = (lead: [Uint8Array, string, number?], parts: [Uint8Array, string, number?][]): Voice[] => {
  const out: Voice[] = [{ channel: 0, instrument: lead[0], notes: lead[1], velocity: lead[2] ?? 110 }];
  let ch = 1;
  for (const [inst, notes, vel] of parts) out.push({ channel: ch++, instrument: inst, notes, velocity: vel ?? 80 });
  return out;
};
const repeat = (s: string, n: number) => new Array(n).fill(s).join(', ');

/** The title: a herald's fanfare, then the Round Tuit theme over marching strings. */
export function titleSong(): Uint8Array {
  const bars = ['D', 'D', 'G', 'D', 'Bm', 'G', 'A', 'A', 'D', 'D', 'G', 'D', 'G', 'A', 'D', 'D'];
  const lead = [
    'D4 e, D4 e, D4 e, A4 q., r e',
    'F#4 e, G4 e, A4 e, D5 h',
    'D5 q, B4 e, G4 e, B4 q, D5 q',
    'A4 h., r q',
    'B4 q, A4 e, F#4 e, D4 q, F#4 q',
    'G4 q, B4 q, D5 q, B4 q',
    'A4 q., G4 e, F#4 q, E4 q',
    'A4 h., r q',
    'D5 q, C#5 e, D5 e, A4 q, F#4 q',
    'D4 q, F#4 e, A4 e, D5 h',
    'E5 q, D5 e, B4 e, G4 q, B4 q',
    'A4 q, F#4 q, D4 h',
    'B4 q, C#5 q, D5 q, E5 q',
    'F#5 q., E5 e, C#5 q, A4 q',
    'D5 w',
    'r w',
  ].join(', ');
  const [a, b, c] = comp(bars, 'q q q q');
  return song(
    112,
    voices(
      [HORN, lead, 120],
      [
        [INSTRUMENTS.strings, a, 70],
        [INSTRUMENTS.strings, b, 70],
        [INSTRUMENTS.strings, c, 70],
        [INSTRUMENTS.bass, bass(bars, '0:q 7:q 12:q 7:q'), 95],
        [DRUM, repeat('C3 e, C3 e, r q, C3 q, r q', 16), 70],
      ],
    ),
  );
}

/** The menu: a lute picks the theme slowly, a recorder answers. */
export function menuSong(): Uint8Array {
  const bars = ['D', 'G', 'D', 'A', 'Bm', 'G', 'A', 'D'];
  const lute = bars
    .map(
      (b) =>
        CH[b].map((n) => `${n} e`).join(', ') +
        ', ' +
        CH[b]
          .slice()
          .reverse()
          .map((n) => `${n} e`)
          .join(', ') +
        `, ${CH[b][1]} e, ${CH[b][2]} e`,
    )
    .join(', ');
  const rec = ['r w', 'D5 h, B4 h', 'A4 h., r q', 'C#5 h, E5 h', 'D5 h, F#4 h', 'G4 h, B4 h', 'A4 w', 'D5 w'].join(', ');
  return song(
    92,
    voices(
      [RECORDER, rec, 95],
      [
        [LUTE, lute, 85],
        [INSTRUMENTS.bass, bass(bars, '0:h 7:h'), 80],
      ],
    ),
  );
}

/** The story: D dorian, slow and a little worried. */
export function storySong(): Uint8Array {
  const bars = ['Dm', 'C', 'Dm', 'Am', 'F', 'C', 'Dm', 'Dm'];
  const mel = [
    'D4 q, F4 q, A4 h',
    'G4 q, E4 q, C4 h',
    'D4 q, E4 q, F4 q, A4 q',
    'E4 w',
    'F4 q, A4 q, C5 h',
    'B4 q, G4 q, E4 h',
    'F4 q, E4 q, D4 h',
    'r w',
  ].join(', ');
  const [a, b, c] = comp(bars, 'w');
  return song(
    70,
    voices(
      [HARP, mel, 95],
      [
        [INSTRUMENTS.pad, a, 60],
        [INSTRUMENTS.pad, b, 60],
        [INSTRUMENTS.pad, c, 60],
        [INSTRUMENTS.bass, bass(bars, '0:w'), 80],
      ],
    ),
  );
}

/** The overworld: a striding march in G, horns and strings, a recorder in the second half. */
export function worldSong(): Uint8Array {
  const bars = ['G', 'G', 'C', 'G', 'Em', 'C', 'D', 'D', 'G', 'G', 'C', 'G', 'Em', 'Am', 'D', 'G'];
  const mel = [
    'G4 q, B4 q, D5 q., B4 e',
    'D5 q, G5 q, D5 h',
    'E5 q, D5 e, C5 e, B4 q, A4 q',
    'B4 h., r q',
    'B4 q, E5 q, D5 q, B4 q',
    'C5 q, E5 q, G5 h',
    'F#5 q, E5 e, D5 e, C5 q, A4 q',
    'D5 h., r q',
    'G5 q, F#5 e, E5 e, D5 q, B4 q',
    'D5 q, B4 e, G4 e, B4 h',
    'C5 q, E5 q, G5 q, E5 q',
    'D5 h., B4 q',
    'E5 q, G5 q, B4 q, E5 q',
    'C5 q, A4 q, E5 h',
    'D5 q, F#5 q, A5 q, F#5 q',
    'G5 w',
  ].join(', ');
  const [a, b, c] = comp(bars, 'q re e q re e');
  return song(
    118,
    voices(
      [HORN, mel, 110],
      [
        [INSTRUMENTS.strings, a, 60],
        [INSTRUMENTS.strings, b, 60],
        [INSTRUMENTS.strings, c, 60],
        [INSTRUMENTS.bass, bass(bars, '0:q 7:q 12:q 7:q'), 95],
        [DRUM, repeat('C3 q, C3 e, C3 e, C3 q, r q', 16), 60],
      ],
    ),
  );
}

/** The towns: a lute jig in 6/8 (triplet eighths), a recorder on top. */
export function townSong(): Uint8Array {
  const bars = ['D', 'G', 'D', 'A', 'D', 'G', 'A', 'D'];
  const jig = bars.map((b) => `${CH[b][1]} t, ${CH[b][2]} t, ${CH[b][1]} t, ${CH[b][0]} t, ${CH[b][1]} t, ${CH[b][2]} t`).join(', ');
  const mel = [
    'F#5 t, E5 t, D5 t, A4 t, D5 t, F#5 t',
    'G5 t, F#5 t, E5 t, D5 t, B4 t, G4 t',
    'A4 t, D5 t, F#5 t, A5 t, F#5 t, D5 t',
    'E5 t, C#5 t, A4 t, E5 t, r t, r t',
    'F#5 t, A5 t, F#5 t, D5 t, F#5 t, A5 t',
    'B5 t, G5 t, E5 t, D5 t, B4 t, D5 t',
    'C#5 t, E5 t, A5 t, G5 t, E5 t, C#5 t',
    'D5 t, r t, A4 t, D5 t, r t, r t',
  ].join(', ');
  return song(
    84,
    voices(
      [RECORDER, `${mel}, ${mel}`, 100],
      [
        [LUTE, `${jig}, ${jig}`, 85],
        [INSTRUMENTS.bass, bass([...bars, ...bars], '0:q 7:q'), 85],
      ],
    ),
  );
}

/** The Garden Court and Laterburg: stately, a harp and horns in B flat. */
export function castleSong(): Uint8Array {
  const bars = ['Bb', 'Eb', 'Bb', 'F', 'Gm', 'Eb', 'F', 'Bb'];
  const mel = [
    'D5 h, F5 q, D5 q',
    'Eb5 h, G5 h',
    'F5 q, D5 q, Bb4 h',
    'C5 w',
    'D5 q, Bb4 q, G4 q, Bb4 q',
    'Eb5 q, G5 q, Bb5 h',
    'A4 q, C5 q, F5 q, Eb5 q',
    'D5 w',
  ].join(', ');
  const harp = bars
    .map((b) =>
      CH[b]
        .concat(CH[b])
        .concat(CH[b].slice(0, 2))
        .map((n) => `${n} e`)
        .join(', '),
    )
    .join(', ');
  return song(
    96,
    voices(
      [HORN, mel, 105],
      [
        [HARP, harp, 80],
        [INSTRUMENTS.bass, bass(bars, '0:h 7:h'), 85],
      ],
    ),
  );
}

/** One dungeon's song: what changes from dungeon to dungeon. */
interface Crypt {
  tempo: number;
  /** The lead instrument and its line for the A and B sections (8 bars each). */
  lead: Uint8Array;
  a: string;
  b: string;
  /** Low ostinato and chord pad instruments. */
  low: Uint8Array;
  pad: Uint8Array;
  /** An extra part on top (drips, pick strikes), the same length as both sections. */
  extra?: [Uint8Array, string, number];
}

/**
 * The dungeons share one shape: an A section in A minor over a low ostinato, then a B section
 * that climbs to D minor and back round to E, so the loop runs about forty seconds before it
 * repeats. Each dungeon sets its own tempo, lead, colors and one part of its own.
 */
function crypt(c: Crypt): Uint8Array {
  const barsA = ['Am', 'Am', 'F', 'E', 'Am', 'Dm', 'E', 'E'];
  const barsB = ['Dm', 'Dm', 'Am', 'Am', 'F', 'G', 'E', 'E'];
  const bars = [...barsA, ...barsB];
  // the minor third under each chord where the chord is minor; the major third otherwise
  const low = bars
    .map((b) => {
      const minor = b.endsWith('m');
      return bass([b], `0:e 7:e ${minor ? 3 : 4}:e 7:e 0:e 7:e ${minor ? 3 : 4}:e 7:e`, 2);
    })
    .join(', ');
  const [x, y] = comp(bars, 'w');
  const parts: [Uint8Array, string, number?][] = [
    [c.low, low, 100],
    [c.pad, x, 55],
    [c.pad, y, 55],
  ];
  if (c.extra) parts.push(c.extra);
  return song(c.tempo, voices([c.lead, `${c.a}, ${c.b}`, 75], parts));
}

/** The Snooze Barrows: a slow bell over low strings, and a yawning B section. */
export function barrowsSong(): Uint8Array {
  return crypt({
    tempo: 96,
    lead: INSTRUMENTS.bell,
    a: ['A5 w', 'r w', 'C6 h, B5 h', 'G#5 w', 'E5 w', 'F5 h, E5 h', 'D5 h, C5 h', 'B4 w'].join(', '),
    b: ['F5 h, E5 h', 'D5 w', 'E5 h, C5 h', 'A4 w', 'C5 h, D5 h', 'B4 h, G4 h', 'G#4 w', 'r w'].join(', '),
    low: INSTRUMENTS.bass,
    pad: INSTRUMENTS.strings,
  });
}

/** The Soggy Vaults: a harp, an organ's damp chords and a drip in the dark. */
export function vaultsSong(): Uint8Array {
  const drip = repeat('r h, E6 e, r e, r q', 8) + ', ' + repeat('r h, D6 e, r e, A5 q', 8);
  return crypt({
    tempo: 88,
    lead: HARP,
    a: ['A4 q, C5 q, E5 h', 'D5 q, C5 q, B4 h', 'A4 q, C5 q, F5 h', 'E5 w', 'C5 q, E5 q, A5 h', 'F5 q, E5 q, D5 h', 'B4 q, D5 q, E5 h', 'G#4 w'].join(', '),
    b: ['D5 q, F5 q, A5 h', 'G5 q, F5 q, E5 h', 'C5 q, E5 q, A5 h', 'G5 q, E5 q, C5 h', 'A4 q, C5 q, F5 h', 'G4 q, B4 q, D5 h', 'E5 h, D5 h', 'B4 w'].join(
      ', ',
    ),
    low: INSTRUMENTS.bass,
    pad: INSTRUMENTS.organ,
    extra: [INSTRUMENTS.bell, drip, 45],
  });
}

/** The Putoff Mines: a quicker march, brass on top and picks striking on the beat. */
export function minesSong(): Uint8Array {
  const picks = repeat('A2 q, r q, A2 q, A2 e, A2 e', 16);
  return crypt({
    tempo: 112,
    lead: INSTRUMENTS.brass,
    a: ['A4 h, E5 h', 'C5 q, B4 q, A4 h', 'F4 h, C5 h', 'B4 q, G#4 q, E4 h', 'A4 h, E5 h', 'F5 q, E5 q, D5 h', 'E5 q, D5 q, B4 h', 'E4 w'].join(', '),
    b: ['D5 h, F5 h', 'A5 q, F5 q, D5 h', 'C5 h, E5 h', 'A5 q, E5 q, C5 h', 'F5 h, A5 h', 'G5 q, F5 q, D5 h', 'E5 q, F5 q, E5 q, D5 q', 'B4 h, G#4 h'].join(
      ', ',
    ),
    low: INSTRUMENTS.bass,
    pad: INSTRUMENTS.strings,
    extra: [DRUM, picks, 70],
  });
}

/** Deadline Keep: a clock ticks; C minor, every bar a minute closer, then a B section that climbs through A-flat and B-flat to the dominant. */
export function keepSong(): Uint8Array {
  const barsA = ['Cm', 'Cm', 'Ab', 'G', 'Cm', 'Cm', 'Ab', 'G'];
  const barsB = ['Ab', 'Bb', 'Eb', 'Cm', 'Ab', 'Bb', 'G', 'G'];
  const bars = [...barsA, ...barsB];
  const tick = repeat('C6 q, G5 q', 32);
  const melA = ['C5 h, Eb5 h', 'D5 q, C5 q, B4 h', 'C5 h, Ab4 h', 'G4 w', 'Eb5 h, G5 h', 'F5 q, Eb5 q, D5 h', 'Eb5 q, C5 q, Ab4 h', 'B4 w'];
  const melB = [
    'C5 q, Eb5 q, Ab5 h',
    'F5 q, D5 q, Bb4 h',
    'Eb5 q, G5 q, Bb5 h',
    'G5 q, Eb5 q, C5 h',
    'Ab5 h, G5 h',
    'F5 q, G5 q, Ab5 h',
    'G5 h, F5 q, D5 q',
    'B4 h, D5 h',
  ];
  const [a, b, c] = comp(bars, 'h h');
  return song(
    108,
    voices(
      [HORN, [...melA, ...melB].join(', '), 100],
      [
        [TICK, tick, 70],
        [INSTRUMENTS.organ, a, 55],
        [INSTRUMENTS.organ, b, 55],
        [INSTRUMENTS.organ, c, 55],
        [INSTRUMENTS.bass, bass(bars, '0:q 0:q 7:q 0:q'), 95],
      ],
    ),
  );
}

/** The Dawdle Flats in THE CHEZ: a jaunty two-step with a kazoo on the tune. */
export function flatsSong(): Uint8Array {
  const bars = ['C', 'C', 'F', 'C', 'G', 'F', 'C', 'G', 'C', 'C', 'F', 'C', 'F', 'G', 'C', 'C'];
  const mel = [
    'E4 e, G4 e, C5 q, G4 e, E4 e, G4 q',
    'A4 e, G4 e, E4 e, C4 e, D4 q, E4 q',
    'F4 e, A4 e, C5 q, A4 e, F4 e, A4 q',
    'G4 h., r q',
    'B4 e, D5 e, G5 q, F5 e, D5 e, B4 q',
    'C5 e, A4 e, F4 q, A4 q, C5 q',
    'E5 q, D5 e, C5 e, G4 q, E4 q',
    'D4 h., r q',
  ].join(', ');
  const oompah = bass(bars, '0:q r:q 7:q r:q');
  const chords = comp(bars, 're e re e re e re e');
  return song(
    136,
    voices(
      [KAZOO, `${mel}, ${mel}`, 105],
      [
        [INSTRUMENTS.bass, oompah, 100],
        [INSTRUMENTS.piano, chords[0], 65],
        [INSTRUMENTS.piano, chords[1], 65],
        [DRUM, repeat('C3 q, r q, C3 q, r q', 16), 55],
      ],
    ),
  );
}

/** The Round Tuit made whole: the title theme in triumph. */
export function wonSong(): Uint8Array {
  const bars = ['D', 'G', 'D', 'A', 'Bm', 'G', 'A', 'D'];
  const mel = [
    'A4 q, D5 q, F#5 q., E5 e',
    'D5 q, B4 q, G4 h',
    'A4 q, D5 q, F#5 q, A5 q',
    'G5 q, F#5 q, E5 h',
    'F#5 q, D5 q, B4 q, D5 q',
    'G5 q, E5 q, B4 q, G5 q',
    'A5 q, G5 q, F#5 q, E5 q',
    'D5 w',
  ].join(', ');
  const [a, b, c] = comp(bars, 'h h');
  return song(
    100,
    voices(
      [HORN, mel, 120],
      [
        [INSTRUMENTS.strings, a, 75],
        [INSTRUMENTS.strings, b, 75],
        [INSTRUMENTS.strings, c, 75],
        [INSTRUMENTS.bass, bass(bars, '0:q 7:q 12:q 7:q'), 95],
        [HARP, repeat('D5 e, F#5 e, A5 e, D6 e', 16), 60],
      ],
    ),
  );
}

/** Game over: a slow, sad slide down — with one kazoo honk at the end. */
export function lostSong(): Uint8Array {
  const mel = 'A4 h, G4 h, F4 h, E4 h, D4 w';
  return song(
    80,
    voices(
      [RECORDER, mel, 95],
      [
        [INSTRUMENTS.pad, 'D4 w, Bb3 w, A3 w', 60],
        [KAZOO, 'r w, r w, r h, D3 e, C3 e, r q', 90],
        [INSTRUMENTS.bass, 'D2 w, Bb1 w, A1 w', 85],
      ],
    ),
  );
}
