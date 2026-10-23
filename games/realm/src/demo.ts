// DEMO.REC: what plays on the title screen when nobody touches the keyboard. Recorded from
// the bot (tools/gendemo.ts) walking out of Nowish and up the road, swinging at slimes:
// pairs of [game ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED = [
  1, 80, 15, 208, 1, 77, 5, 205, 1, 80, 15, 208, 1, 77, 5, 205, 1, 80, 10, 208, 1, 77, 5, 205, 1, 80, 10, 208, 1, 77, 5, 205, 1, 80, 50, 208, 1, 77, 5, 205, 1,
  80, 20, 208, 1, 77, 10, 205, 1, 80, 1, 72, 70, 200, 1, 77, 10, 205, 1, 72, 17, 200, 0, 72, 1, 200, 0, 57, 2, 185, 4, 72, 1, 200, 0, 57, 2, 185, 4, 77, 1, 205,
  0, 57, 2, 185, 4, 77, 1, 205, 0, 57, 2, 185, 6, 75, 2, 203, 1, 72, 1, 200, 1, 72, 30, 200, 1, 77, 5, 205, 1, 72, 40, 200, 1, 75, 7, 203, 0, 75, 1, 203, 0, 57,
  2, 185, 4, 75, 1, 203, 0, 57, 2, 185, 6, 75, 1, 203, 1, 75, 15, 203, 1, 80, 15, 208, 1, 77, 18, 205, 0, 77, 1, 205, 0, 57, 2, 185, 4, 77, 1, 205, 0, 57, 2,
  185, 4, 77, 1, 205, 0, 57, 2, 185, 6, 75, 1, 203, 1, 77, 20, 205, 1, 72, 5, 200, 1, 77, 13, 205, 0, 75, 1, 203, 0, 57, 2, 185, 6, 75, 2, 203, 1, 77, 13, 205,
  0, 75, 1, 203, 0, 57, 2, 185, 6, 75, 2, 203, 1, 77, 10, 205, 0, 75, 1, 203, 0, 57, 2, 185, 6, 77, 1, 205, 1, 77, 4, 205, 0, 75, 1, 203, 0, 57, 2, 185, 6, 77,
  2, 205, 1, 77, 4, 205, 0, 75, 1, 203, 0, 57, 2, 185, 6, 77, 2, 205,
];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 20, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
