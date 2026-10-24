// Level 13's song, Firefly Meadow: a lullaby. Teddy's Theme slow and soft on a music-box
// bell over a held pad, a harp rocking up and down each chord like a cradle, then a new
// middle of its own (long notes, as if the meadow were yawning), and the theme again.
import { arrange, TEDDY } from './music';
import { CHORDS, bell, join, pad, pluck } from './tunes';
import { THEME_CHORDS } from './themes';

/** The new middle: eight sleepy bars. */
const LULL = 'E5 h, C5 q, A4 q, F5 h., E5 q, G5 h, E5 q, C5 q, D5 w, C5 q, E5 q, A5 h, A5 q, F5 q, D5 h, B4 q, D5 q, F5 q, D5 q, C5 w';
const LULL_CHORDS = ['Am', 'F', 'C', 'G', 'Am', 'Dm', 'G7', 'C'];

export function meadowSong(): Uint8Array {
  const chords = [...THEME_CHORDS, ...LULL_CHORDS, ...THEME_CHORDS];
  // the cradle: each chord rocked up and down in eighth notes
  const rock = chords.map((ch) => {
    const [a, b, c] = CHORDS[ch];
    return `${a} e, ${b} e, ${c} e, ${b} e, ${a} e, ${b} e, ${c} e, ${b} e`;
  });
  return arrange({
    bpm: 80,
    mel: join(TEDDY, LULL, TEDDY),
    chords,
    lead: bell,
    leadVel: 95,
    comp: pad,
    rhythm: 'w',
    style: 'whole',
    extra: [pluck, join(...rock), 40],
  });
}
