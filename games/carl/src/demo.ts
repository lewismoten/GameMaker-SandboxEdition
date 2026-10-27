// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the living room (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [
  1, 44, 5, 172, 0, 80, 8, 208, 2, 18, 5, 146, 0, 72, 12, 200, 2, 77, 9, 205, 2, 77, 4, 205, 2, 18, 10, 146, 0, 77, 4, 205, 2, 46, 10, 174, 0, 77, 12, 205, 2,
  77, 24, 205, 2, 46, 5, 174, 0, 80, 12, 208, 2, 77, 8, 205, 2, 77, 8, 205, 2, 77, 4, 205, 2, 77, 4, 205, 2, 18, 5, 146, 0, 72, 4, 200, 2, 18, 5, 146, 0, 72,
  12, 200, 2, 77, 8, 205, 2, 44, 10, 172, 2, 77, 4, 205, 2, 77, 8, 205, 2, 46, 5, 174, 0, 77, 4, 205, 2, 80, 4, 208, 2, 46, 8, 174, 2, 46, 10, 174, 2, 18, 10,
  146, 2, 72,
];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 30, key: 1 }, { delta: 4, key: 129 });
  return serializeRecording(keys);
}
