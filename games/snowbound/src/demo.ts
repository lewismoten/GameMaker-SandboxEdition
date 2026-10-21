// DEMO.REC: what plays on the title screen when nobody touches the keyboard. Recorded
// from a real game on Gale Street (pairs of [ticks since the last key, PC scan code;
// +128 = released]), ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED = [
  16, 80, 4, 208, 0, 80, 4, 208, 0, 72, 1, 200, 0, 72, 2, 200, 0, 77, 7, 205, 0, 77, 7, 205, 0, 77, 8, 205, 0, 77, 7, 205, 0, 77, 8, 205, 0, 77, 7, 205, 0, 77,
  7, 205, 0, 77, 4, 205, 0, 72, 13, 200, 0, 80, 8, 208, 0, 80, 4, 208, 0, 80, 4, 208, 0, 72, 1, 200, 0, 72, 1, 200, 0, 75, 8, 203, 0, 75, 1, 203, 0, 75, 1, 203,
  0, 72, 16, 200, 0, 75, 5, 203, 0, 80, 16, 208, 0, 75, 3, 203, 0, 57, 0, 185, 9, 77, 7, 205, 0, 77, 7, 205, 1, 77, 7, 205, 0, 77, 7, 205, 0, 77, 94, 205, 0,
  75, 8, 203, 0, 75, 7, 203, 0, 75, 7, 203, 1, 75, 7, 203, 0, 75, 7, 203, 0, 75, 7, 203, 0, 75, 8, 203, 0, 75, 7, 203, 0, 75, 8, 203, 0, 75, 7, 203, 0, 75, 7,
  203, 0, 75, 4, 203, 0, 75, 5, 203, 0, 80, 5, 208, 0, 72, 1, 200, 1, 72, 1, 200, 0, 72, 1, 200, 0, 72, 1, 200, 0, 77, 8, 205, 0, 77, 7, 205, 0, 77, 4, 205, 0,
  77, 4, 205, 0, 75, 2, 203, 0, 75, 1, 203, 0, 72, 13, 200, 0, 80, 7, 208, 0, 80, 7, 208, 0, 77, 8, 205, 0, 77, 4, 205, 0, 75, 1, 203, 0, 75, 1, 203, 0, 72, 16,
  200, 0, 77, 5, 205, 0, 80, 16, 208, 0, 77, 7, 205, 0, 77, 5, 205, 0, 75, 1, 203, 0, 75, 1, 203, 0, 77, 27, 205,
];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 25, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
