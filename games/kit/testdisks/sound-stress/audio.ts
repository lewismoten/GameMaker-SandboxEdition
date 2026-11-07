// Nine independent melodic parts: OPL2 has nine voices, not sixteen MIDI voices.
// SBMUSIC.C dispatches notes to the Creative driver; engine/audio/cmfPlayer.ts pins the allocation.
import { encodeCmf, type CmfEvent } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/music/compose';

export const LOOP_TICKS = 32 * 4 * 48; // 182.5 BPM at the required 146 Hz clock
export const PARTS = ['piano', 'bass', 'strings', 'brass', 'lead', 'bell', 'organ', 'pad', 'pluck'] as const;

export function bandEvents(): CmfEvent[] {
  const events: CmfEvent[] = [];
  const roots = [48, 53, 57, 55];
  const chord = [0, -12, 4, 7, 12, 16, 19, 24, 28];
  for (let bar = 0; bar < 32; bar++) {
    for (let channel = 0; channel < 9; channel++) {
      const step = channel < 4 ? 48 : 12; // held four-part chords under fast five-part arpeggios
      for (let t = 0; t < 192; t += step) {
        const note = roots[Math.floor(bar / 2) % roots.length] + chord[channel] + (channel >= 4 ? [0, 2, 4, 7][(t / step + bar) % 4] : 0);
        const tick = bar * 192 + t;
        events.push({ tick, data: [0x90 | channel, note, 82] });
        events.push({ tick: tick + step - 2, data: [0x80 | channel, note, 0] });
      }
    }
  }
  events.push({ tick: LOOP_TICKS, data: [0xb0, 7, 100] }); // exact loop boundary, no shortened last bar
  return events.sort((a, b) => a.tick - b.tick);
}

export function buildSong(): Uint8Array {
  return encodeCmf({ instruments: PARTS.map((part) => INSTRUMENTS[part]), events: bandEvents(), ticksPerBeat: 48 });
}
