// DEMO.REC: what the title screen plays when nobody touches the keyboard: Dex sets out
// across Hover Heights. Recorded by playing the level in the simulator (see verify.ts):
// pairs of [ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../web/src/formats/recording';

export const DEMO: number[] = [];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < DEMO.length; i += 2) keys.push({ delta: DEMO[i], key: DEMO[i + 1] });
  keys.push({ delta: 30, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
