// The parade tune and every arrangement of it, scored with the music editor's presets
// (web/src/audio/oplPresets.ts) so each neighborhood sounds like its family of instruments.
// The bandstand plays the tune with one more family each time Teddy brings one home.
//
// Tempos sit on whole game ticks (the game clock is the music clock / 8), so a song and the
// blocks that animate with it never drift: a beat of 8 game ticks is 64 CMF ticks.
import { tune, v, times, join } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { patchOf } from './notes';
import { rhythmTune } from './rhythm';

/** The tempo for a beat `ticks` game ticks long (146 CMF ticks a second, 8 to a game tick). */
export const bpmFor = (ticks: number) => (146 * 60) / (8 * ticks);
/** The Player Piano's beat: 10 game ticks (109.2 BPM); an eighth (a step of the tubes) is 5. */
export const RAIL_BEAT = 10;

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

// ---- the menu's band: the keys and the strings
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

// ---- the bandstand: the tune with every family home so far. The OPL2 has nine voices (a
// chord takes one a note), so as the band grows, parts make room: the bass takes over the
// piano's left hand, the strings' chord thins, and from the ninth family on an older part
// rests for each newcomer (the glockenspiel takes the pizzicato's off-beats, the timpani the
// synth pad's place, the classic bell the accordion's). With the drum kit home the chip goes
// to rhythm mode: six voices and the five drums.
type One = (ch: number) => ReturnType<typeof v>;
const BAND: Record<string, One> = {
  mel: (ch) => v(ch, patchOf('piano-bright'), MELODY, 110),
  left: (ch) =>
    v(
      ch,
      patchOf('piano-mellow'),
      eachBar((b) => `${b.root} q, ${b.fifth} q, ${b.root} q, ${b.fifth} q`),
      90,
    ),
  orch3: (ch) =>
    v(
      ch,
      patchOf('orchestra'),
      eachBar((b) => chordOf(b, 'w')),
      70,
    ),
  orch2: (ch) =>
    v(
      ch,
      patchOf('orchestra'),
      eachBar((b) => `[${b.chord[0]} ${b.chord[2]}] w`),
      70,
    ),
  orch1: (ch) =>
    v(
      ch,
      patchOf('orchestra'),
      eachBar((b) => `${b.chord[0]} w`),
      70,
    ),
  pizz: (ch) =>
    v(
      ch,
      patchOf('pizzicato'),
      eachBar((b) => times(4, `r e, ${up(b.chord[2])} e`)),
      85,
    ),
  voice: (ch) =>
    v(
      ch,
      patchOf('aah'),
      eachBar((b) => `${b.chord[1]} h, ${b.chord[2]} h`),
      60,
    ),
  bass: (ch) =>
    v(
      ch,
      patchOf('finger-bass'),
      eachBar((b) => `${b.root} q, ${b.fifth} q, ${b.root} q, ${b.fifth} q`),
      95,
    ),
  synth: (ch) =>
    v(
      ch,
      patchOf('pad-warm'),
      eachBar((b) => `${up(b.chord[1])} w`),
      60,
    ),
  organ: (ch) =>
    v(
      ch,
      patchOf('accordion'),
      eachBar((b) => `${up(b.root)} h, ${up(b.fifth)} h`),
      55,
    ),
  brass: (ch) =>
    v(
      ch,
      patchOf('trumpet'),
      eachBar((b) => `r h, ${up(b.chord[0])} e, ${up(b.chord[1])} e, ${up(b.chord[2])} q`),
      80,
    ),
  winds: (ch) =>
    v(
      ch,
      patchOf('flute'),
      eachBar((b) => `${up(b.chord[2])} h, ${up(b.chord[1])} h`),
      70,
    ),
  mallets: (ch) =>
    v(
      ch,
      patchOf('glockenspiel'),
      eachBar((b) => times(4, `r e, ${up(up(b.chord[0]))} e`)),
      60,
    ),
  perc: (ch) =>
    v(
      ch,
      patchOf('timpani'),
      eachBar((b) => `${b.root} q, r q, ${b.fifth} q, r q`),
      85,
    ),
  classic: (ch) =>
    v(
      ch,
      patchOf('bell'),
      eachBar((b) => `${up(b.chord[2])} h, r h`),
      55,
    ),
};
/** The parts playing with `n` families home (n = 1..11; the twelfth is bandFinale). */
const LINEUP: string[][] = [
  ['mel', 'left'],
  ['mel', 'left', 'orch3', 'pizz'],
  ['mel', 'left', 'orch2', 'pizz', 'voice'],
  ['mel', 'bass', 'orch2', 'pizz', 'voice'],
  ['mel', 'bass', 'orch2', 'pizz', 'voice', 'synth'],
  ['mel', 'bass', 'orch2', 'pizz', 'voice', 'synth', 'organ'],
  ['mel', 'bass', 'orch2', 'pizz', 'voice', 'synth', 'organ', 'brass'],
  ['mel', 'bass', 'orch1', 'pizz', 'voice', 'synth', 'organ', 'brass', 'winds'],
  ['mel', 'bass', 'orch1', 'mallets', 'voice', 'synth', 'organ', 'brass', 'winds'],
  ['mel', 'bass', 'orch1', 'mallets', 'voice', 'perc', 'organ', 'brass', 'winds'],
  ['mel', 'bass', 'orch1', 'mallets', 'voice', 'perc', 'classic', 'brass', 'winds'],
];

/** The bandstand's tune with the families home so far (1 keys, 2 keys and strings, and so on). */
export function bandSong(families: number): Uint8Array {
  if (families >= 12) return bandFinale();
  let ch = 0;
  const voices = LINEUP[families - 1].map((id) => {
    const x = BAND[id](ch);
    ch += id === 'orch3' ? 3 : id === 'orch2' ? 2 : 1;
    return x;
  });
  if (ch > 9) throw new Error(`bandSong(${families}): ${ch} voices`);
  return tune(bpmFor(9), voices);
}

/** The whole band, the drum kit too: six voices in rhythm mode and the five drums marching. */
export function bandFinale(): Uint8Array {
  const parts = ['mel', 'bass', 'voice', 'mallets', 'brass', 'winds'];
  return rhythmTune(
    bpmFor(9),
    parts.map((id, ch) => BAND[id](ch)),
    [
      { channel: 11, instrument: patchOf('kick-punchy'), notes: times(16, 'C2 q, r q'), velocity: 100 },
      { channel: 12, instrument: patchOf('snare-tight'), notes: times(8, 'r q, G3 q, r q, G3 e, G3 e'), velocity: 90 },
      { channel: 15, instrument: patchOf('hat-closed'), notes: times(32, 'r e, G3 e'), velocity: 70 },
      { channel: 14, instrument: patchOf('crash'), notes: times(4, 'C5 w, r w'), velocity: 80 },
      { channel: 13, instrument: patchOf('tom-mid'), notes: times(4, 'r w, r h, r q, C3 e, C3 e'), velocity: 85 },
    ],
  );
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

/** The marching field: the tune on trumpet, trombone under it, a tuba and a snare (a beat of 12 ticks, as the staff glides). */
export function fieldSong(): Uint8Array {
  return tune(bpmFor(12), [
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
