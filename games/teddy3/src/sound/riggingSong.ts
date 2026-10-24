// Level 15's song, Doc Leo Hangs the Lights: Doc Leo's Theme up high, an octave up on the
// bells over soft held chords, with a new middle of its own: a climbing figure, each
// step a little higher than the last (one catwalk up, then the next), and a long held note
// at the top of the tent before the theme comes back.
import { arrange } from './music';
import { bell, join, pad } from './tunes';
import { LEO_A, LEO_B, LEO_CHORDS } from './themes';

/** A phrase an octave higher. */
const up = (s: string) => s.replace(/([A-G][#b]?)(\d)/g, (_, n: string, o: string) => `${n}${Number(o) + 1}`);

/** The new part: four climbing steps, then the view from the top (8 bars in F). */
const CLIMB =
  'F5 e, G5 e, A5 q, G5 e, A5 e, Bb5 q, A5 e, Bb5 e, C6 q, D6 h, ' +
  'G5 e, A5 e, Bb5 q, A5 e, Bb5 e, C6 q, Bb5 e, C6 e, D6 q, E6 h, ' +
  'F6 h., E6 q, D6 q, C6 q, Bb5 q, A5 q, ' +
  'G5 q, A5 q, Bb5 q, C6 q, F5 w';
const CLIMB_CHORDS = ['F', 'Bb', 'Gm', 'C7', 'F', 'Dm', 'Gm', 'C7'];

export function riggingSong(): Uint8Array {
  return arrange({
    bpm: 112,
    mel: join(up(LEO_A), up(LEO_B), CLIMB, up(LEO_A), up(LEO_B)),
    chords: [...LEO_CHORDS, ...CLIMB_CHORDS, ...LEO_CHORDS],
    lead: bell,
    comp: pad,
    rhythm: 'h h',
    style: 'half',
  });
}
