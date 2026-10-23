// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run up the steam and over the tub (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [1, 75, 10, 203, 39, 72, 8, 200, 0, 77, 5, 205, 3, 77, 23, 205, 8, 18, 12, 146, 0, 77, 0, 205, 15, 18, 10, 146, 0, 77, 5, 205, 3, 77, 12, 205, 6, 72, 12, 200, 0, 77, 1, 205, 3, 77, 9, 205, 6, 77, 6, 205, 12, 18, 8, 146, 0, 77, 19, 205, 3, 18, 12, 146, 0, 77, 0, 205, 6, 77, 6, 205, 22, 72, 12, 200, 0, 77, 5, 205, 3, 72, 12, 200, 0, 75, 3, 203, 3, 75, 2, 203, 6, 18, 12, 146, 0, 77, 20, 205, 5, 77, 7, 205, 6, 18, 12, 146, 0, 77, 0, 205, 10, 77, 10, 205, 6, 18];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 30, key: 1 }, { delta: 4, key: 129 });
  return serializeRecording(keys);
}
