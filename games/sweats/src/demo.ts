// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run along the avenue and in through the castle door (tools/gendemo.ts writes
// RECORDED), as pairs of [ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [1, 77, 35, 205, 6, 72, 10, 200, 0, 77, 5, 205, 3, 77, 13, 205, 6, 18, 12, 146, 0, 77, 0, 205, 8, 77, 31, 205, 6, 77, 45, 205, 6, 77, 6, 205, 6, 75, 1, 203, 6, 77, 25, 205, 6, 57, 3, 185, 12, 18, 12, 146, 0, 77, 60, 205, 9, 77, 15, 205, 6, 18, 12, 146, 0, 77, 0, 205, 7, 77, 3, 205, 15, 18, 12, 146, 0, 77, 1, 205, 3, 18, 12, 146, 0, 77];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 30, key: 1 }, { delta: 4, key: 129 });
  return serializeRecording(keys);
}
