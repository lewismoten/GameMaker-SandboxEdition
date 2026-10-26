// DEMO.REC: what the title screen plays when nobody touches the keyboard: Dex sets out
// across Hover Heights. Recorded by the bot playing the level in the simulator (tools/gendemo.ts):
// pairs of [ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const DEMO: number[] = [
  1, 77, 12, 205, 0, 75, 16, 203, 0, 80, 8, 208, 0, 75, 4, 203, 0, 80, 12, 208, 0, 77, 8, 205, 0, 80, 8, 208, 0, 77, 12, 205, 0, 80, 20, 208, 0, 75, 4, 203, 0,
  77, 16, 205, 0, 72, 4, 200, 0, 75, 12, 203, 0, 80, 12, 208, 0, 75, 4, 203, 0, 80, 12, 208, 0, 75, 12, 203, 0, 72, 4, 200, 0, 77, 69, 205, 0, 72, 8, 200, 0,
  77, 20, 205, 0, 72, 4, 200, 0, 77, 8, 205, 0, 80, 4, 208, 0, 77, 4, 205, 0, 80, 8, 208, 0, 77, 28, 205, 0, 77, 32, 205, 0, 72, 8, 200, 0, 75, 4, 203, 0, 72,
  24, 200, 0, 75, 8, 203, 0, 80, 12, 208, 0, 72, 12, 200, 0, 77, 8, 205, 0, 72, 20, 200, 0, 77, 4, 205, 0, 72, 24, 200, 0, 75, 4, 203, 0, 72, 25, 200, 0, 75,
  20, 203, 0, 72, 8, 200, 0, 75, 36, 203, 0, 80, 28, 208, 0, 75, 4, 203, 0, 80, 41, 208, 0, 75, 24, 203, 0, 72, 12, 200, 0, 75, 16, 203, 0, 72, 16, 200, 0, 77,
  4, 205, 0, 72, 4, 200, 0, 77, 4, 205, 0, 72, 24, 200, 0, 75, 20, 203, 0, 80, 24, 208, 0, 75, 8, 203, 0, 80, 12, 208, 0, 75, 24, 203, 0, 72, 20, 200, 0, 75,
  12, 203, 0, 72, 4, 200, 0, 77, 4, 205, 0, 72, 12, 200, 0, 75, 1, 203,
];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < DEMO.length; i += 2) keys.push({ delta: DEMO[i], key: DEMO[i + 1] });
  keys.push({ delta: 30, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
