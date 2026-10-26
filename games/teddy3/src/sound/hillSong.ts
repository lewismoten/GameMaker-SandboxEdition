// Level 12's song, Lookout Hill: the Road Song climbing. It plays once in G on the organ, then
// a new bridge of its own that walks up the scale a bar at a time like the car up the hill,
// then the Road Song again a step higher, and once more a step higher still, as the Big Top
// comes into sight (every voice moves up with it).
import { BANJO, BASS, SNAP, backbeat, bass, comp, join, organ, tune, v } from './tunes';
import { ROAD_A, ROAD_B, ROAD_CHORDS } from './themes';

/** The climb: eight bars, each phrase starting a step higher than the last (in G). */
const CLIMB =
  'G4 e, A4 e, B4 e, D5 e, G5 q, D5 q, A4 e, B4 e, C5 e, E5 e, A5 q, E5 q, ' +
  'B4 e, C5 e, D5 e, F#5 e, B5 q, F#5 q, C5 e, D5 e, E5 e, G5 e, C6 q, G5 q, ' +
  'D5 e, E5 e, F#5 e, A5 e, D6 q, A5 q, E5 e, F#5 e, G5 e, B5 e, E6 q, B5 q, ' +
  'C6 q, B5 q, A5 q, F#5 q, G5 h, D5 h';
const CLIMB_CHORDS = ['G', 'Am', 'Em', 'C', 'D7', 'Em', 'D7', 'G'];

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

/** Moves every note in a note string up `n` semitones (rests stay rests). */
function up(notes: string, n: number): string {
  return notes
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const [pitch, len] = t.split(' ');
      if (pitch === 'r') return t;
      const m = /^([A-G][#b]?)(\d)$/.exec(pitch);
      if (!m) throw new Error(`Bad note ${pitch}`);
      const k = NAMES.indexOf(FLAT[m[1]] ?? m[1]) + Number(m[2]) * 12 + n;
      return `${NAMES[k % 12]}${Math.floor(k / 12)} ${len}`;
    })
    .join(', ');
}

/** One section's five voices (melody, three comping, bass), raised `n` semitones. */
function section(mel: string, chords: string[], n: number): string[] {
  const [a, b, c] = comp(chords, 're e re e re e re e', -1);
  return [mel, a, b, c, bass(chords, 'walk')].map((s) => up(s, n));
}

export function hillSong(): Uint8Array {
  const road = join(ROAD_A, ROAD_B);
  const parts = [section(road, ROAD_CHORDS, 0), section(CLIMB, CLIMB_CHORDS, 0), section(road, ROAD_CHORDS, 2), section(road, ROAD_CHORDS, 4)];
  const voice = (i: number) => join(...parts.map((p) => p[i]));
  return tune(138, [
    v(0, organ, voice(0), 105),
    v(1, BANJO, voice(1), 58),
    v(2, BANJO, voice(2), 58),
    v(3, BANJO, voice(3), 58),
    v(4, BASS, voice(4), 105),
    v(5, SNAP, backbeat(32), 55),
  ]);
}
