// Level 9's song, Gwinn's Buried Treasure: Gwinn's Theme low and plucky (banjo, an octave
// down, over a walking bass), with a new digging section of its own: a stubborn little riff
// that keeps going down a step, then climbs back up.
import { arrange } from './music';
import { BANJO, join, pluck, times } from './tunes';
import { GWINN_A, GWINN_B, GWINN_CHORDS } from './themes';

/** The new part: digging down (each phrase a step lower), then the climb back up (8 bars). */
const DIGGING =
  'A4 e, A4 e, E4 e, A4 e, C5 q, B4 q, G4 e, G4 e, D4 e, G4 e, B4 q, A4 q, F4 e, F4 e, C4 e, F4 e, A4 q, G4 q, E4 e, E4 e, B3 e, E4 e, G#4 h, ' +
  'E4 e, G#4 e, B4 e, E5 e, D5 q, B4 q, F4 e, A4 e, C5 e, F5 e, E5 q, C5 q, D5 e, C5 e, B4 e, A4 e, G#4 q, B4 q, A4 h, r h';
const DIGGING_CHORDS = ['Am', 'G', 'F', 'E7', 'E7', 'F', 'E7', 'Am'];

/** Gwinn's Theme an octave down. */
const low = (s: string) => s.replace(/([A-G][#b]?)(\d)/g, (_m, n: string, o: string) => `${n}${Number(o) - 1}`);

export function digSong(): Uint8Array {
  return arrange({
    bpm: 112,
    mel: join(low(GWINN_A), low(GWINN_B), DIGGING, low(GWINN_A), low(GWINN_B)),
    chords: [...GWINN_CHORDS, ...DIGGING_CHORDS, ...GWINN_CHORDS],
    lead: BANJO,
    comp: pluck,
    rhythm: 're e re e re e re e',
    style: 'walk',
    beat: times(24, 'C4 q, r q, C4 e, C4 e, r q'),
  });
}
