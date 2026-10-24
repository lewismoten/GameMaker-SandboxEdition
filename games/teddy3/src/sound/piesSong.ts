// Level 10's song, Pie Practice: Doc Leo's Theme as a slapstick gallop on the whistle, with a
// new middle of its own: a figure that tumbles down and climbs back up (a pie flying in, a
// pratfall, up again), twice, then two hiccuping "who, me?" figures, a run down and a splat.
import { arrange } from './music';
import { TOY, WHISTLE, join, times } from './tunes';
import { LEO_A, LEO_B, LEO_CHORDS } from './themes';

/** The new part: tumble and climb, tumble and climb, then the splat (8 bars in F). */
const SPLAT =
  'C6 e, A5 e, F5 e, C5 e, r q, F4 q, G4 e, A4 e, Bb4 e, C5 e, D5 q, r q, ' +
  'D6 e, Bb5 e, G5 e, D5 e, r q, G4 q, A4 e, Bb4 e, C5 e, D5 e, E5 q, r q, ' +
  'F5 e, F5 e, r e, F5 e, A5 q, F5 q, G5 e, G5 e, r e, G5 e, Bb5 q, G5 q, ' +
  'A5 e, G5 e, F5 e, E5 e, D5 e, C5 e, Bb4 e, G4 e, F4 q, r q, C4 q, F4 q';
const SPLAT_CHORDS = ['F', 'C7', 'Gm', 'C7', 'F', 'Gm', 'C7', 'F'];

export function piesSong(): Uint8Array {
  return arrange({
    bpm: 150,
    mel: join(LEO_A, LEO_B, SPLAT, LEO_A, LEO_B),
    chords: [...LEO_CHORDS, ...SPLAT_CHORDS, ...LEO_CHORDS],
    lead: WHISTLE,
    comp: TOY,
    rhythm: 're e re e re e re e',
    style: 'gallop',
    beat: times(24, 'C4 e, r e, C4 e, r e, r q, C4 q'),
  });
}
