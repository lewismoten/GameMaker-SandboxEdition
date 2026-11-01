// The parade tune's arrangements for levels 10-13: the rain on a steel tongue drum in D major
// (a step up from the tune's C).
import { tune, v, times } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { patchOf } from './notes';
import { MELODY, bpmFor, chordOf, eachBar, up } from './song';
import { RAIN_BEAT } from '../levels/rain';

/** The Rain Delay: the tune on a tongue drum in D, a soft pad, a light patter on the hat for the rain. */
export function rainSong(): Uint8Array {
  return tune(bpmFor(RAIN_BEAT), [
    v(0, patchOf('steel-drum'), MELODY, 85, 2),
    v(
      1,
      patchOf('pad-warm'),
      eachBar((b) => chordOf(b, 'w')),
      35,
      2,
    ),
    v(
      2,
      patchOf('marimba'),
      eachBar((b) => `${b.root} q, r q, ${up(b.fifth)} q, r q`),
      55,
      2,
    ),
    v(5, patchOf('melodic-hat'), times(8, 'A5 e, A5 s, A5 s, A5 e, A5 e, A5 s, A5 s, A5 e, A5 e, A5 e'), 25),
  ]);
}
