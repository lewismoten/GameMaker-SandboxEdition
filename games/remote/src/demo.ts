// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own search of the living room (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [1, 75, 5, 203, 1, 80, 3, 208, 2, 77, 5, 205, 1, 80, 3, 208, 2, 77, 5, 205, 1, 80, 3, 208, 2, 72, 20, 200, 1, 77, 5, 205, 1, 80, 20, 208, 1, 75, 25, 203, 1, 80, 35, 208, 1, 77, 5, 205, 1, 72, 15, 200, 1, 75, 10, 203, 1, 75, 3, 203, 2, 80, 5, 208, 1, 77, 35, 205, 1, 72, 30, 200, 1, 77, 40, 205, 1, 72, 5, 200, 1, 77, 20, 205, 1, 72, 3, 200, 2, 72, 2, 200, 1, 72, 5, 200, 1, 77, 10, 205, 1, 72, 3, 200, 2, 80, 10, 208, 1, 75, 5, 203, 1, 80, 5, 208, 1, 77, 3, 205, 2, 80, 20, 208, 1, 80, 3, 208, 2, 77, 5, 205, 1, 80];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 30, key: 1 }, { delta: 4, key: 129 });
  return serializeRecording(keys);
}
