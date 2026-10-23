// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the garden (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [1, 18, 8, 146, 0, 77, 8, 205, 9, 77, 17, 72, 10, 200, 11, 205, 6, 77, 10, 72, 10, 200, 6, 72, 10, 200, 14, 72, 10, 200, 15, 72, 10, 200, 7, 205, 6, 18, 8, 146, 0, 77, 13, 205, 3, 18, 8, 146, 0, 77, 9, 205, 3, 18, 8, 146, 0, 77, 9, 205, 3, 18, 8, 146, 0, 77, 10, 205, 3, 77, 7, 205, 17, 77, 14, 205, 13, 18, 4, 146, 0, 77, 21, 205, 3, 77, 13, 205, 6, 72, 6, 200, 9, 77, 34, 72, 10, 200];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 25, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
