// The songs of the later neighborhoods (song.ts has the parade tune and the first ones), each
// the parade tune scored for its family's presets.
import { tune, v, times } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { BARS, MELODY, bpmFor, eachBar, up } from './song';
import { patchOf } from './notes';

/** Rests for the first `bars` bars, then `fn`'s notes for the rest. */
const from = (bars: number, fn: (b: (typeof BARS)[number]) => string) => BARS.map((b, i) => (i < bars ? 'r w' : fn(b))).join(', ');

/**
 * The choir loft: the tune sung soprano, and the choir coming in under it a voice a bar (each a
 * long note of the bar's chord, low to high) until nine voices sing in the last bar; then it
 * starts again from the one. Slow (a beat of 12 ticks).
 */
export function choirSong(): Uint8Array {
  const parts: [string, (b: (typeof BARS)[number]) => string][] = [
    ['ooh', (b) => b.root],
    ['ooh', (b) => up(b.fifth)],
    ['aah', (b) => b.chord[0]],
    ['aah', (b) => b.chord[1]],
    ['aah', (b) => b.chord[2]],
    ['choir', (b) => up(b.chord[0])],
    ['choir', (b) => up(b.chord[1])],
    ['soprano', (b) => up(b.chord[2])],
  ];
  return tune(bpmFor(12), [
    v(0, patchOf('soprano'), MELODY, 90),
    ...parts.map(([id, note], j) =>
      v(
        j + 1,
        patchOf(id),
        from(j, (b) => `${note(b)} w`),
        45,
      ),
    ),
  ]);
}

/** The basement: the tune on a fretless bass, a sub-bass under it, slap pops, and a woodblock click on every beat (a beat of 8 ticks, the metronome floor's). */
export function basementSong(): Uint8Array {
  return tune(bpmFor(8), [
    v(0, patchOf('fretless'), MELODY, 100, -12),
    v(
      1,
      patchOf('sub-bass'),
      eachBar((b) => `${b.root} w`),
      95,
      -12,
    ),
    v(
      2,
      patchOf('slap-bass'),
      eachBar((b) => times(4, `r e, ${b.root} e`)),
      70,
    ),
    v(3, patchOf('woodblock'), times(32, 'C5 q'), 45),
  ]);
}
