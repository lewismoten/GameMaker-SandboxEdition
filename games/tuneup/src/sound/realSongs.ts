// The parade tune's arrangements for the dream's swim and the real tune-up (levels 5-9), on the
// music editor's presets: a slow wobble under water, a kazoo fan band (hotter in its second
// verse), a breakbeat for Brake Dance, a mysterious magic-show waltz-time vamp for the shell
// game, a bouncy calliope-ish pump tune, and a hushed music-box lullaby for Muffled.
import { tune, v, times } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { patchOf } from './notes';
import { BARS, MELODY, bpmFor, chordOf, eachBar, up } from './song';
import { FAN_BEAT } from '../levels/fan';
import { BRAKE_BEAT } from '../levels/brake';

/** The Fan Band: a kazoo on the tune, a tuba, a snare; the hot verse adds a second kazoo and a busier snare. */
export function fanSong(verse: number): Uint8Array {
  const hot = verse === 1;
  return tune(bpmFor(FAN_BEAT), [
    v(0, patchOf('kazoo'), MELODY, 95),
    ...(hot
      ? [
          v(
            1,
            patchOf('kazoo'),
            eachBar((b) => `${b.chord[1]} q, ${b.chord[2]} q, ${b.chord[1]} q, ${b.chord[2]} q`),
            55,
          ),
        ]
      : []),
    v(
      2,
      patchOf('tuba'),
      eachBar((b) => `${b.root} q, r q, ${b.fifth} q, r q`),
      85,
    ),
    v(5, patchOf('melodic-snare'), times(8, hot ? 'D4 e, D4 e, r q, D4 e, D4 e, r q' : 'r q, D4 q, r q, D4 q'), 55),
  ]);
}

/** Brake Dance: a breakbeat (kick, snare, hat on melodic channels), a slap bass, stabs of the tune's chords. */
export function brakeSong(): Uint8Array {
  return tune(bpmFor(BRAKE_BEAT), [
    v(
      0,
      patchOf('synth-brass'),
      eachBar((b) => `r e, ${chordOf(b, 'e')}, r q, r e, ${chordOf(b, 'e')}, r q`),
      60,
    ),
    v(
      1,
      patchOf('slap-bass'),
      eachBar((b) => `${b.root} e, ${b.root} e, r e, ${b.fifth} e, r e, ${b.root} e, ${b.fifth} e, r e`),
      90,
    ),
    v(3, patchOf('melodic-kick'), times(8, 'C3 q, r e, C3 e, r q, C3 q'), 85),
    v(4, patchOf('melodic-snare'), times(8, 'r q, D4 q, r e, D4 e, D4 q'), 70),
    v(5, patchOf('melodic-hat'), times(8, 'A5 e, A5 e, A5 e, A5 e, A5 e, A5 e, A5 e, A5 e'), 40),
  ]);
}

/** Hubcaps and Balls: a magician's vamp, the tune on a clarinet over pizzicato strings, a drumroll for the reveal. */
export function cupsSong(fast: boolean): Uint8Array {
  return tune(bpmFor(fast ? 8 : 11), [
    v(0, patchOf('clarinet'), MELODY, 80),
    v(
      1,
      patchOf('pizzicato'),
      eachBar((b) => `${b.root} q, ${b.chord[1]} q, ${b.fifth} q, ${b.chord[2]} q`),
      70,
    ),
    v(5, patchOf('melodic-snare'), times(8, 'D4 s, D4 s, D4 s, D4 s, r q, r h'), 35),
  ]);
}

/** Pump Up the Volume: the tune on a bouncy combo organ, an oom-pah tuba, glockenspiel squeaks. */
export function pumpSong(): Uint8Array {
  return tune(bpmFor(9), [
    v(0, patchOf('combo-organ'), MELODY, 85),
    v(
      1,
      patchOf('tuba'),
      eachBar((b) => `${b.root} q, r q, ${b.fifth} q, r q`),
      85,
    ),
    v(
      2,
      patchOf('glockenspiel'),
      eachBar((b) => `r h, ${up(b.chord[2])} e, ${up(b.chord[1])} e, r q`),
      45,
    ),
  ]);
}

/** Muffled: a hushed music-box lullaby, slow, with a soft low hum like a dog snoring. */
export function muffledSong(): Uint8Array {
  return tune(bpmFor(15), [
    v(0, patchOf('music-box'), MELODY, 60),
    v(
      1,
      patchOf('ooh'),
      eachBar((b) => `${b.root.replace(/\d/, '3')} w`),
      30,
    ),
    v(2, patchOf('pad-warm'), BARS.map((b) => chordOf(b, 'w')).join(', '), 25),
  ]);
}
