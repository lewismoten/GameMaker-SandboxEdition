// Level 12's song, Teddy's Dream Run: Teddy's Theme at a gallop on a music-box bell, the
// comping skipping along like paws on a path, a soft backbeat, and a harp running up and down
// each chord twice as fast (the world going by). Twice through.
import { arrange, TEDDY } from './music';
import { CHORDS, backbeat, bell, join, pluck } from './tunes';
import { THEME_CHORDS } from './themes';

export function dreamSong(): Uint8Array {
  const chords = [...THEME_CHORDS, ...THEME_CHORDS];
  const run = chords.map((ch) => {
    const [a, b, c] = CHORDS[ch];
    return `${a} s, ${b} s, ${c} s, ${b} s, ${a} s, ${b} s, ${c} s, ${b} s, ${a} s, ${b} s, ${c} s, ${b} s, ${a} s, ${b} s, ${c} s, ${b} s`;
  });
  return arrange({
    bpm: 132,
    mel: join(TEDDY, TEDDY),
    chords,
    lead: bell,
    leadVel: 100,
    rhythm: 're e re e re e re e',
    style: 'walk',
    beat: backbeat(chords.length),
    extra: [pluck, join(...run), 38],
  });
}
