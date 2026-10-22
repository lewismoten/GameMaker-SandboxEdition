// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run across the hillside (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [1, 77, 7, 205, 6, 18, 10, 146, 0, 77, 11, 205, 5, 77, 20, 205, 42, 18, 12, 146, 0, 77, 32, 205, 3, 77, 7, 205, 6, 77, 3, 72, 10, 200, 71, 205, 6, 77, 17, 72, 10, 200, 6, 72, 10, 200, 18, 205, 8, 77, 3, 72, 10, 200, 6, 72, 10, 200, 7, 205, 6, 77, 4, 205, 15, 18, 4, 146, 0, 77, 8, 205, 3, 77];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 30, key: 1 }, { delta: 4, key: 129 });
  return serializeRecording(keys);
}
