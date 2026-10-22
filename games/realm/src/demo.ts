// DEMO.REC: what plays on the title screen when nobody touches the keyboard. Recorded from
// the bot (tools/gendemo.ts) walking out of Nowish and up the road, swinging at slimes:
// pairs of [game ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED = [1, 80, 15, 208, 1, 77, 5, 205, 1, 80, 16, 80, 1, 80, 55, 208, 1, 77, 15, 205, 1, 80, 5, 208, 1, 77, 5, 205, 1, 80, 20, 208, 1, 77, 10, 205, 1, 80, 1, 72, 70, 200, 1, 77, 10, 205, 1, 72, 17, 200, 0, 72, 1, 200, 0, 57, 2, 185, 4, 72, 1, 200, 0, 57, 2, 185, 4, 77, 1, 205, 0, 57, 2, 185, 4, 77, 1, 205, 0, 57, 2, 185, 4, 75, 20, 203, 2, 72, 287, 200, 0, 75, 2, 203, 3, 80, 54, 208, 0, 80, 1, 208, 0, 57, 2, 185, 4, 80, 1, 208, 0, 57, 2, 185, 4, 72, 1, 200, 3, 80, 53, 208, 0, 80, 1, 208, 0, 57, 2, 185, 4, 80, 1, 208, 0, 57, 2, 185, 4, 80, 1, 208, 0, 57, 2, 185, 4, 72, 1, 200, 3, 80, 34, 208, 0, 80, 1, 208, 0, 57, 2, 185, 4, 80, 1, 208, 0, 57, 2, 185, 4, 77, 1, 205, 0, 57, 2, 185, 4, 77, 1, 205, 0, 57, 2, 185, 4, 75, 20, 203, 2, 80, 175, 208, 0, 75, 2, 203, 3, 72, 65, 200, 1, 77];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 20, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
