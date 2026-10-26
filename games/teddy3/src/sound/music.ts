// The soundtrack: an FM song for every screen and stop, composed on the sequel's instruments
// with the series' themes (themes.ts). Teddy's stops play Teddy's Theme, the MEANWHILE...
// stops play Gwinn's or Doc Leo's, the road trips play the Road Song, and the ending plays
// "Happy Birthday to You" before all four themes together.
import {
  BANJO,
  BASS,
  CALLIOPE,
  SNAP,
  TOY,
  TROMBONE,
  TUBA,
  WHISTLE,
  backbeat,
  bass,
  bell,
  brass,
  comp,
  join,
  organ,
  pad,
  piano,
  pluck,
  strings,
  times,
  tune,
  v,
} from './tunes';
import {
  BIRTHDAY,
  BIRTHDAY_CHORDS,
  GWINN_A,
  GWINN_B,
  GWINN_CHORDS,
  LEO_A,
  LEO_B,
  LEO_CHORDS,
  ROAD_A,
  ROAD_B,
  ROAD_CHORDS,
  THEME_A,
  THEME_B,
  THEME_CHORDS,
} from './themes';

type Kit = Parameters<typeof v>[1];

/** A song from a melody over chords: comping, a bass line and an optional backbeat. */
export function arrange(o: {
  bpm: number;
  mel: string;
  chords: string[];
  lead: Kit;
  leadVel?: number;
  comp?: Kit;
  rhythm?: string;
  bass?: Kit;
  style?: Parameters<typeof bass>[1];
  beat?: string;
  extra?: [Kit, string, number];
}): Uint8Array {
  const [a, b, c] = comp(o.chords, o.rhythm ?? 'q q q q', -1);
  const ci = o.comp ?? piano;
  const voices = [
    v(0, o.lead, o.mel, o.leadVel ?? 105),
    v(1, ci, a, 58),
    v(2, ci, b, 58),
    v(3, ci, c, 58),
    v(4, o.bass ?? BASS, bass(o.chords, o.style ?? 'oompah'), 105),
  ];
  if (o.beat) voices.push(v(5, SNAP, o.beat, 55));
  if (o.extra) voices.push(v(6, o.extra[0], o.extra[1], o.extra[2]));
  return tune(o.bpm, voices);
}

export const TEDDY = join(THEME_A, THEME_B);
export const twice = <T>(xs: T[]) => [...xs, ...xs];

/** Title: Teddy's Theme as a bouncy march on the calliope, then Doc Leo's, then home. */
export function titleSong(): Uint8Array {
  const chords = [...THEME_CHORDS, ...LEO_CHORDS, ...THEME_CHORDS];
  const mel = join(TEDDY, LEO_A, LEO_B, TEDDY);
  return arrange({ bpm: 144, mel, chords, lead: CALLIOPE, rhythm: 're e re e re e re e', bass: TUBA, beat: backbeat(24) });
}

/** Menu: the theme on a music box. */
export function menuSong(): Uint8Array {
  return arrange({ bpm: 112, mel: TEDDY, chords: THEME_CHORDS, lead: TOY, comp: pad, rhythm: 'h h', style: 'half' });
}

/** The story: Doc Leo's Theme, hushed, on strings (a surprise is being planned). */
export function storySong(): Uint8Array {
  return arrange({ bpm: 92, mel: join(LEO_A, LEO_B), chords: LEO_CHORDS, lead: WHISTLE, comp: strings, rhythm: 'q q q q', style: 'whole' });
}

/** Level 1, the garage at dawn: the theme on a toy piano over a ticking bench clock. */
export function garageSong(): Uint8Array {
  return arrange({
    bpm: 112,
    mel: join(TEDDY, TEDDY.replace(/C5 h$/, 'C5 q, G4 q')),
    chords: twice(THEME_CHORDS),
    lead: TOY,
    rhythm: 'q re e q re e',
    style: 'half',
    extra: [bell, join(times(7, 'r w'), 'C6 h, G5 h', times(7, 'r w'), 'E6 h, C6 h'), 55],
  });
}

/** Level 2, Maple Street: the Road Song, humming along on an organ with a skipping banjo. */
export function mapleSong(): Uint8Array {
  return arrange({
    bpm: 132,
    mel: join(ROAD_A, ROAD_B, ROAD_A, ROAD_B.replace(/G4 h$/, 'G4 q, D4 q')),
    chords: twice(ROAD_CHORDS),
    lead: organ,
    comp: BANJO,
    rhythm: 're e re e re e re e',
    style: 'walk',
    beat: backbeat(16),
  });
}

/** Level 3, Puddlewick Park: the theme on a whistle over plucked strings, swinging along. */
export function parkSong(): Uint8Array {
  return arrange({
    bpm: 120,
    mel: join(TEDDY, TEDDY),
    chords: twice(THEME_CHORDS),
    lead: WHISTLE,
    comp: pluck,
    rhythm: 'q re e q re e',
    style: 'walk',
    beat: backbeat(16),
  });
}

/** Game won: SURPRISE! "Happy Birthday to You" (3/4) on brass, then all four themes in a row. */
export function wonSong(): Uint8Array {
  const root = (ch: string) => ch.replace(/m|7/g, '');
  const [ba, bb, bc] = comp(BIRTHDAY_CHORDS, 'q q q', -1);
  const bdayBass = BIRTHDAY_CHORDS.map((ch) => `${root(ch)}2 h.`).join(', ');
  const chords = [...THEME_CHORDS, ...GWINN_CHORDS, ...LEO_CHORDS, ...ROAD_CHORDS, 'C', 'C'];
  const [a, b, c] = comp(chords, 'q q q q', -1);
  const mel = join(TEDDY, GWINN_A, GWINN_B, LEO_A, LEO_B, ROAD_A, ROAD_B, 'C5 q, E5 q, G5 q, C6 q, C6 w');
  return tune(126, [
    v(0, brass, join(BIRTHDAY, mel), 105),
    v(1, strings, join(ba, a), 58),
    v(2, strings, join(bb, b), 58),
    v(3, strings, join(bc, c), 58),
    v(4, TUBA, join(bdayBass, bass(chords, 'oompah')), 110),
    v(5, SNAP, join(times(9, 'r h.'), backbeat(chords.length)), 55),
  ]);
}

/** Game lost: a sleepy trombone, and the sad-clown "wah wah wah waaah". */
export function lostSong(): Uint8Array {
  const mel = 'C5 h, A4 q, F4 q, G4 h., r q, G4 q., r e, F#4 q., r e, F4 q., r e, E4 q., r e, E4 w, r w';
  return arrange({ bpm: 80, mel, chords: ['F', 'G7', 'C', 'C', 'C', 'C'], lead: TROMBONE, comp: pad, rhythm: 'w', style: 'whole' });
}

/** Each level's song, by its file name. */
export const LEVEL_SONGS: Record<string, () => Uint8Array> = {
  garage: garageSong,
  maple: mapleSong,
};
