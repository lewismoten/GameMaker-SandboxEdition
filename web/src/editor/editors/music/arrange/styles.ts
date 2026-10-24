// The accompaniment generator's styles: for each, the bar length, a few bass lines, comping
// rhythms and drum grooves to pick from (a new take picks again), and the preset sounds
// (audio/oplPresets.ts, oplDrumPresets.ts) the band plays. The ideas follow games/kit/song.ts,
// the arranger the Bard of Bizarre games share. No DOM.

/** A bass note: when in the bar (beats), how long, and which: root, fifth, octave, third, or a step into the next chord's root. */
export type BassStep = [at: number, len: number, note: 'R' | '5' | '8' | '3' | 'A'];

/** Comping: chords struck at these [beat, length]s, or an arpeggio stepping through the chord tones. */
export type Comp = { hits: [at: number, len: number][] } | { arp: number };

/** A bar of drums: per drum a grid across the bar ('x' hit, 'X' accent, '.' rest). */
export type Groove = Partial<Record<Drum, string>>;
export type Drum = 'k' | 's' | 't' | 'c' | 'h';

export interface Style {
  id: StyleId;
  name: string;
  about: string;
  beatsPerBar: 3 | 4;
  /** A chord can change halfway through a bar. */
  halves: boolean;
  bass: BassStep[][];
  comp: Comp[];
  /** Chord voices the comping uses (1 for an arpeggio, else 3). */
  grooves: Groove[];
  /** The groove that ends every fourth bar (and the last), if any. */
  fill?: Groove;
  /** A cymbal crash on the first bar. */
  crash: boolean;
  sounds: { bass: string[]; comp: string[]; kick: string; snare: string; tom: string; cymbal: string; hat: string };
  vel: { bass: number; comp: number; drums: number };
}

export type StyleId = 'march' | 'waltz' | 'ballad' | 'rock' | 'chiptune';

export const STYLES: Style[] = [
  {
    id: 'march',
    name: 'March',
    about: 'Oom-pah: tuba on the beat, brass chords between, a snare that drills',
    beatsPerBar: 4,
    halves: true,
    bass: [
      [
        [0, 1, 'R'],
        [2, 1, '5'],
      ],
      [
        [0, 1, 'R'],
        [1, 1, '5'],
        [2, 1, 'R'],
        [3, 1, '5'],
      ],
    ],
    comp: [
      {
        hits: [
          [1, 0.5],
          [3, 0.5],
        ],
      },
      {
        hits: [
          [0.5, 0.5],
          [1.5, 0.5],
          [2.5, 0.5],
          [3.5, 0.5],
        ],
      },
    ],
    grooves: [
      { k: 'x...x...', s: '..x...x.', t: 'x.....xx', h: 'x.x.x.x.' },
      { k: 'x...x...', s: 'x.xxx.x.', h: '..x...x.' },
    ],
    fill: { k: 'x...x...', s: 'x.x.xxxX', h: 'x.x.....' },
    crash: true,
    sounds: {
      bass: ['tuba', 'trombone'],
      comp: ['synth-brass', 'horn', 'trumpet'],
      kick: 'kick-punchy',
      snare: 'snare-tight',
      tom: 'tom-mid',
      cymbal: 'crash',
      hat: 'hat-closed',
    },
    vel: { bass: 105, comp: 72, drums: 96 },
  },
  {
    id: 'waltz',
    name: 'Waltz',
    about: 'Three beats a bar: the bass on one, the chord on two and three',
    beatsPerBar: 3,
    halves: false,
    bass: [
      [[0, 1, 'R']],
      [
        [0, 1, 'R'],
        [2, 1, '5'],
      ],
    ],
    comp: [
      {
        hits: [
          [1, 0.9],
          [2, 0.9],
        ],
      },
      {
        hits: [
          [1, 0.5],
          [2, 0.5],
        ],
      },
    ],
    grooves: [
      { k: 'x.....', h: '..x.x.' },
      { k: 'x.....', s: '..x.x.' },
      { k: 'x.....', h: 'x.x.x.' },
    ],
    crash: false,
    sounds: {
      bass: ['upright-bass', 'pizzicato', 'tuba'],
      comp: ['accordion', 'strings', 'harp'],
      kick: 'kick-boomy',
      snare: 'snare-fat',
      tom: 'tom-low',
      cymbal: 'ride',
      hat: 'hat-pedal',
    },
    vel: { bass: 100, comp: 64, drums: 70 },
  },
  {
    id: 'ballad',
    name: 'Ballad',
    about: 'Slow and soft: long held chords, a gentle bass and a light pulse',
    beatsPerBar: 4,
    halves: true,
    bass: [
      [[0, 4, 'R']],
      [
        [0, 2, 'R'],
        [2, 2, '5'],
      ],
      [
        [0, 3, 'R'],
        [3, 1, 'A'],
      ],
    ],
    comp: [
      { hits: [[0, 4]] },
      {
        hits: [
          [0, 2],
          [2, 2],
        ],
      },
      { arp: 0.5 },
    ],
    grooves: [{ k: 'x.......', h: '..x...x.' }, { k: 'x.......', s: '....x...' }, {}],
    crash: false,
    sounds: {
      bass: ['fretless', 'finger-bass', 'upright-bass'],
      comp: ['pad-warm', 'strings', 'epiano-round', 'choir'],
      kick: 'kick-boomy',
      snare: 'rimshot',
      tom: 'tom-low',
      cymbal: 'ride',
      hat: 'hat-closed',
    },
    vel: { bass: 92, comp: 58, drums: 64 },
  },
  {
    id: 'rock',
    name: 'Rock',
    about: 'Driving eighth-note bass, punchy chords and a backbeat',
    beatsPerBar: 4,
    halves: true,
    bass: [
      [
        [0, 0.5, 'R'],
        [0.5, 0.5, 'R'],
        [1, 0.5, 'R'],
        [1.5, 0.5, 'R'],
        [2, 0.5, 'R'],
        [2.5, 0.5, 'R'],
        [3, 0.5, 'R'],
        [3.5, 0.5, 'R'],
      ],
      [
        [0, 0.5, 'R'],
        [0.5, 0.5, '8'],
        [1, 0.5, 'R'],
        [1.5, 0.5, '8'],
        [2, 0.5, 'R'],
        [2.5, 0.5, '5'],
        [3, 0.5, '8'],
        [3.5, 0.5, 'A'],
      ],
      [
        [0, 1.5, 'R'],
        [1.5, 0.5, 'R'],
        [2, 1, '5'],
        [3, 1, '8'],
      ],
    ],
    comp: [
      {
        hits: [
          [0, 0.75],
          [0.75, 0.75],
          [1.5, 1],
          [2.5, 0.5],
          [3, 1],
        ],
      },
      {
        hits: [
          [0, 1.5],
          [1.5, 0.5],
          [2, 2],
        ],
      },
      {
        hits: [
          [0.5, 0.5],
          [1.5, 0.5],
          [2.5, 0.5],
          [3.5, 0.5],
        ],
      },
    ],
    grooves: [
      { k: 'x...x.x.', s: '..X...X.', h: 'xxxxxxxx' },
      { k: 'x...x.x.', s: '..X...X.', h: 'x.x.x.x.' },
      { k: 'x..x..x.', s: '..X...X.', h: 'x.xxx.xx' },
    ],
    fill: { k: 'x...x...', s: '..X..xXX', t: '......xx', h: 'xxxxx...' },
    crash: true,
    sounds: {
      bass: ['punch-bass', 'finger-bass', 'slap-bass'],
      comp: ['combo-organ', 'guitar-steel', 'synth-brass', 'tonewheel'],
      kick: 'kick-punchy',
      snare: 'snare-tight',
      tom: 'tom-mid',
      cymbal: 'crash',
      hat: 'hat-closed',
    },
    vel: { bass: 108, comp: 70, drums: 104 },
  },
  {
    id: 'chiptune',
    name: 'Chiptune',
    about: 'Video game style: square-wave arpeggios, a bouncing octave bass, busy hi-hats',
    beatsPerBar: 4,
    halves: true,
    bass: [
      [
        [0, 0.5, 'R'],
        [0.5, 0.5, '8'],
        [1, 0.5, 'R'],
        [1.5, 0.5, '8'],
        [2, 0.5, 'R'],
        [2.5, 0.5, '8'],
        [3, 0.5, 'R'],
        [3.5, 0.5, '8'],
      ],
      [
        [0, 0.5, 'R'],
        [0.5, 0.5, 'R'],
        [1, 0.5, '5'],
        [1.5, 0.5, '8'],
        [2, 0.5, 'R'],
        [2.5, 0.5, 'R'],
        [3, 0.5, '5'],
        [3.5, 0.5, 'A'],
      ],
    ],
    comp: [{ arp: 0.25 }, { arp: 1 / 6 }],
    grooves: [
      { k: 'x...x.x.', s: '..X...X.', h: 'xxxxxxxx' },
      { k: 'x.x...x.', s: '....X...', h: 'xxxxxxxxxxxxxxxx' },
    ],
    fill: { k: 'x.x.x.x.', s: '....xxXX', h: 'xxxx....' },
    crash: false,
    sounds: {
      bass: ['lead-square', 'sub-bass'],
      comp: ['lead-square', 'lead-bright'],
      kick: 'kick-punchy',
      snare: 'snare-tight',
      tom: 'tom-high',
      cymbal: 'crash',
      hat: 'hat-closed',
    },
    vel: { bass: 96, comp: 66, drums: 92 },
  },
];

export const styleById = (id: string): Style => STYLES.find((s) => s.id === id) ?? STYLES[0];
