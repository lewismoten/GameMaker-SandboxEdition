// The Teddy Course (Level 16, the finale): all four themes in turn, Teddy's, Gwinn's, Doc
// Leo's and the Road Song, on brass over a march, with a drum roll into each station.
import { TEDDY, arrange } from './music';
import { CALLIOPE, backbeat, brass, join } from './tunes';
import { GWINN_A, GWINN_B, GWINN_CHORDS, LEO_A, LEO_B, LEO_CHORDS, ROAD_A, ROAD_B, ROAD_CHORDS, THEME_CHORDS } from './themes';

export function courseSong(): Uint8Array {
  const chords = [...THEME_CHORDS, ...GWINN_CHORDS, ...LEO_CHORDS, ...ROAD_CHORDS, ...THEME_CHORDS];
  return arrange({
    bpm: 138,
    mel: join(TEDDY, GWINN_A, GWINN_B, LEO_A, LEO_B, ROAD_A, ROAD_B, TEDDY),
    chords,
    lead: brass,
    comp: CALLIOPE,
    rhythm: 're e re e re e re e',
    style: 'oompah',
    beat: backbeat(chords.length),
  });
}
