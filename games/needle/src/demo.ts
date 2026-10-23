// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the city (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [
  61, 77, 53, 72, 10, 200, 11, 72, 10, 200, 3, 205, 9, 77, 8, 72, 10, 200, 23, 205, 7, 77, 8, 72, 10, 200, 8, 72, 10, 200, 5, 205, 6, 16, 18, 144, 0, 75, 10,
  203, 3, 77, 24, 72, 10, 200, 13, 205, 10, 77, 3, 72, 10, 200, 8, 72, 10, 200, 8, 72, 10, 200, 20, 205, 6, 77,
];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 25, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
