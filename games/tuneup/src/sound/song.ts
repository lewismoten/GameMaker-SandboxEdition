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

/** The Timing Beat's beat: 12 game ticks (91 BPM); a step of the pipes is an eighth. */
export const BEAT = 12;

/**
 * The Timing Beat's own tune, the roll's rag (not the parade tune): three strains, one a verse,
 * the organ pipes playing it over a stride bass. Each strain leaves room for the keys Doc Leo
 * boops (C5, E5, G5 and C6, landing where the roll's holes put them) and picks chords those notes
 * belong to, so his boops finish the phrase instead of repeating over the same one.
 * - Verse 1 lands on beats 1 and 3 (C6 C5 | E5 G5), so the tune answers on beats 2 and 4.
 * - Verse 2 lands off the beat (C5 on 2-and, E5 and G5 or C6 on 4-and): a tune on the beats.
 * - Verse 3, a waltz, lands on every beat (C5 E5 G5 | C6 G5 E5): long notes over a C pedal.
 */
const ROLL_STRAINS: { meter: 3 | 4; chords: string[]; tune: string }[] = [
  {
    meter: 4,
    chords: ['C', 'C', 'F', 'Em', 'Am', 'C', 'F', 'C'],
    tune: join(
      'r q, E5 e, G5 e, r q, A5 e, G5 e',
      'r q, F5 e, E5 e, r q, D5 e, E5 e',
      'r q, A5 e, C6 e, r q, A5 e, F5 e',
      'r q, B5 e, G5 e, r q, E5 e, B4 e',
      'r q, A5 e, E5 e, r q, C6 e, B5 e',
      'r q, G5 e, E5 e, r q, D5 e, C5 e',
      'r q, F5 e, A5 e, r q, G5 e, F5 e',
      'r q, E5 e, D5 e, r q, C5 e, r e',
    ),
  },
  {
    meter: 4,
    chords: ['C', 'F', 'Am7', 'Am', 'C', 'F', 'Am7', 'C'],
    tune: join(
      'G5 q, E5 q, G5 q, C6 q',
      'A5 q, F5 q, A5 h',
      'C6 q, A5 q, G5 q, E5 q',
      'A5 q, E5 q, A5 h',
      'E5 q, G5 q, C6 q, E6 q',
      'D6 q, C6 q, A5 h',
      'G5 q, A5 q, G5 q, E5 q',
      'E5 q, D5 q, C5 h',
    ),
  },
  {
    meter: 3,
    chords: ['C', 'C', 'F', 'C', 'Am', 'Am', 'F', 'C'],
    tune: join('E6 h.', 'D6 q, C6 q, G5 q', 'A5 h.', 'G5 h, E5 q', 'A5 h, C6 q', 'E6 h.', 'F6 q, E6 q, C6 q', 'C6 h.'),
  },
];
/** The strains' chords: the stride's low root and the chord over it. */
const ROLL_CHORDS: Record<string, { root: string; chord: string }> = {
  C: { root: 'C3', chord: '[E3 G3 C4]' },
  F: { root: 'F2', chord: '[F3 A3 C4]' },
  Em: { root: 'E3', chord: '[E3 G3 B3]' },
  Am: { root: 'A2', chord: '[E3 A3 C4]' },
  Am7: { root: 'A2', chord: '[E3 G3 C4]' },
};

/** The Timing Beat, verse `verse`: its strain of the roll's rag, the stride under it. */
export function beatSong(verse: number): Uint8Array {
  const { meter, chords, tune: melody } = ROLL_STRAINS[verse];
  const stride = join(
    ...chords.map((name) => {
      const { root, chord } = ROLL_CHORDS[name];
      return meter === 3 ? `${root} q, ${chord} q, ${chord} q` : `${root} q, ${chord} q, ${root} q, ${chord} q`;
    }),
  );
  return tune(bpmFor(BEAT), [v(0, patchOf('pipe-organ'), melody, 60), v(3, patchOf('piano-mellow'), stride, 62)]);
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
