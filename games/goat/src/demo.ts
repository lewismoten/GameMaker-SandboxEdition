// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of
// the bot's own run through the shepherds' field (tools/gendemo.ts writes RECORDED), as
// pairs of [ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [1, 72, 10, 200, 1, 75, 5, 203, 1, 80, 15, 208, 1, 77, 5, 205, 1, 72, 5, 200, 1, 77, 25, 205, 1, 80, 5, 208, 1, 77, 15, 205, 1, 72, 3, 200, 2, 72, 2, 200, 1, 77, 35, 205, 1, 77, 3, 205, 2, 80, 20, 208, 1, 75, 10, 203, 1, 80, 20, 208, 1, 75, 20, 203, 1, 80, 5, 208, 1, 77, 3, 205, 2, 72, 15, 200, 1, 77, 25, 205, 1, 72, 3, 200, 2, 72, 2, 200, 1, 72, 5, 200, 1, 77, 35, 205, 1, 57, 2, 185, 12, 77, 15, 205, 1, 80, 5, 208, 1, 77, 15, 205, 1, 77, 3, 205, 2, 72, 35, 200, 1, 77];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 25, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
