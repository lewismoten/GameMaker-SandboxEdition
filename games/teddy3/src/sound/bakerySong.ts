// Level 5's song, the bakery downtown: a busy belt shuffle. Teddy's Theme on the xylophone-ish
// toy piano over a walking bass, then a new middle of its own (trays going round the belt,
// up and back down each bar), then the theme again; a little music-box tick keeps time like
// the belt's rollers.
import { arrange, TEDDY } from './music';
import { CHORDS, TOY, bell, join, lead } from './tunes';
import { THEME_CHORDS } from './themes';

/** The new middle: eight bars that go round and round like the belts. */
const BELTS =
  'A5 e, F5 e, C5 e, F5 e, A5 e, G5 e, F5 q, C6 e, A5 e, F5 e, A5 e, C6 q, r q, ' +
  'G5 e, E5 e, C5 e, E5 e, G5 e, F5 e, E5 q, C6 e, G5 e, E5 e, G5 e, C6 q, r q, ' +
  'F#5 e, A5 e, C6 e, A5 e, F#5 e, E5 e, D5 q, G5 e, B5 e, D6 e, B5 e, A5 e, G5 e, F5 q, ' +
  'E5 q, G5 q, C6 q, B5 e, A5 e, G5 h, D5 e, E5 e, F5 e, D5 e';
const BELT_CHORDS = ['F', 'F', 'C', 'C', 'D7', 'G7', 'C', 'G7'];

export function bakerySong(): Uint8Array {
  const chords = [...THEME_CHORDS, ...BELT_CHORDS, ...THEME_CHORDS];
  // the rollers: the chord's top note, ticking on the off-beats
  const tick = chords.map((ch) => {
    const n = CHORDS[ch][2];
    const hi = `${n.slice(0, -1)}${Number(n.slice(-1)) + 1}`;
    return `r e, ${hi} e, r e, ${hi} e, r e, ${hi} e, r e, ${hi} e`;
  });
  return arrange({
    bpm: 138,
    mel: join(TEDDY, BELTS, TEDDY),
    chords,
    lead: TOY,
    comp: lead,
    rhythm: 'q re e q re e',
    style: 'walk',
    extra: [bell, join(...tick), 38],
  });
}
