// LIGHTNING's one song, new for this game: a quiet A-minor tune for a stormy night, with the thunder in it. A block
// timer can't play a sound, but the song and the block clock run off the same PC timer (the song gets 8 ticks for
// every game tick) and both start with the level. So the song is exactly two flashes long, 32 beats at 146 beats a
// minute (60 song ticks a beat, 1920 in all, 240 game ticks: storm.ts ROUND twice), and a low rumble starts one beat
// into each 16, just after the flash that ends the 16 before. Note strings are the kit's: a note, an octave and a length.
import { encodeCmf, type CmfEvent } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { INSTRUMENTS, midi, type Voice } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { LEN, join, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
import { ROUND } from './storm';

export const BPM = 146;
/** Song ticks a beat (Game-Maker plays 146 a second), and beats in the whole song. */
export const TPB = (146 * 60) / BPM;
export const BEATS = 32;
/** The beat each rumble starts on, in the song. */
export const RUMBLES = [1, 17];

const MELODY = join('r h, E5 q, G5 q', 'A5 h., G5 q', 'E5 q, D5 q, C5 q, D5 q', 'E5 w', 'r h, C5 q, D5 q', 'E5 h., D5 q', 'C5 q, B4 q, A4 q, B4 q', 'A4 w');
const PAD = join('[A3 C4 E4] w', '[F3 A3 C4] w', '[C4 E4 G4] w', '[G3 B3 D4] w', '[A3 C4 E4] w', '[F3 A3 C4] w', '[G3 B3 D4] w', '[A3 C4 E4] w');
/** The thunder: a low growl one beat into each round, a beat after the flash. */
const RUMBLE = join('r q, [E1 F1] h., [D1 E1] h, r h, r w, r w', 'r q, [E1 F1] h., [D1 E1] h, r h, r w, r w');

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
