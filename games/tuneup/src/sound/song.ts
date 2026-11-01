// The parade tune and every arrangement of it, scored with the music editor's presets
// (web/src/audio/oplPresets.ts) so each neighborhood sounds like its family of instruments.
// The bandstand plays the tune with one more family each time Teddy brings one home.
//
// Tempos sit on whole game ticks (the game clock is the music clock / 8), so a song and the
// blocks that animate with it never drift: a beat of 8 game ticks is 64 CMF ticks.
import { tune, v, times, join } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { patchOf } from './notes';

/** The tempo for a beat `ticks` game ticks long (146 CMF ticks a second, 8 to a game tick). */
export const bpmFor = (ticks: number) => (146 * 60) / (8 * ticks);
/** The Player Piano's beat: 10 game ticks (109.2 BPM); an eighth (a step of the tubes) is 5. */
export const RAIL_BEAT = 10;

// ---- the parade tune: eight bars in C, a chord a bar
const MELODY = join(
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
const BARS: { chord: string[]; root: string; fifth: string }[] = [
  { chord: ['C4', 'E4', 'G4'], root: 'C3', fifth: 'G2' },
  { chord: ['C4', 'F4', 'A4'], root: 'F2', fifth: 'C3' },
  { chord: ['C4', 'E4', 'G4'], root: 'C3', fifth: 'G2' },
  { chord: ['C4', 'F4', 'A4'], root: 'F2', fifth: 'C3' },
  { chord: ['D4', 'F4', 'A4'], root: 'D3', fifth: 'A2' },
  { chord: ['C4', 'E4', 'G4'], root: 'C3', fifth: 'G2' },
  { chord: ['B3', 'D4', 'G4'], root: 'G2', fifth: 'D3' },
  { chord: ['C4', 'E4', 'G4'], root: 'C3', fifth: 'G2' },
];
const chordOf = (b: (typeof BARS)[number], len: string) => `[${b.chord.join(' ')}] ${len}`;
const eachBar = (fn: (b: (typeof BARS)[number]) => string) => join(...BARS.map(fn));
/** Up an octave (for a part that sits above the chords). */
const up = (n: string) => n.replace(/(\d)/, (d) => String(Number(d) + 1));

// ---- the parts each family adds at the bandstand
type Part = ReturnType<typeof v>[];
const keysPart = (): Part => [
  v(0, patchOf('piano-bright'), MELODY, 110),
  // the left hand: oom-pah, root and fifth
  v(
    1,
    patchOf('piano-mellow'),
    eachBar((b) => `${b.root} q, ${b.fifth} q, ${b.root} q, ${b.fifth} q`),
    90,
  ),
];
const stringsPart = (): Part => [
  v(
    2,
    patchOf('orchestra'),
    eachBar((b) => chordOf(b, 'w')),
    70,
  ),
  // pizzicato on the off-beats, the chord's top note an octave up
  v(
    5,
    patchOf('pizzicato'),
    eachBar((b) => times(4, `r e, ${up(b.chord[2])} e`)),
    85,
  ),
];

// Each chord note takes a channel of its own (one OPL voice each), so with more than two
// families home the strings' chord drops its middle note to leave a voice for each new part.
const stringsPair = (): Part => [
  v(
    2,
    patchOf('orchestra'),
    eachBar((b) => `[${b.chord[0]} ${b.chord[2]}] w`),
    70,
  ),
  v(
    4,
    patchOf('pizzicato'),
    eachBar((b) => times(4, `r e, ${up(b.chord[2])} e`)),
    85,
  ),
];
const synthPart = (): Part => [
  v(
    5,
    patchOf('pad-warm'),
    eachBar((b) => `${up(b.chord[1])} w`),
    60,
  ),
];
const organPart = (): Part => [
  v(
    6,
    patchOf('accordion'),
    eachBar((b) => `${up(b.root)} h, ${up(b.fifth)} h`),
    55,
  ),
];
const brassPart = (): Part => [
  v(
    7,
    patchOf('trumpet'),
    eachBar((b) => `r h, ${up(b.chord[0])} e, ${up(b.chord[1])} e, ${up(b.chord[2])} q`),
    80,
  ),
];
const windsPart = (): Part => [
  v(
    8,
    patchOf('flute'),
    eachBar((b) => `${up(b.chord[2])} h, ${up(b.chord[1])} h`),
    70,
  ),
];
/** The parts each family adds, after the keys and strings (FAMILIES' order). */
const LATER = [synthPart, organPart, brassPart, windsPart];

/** The bandstand's tune with the families home so far (1 keys, 2 keys and strings, and so on). */
export function bandSong(families: number): Uint8Array {
  if (families <= 2) return tune(bpmFor(9), [...keysPart(), ...(families >= 2 ? stringsPart() : [])]);
  return tune(bpmFor(9), [...keysPart(), ...stringsPair(), ...LATER.slice(0, families - 2).flatMap((p) => p())]);
}

/** The menu: the whole band so far, with a parade drum on melody tracks. */
export function menuSong(): Uint8Array {
  return tune(bpmFor(9), [
    ...keysPart(),
    ...stringsPart(),
    v(6, patchOf('melodic-kick'), times(8, 'C3 q, r q, C3 q, r q'), 80),
    v(7, patchOf('melodic-snare'), times(8, 'r q, D4 e, D4 e, r q, D4 q'), 70),
  ]);
}

/** The Piano Shop: the tune for a keys trio, brisk (a beat of 8 ticks). */
export function shopSong(): Uint8Array {
  return tune(bpmFor(8), [
    v(0, patchOf('piano-bright'), MELODY, 105),
    // harpsichord running the chord in eighths
    v(
      1,
      patchOf('harpsichord'),
      eachBar((b) => times(2, b.chord.map((n) => `${up(n)} e`).join(', ') + `, ${up(b.chord[1])} e`)),
      60,
    ),
    v(
      2,
      patchOf('clavinet'),
      eachBar((b) => `${b.root} h, ${b.fifth} h`),
      85,
    ),
    v(
      3,
      patchOf('epiano-round'),
      eachBar((b) => `r q, ${chordOf(b, 'q')}, r q, ${chordOf(b, 'q')}`),
      55,
    ),
  ]);
}

/**
 * The Player Piano's phrase: two bars (80 game ticks, the tubes' loop) of soft chords and a
 * walking bass, with room left for the notes Teddy plays (C5 and G5, on eighths 1, 4, 7, 10
 * and 13). Pads, not hard downbeats: the ear may be a tick or two off the tubes on some PCs.
 */
export function railSong(): Uint8Array {
  return tune(bpmFor(RAIL_BEAT), [
    v(0, patchOf('epiano-round'), '[C4 E4 G4] w, [A3 C4 E4] w', 60),
    v(3, patchOf('piano-mellow'), 'C3 q, E3 q, G3 q, E3 q, A2 q, C3 q, E3 q, G3 q', 80),
    v(4, patchOf('tine-glass'), 'r h, r q, E6 e, r e, r h, r q, C6 e, r e', 40),
  ]);
}

/** The music store's back room: the tune on strings, unhurried (a beat of 10 ticks). */
export function stringsSong(): Uint8Array {
  return tune(bpmFor(10), [
    v(0, patchOf('violin'), MELODY, 100),
    v(
      1,
      patchOf('harp'),
      eachBar((b) => times(2, b.chord.map((n) => `${n} e`).join(', ') + `, ${up(b.chord[0])} e`)),
      65,
    ),
    v(
      2,
      patchOf('orchestra'),
      eachBar((b) => chordOf(b, 'w')),
      55,
    ),
    v(
      5,
      patchOf('upright-bass'),
      eachBar((b) => `${b.root} q, r q, ${b.fifth} q, r q`),
      90,
    ),
  ]);
}

/** The arcade: the tune on a square lead over a warm pad, a saw running the chord (a beat of 8 ticks). */
export function arcadeSong(): Uint8Array {
  return tune(bpmFor(8), [
    v(0, patchOf('lead-square'), MELODY, 95),
    v(
      1,
      patchOf('pad-80s'),
      eachBar((b) => chordOf(b, 'w')),
      50,
    ),
    v(
      4,
      patchOf('lead-saw'),
      eachBar((b) => times(2, [...b.chord, up(b.chord[0])].map((n) => `${up(n)} e`).join(', '))),
      45,
    ),
    v(
      5,
      patchOf('sub-bass'),
      eachBar((b) => `${b.root} q, ${b.root} e, ${b.root} e, ${b.fifth} q, ${b.root} q`),
      90,
    ),
  ]);
}

/** The roller rink: the tune on a tonewheel organ, oom-pah-pah chords (a beat of 8 ticks: a block a beat). */
export function rinkSong(): Uint8Array {
  return tune(bpmFor(8), [
    v(0, patchOf('tonewheel'), MELODY, 95),
    v(
      1,
      patchOf('combo-organ'),
      eachBar((b) => `r q, ${chordOf(b, 'q')}, r q, ${chordOf(b, 'q')}`),
      50,
    ),
    v(
      4,
      patchOf('pipe-organ'),
      eachBar((b) => `${b.root} h, ${b.fifth} h`),
      80,
    ),
  ]);
}

/** The marching field: the tune on trumpet, trombone under it, a tuba and a snare (a beat of 10 ticks, as the staff glides). */
export function fieldSong(): Uint8Array {
  return tune(bpmFor(10), [
    v(0, patchOf('trumpet'), MELODY, 90),
    v(
      1,
      patchOf('trombone'),
      eachBar((b) => `${b.chord[1]} h, ${b.chord[0]} h`),
      70,
    ),
    v(
      2,
      patchOf('tuba'),
      eachBar((b) => `${b.root} q, ${b.fifth} q, ${b.root} q, ${b.fifth} q`),
      90,
    ),
    v(3, patchOf('melodic-snare'), times(8, 'D4 e, D4 e, r q, D4 q, r q'), 55),
  ]);
}

/** The woods by the river: the tune on flute, a clarinet's broken chords and an oboe's long notes, unhurried. */
export function woodsSong(): Uint8Array {
  return tune(bpmFor(11), [
    v(0, patchOf('flute'), MELODY, 90),
    v(
      1,
      patchOf('clarinet'),
      eachBar((b) => times(2, b.chord.map((n) => `${n} e`).join(', ') + `, ${b.chord[1]} e`)),
      55,
    ),
    v(
      2,
      patchOf('oboe'),
      eachBar((b) => `${up(b.root)} w`),
      50,
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
