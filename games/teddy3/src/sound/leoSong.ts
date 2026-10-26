// Doc Leo's Balloons (Level 6): Doc Leo's Theme as a soft-shoe on the calliope, with a new
// squeaky "balloon twisting" middle (a rising toy-piano figure that pops at the top).
import { arrange, twice } from './music';
import { CALLIOPE, TOY, join } from './tunes';
import { LEO_A, LEO_B, LEO_CHORDS } from './themes';

const TWIST = 'F5 e, G5 e, A5 e, C6 e, A5 q, r q, D5 e, E5 e, F5 e, A5 e, G5 q, r q, Bb4 e, C5 e, D5 e, F5 e, E5 q, G5 q, F5 h, r h';

export function leoSong(): Uint8Array {
  return arrange({
    bpm: 120,
    mel: join(LEO_A, LEO_B, TWIST, LEO_B),
    chords: [...LEO_CHORDS, 'F', 'C7', 'Gm', 'F', ...LEO_CHORDS.slice(4)],
    lead: CALLIOPE,
    comp: TOY,
    rhythm: 're e re e re e re e',
    style: 'oompah',
  });
}
void twice;
