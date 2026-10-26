// Level 7's song, the River Road: the Road Song a step higher (in A), on a whistle over a
// rolling banjo, with a new middle of its own that drifts along like the river (long notes
// that spill down in eighths), and the Road Song again.
import { BANJO, BASS, SNAP, WHISTLE, backbeat, bass, comp, join, tune, v } from './tunes';
import { ROAD_A, ROAD_B, ROAD_CHORDS } from './themes';

/** The river middle: eight bars, a slow swell and a spill (written in G, played in A). */
const RIVER =
  'E5 q., D5 e, C5 q, E5 q, D5 q., B4 e, G4 h, C5 e, B4 e, A4 e, B4 e, C5 q, E5 q, B4 h., r q, ' +
  'G5 q., E5 e, C5 q, E5 q, D5 e, E5 e, D5 e, B4 e, G4 q, B4 q, A4 e, B4 e, C5 e, D5 e, F#5 q, A5 q, G5 h., r q';
const RIVER_CHORDS = ['C', 'G', 'Am', 'Em', 'C', 'G', 'D7', 'G'];

/** Up a whole step, from G to A: a new key for the road. */
const UP = 2;

export function roadSong(): Uint8Array {
  const chords = [...ROAD_CHORDS, ...RIVER_CHORDS, ...ROAD_CHORDS];
  const [a, b, c] = comp(chords, 're e re e re e re e', -1);
  return tune(126, [
    v(0, WHISTLE, join(ROAD_A, ROAD_B, RIVER, ROAD_A, ROAD_B), 105, UP),
    v(1, BANJO, a, 58, UP),
    v(2, BANJO, b, 58, UP),
    v(3, BANJO, c, 58, UP),
    v(4, BASS, bass(chords, 'walk'), 105, UP),
    v(5, SNAP, backbeat(chords.length), 55),
  ]);
}
