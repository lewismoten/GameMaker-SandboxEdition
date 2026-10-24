// Level 4's song, Gwinn's Invitations: Gwinn's Theme as a brisk street march on the calliope,
// with a new middle section of its own (a doorbell call-and-answer: two high notes, a low
// reply) over a marching tuba, then the theme again.
import { arrange } from './music';
import { CALLIOPE, TUBA, bell, join, times } from './tunes';
import { GWINN_A, GWINN_B, GWINN_CHORDS } from './themes';

/** The new part: ding-dong phrases, each answered a step lower (8 bars in A minor). */
const DOORBELL =
  'E5 q, C5 q, r e, A4 e, B4 e, C5 e, D5 q, B4 q, r e, G#4 e, A4 e, B4 e, C5 q, A4 q, r e, F4 e, G4 e, A4 e, B4 h, E5 h, ' +
  'A5 q, E5 q, r e, C5 e, D5 e, E5 e, F5 q, D5 q, r e, B4 e, C5 e, D5 e, E5 q, C5 e, B4 e, A4 q, G#4 q, A4 h, r h';
const DOORBELL_CHORDS = ['Am', 'E7', 'F', 'E7', 'Am', 'Dm', 'E7', 'Am'];

export function inviteSong(): Uint8Array {
  return arrange({
    bpm: 128,
    mel: join(GWINN_A, GWINN_B, DOORBELL, GWINN_A, GWINN_B),
    chords: [...GWINN_CHORDS, ...DOORBELL_CHORDS, ...GWINN_CHORDS],
    lead: CALLIOPE,
    comp: bell,
    rhythm: 'r q r q',
    bass: TUBA,
    style: 'oompah',
    beat: times(24, 'r q, C4 e, C4 e, r q, C4 q'),
  });
}
