// The songs of the later neighborhoods (song.ts has the parade tune and the first ones), each
// the parade tune scored for its family's presets.
import { tune, v, times } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { BARS, MELODY, bpmFor, eachBar, up } from './song';
import { patchOf } from './notes';
import { rhythmTune } from './rhythm';

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

/**
 * The clock tower: the tune on a music box, celesta chords, a marimba bass, a woodblock's
 * tick-tock, and a tubular bell that rings on the sixth beat of every two bars, as the bell
 * curtains swing open (a beat of 9 ticks: two bars are the clock's 72).
 */
export function clockSong(): Uint8Array {
  return tune(bpmFor(9), [
    v(0, patchOf('music-box'), MELODY, 95),
    v(
      1,
      patchOf('celesta'),
      eachBar((b) => `r q, ${up(b.chord[0])} q, ${up(b.chord[1])} q, ${up(b.chord[2])} q`),
      55,
    ),
    v(
      2,
      patchOf('marimba'),
      eachBar((b) => `${b.root} h, ${b.fifth} h`),
      85,
    ),
    v(3, patchOf('woodblock'), times(16, 'G5 q, C5 q'), 35),
    v(4, patchOf('tubular-bells'), times(4, 'r w, r q, C5 q, r h'), 80),
  ]);
}

/** The farm: the band on the beat (the drum on one, the snare on two and four, the shaker on three, as the hooks light), the tune on a woodblock over the timpani (a beat of 8 ticks). */
export function farmSong(): Uint8Array {
  return tune(bpmFor(8), [
    v(0, patchOf('woodblock'), MELODY, 90),
    v(
      1,
      patchOf('timpani'),
      eachBar((b) => `${b.root} h, ${b.fifth} h`),
      80,
    ),
    v(2, patchOf('melodic-kick'), times(8, 'C3 q, r h.'), 90),
    v(3, patchOf('melodic-snare'), times(8, 'r q, D4 q, r q, D4 q'), 70),
    v(4, patchOf('melodic-hat'), times(8, 'r h, F#4 q, r q'), 60),
    v(5, patchOf('cowbell'), times(8, 'r h, r q, r e, G5 e'), 45),
  ]);
}

/** The attic: the tune on the song maker's own piano, its strings, bass, pluck and bell (a beat of 10 ticks). */
export function atticSong(): Uint8Array {
  return tune(bpmFor(10), [
    v(0, patchOf('piano'), MELODY, 100),
    v(
      1,
      patchOf('strings'),
      eachBar((b) => `[${b.chord.join(' ')}] w`),
      55,
    ),
    v(
      4,
      patchOf('bass'),
      eachBar((b) => `${b.root} q, r q, ${b.fifth} q, r q`),
      90,
    ),
    v(
      5,
      patchOf('pluck'),
      eachBar((b) => times(4, `r e, ${up(b.chord[1])} e`)),
      60,
    ),
    v(6, patchOf('bell'), times(4, 'r w, r h, C6 h'), 50),
  ]);
}

/**
 * Sound Check: the whole tune in rhythm mode, the drums out front. The snare plays in the odd
 * bars and the hi-hat in the even ones, as their doors take turns (they share an FM channel),
 * and the toms and the cymbal the same (a beat of 8 ticks: a bar is a door's 32).
 */
export function cardSong(): Uint8Array {
  const bars = (odd: string, even: string) => times(4, `${odd}, ${even}`);
  return rhythmTune(
    bpmFor(8),
    [
      v(0, patchOf('lead-bright'), MELODY, 95),
      v(
        1,
        patchOf('finger-bass'),
        eachBar((b) => `${b.root} q, ${b.root} q, ${b.fifth} q, ${b.root} q`),
        95,
      ),
      v(
        2,
        patchOf('pad-warm'),
        eachBar((b) => `[${b.chord.join(' ')}] w`),
        45,
      ),
      v(
        5,
        patchOf('trumpet'),
        eachBar((b) => `r h, r e, ${up(b.chord[2])} e, r q`),
        60,
      ),
    ],
    [
      { channel: 11, instrument: patchOf('kick-punchy'), notes: times(32, 'C2 q'), velocity: 100 },
      { channel: 12, instrument: patchOf('snare-tight'), notes: bars('r q, G3 q, r q, G3 q', 'r w'), velocity: 95 },
      { channel: 15, instrument: patchOf('hat-closed'), notes: bars('r w', times(8, 'G3 e')), velocity: 75 },
      { channel: 13, instrument: patchOf('tom-mid'), notes: bars('r h, C3 e, C3 e, C3 q', 'r w'), velocity: 85 },
      { channel: 14, instrument: patchOf('crash'), notes: bars('r w', 'C5 h, C5 h'), velocity: 70 },
    ],
  );
}
