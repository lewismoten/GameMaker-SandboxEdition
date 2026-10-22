// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run out of bed and down the hall (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [1, 77, 13, 205, 12, 18, 10, 146, 0, 77, 10, 205, 3, 77, 5, 205, 6, 72, 12, 200, 9, 77, 3, 72, 10, 200, 10, 205, 6, 77, 18, 205, 6, 77, 8, 205, 6, 18, 12, 146, 0, 77, 5, 205, 4, 77, 4, 205, 6, 72, 12, 200, 4, 77, 8, 205, 6, 18, 6, 146, 0, 77, 11, 205, 3, 77, 1, 205, 6, 18, 12, 146, 0, 77, 5, 205, 5, 77, 5, 205, 6, 18, 12, 146, 0, 77, 6, 205, 3, 77, 2, 205, 6, 18, 12, 146, 0, 77, 6, 205, 3, 77, 22, 205, 6, 18, 12, 146, 0, 77, 0, 205, 7, 77, 5, 205, 6, 72, 8, 200, 9, 77, 18, 205];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 30, key: 1 }, { delta: 4, key: 129 });
  return serializeRecording(keys);
}
