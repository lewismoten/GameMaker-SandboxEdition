// Level 14's song, Gwinn Hides Backstage: Gwinn's Theme on tiptoe, plucked short (every note
// cut to an eighth, with a rest after), over a quiet walking bass, with a new sneaking section
// of its own: creeping half steps that stop dead (a rest, as a light goes over), then a
// scurry up to the top, and the theme again.
import { arrange } from './music';
import { join, pluck, times } from './tunes';
import { GWINN_A, GWINN_B, GWINN_CHORDS } from './themes';

/** The new part: creep, freeze, creep, freeze, then the scurry (8 bars in A minor). */
const SNEAK =
  'E4 e, r e, F4 e, r e, E4 e, r e, D#4 e, r e, E4 e, r e, r q, r h, ' +
  'A4 e, r e, Bb4 e, r e, A4 e, r e, G#4 e, r e, A4 e, r e, r q, r h, ' +
  'C5 e, r e, B4 e, r e, C5 e, D5 e, E5 e, r e, F5 e, E5 e, D5 e, C5 e, B4 e, A4 e, G#4 e, B4 e, ' +
  'E5 e, r e, E4 e, r e, A4 q, r q, A3 e, r e, r q, r h';
const SNEAK_CHORDS = ['Am', 'E7', 'Dm', 'E7', 'Am', 'Dm', 'E7', 'Am'];

/** Each note of a phrase made short: an eighth, then a rest for the rest of its length. */
const tiptoe = (s: string) =>
  s
    .split(', ')
    .map((n) => {
      const [pitch, len] = n.split(' ');
      if (pitch === 'r' || len === 'e') return n;
      const rest = { q: 'r e', 'q.': 'r q', h: 'r e, r q', 'h.': 'r e, r q, r q' }[len];
      return rest ? `${pitch} e, ${rest}` : n;
    })
    .join(', ');

export function stageSong(): Uint8Array {
  return arrange({
    bpm: 104,
    mel: join(tiptoe(GWINN_A), tiptoe(GWINN_B), SNEAK, tiptoe(GWINN_A), tiptoe(GWINN_B)),
    chords: [...GWINN_CHORDS, ...SNEAK_CHORDS, ...GWINN_CHORDS],
    lead: pluck,
    leadVel: 100,
    comp: pluck,
    rhythm: 'r e re r e re',
    style: 'walk',
    beat: times(24, 'r q, C4 e, r e, r q, C4 e, r e'),
  });
}
