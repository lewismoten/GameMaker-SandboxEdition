// The parade tune and every arrangement of it, scored with the music editor's presets
// (web/src/audio/oplPresets.ts): each part of THE CHEZ that Doc Leo tunes up by ear has its own.
//
// Tempos sit on whole game ticks (the game clock is the music clock / 8), so a song and the
// blocks that animate with it never drift: a beat of 8 game ticks is 64 CMF ticks.
import { tune, v, times, join } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { patchOf } from './notes';

/** The tempo for a beat `ticks` game ticks long (146 CMF ticks a second, 8 to a game tick). */
export const bpmFor = (ticks: number) => (146 * 60) / (8 * ticks);

// ---- the parade tune: eight bars in C, a chord a bar
export const MELODY = join(
  'C5 q, E5 q, G5 q, E5 q',
  'F5 q, A5 q, G5 h',
  'E5 q, G5 q, C6 q, G5 q',
  'A5 q, G5 e, F5 e, E5 h',
  'D5 q, F5 q, A5 q, F5 q',
  'E5 q, G5 q, C6 h',
  'B4 q, D5 q, G5 q, F5 q',
  'E5 q, D5 q, C5 h',
);
/** Each bar's chord, low to high, and its bass root and fifth. */
export const BARS: { chord: string[]; root: string; fifth: string }[] = [
  { chord: ['C4', 'E4', 'G4'], root: 'C3', fifth: 'G2' },
  { chord: ['C4', 'F4', 'A4'], root: 'F2', fifth: 'C3' },
  { chord: ['C4', 'E4', 'G4'], root: 'C3', fifth: 'G2' },
  { chord: ['C4', 'F4', 'A4'], root: 'F2', fifth: 'C3' },
  { chord: ['D4', 'F4', 'A4'], root: 'D3', fifth: 'A2' },
  { chord: ['C4', 'E4', 'G4'], root: 'C3', fifth: 'G2' },
  { chord: ['B3', 'D4', 'G4'], root: 'G2', fifth: 'D3' },
  { chord: ['C4', 'E4', 'G4'], root: 'C3', fifth: 'G2' },
];
export const chordOf = (b: (typeof BARS)[number], len: string) => `[${b.chord.join(' ')}] ${len}`;
export const eachBar = (fn: (b: (typeof BARS)[number]) => string) => join(...BARS.map(fn));
/** Up an octave (for a part that sits above the chords). */
export const up = (n: string) => n.replace(/(\d)/, (d) => String(Number(d) + 1));

/** The menu: the tune on a kazoo over the piano's oom-pah, a parade drum on melody tracks. */
export function menuSong(): Uint8Array {
  return tune(bpmFor(9), [
    v(0, patchOf('kazoo'), MELODY, 100),
    v(
      1,
      patchOf('piano-mellow'),
      eachBar((b) => `${b.root} q, ${chordOf(b, 'q')}, ${b.fifth} q, ${chordOf(b, 'q')}`),
      75,
    ),
    v(4, patchOf('melodic-kick'), times(8, 'C3 q, r q, C3 q, r q'), 80),
    v(5, patchOf('melodic-snare'), times(8, 'r q, D4 e, D4 e, r q, D4 q'), 70),
  ]);
}

/** Jump Start: the garage at dawn, the tune on a muted trumpet, a tuba and a brushed snare, brisk. */
export function jumpSong(): Uint8Array {
  return tune(bpmFor(9), [
    v(0, patchOf('trumpet'), MELODY, 90),
    v(
      1,
      patchOf('tuba'),
      eachBar((b) => `${b.root} q, r q, ${b.fifth} q, r q`),
      90,
    ),
    v(
      2,
      patchOf('piano-mellow'),
      eachBar((b) => `r q, ${chordOf(b, 'q')}, r q, ${chordOf(b, 'q')}`),
      55,
    ),
    v(5, patchOf('melodic-snare'), times(8, 'r q, D4 q, r q, D4 e, D4 e'), 55),
  ]);
}

/** Spark Plucks: a harp runs the chords under a bright square lead, a sweeping pad, electric. */
export function sparkSong(): Uint8Array {
  return tune(bpmFor(10), [
    v(0, patchOf('lead-square'), MELODY, 70),
    v(
      1,
      patchOf('harp'),
      eachBar((b) => times(2, [...b.chord, up(b.chord[0])].map((n) => `${n} e`).join(', '))),
      70,
    ),
    v(
      2,
      patchOf('pad-sweep'),
      eachBar((b) => chordOf(b, 'w')),
      45,
    ),
    v(
      5,
      patchOf('sub-bass'),
      eachBar((b) => `${b.root} h, ${b.fifth} h`),
      85,
    ),
  ]);
}

/** The Timing Beat's beat: 12 game ticks (91 BPM); a step of the pipes is an eighth. */
export const BEAT = 12;

/**
 * The Timing Beat's verses, quiet under the notes Doc Leo plays (four lanes, four pitches):
 * soft chords and a walking bass, two bars a loop of the pipes (eight bars in all). The third
 * verse is a waltz: six eighths a bar, two bars a loop.
 */
export function beatSong(verse: number): Uint8Array {
  if (verse === 2)
    return tune(bpmFor(BEAT), [
      v(
        0,
        patchOf('epiano-round'),
        eachBar((b) => `${b.root} q, ${chordOf(b, 'q')}, ${chordOf(b, 'q')}`),
        55,
      ),
      v(
        3,
        patchOf('music-box'),
        eachBar((b) => `${up(up(b.chord[2]))} h.`),
        40,
      ),
    ]);
  const comp =
    verse === 0
      ? (b: (typeof BARS)[number]) => `${chordOf(b, 'h')}, ${chordOf(b, 'h')}`
      : (b: (typeof BARS)[number]) => `r e, ${chordOf(b, 'q')}, r e, r e, ${chordOf(b, 'q')}, r e`;
  return tune(bpmFor(BEAT), [
    v(0, patchOf('epiano-round'), eachBar(comp), 55),
    v(
      3,
      patchOf('piano-mellow'),
      eachBar((b) => `${b.root} q, ${b.chord[0].replace(/\d/, '3')} q, ${b.fifth} q, ${b.chord[1].replace(/\d/, '3')} q`),
      75,
    ),
  ]);
}

/** Oil's Well: slow and slick, the tune on a soft reed over an upright bass and a vibraphone. */
export function oilSong(): Uint8Array {
  return tune(bpmFor(13), [
    v(0, patchOf('reed-soft'), MELODY, 70),
    v(
      1,
      patchOf('upright-bass'),
      eachBar((b) => `${b.root} q, ${b.fifth} q, ${b.root} q, ${b.fifth} q`),
      85,
    ),
    v(
      2,
      patchOf('vibraphone'),
      eachBar((b) => `r q, ${chordOf(b, 'h')}, r q`),
      45,
    ),
  ]);
}

/** The ending: the tune's last line, the band all together, then a held chord. */
export function wonSong(): Uint8Array {
  return tune(bpmFor(9), [
    v(0, patchOf('trumpet'), 'B4 q, D5 q, G5 q, F5 q, E5 q, D5 q, C5 h, C6 w', 100),
    v(1, patchOf('piano-bright'), 'G3 h, G3 h, C4 h, C4 h, [C4 E4 G4] w', 80),
    v(5, patchOf('orchestra'), '[B3 D4 G4] w, [C4 E4 G4] w, [C4 E4 G4] w', 60),
  ]);
}

/** Game over: the tune's opening, slowly, on a lone music box. Even this is friendly. */
export function lostSong(): Uint8Array {
  return tune(bpmFor(14), [v(0, patchOf('music-box'), 'C5 q, E5 q, G5 q, E5 q, F5 q, D5 q, C5 h', 80)]);
}
