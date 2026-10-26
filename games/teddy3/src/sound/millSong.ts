// Level 8's song, the old mill: a rolling water-wheel 12/8. Teddy's Theme on the whistle,
// over a banjo rolling triplets and a turning bass, then a new middle of its own that climbs
// like a paddle going up and spills back down, and the theme again.
import { arrange, TEDDY } from './music';
import { BANJO, CHORDS, WHISTLE, join } from './tunes';
import { THEME_CHORDS } from './themes';

/** The new middle: eight bars, each rising up the chord and spilling back down. */
const WHEEL =
  'C5 q, E5 e, G5 e, C6 q, G5 e, E5 e, ' +
  'D5 q, F5 e, A5 e, D6 q, A5 e, F5 e, ' +
  'E5 q, G5 e, B5 e, E6 q, B5 e, G5 e, ' +
  'F5 q, A5 e, C6 e, F6 h, ' +
  'E5 q, G5 e, C6 e, E6 q, C6 e, G5 e, ' +
  'F5 q, A5 e, D6 e, F6 q, D6 e, A5 e, ' +
  'G5 q, B5 e, D6 e, G6 q, F6 e, D6 e, ' +
  'C6 h, G5 q, E5 q';
const WHEEL_CHORDS = ['C', 'Dm', 'Em', 'F', 'C', 'Dm', 'G7', 'C'];

export function millSong(): Uint8Array {
  const chords = [...THEME_CHORDS, ...WHEEL_CHORDS, ...THEME_CHORDS];
  // the wheel's slosh: the chord rolled in eighth-note triplets, low and soft
  const roll = chords.map((ch) => {
    const [a, b, c] = CHORDS[ch];
    return Array(4).fill(`${a} t, ${b} t, ${c} t`).join(', ');
  });
  return arrange({
    bpm: 108,
    mel: join(TEDDY, WHEEL, TEDDY),
    chords,
    lead: WHISTLE,
    comp: BANJO,
    rhythm: 'q. e q. e',
    style: 'half',
    extra: [BANJO, join(...roll), 34],
  });
}
