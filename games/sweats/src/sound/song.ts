// The score (placeholder until the coffee-house jazz is composed): every song the scenes name.
import { CLOSE_CHORDS, EPIANO, FLUTE, Writer, vamp } from '../../../kit/song';

/** The level songs a monologue may name, and the songs of the title, menu, story, endings and intermissions. */
export const LEVEL_SONGS = ['office', 'shop', 'home', 'outside', 'epic', 'chase', 'blues', 'triumph'] as const;
export const SCREEN_SONGS = ['title', 'menu', 'story', 'won', 'lost', 'hive', 'inter1', 'inter2', 'inter3', 'finale'] as const;
export type SongName = (typeof LEVEL_SONGS)[number] | (typeof SCREEN_SONGS)[number];

function placeholder(): Uint8Array {
  const w = new Writer(96, CLOSE_CHORDS);
  w.part({ section: { ...vamp(['C', 'Am', 'F', 'G']), tune: ['C5 q, E5 q, G5 h', 'A4 h, C5 h', 'F4 q, A4 q, C5 h', 'B4 h, D5 h'] }, lead: FLUTE, bass: 'walk', comp: 'x h, x h', compPatch: EPIANO, drums: ['ride'] });
  return w.cmf();
}

export function buildSongs(): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const n of [...LEVEL_SONGS, ...SCREEN_SONGS]) out[n] = placeholder();
  return out;
}
