// Who plays each caller on the wall phone: a voice sample or Kokoro stock voice, shifted in pitch and
// speed, the same way the tour's hosts are cast (HOSTS in src/tour/steps.ts, scripts/narrate.ts).
// A character keeps one voice everywhere: the Hint Giant is the tour's slow Scroobie voice (its gentle giant),
// two semitones down, slow, so the pay-per-minute line rings up minutes. Mom and Dad also yell from the extension.
// Lewis's own voice is only for Doc Leo, so nobody here uses it.

export interface CastVoice {
  /** 'kokoro:<voice>' (hexgrad's stock voices) or a cloned sample's name (scripts/narrate.ts SAMPLES). */
  sample: string;
  semitones: number;
  tempo: number;
  /** Who it is, for the README. */
  who: string;
}

export const CAST: Record<string, CastVoice> = {
  dispatcher: { who: '911 dispatcher', sample: 'kokoro:af_nicole', semitones: 0, tempo: 1.05 },
  receptionist: { who: 'Linda, Three Rivers Insurance', sample: 'kokoro:af_sarah', semitones: 1, tempo: 1.1 },
  mom: { who: 'Mom', sample: 'kokoro:af_heart', semitones: 0, tempo: 1.05 },
  dad: { who: 'Dad', sample: 'olden-mon', semitones: -1, tempo: 1.12 },
  shop: { who: 'Gus, the maintenance shop', sample: 'kokoro:am_onyx', semitones: 0, tempo: 1.05 },
  jenny: { who: 'Jenny, the sitter', sample: 'kokoro:af_jessica', semitones: 1, tempo: 1.2 },
  'time-lady': { who: 'Riverbend time and temperature', sample: 'kokoro:af_alloy', semitones: 0, tempo: 0.95 },
  weather: { who: 'The weather line', sample: 'kokoro:am_adam', semitones: -1, tempo: 0.98 },
  movies: { who: 'The Movie Line', sample: 'snooty-wiz', semitones: 0, tempo: 1.05 },
  grandma: { who: 'Grandma', sample: 'kokoro:af_aoede', semitones: 2, tempo: 0.82 },
  recording: { who: 'The phone company recording', sample: 'kokoro:af_kore', semitones: 0, tempo: 0.95 },
  robot: { who: 'The rating council recording', sample: 'kokoro:am_fenrir', semitones: -3, tempo: 0.92 },
  kowalski: { who: 'The Kowalskis’ machine', sample: 'kokoro:af_river', semitones: 0, tempo: 1.05 },
  rick: { who: 'Rick’s machine', sample: 'kokoro:am_eric', semitones: 0, tempo: 1.08 },
  henderson: { who: 'The Hendersons’ machine', sample: 'kokoro:am_echo', semitones: 0, tempo: 1 },
  giant: { who: 'The Hint Giant, the Hint Kennel’s automated line', sample: 'scroobie', semitones: -2, tempo: 0.9 },
};
