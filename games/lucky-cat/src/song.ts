// LUCKY CAT's six songs, all written for this game and arranged here for the OPL2 with the kit's writer (kit/song.ts:
// rhythm mode, six melodic voices and the chip's drums). Each plays its A and B sections as AABA.
//   theme    "Thirteen Steps": noir swing in D minor (electric piano, walking bass, ride) for the street levels
//   mirror   "Backwards Tango": a sly tango in A minor (reed, oom-pah bass) for the funhouse
//   rascal   "Rascal's Morning": a ragtime shuffle in F (piano and bells) for the morning, played as Rascal
//   fair     "Thirteenth Chime": fast surf rock in E minor (square lead, eighth-note bass) for the race to the fair
//   tower    "Clockwork": a ticking march in B minor (bells) for the clock tower
//   finale   "Payback": a driving minor-key rocker in G minor (brass over square) for the roof and the ending
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { CELESTA, EPIANO, ORGAN, REED, Writer, type Part, type Section } from '@lewismoten/gamemaker-sandbox-tools/kit/song';

export const SONGS = ['theme', 'mirror', 'rascal', 'fair', 'tower', 'finale'] as const;
export type SongName = (typeof SONGS)[number];

type Band = Omit<Part, 'section' | 'drums'> & { drumsA: string[]; drumsB: string[] };

interface Tune {
  bpm: number;
  band: Band;
  A: Section;
  B: Section;
}

const bars = (s: string): string[] => s.split('|').map((b) => b.trim());

const TUNES: Record<SongName, Tune> = {
  theme: {
    bpm: 128,
    band: {
      lead: EPIANO,
      leadVel: 110,
      second: 'octave',
      secondPatch: CELESTA,
      secondVel: 40,
      bass: 'walk',
      bassVel: 100,
      comp: 'r e, x e, r q, r e, x e, r q',
      compPatch: ORGAN,
      compVel: 55,
      drumsA: ['ride'],
      drumsB: ['ride', 'ride', 'ride', 'shuffle'],
    },
    A: {
      chords: bars('Dm | Dm | Gm | A7 | Dm | A# | Gm A7 | Dm'),
      tune: bars(
        'D5 q, F5 e, A5 e, r e, G#5 e, A5 q | D6 q., C6 e, A5 h | G5 e, A5 e, A#5 q, D6 q, A#5 q | A5 q, C#6 q, E6 q, r q | F5 e, E5 e, D5 e, F5 e, A5 q, D6 q | D6 e, C6 e, A#5 q, F5 h | G5 q, A#5 q, A5 q, C#6 q | D6 h., r q',
      ),
    },
    B: {
      chords: bars('A# | F | Gm | A7 | Dm | Gm | E7 A7 | Dm'),
      tune: bars(
        'F5 q, A#5 q, D6 q, F6 q | E6 e, D6 e, C6 q, A5 h | G5 q., A#5 e, D6 q, G6 q | F6 e, E6 e, C#6 e, A5 e, E5 h | D5 e, F5 e, A5 e, D6 e, F6 q, E6 q | D6 q, A#5 q, G5 h | G#5 q, B5 q, A5 q, C#6 q | D6 q, A5 q, D5 h',
      ),
    },
  },
  mirror: {
    bpm: 108,
    band: {
      lead: REED,
      leadVel: 112,
      second: 'none',
      bass: 'pump',
      bassVel: 100,
      comp: 'x q., x e, r q, x q',
      compPatch: INSTRUMENTS.strings,
      compVel: 55,
      drumsA: ['camel'],
      drumsB: ['camel', 'camel', 'camel', 'march'],
    },
    A: {
      chords: bars('Am | Am | Dm | E7 | Am | F | E7 | Am'),
      tune: bars(
        'A5 q., E5 e, A5 e, B5 e, C6 q | B5 e, A5 e, G#5 e, A5 e, E5 h | D6 q., C6 e, B5 e, A5 e, F5 q | E5 q, G#5 q, B5 q, D6 q | C6 q., B5 e, A5 e, C6 e, E6 q | F6 e, E6 e, D6 e, C6 e, A5 h | B5 q., A5 e, G#5 q, B5 q | A5 h., r q',
      ),
    },
    B: {
      chords: bars('C | G | Am | E7 | F | C | Dm E7 | Am'),
      tune: bars(
        'E6 q., D6 e, C6 q, G5 q | D6 e, C6 e, B5 e, D6 e, G5 h | C6 q., B5 e, A5 q, E5 q | G#5 e, A5 e, B5 e, D6 e, E6 h | F6 q., E6 e, D6 q, C6 q | E6 e, D6 e, C6 e, G5 e, E5 h | F5 q, A5 q, G#5 q, B5 q | A5 h, E5 q, A4 q',
      ),
    },
  },
  rascal: {
    bpm: 140,
    band: {
      lead: INSTRUMENTS.piano,
      leadVel: 112,
      second: 'octave',
      secondPatch: INSTRUMENTS.bell,
      secondVel: 45,
      bass: 'pump',
      bassVel: 105,
      comp: 'r e, x e, r e, x e, r e, x e, r e, x e',
      compPatch: INSTRUMENTS.piano,
      compVel: 50,
      drumsA: ['shuffle'],
      drumsB: ['shuffle', 'shuffle', 'shuffle', 'rockFill'],
    },
    A: {
      chords: bars('F | D7 | G7 | C7 | F | A7 | Dm G7 | C7'),
      tune: bars(
        'A5 e, C6 e, F6 e, C6 e, A5 e, C6 e, F6 q | F#5 e, A5 e, D6 e, A5 e, F#6 q, D6 q | G5 e, B5 e, D6 e, F6 e, E6 e, D6 e, B5 q | C6 q, E5 e, G5 e, A#5 h | A5 e, C6 e, F6 e, A6 e, G6 e, F6 e, C6 q | C#6 e, E6 e, A6 e, E6 e, C#6 h | D6 q, F6 q, B5 q, D6 q | C6 e, D6 e, E6 e, G6 e, C6 h',
      ),
    },
    B: {
      chords: bars('A# | F | G7 | C7 | A# | F | G7 C7 | F'),
      tune: bars(
        'D6 e, F6 e, A#6 e, F6 e, D6 h | C6 e, A5 e, F5 e, A5 e, C6 h | B5 e, D6 e, F6 e, D6 e, B5 q, G5 q | E5 e, G5 e, A#5 e, C6 e, E6 h | F6 q., D6 e, A#5 q, F5 q | A5 e, C6 e, F6 e, C6 e, A5 h | G5 q, B5 q, A#5 q, E6 q | F6 h., r q',
      ),
    },
  },
  fair: {
    bpm: 168,
    band: {
      lead: INSTRUMENTS.lead,
      leadVel: 110,
      second: 'double',
      secondPatch: INSTRUMENTS.brass,
      secondVel: 60,
      bass: 'eighths',
      bassVel: 105,
      comp: 'x e, r e, x e, r e, x e, r e, x e, x e',
      compPatch: INSTRUMENTS.pluck,
      compVel: 60,
      drumsA: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'],
      drumsB: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'],
    },
    A: {
      chords: bars('Em | Em | C | D | Em | Em | C B7 | Em'),
      tune: bars(
        'E5 e, E5 e, G5 e, E5 e, B5 q, A5 e, G5 e | F#5 e, G5 e, F#5 e, E5 e, B4 h | C5 e, E5 e, G5 e, C6 e, B5 q, G5 q | A5 e, F#5 e, D5 e, F#5 e, A5 h | E5 e, G5 e, B5 e, E6 e, D6 e, B5 e, G5 q | E6 q, D6 e, B5 e, G5 e, B5 e, E5 q | C6 q, B5 q, D#6 q, F#6 q | E6 h., r q',
      ),
    },
    B: {
      chords: bars('Am | Em | Am | B7 | C | G | Am B7 | Em'),
      tune: bars(
        'A5 e, C6 e, E6 e, C6 e, A5 q, E5 q | G5 e, B5 e, E6 e, B5 e, G5 h | A5 e, C6 e, E6 e, A6 e, G6 q, E6 q | F#6 e, D#6 e, B5 e, F#5 e, D#5 h | E6 e, E6 e, G6 e, E6 e, C6 h | D6 e, D6 e, G6 e, D6 e, B5 h | C6 q, E6 q, D#6 q, F#6 q | E6 q, B5 q, E5 h',
      ),
    },
  },
  tower: {
    bpm: 116,
    band: {
      lead: INSTRUMENTS.bell,
      leadVel: 112,
      second: 'double',
      secondPatch: EPIANO,
      secondVel: 50,
      bass: 'half',
      bassVel: 100,
      comp: 'x e, x e, x e, x e, x e, x e, x e, x e',
      compPatch: INSTRUMENTS.pluck,
      compVel: 45,
      drumsA: ['march'],
      drumsB: ['march', 'march', 'march', 'rockFill'],
    },
    A: {
      chords: bars('Bm | F#7 | Bm | F#7 | G | D | Em F#7 | Bm'),
      tune: bars(
        'B5 e, F#5 e, B5 e, D6 e, F#6 q, D6 q | C#6 e, A#5 e, F#5 e, A#5 e, C#6 h | D6 e, B5 e, F#5 e, B5 e, D6 q, F#6 q | E6 e, C#6 e, A#5 e, C#6 e, F#6 h | G6 q, D6 q, B5 q, G5 q | F#6 q, D6 q, A5 q, F#5 q | G5 q, B5 q, A#5 q, C#6 q | B5 h., r q',
      ),
    },
    B: {
      chords: bars('G | A | F#m | Bm | G | A | F#7 | Bm'),
      tune: bars(
        'B5 q, D6 q, G6 h | A5 q, C#6 q, E6 h | F#6 e, E6 e, C#6 e, A5 e, F#5 h | B5 e, C#6 e, D6 e, E6 e, F#6 h | G6 e, F#6 e, E6 e, D6 e, B5 h | A5 e, B5 e, C#6 e, E6 e, A6 h | A#6 q, F#6 q, C#6 q, A#5 q | B5 q, F#5 q, B4 h',
      ),
    },
  },
  finale: {
    bpm: 156,
    band: {
      lead: INSTRUMENTS.brass,
      leadVel: 115,
      second: 'octave',
      secondPatch: INSTRUMENTS.lead,
      secondVel: 50,
      bass: 'eighths',
      bassVel: 110,
      comp: 'x e, r e, x e, x e, r e, x e, r e, x e',
      compPatch: ORGAN,
      compVel: 55,
      drumsA: ['crash', 'rock', 'rock', 'rock', 'rock', 'rock', 'rock', 'rockFill'],
      drumsB: ['crash', 'hop', 'hop', 'hop', 'crash', 'hop', 'hop', 'rockFill'],
    },
    A: {
      chords: bars('Gm | Gm | D# | F | Gm | Gm | D# D7 | Gm'),
      tune: bars(
        'G5 e, G5 e, A#5 e, G5 e, D6 q, C6 e, A#5 e | A5 e, A#5 e, A5 e, G5 e, D5 h | D#5 e, G5 e, A#5 e, D#6 e, D6 q, A#5 q | C6 e, A5 e, F5 e, A5 e, C6 h | G5 e, A#5 e, D6 e, G6 e, F6 e, D6 e, A#5 q | G6 q, F6 e, D6 e, A#5 e, D6 e, G5 q | D#6 q, D6 q, F#6 q, A6 q | G6 h., r q',
      ),
    },
    B: {
      chords: bars('Cm | Gm | Cm | D7 | D# | A# | Cm D7 | Gm'),
      tune: bars(
        'C6 e, D#6 e, G6 e, D#6 e, C6 q, G5 q | A#5 e, D6 e, G6 e, D6 e, A#5 h | C6 e, D#6 e, G6 e, C7 e, A#6 q, G6 q | A6 e, F#6 e, D6 e, A5 e, F#5 h | G6 e, G6 e, A#6 e, G6 e, D#6 h | F6 e, F6 e, A#6 e, F6 e, D6 h | D#6 q, G6 q, F#6 q, A6 q | G6 q, D6 q, G5 h',
      ),
    },
  },
};

/** A song as a .CMF file: AABA. */
export function song(name: SongName): Uint8Array {
  const { bpm, band, A, B } = TUNES[name];
  const { drumsA, drumsB, ...rest } = band;
  const w = new Writer(bpm);
  w.part({ ...rest, section: A, drums: drumsA });
  w.part({ ...rest, section: A, drums: drumsA });
  w.part({ ...rest, section: B, drums: drumsB });
  w.part({ ...rest, section: A, drums: drumsA });
  return w.cmf();
}
