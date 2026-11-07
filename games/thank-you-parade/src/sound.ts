// The parade's sounds (.SND) and its one song (.CMF). The sounds are the Starters' with a rising bell for a card handed
// over (Game-Maker plays sound 8 when a counter goes down), and the song is "Thank You March", a march in C major
// in the Starters' marching band (kit/starter/songStyle.ts), 32 bars before it loops.
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { SND } from '../../kit/starter/ids';
import { starterSong } from '../../kit/starter/songStyle';
import { buildSounds } from '../../kit/starter/sounds';

export function paradeSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.use] = SPEAKER.arpeggio([1319, 1568, 2093, 2637]); // a chime for each hand-over
  return set;
}

export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 112,
    A: {
      chords: 'C | C | F | C | G | C | F G | C',
      tune: 'E5 q, E5 e, G5 e, C6 q, G5 q | E5 q, E5 e, G5 e, C6 h | A5 q, A5 e, C6 e, F6 q, C6 q | G5 q, E5 q, C5 h | B5 q, B5 e, D6 e, G6 q, D6 q | C6 q, G5 q, E5 q, G5 q | A5 q, C6 q, F5 q, B5 q | C6 h., r q',
    },
    B: {
      chords: 'F | C | F | C | G | Am | F G | C',
      tune: 'A5 q, F5 q, A5 q, C6 q | G5 q, E5 q, G5 h | A5 e, C6 e, F6 e, C6 e, A5 q, F5 q | E5 q, G5 q, C6 h | D6 q, B5 q, G5 q, B5 q | C6 q, E6 q, A5 h | F5 q, A5 q, B5 q, D6 q | C6 h., r q',
    },
  });
}
