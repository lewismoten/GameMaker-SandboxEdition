// A short song that shows off an instrument preset: a rising phrase and a chord for melodic
// patches, a held chord for pads, a few hits for percussion, and the drum on its own channel
// in rhythm mode for the drum kit. Written as a Game-Maker CMF, so it plays through the same
// player as any song (the editor's preview and the offline renders in the tests).
import { TICK_RATE } from './cmfPlayer';
import { encodeCmf, type CmfEvent } from '../formats/cmf';
import { DRUM_SLOTS } from './oplDrumPresets';
import type { OplPreset } from './oplPatch';

const T = (s: number) => Math.round(s * TICK_RATE);

/** The preview song and how long it lasts with its last note's tail (seconds). */
export function presetPreview(p: OplPreset, velocity = 110): { bytes: Uint8Array; seconds: number } {
  const events: CmfEvent[] = [];
  const note = (ch: number, key: number, at: number, len: number, vel = velocity) => {
    events.push({ tick: T(at), data: [0x90 | ch, key, vel] });
    events.push({ tick: T(at + len), data: [0x80 | ch, key, 0] });
  };
  let end: number;
  if (p.drum) {
    // rhythm mode, then the drum alone on its MIDI channel
    events.push({ tick: 0, data: [0xb0, 0x67, 0x01] });
    const ch = DRUM_SLOTS[p.drum].ch;
    [0, 0.25, 0.5, 0.875].forEach((at, i) => note(ch, p.key, at, 0.1, i === 3 ? 127 : velocity - 20 * (i % 2)));
    end = 0.875 + 1.2;
  } else if (p.play === 'hits') {
    [0, 0.25, 0.5, 0.875].forEach((at, i) => note(0, p.key + (i === 2 ? 7 : 0), at, 0.12));
    end = 0.875 + 1.2;
  } else if (p.play === 'chord') {
    [0, 4, 7, 12].forEach((k, ch) => note(ch, p.key + k, 0, 1.6));
    end = 1.6 + 1.4;
  } else {
    [0, 4, 7, 12].forEach((k, i) => note(0, p.key + k, i * 0.22, 0.2));
    [0, 4, 7].forEach((k, ch) => note(ch, p.key + k, 0.95, 1.1));
    end = 0.95 + 1.1 + 1.2;
  }
  // a do-nothing controller holds the song open through the last note's tail (PlayIt ignores
  // every controller but 0x67) a little past the time given, as the song starts over after it
  events.push({ tick: T(end + 0.5), data: [0xb0, 0x7b, 0x00] });
  const instruments = Array.from({ length: 16 }, () => p.patch);
  return { bytes: encodeCmf({ instruments, events }), seconds: end };
}
