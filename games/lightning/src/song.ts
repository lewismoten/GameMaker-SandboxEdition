// LIGHTNING's one song, new for this game: a quiet A-minor tune for a stormy night, with the thunder in it. A block
// timer can't play a sound, but the song and the block clock run off the same PC timer (the song gets 8 ticks for
// every game tick). So the song is exactly two flashes long, 32 beats at 146 beats a minute (60 song ticks a beat, 1920
// in all, 240 game ticks: storm.ts ROUND twice), and it stays in step with the sky. The song starts when the level
// loads, about a second before the block clock (the screen fades in first: PLAYGAME.C 1404, 4444), so a flash ends
// about 2 beats into the song's round, and the rumble written on beat 4 comes a beat or so after it.
// Note strings are the kit's: a note, an octave and a length.
import { encodeCmf, type CmfEvent } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { INSTRUMENTS, midi, type Voice } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { LEN, join, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { ROUND } from './storm';

const BPM = 146;
/** Song ticks a beat (Game-Maker plays 146 a second), and beats in the whole song. */
const TPB = (146 * 60) / BPM;
const BEATS = 32;

const MELODY = join(
  'E5 q, G5 q, A5 h',
  'r h, G5 q, E5 q',
  'D5 q, C5 q, D5 q, E5 q',
  'E5 w',
  'C5 q, D5 q, E5 h',
  'r h, D5 q, C5 q',
  'B4 q, A4 q, B4 q, C5 q',
  'A4 w',
);
const PAD = join('[A3 C4 E4] w', '[F3 A3 C4] w', '[C4 E4 G4] w', '[G3 B3 D4] w', '[A3 C4 E4] w', '[F3 A3 C4] w', '[G3 B3 D4] w', '[A3 C4 E4] w');
/** The thunder: a low growl on beat 4 of each round, a beat or so after the flash. */
const RUMBLE = join('r w, [E2 F2] h., [D2 E2] h, r h., r w', 'r w, [E2 F2] h., [D2 E2] h, r h., r w');

/** The voices' notes as CMF events, and an event at the very end so the loop is exactly BEATS long. */
function events(voices: Voice[]): { events: CmfEvent[]; instruments: Uint8Array[] } {
  const instruments: Uint8Array[] = [];
  const out: CmfEvent[] = [];
  for (const voice of voices) {
    let t = 0;
    for (const raw of voice.notes.split(',').map((s) => s.trim())) {
      const m = /^(.+?)\s+([whqest])(\.?)$/.exec(raw)!;
      const len = LEN[m[2]] * (m[3] ? 1.5 : 1) * TPB;
      m[1]
        .replace(/[[\]]/g, ' ')
        .trim()
        .split(/\s+/)
        .forEach((name, k) => {
          const n = midi(name);
          if (n === null) return;
          const ch = voice.channel + k;
          instruments[ch] = voice.instrument;
          out.push({ tick: t, data: [0x90 | ch, n, voice.velocity ?? 100] }, { tick: t + len * 0.92, data: [0x80 | ch, n, 0] });
        });
      t += len;
    }
    if (t !== BEATS * TPB) throw new Error(`a voice is ${t / TPB} beats, not ${BEATS}`);
  }
  out.push({ tick: BEATS * TPB, data: [0xb0, 7, 100] }); // the end: channel 1's volume, set to where it already is
  for (let c = 0; c < 16; c++) instruments[c] ??= INSTRUMENTS.piano;
  return { events: out, instruments };
}

/** The song as a .CMF file. */
export function song(): Uint8Array {
  if ((BEATS * TPB) / 8 !== 2 * ROUND) throw new Error('the song should last exactly two flashes');
  const { events: ev, instruments } = events([v(0, INSTRUMENTS.bell, MELODY, 80), v(1, INSTRUMENTS.pad, PAD, 60), v(4, INSTRUMENTS.bass, RUMBLE, 127)]);
  return encodeCmf({ instruments, events: ev, ticksPerBeat: TPB });
}
