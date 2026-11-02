// Tune-Up's main theme and The Timing Beat's songs. Every other level has a song of its own
// (dreamSongs, realSongs, realSongs2, finaleSongs; the title and the ending in themeSongs),
// scored with the music editor's presets (web/src/audio/oplPresets.ts).
//
// Tempos sit on whole game ticks (the game clock is the music clock / 8), so a song and the
// blocks that animate with it never drift: a beat of 8 game ticks is 64 CMF ticks.
import { tune, v, join } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { patchOf } from './notes';

/** The tempo for a beat `ticks` game ticks long (146 CMF ticks a second, 8 to a game tick). */
export const bpmFor = (ticks: number) => (146 * 60) / (8 * ticks);

/** The main theme's first two bars, the motif the title, the wake and the ending quote (in score.ts's notation). */
export const MOTIF = 'C5q E5q G5q E5q | F5q A5q G5h';

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
