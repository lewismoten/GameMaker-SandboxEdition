// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run at the banquet (tools/gendemo.ts writes RECORDED), as pairs of [ticks since the
// last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [1, 77, 10, 205, 6, 72, 12, 200, 9, 77, 25, 205, 6, 72, 12, 200, 9, 77, 10, 205, 6, 72, 8, 200, 7, 18, 12, 146, 0, 77, 8, 205, 3, 72, 12, 200, 9, 77, 15, 205, 42, 77, 10, 205, 6, 57, 2, 185, 10, 18, 8, 146, 0, 77, 2, 205, 5, 77, 6, 205, 9, 18, 12, 146, 0, 77, 5, 205, 4, 77, 5, 205, 6, 72, 12, 200, 9, 18, 12, 146, 0, 77, 10, 205, 3, 75, 7, 203, 6, 72, 12, 200, 9, 18, 6, 146, 0, 77, 9, 205, 3, 77, 3, 205, 6, 18];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 30, key: 1 }, { delta: 4, key: 129 });
  return serializeRecording(keys);
}
