// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run across the hillside (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [
  1, 77, 5, 205, 6, 18, 10, 146, 0, 77, 8, 205, 7, 77, 15, 205, 6, 72, 8, 200, 51, 18, 12, 146, 0, 77, 26, 205, 3, 77, 5, 205, 12, 77, 3, 72, 10, 200, 18, 205,
  6, 72, 12, 200, 9, 77, 20, 205, 8, 72, 8, 200, 9, 77, 15, 205, 6, 72, 8, 200, 9, 77, 13, 72, 10, 200, 13, 205, 10, 77, 3, 72, 10, 200, 5, 205, 6, 77, 3, 205,
  15, 18, 4, 146, 0, 77, 6, 205, 3, 77,
];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 30, key: 1 }, { delta: 4, key: 129 });
  return serializeRecording(keys);
}
