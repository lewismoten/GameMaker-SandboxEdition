// The parade tune's last arrangements: the test drive (the 8-track's driving music, a bouncy
// organ over a walking bass, a little brighter on Main Street) and the parade route, where each
// scene's song brings in the band sections joined so far (drums, then tubas and horns, then the
// kazoos and the whole Clown Club band).
import { tune, v, times } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { patchOf } from './notes';
import { MELODY, bpmFor, chordOf, eachBar, up } from './song';

/** The test drive's beat in ticks (two to a light's countdown bar). */
export const DRIVE_BEAT = 9;

/** The Test Drive, part `part` (0 round the block, 1 Main Street). */
export function driveSong(part: number): Uint8Array {
  return tune(bpmFor(DRIVE_BEAT), [
    v(0, patchOf(part ? 'synth-brass' : 'combo-organ'), MELODY, 85),
    v(
      1,
      patchOf('slap-bass'),
      eachBar((b) => `${b.root} q, ${b.fifth} q, ${up(b.root)} q, ${b.fifth} q`),
      80,
      -12,
    ),
    v(
      2,
      patchOf('pad-warm'),
      eachBar((b) => chordOf(b, 'w')),
      30,
    ),
    v(3, patchOf('melodic-kick'), times(8, 'C3 q, r q, C3 q, r q'), 70),
    v(4, patchOf('melodic-snare'), times(8, part ? 'r q, D4 q, r q, D4 e, D4 e' : 'r q, D4 q, r q, D4 q'), 55),
  ]);
}

/** The parade's beat in ticks (a march). */
export const PARADE_BEAT = 11;

/** The Parade Route, scene `part` (0-2): the band so far, a section more each scene. */
export function paradeSong(part: number): Uint8Array {
  const voices = [
    v(4, patchOf('melodic-snare'), times(8, 'D4 e, D4 e, D4 q, D4 e, D4 e, D4 q'), 60),
    v(3, patchOf('melodic-kick'), times(8, 'C3 q, r q, C3 q, r q'), 80),
    v(0, patchOf('trumpet'), MELODY, 90),
  ];
  if (part >= 1)
    voices.push(
      v(
        1,
        patchOf('tuba'),
        eachBar((b) => `${b.root} q, ${b.fifth} q, ${b.root} q, ${b.fifth} q`),
        80,
        -12,
      ),
      v(
        2,
        patchOf('pad-warm'),
        eachBar((b) => chordOf(b, 'w')),
        35,
      ),
    );
  if (part >= 2) voices.push(v(5, patchOf('kazoo'), MELODY, 60, 12));
  return tune(bpmFor(PARADE_BEAT), voices);
}
